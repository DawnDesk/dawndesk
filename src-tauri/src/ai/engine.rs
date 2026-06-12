use crate::settings::config::{AiProvider, AppConfig};
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Deserialize, Serialize)]
pub struct ChatMessage {
    pub role: String,
    pub content: String,
}

#[derive(Debug, Serialize)]
struct OllamaChatRequest<'a> {
    model: &'a str,
    messages: &'a [ChatMessage],
    stream: bool,
}

#[derive(Debug, Deserialize)]
struct OllamaChatResponse {
    message: Option<OllamaChatMessage>,
    error: Option<String>,
}

#[derive(Debug, Deserialize)]
struct OllamaChatMessage {
    content: String,
}

pub fn chat(config: &AppConfig, messages: &[ChatMessage], stream: bool) -> Result<String, String> {
    match config.ai_provider {
        AiProvider::OllamaCloud => chat_ollama_cloud(config, messages, stream),
        AiProvider::Anthropic => {
            Err("Anthropic chat is not implemented yet. Select Ollama Cloud for now.".to_string())
        }
        AiProvider::Openai => {
            Err("OpenAI chat is not implemented yet. Select Ollama Cloud for now.".to_string())
        }
    }
}

fn chat_ollama_cloud(
    config: &AppConfig,
    messages: &[ChatMessage],
    stream: bool,
) -> Result<String, String> {
    if stream {
        return Err("Streaming chat is not implemented for Ollama Cloud yet.".to_string());
    }

    let api_key = config.api_keys.ollama_cloud.trim();
    if api_key.is_empty() {
        return Err("Add an Ollama Cloud API key in Settings before chatting.".to_string());
    }

    if config.ai_model.trim().is_empty() {
        return Err("Select an Ollama Cloud model in Settings before chatting.".to_string());
    }

    let http_response = reqwest::blocking::Client::new()
        .post("https://ollama.com/api/chat")
        .bearer_auth(api_key)
        .json(&OllamaChatRequest {
            model: config.ai_model.trim(),
            messages,
            stream: false,
        })
        .send()
        .map_err(|error| format!("Ollama Cloud request failed: {error}"))?;

    let status = http_response.status();
    let body = http_response
        .text()
        .map_err(|error| format!("Failed to read Ollama Cloud response: {error}"))?;

    let response = serde_json::from_str::<OllamaChatResponse>(&body)
        .map_err(|error| format!("Failed to parse Ollama Cloud response: {error}"))?;

    if !status.is_success() {
        return Err(response
            .error
            .map(|error| format!("Ollama Cloud error: {error}"))
            .unwrap_or_else(|| format!("Ollama Cloud returned HTTP {status}.")));
    }

    if let Some(error) = response.error {
        return Err(format!("Ollama Cloud error: {error}"));
    }

    let content = response
        .message
        .map(|message| message.content)
        .ok_or_else(|| "Ollama Cloud returned an empty response.".to_string())?;

    if content.trim().is_empty() {
        Err("Ollama Cloud returned an empty response.".to_string())
    } else {
        Ok(content)
    }
}
