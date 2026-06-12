use crate::{plugins::manifest::read_manifest, settings::config::AppConfig};
use serde::Serialize;
use serde_json::{json, Map, Value};
use sha2::{Digest, Sha256};
use std::{
    fs,
    io::{Cursor, Read},
    path::{Path, PathBuf},
};
use zip::ZipArchive;

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
    pub entry_path: Option<String>,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PluginDownloadProgress {
    pub plugin_id: String,
    pub progress: f64,
    pub received_bytes: u64,
    pub total_bytes: Option<u64>,
    pub status: String,
}

pub fn list_plugins(config: &AppConfig) -> Result<Vec<PluginMeta>, String> {
    let plugins_dir = PathBuf::from(&config.data_root).join("plugins");

    if !plugins_dir.exists() {
        return Ok(Vec::new());
    }

    let mut plugins = Vec::new();
    for entry in fs::read_dir(plugins_dir).map_err(|error| error.to_string())? {
        let entry = entry.map_err(|error| error.to_string())?;
        if !entry.path().is_dir() || entry.file_name().to_string_lossy().starts_with('.') {
            continue;
        }

        let Some(manifest_path) = find_manifest_path(&entry.path()) else {
            continue;
        };
        let plugin_dir = manifest_path
            .parent()
            .map(Path::to_path_buf)
            .unwrap_or_else(|| entry.path());
        let manifest = read_manifest(&manifest_path)?;
        let entry_path = plugin_dir.join("index.html");
        plugins.push(PluginMeta {
            id: manifest.id,
            name: manifest.name,
            version: manifest.version,
            description: manifest.description,
            enabled: true,
            installed_at: "local".to_string(),
            category: manifest.category,
            icon: manifest.icon,
            entry_path: entry_path
                .exists()
                .then(|| entry_path.to_string_lossy().to_string()),
        });
    }

    plugins.sort_by(|left, right| left.name.cmp(&right.name));
    Ok(plugins)
}

