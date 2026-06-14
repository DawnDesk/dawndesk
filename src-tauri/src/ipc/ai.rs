use crate::{
    ai::{
        engine::{chat, ChatMessage},
        registry::{collect_tools, ToolDefinition},
    },
    ipc::settings::current_config,
    settings::config::user_data_root,
    AppState,
};
use serde::Deserialize;
use serde_json::{json, Value};
use tauri::Emitter;

const MAX_TOOL_ROUNDS: usize = 4;

#[tauri::command]
pub fn ai_get_tools(state: tauri::State<'_, AppState>) -> Result<Vec<ToolDefinition>, String> {
    let config = current_config(&state)?;
    collect_tools(&config)
}

#[tauri::command]
pub fn ai_chat(
    messages: Vec<ChatMessage>,
    stream: bool,
    state: tauri::State<'_, AppState>,
    app: tauri::AppHandle,
) -> Result<String, String> {
    let config = current_config(&state)?;
    let tools = collect_tools(&config)?;
    if stream {
        return chat(&config, &messages, stream, &tools);
    }

    let mut conversation = messages;
    let mut executions = Vec::new();

    for _ in 0..MAX_TOOL_ROUNDS {
        let response = chat(&config, &conversation, false, &tools)?;
        let calls = extract_tool_calls(&response)?;

        if calls.is_empty() {
            return Ok(format_ai_response(&response, &executions));
        }

        let mut round_results = Vec::new();
        let mut has_mutation = false;

        for call in calls {
            has_mutation |= call.is_mutation();
            let result = execute_tool_call(&config, &state, Some(&app), &call)?;
            executions.push(ToolExecution {
                call: call.clone(),
                result: result.clone(),
            });
            round_results.push(json!({
                "pluginId": call.plugin_id,
                "name": call.name,
                "arguments": call.arguments,
                "result": result,
            }));
        }

        if has_mutation {
            return Ok(format_ai_response(&response, &executions));
        }

        conversation.push(ChatMessage {
            role: "assistant".to_string(),
            content: response,
        });
        conversation.push(ChatMessage {
            role: "system".to_string(),
            content: format!(
                "DawnDesk executed the requested plugin command(s). Use these results to answer the user. If you need to modify data, provide the next tool call as fenced JSON. Tool results:\n{}",
                serde_json::to_string_pretty(&round_results)
                    .map_err(|error| format!("Failed to serialize tool results: {error}"))?
            ),
        });
    }

    Ok(format_ai_response(
        "I stopped after several plugin command rounds to avoid repeating commands.",
        &executions,
    ))
}

#[tauri::command]
pub fn ai_call(prompt: String, state: tauri::State<'_, AppState>) -> Result<String, String> {
    let config = current_config(&state)?;
    let tools = collect_tools(&config)?;
    chat(
        &config,
        &[ChatMessage {
            role: "user".to_string(),
            content: prompt,
        }],
        false,
        &tools,
    )
}

#[tauri::command]
pub fn ai_run_tool(
    plugin_id: String,
    name: String,
    arguments: Value,
    state: tauri::State<'_, AppState>,
    app: tauri::AppHandle,
) -> Result<Value, String> {
    let config = current_config(&state)?;
    execute_tool_call(
        &config,
        &state,
        Some(&app),
        &ToolCall {
            plugin_id,
            name,
            arguments,
        },
    )
}

#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ToolCall {
    #[serde(alias = "plugin_id")]
    plugin_id: String,
    #[serde(alias = "tool")]
    name: String,
    #[serde(default, alias = "input")]
    arguments: Value,
}

impl ToolCall {
    fn is_mutation(&self) -> bool {
        matches!(
            self.name.as_str(),
            "create_note" | "update_note" | "delete_note"
        )
    }
}

#[derive(Debug)]
struct ToolExecution {
    call: ToolCall,
    result: Value,
}

