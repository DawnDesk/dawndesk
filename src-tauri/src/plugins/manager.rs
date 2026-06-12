use crate::{plugins::manifest::read_manifest, settings::config::AppConfig};
use serde::Serialize;
use serde_json::{json, Map, Value};
use std::{fs, path::PathBuf};

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PluginMeta {
    pub id: String,
    pub name: String,
    pub version: String,
    pub description: String,
    pub enabled: bool,
    pub installed_at: String,
    pub category: Option<String>,
    pub icon: Option<String>,
}

pub fn list_plugins(config: &AppConfig) -> Result<Vec<PluginMeta>, String> {
    let plugins_dir = PathBuf::from(&config.data_root).join("plugins");

    if !plugins_dir.exists() {
        return Ok(Vec::new());
    }

    let mut plugins = Vec::new();
    for entry in fs::read_dir(plugins_dir).map_err(|error| error.to_string())? {
        let entry = entry.map_err(|error| error.to_string())?;
        let manifest_path = entry.path().join("plugin.manifest.json");
        if !manifest_path.exists() {
            continue;
        }

        let manifest = read_manifest(&manifest_path)?;
        plugins.push(PluginMeta {
            id: manifest.id,
            name: manifest.name,
            version: manifest.version,
            description: manifest.description,
            enabled: true,
            installed_at: "local".to_string(),
            category: manifest.category,
            icon: manifest.icon,
        });
    }

    plugins.sort_by(|left, right| left.name.cmp(&right.name));
    Ok(plugins)
}

pub fn install_plugin(id: &str) -> Result<(), String> {
    Err(format!(
        "Plugin install for '{id}' needs registry artifact download integration."
    ))
}

pub fn uninstall_plugin(config: &AppConfig, id: &str, keep_data: bool) -> Result<(), String> {
    let plugin_dir = PathBuf::from(&config.data_root).join("plugins").join(id);

    if !plugin_dir.exists() {
        return Err(format!("Plugin '{id}' is not installed."));
    }

    if keep_data {
        let manifest = plugin_dir.join("plugin.manifest.json");
        if manifest.exists() {
            fs::remove_file(manifest).map_err(|error| error.to_string())?;
        }
    } else {
        fs::remove_dir_all(plugin_dir).map_err(|error| error.to_string())?;
    }

    Ok(())
}

pub fn get_plugin_data(
    config: &AppConfig,
    plugin_id: &str,
    key: &str,
) -> Result<Option<Value>, String> {
    let store = read_json_object(plugin_store_path(config, plugin_id))?;
    Ok(store.get(key).cloned())
}

pub fn set_plugin_data(
    config: &AppConfig,
    plugin_id: &str,
    key: String,
    value: Value,
) -> Result<(), String> {
    let store_path = plugin_store_path(config, plugin_id);
    let mut store = read_json_object(store_path.clone())?;
    store.insert(key, value);
    write_json_object(store_path, &store)
}

pub fn delete_plugin_data(config: &AppConfig, plugin_id: &str, key: &str) -> Result<(), String> {
    let store_path = plugin_store_path(config, plugin_id);
    let mut store = read_json_object(store_path.clone())?;
    store.remove(key);
    write_json_object(store_path, &store)
}

fn plugin_store_path(config: &AppConfig, plugin_id: &str) -> PathBuf {
    PathBuf::from(&config.data_root)
        .join("plugins")
        .join(plugin_id)
        .join("data.json")
}

fn read_json_object(path: PathBuf) -> Result<Map<String, Value>, String> {
    if !path.exists() {
        return Ok(Map::new());
    }

    let content = fs::read_to_string(path).map_err(|error| error.to_string())?;
    let value: Value = serde_json::from_str(&content).map_err(|error| error.to_string())?;
    Ok(value.as_object().cloned().unwrap_or_default())
}

fn write_json_object(path: PathBuf, store: &Map<String, Value>) -> Result<(), String> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|error| error.to_string())?;
    }

    let content = serde_json::to_string_pretty(&json!(store)).map_err(|error| error.to_string())?;
    fs::write(path, content).map_err(|error| error.to_string())
}