pub fn install_plugin(
    config: &AppConfig,
    id: &str,
    url: &str,
    checksum: &str,
    mut on_progress: impl FnMut(PluginDownloadProgress),
) -> Result<(), String> {
    validate_plugin_id(id)?;

    on_progress(progress_event(id, 0.0, 0, None, "starting"));

    let mut response = reqwest::blocking::get(url)
        .map_err(|error| format!("Failed to download plugin '{id}': {error}"))?
        .error_for_status()
        .map_err(|error| format!("Plugin download failed for '{id}': {error}"))?;
    let total_bytes = response.content_length();
    let mut bytes = Vec::new();
    let mut buffer = [0_u8; 64 * 1024];

    loop {
        let read = response
            .read(&mut buffer)
            .map_err(|error| format!("Failed to read plugin download for '{id}': {error}"))?;
        if read == 0 {
            break;
        }

        bytes.extend_from_slice(&buffer[..read]);
        let received_bytes = bytes.len() as u64;
        let progress = total_bytes
            .filter(|total| *total > 0)
            .map(|total| (received_bytes as f64 / total as f64) * 80.0)
            .unwrap_or(12.0);
        on_progress(progress_event(
            id,
            progress,
            received_bytes,
            total_bytes,
            "downloading",
        ));
    }

    on_progress(progress_event(
        id,
        84.0,
        bytes.len() as u64,
        total_bytes,
        "verifying",
    ));
    verify_checksum(id, &bytes, checksum)?;

    let plugins_dir = PathBuf::from(&config.data_root).join("plugins");
    fs::create_dir_all(&plugins_dir).map_err(|error| error.to_string())?;

    let install_dir = plugins_dir.join(id);
    let temp_dir = plugins_dir.join(format!(".installing-{id}"));
    if temp_dir.exists() {
        fs::remove_dir_all(&temp_dir).map_err(|error| error.to_string())?;
    }
    fs::create_dir_all(&temp_dir).map_err(|error| error.to_string())?;

    on_progress(progress_event(
        id,
        90.0,
        bytes.len() as u64,
        total_bytes,
        "extracting",
    ));

    extract_plugin_archive(&bytes, &temp_dir).inspect_err(|_| {
        let _ = fs::remove_dir_all(&temp_dir);
    })?;

    let manifest_dir = find_manifest_dir(&temp_dir)
        .ok_or_else(|| format!("Plugin archive for '{id}' does not contain plugin.manifest.json."))
        .inspect_err(|_| {
            let _ = fs::remove_dir_all(&temp_dir);
        })?;
    let manifest = read_manifest(&manifest_dir.join("plugin.manifest.json")).inspect_err(|_| {
        let _ = fs::remove_dir_all(&temp_dir);
    })?;

    if manifest.id != id {
        let _ = fs::remove_dir_all(&temp_dir);
        return Err(format!(
            "Plugin archive id mismatch. Expected '{id}', found '{}'.",
            manifest.id
        ));
    }

    if install_dir.exists() {
        fs::remove_dir_all(&install_dir).map_err(|error| error.to_string())?;
    }

    on_progress(progress_event(
        id,
        96.0,
        bytes.len() as u64,
        total_bytes,
        "installing",
    ));

    if manifest_dir == temp_dir {
        fs::rename(&temp_dir, &install_dir).map_err(|error| error.to_string())?;
    } else {
        fs::rename(&manifest_dir, &install_dir).map_err(|error| error.to_string())?;
        let _ = fs::remove_dir_all(&temp_dir);
    }

    patch_plugin_entrypoint(&install_dir)?;
    let final_manifest = install_dir.join("plugin.manifest.json");
    if !final_manifest.exists() {
        return Err(format!(
            "Plugin '{id}' installed, but plugin.manifest.json was not found in the final install folder."
        ));
    }
    read_manifest(&final_manifest)?;

    on_progress(progress_event(
        id,
        100.0,
        bytes.len() as u64,
        total_bytes,
        "complete",
    ));

    Ok(())
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

fn validate_plugin_id(id: &str) -> Result<(), String> {
    let valid = !id.is_empty()
        && id.chars().all(|character| {
            character.is_ascii_alphanumeric() || character == '-' || character == '_'
        });

    if valid {
        Ok(())
    } else {
        Err(format!("Plugin id '{id}' contains unsupported characters."))
    }
}

fn verify_checksum(id: &str, bytes: &[u8], checksum: &str) -> Result<(), String> {
    let expected = checksum
        .strip_prefix("sha256:")
        .unwrap_or(checksum)
        .to_lowercase();
    let actual = format!("{:x}", Sha256::digest(bytes));

    if actual == expected {
        Ok(())
    } else {
        Err(format!("Checksum mismatch for plugin '{id}'."))
    }
}

fn progress_event(
    id: &str,
    progress: f64,
    received_bytes: u64,
    total_bytes: Option<u64>,
    status: &str,
) -> PluginDownloadProgress {
    PluginDownloadProgress {
        plugin_id: id.to_string(),
        progress: progress.clamp(0.0, 100.0),
        received_bytes,
        total_bytes,
        status: status.to_string(),
    }
}

fn extract_plugin_archive(bytes: &[u8], destination: &Path) -> Result<(), String> {
    let reader = Cursor::new(bytes.to_vec());
    let mut archive = ZipArchive::new(reader).map_err(|error| error.to_string())?;

    for index in 0..archive.len() {
        let mut file = archive.by_index(index).map_err(|error| error.to_string())?;
        let enclosed_path = file
            .enclosed_name()
            .ok_or_else(|| format!("Archive contains an unsafe path: {}", file.name()))?;
        let output_path = destination.join(enclosed_path);

        if file.is_dir() {
            fs::create_dir_all(&output_path).map_err(|error| error.to_string())?;
            continue;
        }

        if let Some(parent) = output_path.parent() {
            fs::create_dir_all(parent).map_err(|error| error.to_string())?;
        }

        let mut output = fs::File::create(&output_path).map_err(|error| error.to_string())?;
        std::io::copy(&mut file, &mut output).map_err(|error| error.to_string())?;
    }

    Ok(())
}

fn find_manifest_dir(root: &Path) -> Option<PathBuf> {
    let mut stack = vec![root.to_path_buf()];

    while let Some(path) = stack.pop() {
        if path.join("plugin.manifest.json").exists() {
            return Some(path);
        }

        let entries = fs::read_dir(path).ok()?;
        for entry in entries.flatten() {
            if entry.path().is_dir() {
                stack.push(entry.path());
            }
        }
    }

    None
}

fn find_manifest_path(root: &Path) -> Option<PathBuf> {
    find_manifest_dir(root).map(|path| path.join("plugin.manifest.json"))
}

fn patch_plugin_entrypoint(plugin_dir: &Path) -> Result<(), String> {
    let index_path = plugin_dir.join("index.html");
    if !index_path.exists() {
        return Ok(());
    }

    let content = fs::read_to_string(&index_path).map_err(|error| error.to_string())?;
    let patched = content
        .replace("src=\"/assets/", "src=\"./assets/")
        .replace("href=\"/assets/", "href=\"./assets/");

    if patched != content {
        fs::write(index_path, patched).map_err(|error| error.to_string())?;
    }

    Ok(())
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
