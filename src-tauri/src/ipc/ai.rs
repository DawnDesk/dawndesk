use crate::{
    ai::{
        engine::{chat, ChatMessage},
        registry::{collect_tools, ToolDefinition},
    },
    ipc::settings::current_config,
    AppState,
};

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
) -> Result<String, String> {
    let config = current_config(&state)?;
    chat(&config, &messages, stream)
}
