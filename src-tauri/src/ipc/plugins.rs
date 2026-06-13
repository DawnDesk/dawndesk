use crate::{
    ipc::settings::current_config,
    plugins::manager::{
        delete_plugin_data, get_plugin_data, install_plugin, list_plugins, set_plugin_data,
        uninstall_plugin, PluginDownloadProgress, PluginMeta,
    },
    plugins::manifest::read_manifest,
    settings::config::user_data_root,
    AppState,
};
use serde_json::Value;
use std::fs;
use tauri::Emitter;

#[tauri::command]
pub fn plugin_list(state: tauri::State<'_, AppState>) -> Result<Vec<PluginMeta>, String> {
    let config = current_config(&state)?;
    list_plugins(&config)
}

#[tauri::command]
pub fn plugin_install(
    id: String,
    url: String,
    checksum: String,
    state: tauri::State<'_, AppState>,
    app: tauri::AppHandle,
) -> Result<(), String> {
    let config = current_config(&state)?;
    state.sidecars.start_for_plugin(&id)?;
    install_plugin(&config, &id, &url, &checksum, |progress| {
        emit_download_progress(&app, progress);
    })
}

#[tauri::command]
pub fn plugin_uninstall(
    id: String,
    keep_data: bool,
    state: tauri::State<'_, AppState>,
) -> Result<(), String> {
    let config = current_config(&state)?;
    state.sidecars.stop_for_plugin(&id)?;
    uninstall_plugin(&config, &id, keep_data)
}

#[tauri::command]
pub fn plugin_get_data(
    plugin_id: Option<String>,
    key: String,
    state: tauri::State<'_, AppState>,
) -> Result<Option<Value>, String> {
    let config = current_config(&state)?;
    let plugin_id = resolve_plugin_id(&config, plugin_id)?;
    get_plugin_data(&config, &plugin_id, &key)
}

#[tauri::command]
pub fn plugin_set_data(
    plugin_id: Option<String>,
    key: String,
    value: Value,
    state: tauri::State<'_, AppState>,
) -> Result<(), String> {
    let config = current_config(&state)?;
    let plugin_id = resolve_plugin_id(&config, plugin_id)?;
    set_plugin_data(&config, &plugin_id, key, value)
}

#[tauri::command]
pub fn plugin_delete_data(
    plugin_id: Option<String>,
    key: String,
    state: tauri::State<'_, AppState>,
) -> Result<(), String> {
    let config = current_config(&state)?;
    let plugin_id = resolve_plugin_id(&config, plugin_id)?;
    delete_plugin_data(&config, &plugin_id, &key)
}

#[tauri::command]
pub fn plugin_info(
    plugin_id: Option<String>,
    state: tauri::State<'_, AppState>,
) -> Result<Value, String> {
    let config = current_config(&state)?;
    let plugin_id = resolve_plugin_id(&config, plugin_id)?;
    let plugin_dir = user_data_root(&config).join("plugins").join(&plugin_id);
    let manifest = read_manifest(&plugin_dir.join("plugin.manifest.json"))?;

    Ok(serde_json::json!({
        "id": manifest.id,
        "name": manifest.name,
        "version": manifest.version,
        "dataDir": plugin_dir.to_string_lossy(),
    }))
}

#[tauri::command]
pub fn plugin_entry_document(
    plugin_id: String,
    state: tauri::State<'_, AppState>,
) -> Result<String, String> {
    let config = current_config(&state)?;
    let plugin_dir = user_data_root(&config).join("plugins").join(&plugin_id);
    let manifest_path = plugin_dir.join("plugin.manifest.json");
    let manifest = read_manifest(&manifest_path)?;
    let entry_path = plugin_dir.join("index.html");

    if !entry_path.exists() {
        return Err(format!(
            "Plugin '{}' does not include index.html.",
            manifest.id
        ));
    }

    let html = fs::read_to_string(&entry_path).map_err(|error| error.to_string())?;
    inline_plugin_document_assets(&html, &plugin_dir, &manifest.id)
}

#[tauri::command]
pub fn plugin_emit(event: String, payload: Value, app: tauri::AppHandle) -> Result<(), String> {
    app.emit(&event, payload)
        .map_err(|error| format!("Failed to emit '{event}': {error}"))
}

fn emit_download_progress(app: &tauri::AppHandle, progress: PluginDownloadProgress) {
    if let Err(error) = app.emit("plugin_download_progress", progress) {
        eprintln!("Failed to emit plugin download progress: {error}");
    }
}

