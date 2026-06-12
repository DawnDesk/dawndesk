use crate::{
    ipc::settings::current_config,
    plugins::manager::{
        delete_plugin_data, get_plugin_data, install_plugin, list_plugins, set_plugin_data,
        uninstall_plugin, PluginDownloadProgress, PluginMeta,
    },
    AppState,
};
use serde_json::Value;
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
    plugin_id: String,
    key: String,
    state: tauri::State<'_, AppState>,
) -> Result<Option<Value>, String> {
    let config = current_config(&state)?;
    get_plugin_data(&config, &plugin_id, &key)
}

#[tauri::command]
pub fn plugin_set_data(
    plugin_id: String,
    key: String,
    value: Value,
    state: tauri::State<'_, AppState>,
) -> Result<(), String> {
    let config = current_config(&state)?;
    set_plugin_data(&config, &plugin_id, key, value)
}

#[tauri::command]
pub fn plugin_delete_data(
    plugin_id: String,
    key: String,
    state: tauri::State<'_, AppState>,
) -> Result<(), String> {
    let config = current_config(&state)?;
    delete_plugin_data(&config, &plugin_id, &key)
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