fn execute_tool_call(
    config: &crate::settings::config::AppConfig,
    state: &tauri::State<'_, AppState>,
    app: Option<&tauri::AppHandle>,
    call: &ToolCall,
) -> Result<Value, String> {
    let result = if call.plugin_id == "notes" {
        run_notes_tool(config, &call.name, call.arguments.clone())?
    } else {
        state
            .sidecars
            .run_tool(config, &call.plugin_id, &call.name, call.arguments.clone())?
    };

    if call.plugin_id == "notes" && call.is_mutation() {
        if let Some(app) = app {
            app.emit(
                "plugin:notes:data-changed",
                json!({
                    "source": "ai",
                    "command": call.name,
                    "result": result.clone(),
                }),
            )
            .map_err(|error| format!("Failed to notify notes plugin: {error}"))?;
        }
    }

    Ok(result)
}

fn extract_tool_calls(response: &str) -> Result<Vec<ToolCall>, String> {
    let mut calls = Vec::new();
    let mut rest = response;

    while let Some(start) = rest.find("```") {
        rest = &rest[start + 3..];
        let Some(end) = rest.find("```") else {
            break;
        };

        let block = &rest[..end];
        rest = &rest[end + 3..];
        let json_text = block
            .strip_prefix("json")
            .or_else(|| block.strip_prefix("JSON"))
            .unwrap_or(block)
            .trim();

        if json_text.is_empty() {
            continue;
        }

        let Ok(value) = serde_json::from_str::<Value>(json_text) else {
            continue;
        };

        push_tool_calls_from_value(value, &mut calls)?;
    }

    if calls.is_empty() {
        if let Ok(value) = serde_json::from_str::<Value>(response.trim()) {
            push_tool_calls_from_value(value, &mut calls)?;
        }
    }

    Ok(calls)
}

fn push_tool_calls_from_value(value: Value, calls: &mut Vec<ToolCall>) -> Result<(), String> {
    if let Some(items) = value.as_array() {
        for item in items {
            push_tool_calls_from_value(item.clone(), calls)?;
        }
        return Ok(());
    }

    if value
        .get("pluginId")
        .or_else(|| value.get("plugin_id"))
        .is_none()
    {
        return Ok(());
    }

    let call = serde_json::from_value::<ToolCall>(value)
        .map_err(|error| format!("Invalid plugin tool call: {error}"))?;
    calls.push(call);
    Ok(())
}

fn format_ai_response(response: &str, executions: &[ToolExecution]) -> String {
    let answer = strip_tool_blocks(response).trim().to_string();
    let mut output = if answer.is_empty() && executions.is_empty() {
        response.trim().to_string()
    } else if answer.is_empty() {
        "Done. I executed the requested plugin command.".to_string()
    } else {
        answer
    };

    if executions.is_empty() {
        return output;
    }

    output.push_str("\n\n**Commands executed**");
    for execution in executions {
        output.push_str(&format!(
            "\n- `{}.{}` with `{}`",
            execution.call.plugin_id,
            execution.call.name,
            serde_json::to_string(&execution.call.arguments).unwrap_or_else(|_| "{}".to_string())
        ));
        output.push_str("\n```json\n");
        output.push_str(
            &serde_json::to_string_pretty(&execution.result).unwrap_or_else(|_| "null".to_string()),
        );
        output.push_str("\n```");
    }

    output
}

fn strip_tool_blocks(response: &str) -> String {
    let mut output = String::with_capacity(response.len());
    let mut rest = response;

    while let Some(start) = rest.find("```") {
        output.push_str(&rest[..start]);
        let after_start = &rest[start + 3..];
        let Some(end) = after_start.find("```") else {
            output.push_str(&rest[start..]);
            return output;
        };

        let block = &after_start[..end];
        let json_text = block
            .strip_prefix("json")
            .or_else(|| block.strip_prefix("JSON"))
            .unwrap_or(block)
            .trim();

        let is_tool_block = serde_json::from_str::<Value>(json_text)
            .ok()
            .map(|value| contains_tool_call(&value))
            .unwrap_or(false);

        if !is_tool_block {
            output.push_str(&rest[start..start + 3 + end + 3]);
        }

        rest = &after_start[end + 3..];
    }

    output.push_str(rest);
    output
}