fn resolve_plugin_id(
    config: &crate::settings::config::AppConfig,
    plugin_id: Option<String>,
) -> Result<String, String> {
    if let Some(plugin_id) = plugin_id.filter(|id| !id.trim().is_empty()) {
        return Ok(plugin_id);
    }

    let plugins = list_plugins(config)?;
    match plugins.as_slice() {
        [plugin] => Ok(plugin.id.clone()),
        [] => Err("Plugin id is required because no plugins are installed.".to_string()),
        _ => Err("Plugin id is required when multiple plugins are installed.".to_string()),
    }
}

fn inline_plugin_document_assets(
    html: &str,
    plugin_dir: &std::path::Path,
    plugin_id: &str,
) -> Result<String, String> {
    let mut document = html.to_string();

    document = replace_asset_tags(document, plugin_dir, "script", "src", |content| {
        format!("<script type=\"module\">\n{content}\n</script>")
    })?;
    document = replace_asset_tags(document, plugin_dir, "link", "href", |content| {
        format!("<style>\n{content}\n</style>")
    })?;

    if !document.contains("data-dawndesk-plugin-shim") {
        document = document.replace(
            "</head>",
            &format!("{}\n</head>", plugin_ipc_shim(plugin_id)),
        );
    }

    Ok(document)
}

fn replace_asset_tags(
    html: String,
    plugin_dir: &std::path::Path,
    tag_name: &str,
    attribute_name: &str,
    render_replacement: impl Fn(&str) -> String,
) -> Result<String, String> {
    let mut output = String::with_capacity(html.len());
    let mut rest = html.as_str();
    let opening = format!("<{tag_name}");

    while let Some(start) = rest.find(&opening) {
        output.push_str(&rest[..start]);
        rest = &rest[start..];

        let Some(end) = rest.find('>') else {
            output.push_str(rest);
            return Ok(output);
        };

        let tag = &rest[..=end];
        rest = &rest[end + 1..];

        let Some(asset_ref) = extract_asset_ref(tag, attribute_name) else {
            output.push_str(tag);
            continue;
        };

        let Some(asset_name) = normalize_asset_ref(&asset_ref) else {
            output.push_str(tag);
            continue;
        };

        let asset_path = plugin_dir.join("assets").join(asset_name);
        let asset_content = fs::read_to_string(&asset_path).map_err(|error| {
            format!(
                "Failed to read plugin asset '{}': {error}",
                asset_path.display()
            )
        })?;
        output.push_str(&render_replacement(&asset_content));

        if tag_name == "script" {
            if let Some(close) = rest.find("</script>") {
                rest = &rest[close + "</script>".len()..];
            }
        }
    }

    output.push_str(rest);
    Ok(output)
}

fn extract_asset_ref(tag: &str, attribute_name: &str) -> Option<String> {
    for quote in ['"', '\''] {
        let needle = format!("{attribute_name}={quote}");
        if let Some(start) = tag.find(&needle).map(|index| index + needle.len()) {
            let end = tag[start..].find(quote)?;
            return Some(tag[start..start + end].to_string());
        }
    }

    None
}

fn normalize_asset_ref(asset_ref: &str) -> Option<&str> {
    asset_ref
        .strip_prefix("./assets/")
        .or_else(|| asset_ref.strip_prefix("/assets/"))
        .or_else(|| asset_ref.strip_prefix("assets/"))
}

fn plugin_ipc_shim(plugin_id: &str) -> String {
    format!(
        r#"<script data-dawndesk-plugin-shim>
(() => {{
  const pluginId = {plugin_id:?};
  const scopedCommands = new Set(['plugin_get_data', 'plugin_set_data', 'plugin_delete_data', 'plugin_info']);
  function patch() {{
    if (!window.__TAURI__ && window.parent && window.parent.__TAURI__) window.__TAURI__ = window.parent.__TAURI__;
    const core = window.__TAURI__ && window.__TAURI__.core;
    if (!core || core.__dawndeskPluginScoped) return Boolean(core);
    const invoke = core.invoke.bind(core);
    core.invoke = (command, args = {{}}) => {{
      if (scopedCommands.has(command)) args = {{ pluginId, ...args }};
      return invoke(command, args);
    }};
    core.__dawndeskPluginScoped = true;
    return true;
  }}
  if (!patch()) {{
    const timer = setInterval(() => {{ if (patch()) clearInterval(timer); }}, 10);
    setTimeout(() => clearInterval(timer), 5000);
  }}
}})();
</script>"#
    )
}
