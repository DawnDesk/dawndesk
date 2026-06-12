use crate::settings::config::AppConfig;
use std::{fs, path::PathBuf};

pub fn initialize_database(config: &AppConfig) -> Result<(), String> {
    let db_path = PathBuf::from(&config.data_root).join("dawndesk.db");
    if let Some(parent) = db_path.parent() {
        fs::create_dir_all(parent).map_err(|error| error.to_string())?;
    }

    if !db_path.exists() {
        fs::write(&db_path, "").map_err(|error| error.to_string())?;
    }

    Ok(())
}
