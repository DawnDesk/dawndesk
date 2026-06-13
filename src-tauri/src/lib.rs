mod ai {
    pub mod engine;
    pub mod registry;
}

mod db;

mod ipc {
    pub mod ai;
    pub mod plugins;
    pub mod settings;
}

mod plugins {
    pub mod manager;
    pub mod manifest;
    pub mod sidecar;
}

mod settings {
    pub mod config;
}

use settings::config::{ensure_data_dirs, read_config, AppConfig};
use std::sync::Mutex;

pub(crate) struct AppState {
    pub(crate) config: Mutex<AppConfig>,
    pub(crate) sidecars: plugins::sidecar::SidecarManager,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let config = read_config().unwrap_or_default();
    if let Err(error) = ensure_data_dirs(&config) {
        eprintln!("Failed to initialize DawnDesk data directories: {error}");
    }
    if let Err(error) = db::initialize_database(&config) {
        eprintln!("Failed to initialize DawnDesk database: {error}");
    }

    tauri::Builder::default()
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .manage(AppState {
            config: Mutex::new(config),
            sidecars: plugins::sidecar::SidecarManager::new(),
        })
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            ipc::settings::settings_get,
            ipc::settings::settings_set,
            ipc::settings::settings_get_data_root,
            ipc::settings::settings_set_data_root,
            ipc::plugins::plugin_list,
            ipc::plugins::plugin_install,
            ipc::plugins::plugin_uninstall,
            ipc::plugins::plugin_get_data,
            ipc::plugins::plugin_set_data,
            ipc::plugins::plugin_delete_data,
            ipc::plugins::plugin_info,
            ipc::plugins::plugin_entry_document,
            ipc::plugins::plugin_emit,
            ipc::ai::ai_get_tools,
            ipc::ai::ai_chat
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
