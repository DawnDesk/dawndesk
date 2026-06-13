use crate::{
    db::initialize_database,
    settings::config::{ensure_data_dirs, write_config, AppConfig},
    AppState,
};

pub fn current_config(state: &tauri::State<'_, AppState>) -> Result<AppConfig, String> {
    state
        .config
        .lock()
        .map(|config| config.clone())
        .map_err(|error| error.to_string())
}

#[tauri::command]
pub fn settings_get(state: tauri::State<'_, AppState>) -> Result<AppConfig, String> {
    current_config(&state)
}

#[tauri::command]
pub fn settings_set(config: AppConfig, state: tauri::State<'_, AppState>) -> Result<(), String> {
    ensure_data_dirs(&config)?;
    write_config(&config)?;

    let mut stored = state.config.lock().map_err(|error| error.to_string())?;
    *stored = config;
    Ok(())
}

#[tauri::command]
pub fn settings_get_data_root(state: tauri::State<'_, AppState>) -> Result<String, String> {
    Ok(current_config(&state)?.data_root)
}

#[tauri::command]
pub fn settings_set_data_root(
    path: String,
    state: tauri::State<'_, AppState>,
) -> Result<(), String> {
    let mut config = current_config(&state)?;
    config.data_root = path;
    settings_set(config, state)
}

#[tauri::command]
pub fn auth_set_active_user(
    user_id: Option<String>,
    state: tauri::State<'_, AppState>,
) -> Result<(), String> {
    let mut config = current_config(&state)?;
    config.active_user_id = user_id.filter(|value| !value.trim().is_empty());
    ensure_data_dirs(&config)?;
    initialize_database(&config)?;
    write_config(&config)?;

    let mut stored = state.config.lock().map_err(|error| error.to_string())?;
    *stored = config;
    Ok(())
}