fn contains_tool_call(value: &Value) -> bool {
    if value
        .get("pluginId")
        .or_else(|| value.get("plugin_id"))
        .is_some()
    {
        return true;
    }

    value
        .as_array()
        .map(|items| items.iter().any(contains_tool_call))
        .unwrap_or(false)
}

fn run_notes_tool(
    config: &crate::settings::config::AppConfig,
    name: &str,
    arguments: Value,
) -> Result<Value, String> {
    let plugin_dir = user_data_root(config).join("plugins").join("notes");
    let notes_key = "notes";
    let mut notes = read_plugin_array(&plugin_dir, notes_key)?;

    match name {
        "create_note" => {
            let title =
                string_arg(&arguments, "title").unwrap_or_else(|| "Untitled note".to_string());
            let content = string_arg(&arguments, "content").unwrap_or_default();
            let tags = string_array_arg(&arguments, "tags");
            let note = json!({
                "id": format!("note-{}", unix_millis()),
                "title": title,
                "content": content,
                "tags": tags,
                "createdAt": now_iso(),
                "updatedAt": now_iso(),
                "pinned": false,
            });

            notes.insert(0, note.clone());
            write_plugin_array(&plugin_dir, notes_key, &notes)?;
            Ok(note)
        }
        "update_note" => {
            let id = required_string_arg(&arguments, "id")?;
            let mut updated = Value::Null;
            let now = now_iso();

            for note in &mut notes {
                if note.get("id").and_then(Value::as_str) != Some(&id) {
                    continue;
                }

                if let Some(title) = string_arg(&arguments, "title") {
                    note["title"] = json!(title);
                }

                if let Some(content) = string_arg(&arguments, "content") {
                    note["content"] = json!(content);
                }

                if arguments.get("tags").is_some() {
                    note["tags"] = json!(string_array_arg(&arguments, "tags"));
                }

                note["updatedAt"] = json!(now);
                updated = note.clone();
                break;
            }

            if updated.is_null() {
                return Err(format!("Note '{id}' was not found."));
            }

            write_plugin_array(&plugin_dir, notes_key, &notes)?;
            Ok(updated)
        }
        "delete_note" => {
            let id = required_string_arg(&arguments, "id")?;
            let before = notes.len();
            notes.retain(|note| note.get("id").and_then(Value::as_str) != Some(&id));
            write_plugin_array(&plugin_dir, notes_key, &notes)?;
            Ok(json!({
                "id": id,
                "deleted": notes.len() != before,
            }))
        }
        "list_notes" => {
            let limit = arguments
                .get("limit")
                .and_then(Value::as_u64)
                .map(|value| value as usize)
                .unwrap_or(20);
            let pinned_only = arguments
                .get("pinned_only")
                .or_else(|| arguments.get("pinnedOnly"))
                .and_then(Value::as_bool)
                .unwrap_or(false);
            let list: Vec<Value> = notes
                .into_iter()
                .filter(|note| {
                    !pinned_only || note.get("pinned").and_then(Value::as_bool).unwrap_or(false)
                })
                .take(limit)
                .collect();

            Ok(json!(list))
        }
        "search_notes" => {
            let query = required_string_arg(&arguments, "query")?.to_lowercase();
            let limit = arguments
                .get("limit")
                .and_then(Value::as_u64)
                .map(|value| value as usize)
                .unwrap_or(20);
            let matches: Vec<Value> = notes
                .into_iter()
                .filter(|note| {
                    ["title", "content"].iter().any(|key| {
                        note.get(*key)
                            .and_then(Value::as_str)
                            .unwrap_or("")
                            .to_lowercase()
                            .contains(&query)
                    }) || note
                        .get("tags")
                        .and_then(Value::as_array)
                        .map(|tags| {
                            tags.iter().any(|tag| {
                                tag.as_str().unwrap_or("").to_lowercase().contains(&query)
                            })
                        })
                        .unwrap_or(false)
                })
                .take(limit)
                .collect();

            Ok(json!(matches))
        }
        _ => state_sidecar_unavailable(name),
    }
}

