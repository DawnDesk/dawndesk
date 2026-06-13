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
        let icon = resolve_plugin_icon(&plugin_dir, manifest.icon.as_deref())?;
        plugins.push(PluginMeta {
            id: manifest.id,
            name: manifest.name,
            version: manifest.version,
            description: manifest.description,
            enabled: true,
            installed_at: "local".to_string(),
            category: manifest.category,
            icon,
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
    let backup_dir = plugins_dir.join(format!(".previous-{id}"));
    let temp_dir = plugins_dir.join(format!(".installing-{id}"));
    if temp_dir.exists() {
        fs::remove_dir_all(&temp_dir).map_err(|error| error.to_string())?;
    }
    if backup_dir.exists() {
        fs::remove_dir_all(&backup_dir).map_err(|error| error.to_string())?;
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

    on_progress(progress_event(
        id,
        96.0,
        bytes.len() as u64,
        total_bytes,
        "installing",
    ));

    if install_dir.exists() {
        fs::rename(&install_dir, &backup_dir).map_err(|error| error.to_string())?;
    }

    let move_result = if manifest_dir == temp_dir {
        fs::rename(&temp_dir, &install_dir).map_err(|error| error.to_string())
    } else {
        fs::rename(&manifest_dir, &install_dir).map_err(|error| error.to_string())
    };

    if let Err(error) = move_result {
        restore_plugin_backup(&install_dir, &backup_dir);
        let _ = fs::remove_dir_all(&temp_dir);
        return Err(format!(
            "Failed to move plugin '{id}' into the install folder: {error}"
        ));
    }
    let _ = fs::remove_dir_all(&temp_dir);

    let final_check = patch_plugin_entrypoint(&install_dir, id).and_then(|_| {
        let final_manifest = install_dir.join("plugin.manifest.json");
        if !final_manifest.exists() {
            return Err(format!(
                "Plugin '{id}' installed, but plugin.manifest.json was not found in the final install folder."
            ));
        }
        read_manifest(&final_manifest).map(|_| ())
    });

    if let Err(error) = final_check {
        let _ = fs::remove_dir_all(&install_dir);
        restore_plugin_backup(&install_dir, &backup_dir);
        return Err(error);
    }

    if backup_dir.exists() {
        fs::remove_dir_all(&backup_dir).map_err(|error| error.to_string())?;
    }

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
    if is_seven_zip_archive(bytes) {
        return extract_seven_zip_archive(bytes, destination);
    }

    if !is_zip_archive(bytes) {
        return Err("Unsupported plugin archive format. Expected ZIP or 7z package.".to_string());
    }

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

fn extract_seven_zip_archive(bytes: &[u8], destination: &Path) -> Result<(), String> {
    let archive_path = destination.join(".plugin-package.7z");
    fs::write(&archive_path, bytes).map_err(|error| error.to_string())?;

    let result = sevenz_rust::decompress_file(&archive_path, destination)
        .map_err(|error| format!("Failed to extract 7z plugin package: {error}"));
    let _ = fs::remove_file(archive_path);
    result
}

fn is_zip_archive(bytes: &[u8]) -> bool {
    bytes.starts_with(b"PK\x03\x04")
        || bytes.starts_with(b"PK\x05\x06")
        || bytes.starts_with(b"PK\x07\x08")
}

fn is_seven_zip_archive(bytes: &[u8]) -> bool {
    bytes.starts_with(&[0x37, 0x7A, 0xBC, 0xAF, 0x27, 0x1C])
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

fn resolve_plugin_icon(plugin_dir: &Path, icon: Option<&str>) -> Result<Option<String>, String> {
    let Some(icon) = icon.map(str::trim).filter(|value| !value.is_empty()) else {
        return Ok(None);
    };

    if icon.starts_with("http://") || icon.starts_with("https://") || icon.starts_with("data:") {
        return Ok(Some(icon.to_string()));
    }

    let normalized_icon = icon
        .strip_prefix("./")
        .or_else(|| icon.strip_prefix('/'))
        .unwrap_or(icon);
    let icon_path = plugin_dir.join(normalized_icon);

    if !icon_path.exists() {
        return Ok(None);
    }

    let bytes = fs::read(&icon_path).map_err(|error| {
        format!(
            "Failed to read plugin icon '{}': {error}",
            icon_path.display()
        )
    })?;
    let mime = match icon_path
        .extension()
        .and_then(|extension| extension.to_str())
        .map(str::to_ascii_lowercase)
        .as_deref()
    {
        Some("svg") => "image/svg+xml",
        Some("png") => "image/png",
        Some("jpg") | Some("jpeg") => "image/jpeg",
        Some("webp") => "image/webp",
        Some("gif") => "image/gif",
        _ => "application/octet-stream",
    };

    Ok(Some(format!(
        "data:{mime};base64,{}",
        encode_base64(&bytes)
    )))
}

fn encode_base64(bytes: &[u8]) -> String {
    const TABLE: &[u8; 64] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let mut encoded = String::with_capacity(bytes.len().div_ceil(3) * 4);

    for chunk in bytes.chunks(3) {
        let first = chunk[0];
        let second = *chunk.get(1).unwrap_or(&0);
        let third = *chunk.get(2).unwrap_or(&0);

        encoded.push(TABLE[(first >> 2) as usize] as char);
        encoded.push(TABLE[(((first & 0b0000_0011) << 4) | (second >> 4)) as usize] as char);

        if chunk.len() > 1 {
            encoded.push(TABLE[(((second & 0b0000_1111) << 2) | (third >> 6)) as usize] as char);
        } else {
            encoded.push('=');
        }

        if chunk.len() > 2 {
            encoded.push(TABLE[(third & 0b0011_1111) as usize] as char);
        } else {
            encoded.push('=');
        }
    }

    encoded
}

fn patch_plugin_entrypoint(plugin_dir: &Path, plugin_id: &str) -> Result<(), String> {
    let index_path = plugin_dir.join("index.html");
    if !index_path.exists() {
        return Ok(());
    }

    let content = fs::read_to_string(&index_path).map_err(|error| error.to_string())?;
    let mut patched = content
        .replace("src=\"/assets/", "src=\"./assets/")
        .replace("href=\"/assets/", "href=\"./assets/");
    let shim = plugin_ipc_shim(plugin_id);

    if !patched.contains("data-dawndesk-plugin-shim") {
        patched = patched.replace("</head>", &format!("{shim}\n  </head>"));
    }

    if patched != content {
        fs::write(index_path, patched).map_err(|error| error.to_string())?;
    }

    Ok(())
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
      if (scopedCommands.has(command)) {{
        args = {{ pluginId, ...args }};
      }}
      return invoke(command, args);
    }};
    core.__dawndeskPluginScoped = true;
    return true;
  }}
  if (!patch()) {{
    const timer = setInterval(() => {{
      if (patch()) clearInterval(timer);
    }}, 10);
    setTimeout(() => clearInterval(timer), 5000);
  }}
}})();
</script>"#
    )
}

fn restore_plugin_backup(install_dir: &Path, backup_dir: &Path) {
    if backup_dir.exists() && !install_dir.exists() {
        let _ = fs::rename(backup_dir, install_dir);
    }
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