fn state_sidecar_unavailable(name: &str) -> Result<Value, String> {
    Err(format!("Unsupported notes tool '{name}'."))
}

fn read_plugin_array(plugin_dir: &std::path::Path, key: &str) -> Result<Vec<Value>, String> {
    let store_path = plugin_dir.join("data.json");

    if !store_path.exists() {
        return Ok(Vec::new());
    }

    let content = std::fs::read_to_string(&store_path)
        .map_err(|error| format!("Failed to read plugin data: {error}"))?;
    let store: Value = serde_json::from_str(&content)
        .map_err(|error| format!("Failed to parse plugin data: {error}"))?;

    Ok(store
        .get(key)
        .and_then(Value::as_array)
        .cloned()
        .unwrap_or_default())
}

fn write_plugin_array(
    plugin_dir: &std::path::Path,
    key: &str,
    values: &[Value],
) -> Result<(), String> {
    let store_path = plugin_dir.join("data.json");
    let mut store = if store_path.exists() {
        let content = std::fs::read_to_string(&store_path)
            .map_err(|error| format!("Failed to read plugin data: {error}"))?;
        serde_json::from_str::<Value>(&content)
            .map_err(|error| format!("Failed to parse plugin data: {error}"))?
            .as_object()
            .cloned()
            .unwrap_or_default()
    } else {
        serde_json::Map::new()
    };

    if let Some(parent) = store_path.parent() {
        std::fs::create_dir_all(parent)
            .map_err(|error| format!("Failed to create plugin data dir: {error}"))?;
    }

    store.insert(key.to_string(), json!(values));
    let content = serde_json::to_string_pretty(&json!(store))
        .map_err(|error| format!("Failed to serialize plugin data: {error}"))?;
    std::fs::write(store_path, content)
        .map_err(|error| format!("Failed to write plugin data: {error}"))
}

fn required_string_arg(arguments: &Value, key: &str) -> Result<String, String> {
    string_arg(arguments, key).ok_or_else(|| format!("Missing required argument '{key}'."))
}

fn string_arg(arguments: &Value, key: &str) -> Option<String> {
    arguments
        .get(key)
        .and_then(Value::as_str)
        .map(ToString::to_string)
}

fn string_array_arg(arguments: &Value, key: &str) -> Vec<String> {
    arguments
        .get(key)
        .and_then(Value::as_array)
        .map(|values| {
            values
                .iter()
                .filter_map(Value::as_str)
                .map(ToString::to_string)
                .collect()
        })
        .unwrap_or_default()
}

fn unix_millis() -> u128 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|duration| duration.as_millis())
        .unwrap_or_default()
}

fn now_iso() -> String {
    format!("{}Z", chrono_like_utc_date_time())
}

fn chrono_like_utc_date_time() -> String {
    let seconds = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|duration| duration.as_secs())
        .unwrap_or_default();
    let days = (seconds / 86_400) as i64;
    let seconds_of_day = seconds % 86_400;
    let hour = seconds_of_day / 3_600;
    let minute = (seconds_of_day % 3_600) / 60;
    let second = seconds_of_day % 60;
    let (year, month, day) = civil_from_days(days);

    format!("{year:04}-{month:02}-{day:02}T{hour:02}:{minute:02}:{second:02}")
}

fn civil_from_days(days_since_epoch: i64) -> (i32, u32, u32) {
    let z = days_since_epoch + 719_468;
    let era = if z >= 0 { z } else { z - 146_096 } / 146_097;
    let doe = z - era * 146_097;
    let yoe = (doe - doe / 1_460 + doe / 36_524 - doe / 146_096) / 365;
    let mut year = yoe + era * 400;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp = (5 * doy + 2) / 153;
    let day = doy - (153 * mp + 2) / 5 + 1;
    let month = mp + if mp < 10 { 3 } else { -9 };

    year += if month <= 2 { 1 } else { 0 };

    (year as i32, month as u32, day as u32)
}
