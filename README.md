# pi-extension-lmstudio

A dynamic extension for the [Pi Coding Agent](https://github.com) that automatically discovers, loads, unloads, and synchronizes your local [LM Studio](https://lmstudio.ai) models natively using slash commands.

## ✨ Features

- **Dynamic Syncing:** Automatically fetches downloaded models from your local LM Studio server and populates Pi's `/model` selector on boot.
- **VRAM Control inside Pi:** Load or unload LLMs into your GPU/RAM without leaving your active terminal workspace.
- **Auto-Switching:** Automatically updates Pi's active context target to your selected model immediately upon loading.
- **Global Memory Flush:** Clear out all system memory instantly with a clean `/lmstudio unload --all` override.

---

## 📋 Prerequisites

Before installing, make sure you have the following packages running on your host system:

1. **LM Studio Desktop App:** Downloaded and installed from [lmstudio.ai](https://lmstudio.ai).
2. **Bootstrap LMS CLI:** Open LM Studio, head to settings, and click **Bootstrap lms CLI** to ensure the `lms` command utility is active in your terminal shell path.
3. **Local Server Enabled:** Start the local developer server inside LM Studio (defaulting to port `1234`).

---

## 🚀 Installation

Follow these quick steps to hook the plugin up to your Pi configuration workspace:

### 1. Register Local Provider Credentials
Pi requires a local auth mapping to allow customized third-party providers. Create an `auth.json` file if you haven't already:

```bash
mkdir -p ~/.pi/agent
nano ~/.pi/agent/auth.json
```

Paste this dummy credential block to activate the `lmstudio` scope:

```json
{
  "providers": {
    "lmstudio": {
      "token": "dummy-local-token-value"
    }
  }
}
```

### 2. Deploy the Extension Script
Navigate to your global Pi configurations directory and pull down the extension script:

```bash
mkdir -p ~/.pi/agent/extensions
nano ~/.pi/agent/extensions/lmstudio.js
```

Paste the complete `lmstudio.js` code inside this file, save (`Ctrl+O`), and close it.

---

## 🛠️ Usage

Fire up your agent environment natively by running:
```bash
pi
```

### Native Slash Commands
The extension hooks directly into Pi's autocomplete UI interface framework:

| Command | Action |
| :--- | :--- |
| `/lmstudio load <model-id>` | Loads the chosen disk-model directly into VRAM and sets it as your active Pi session model. |
| `/lmstudio unload <model-id>` | Safely unloads a single target model out of your system memory. |
| `/lmstudio unload --all` | Drops **all** active models out of your GPU/VRAM to free up hardware resources instantly. |

> **Pro-Tip:** If you download new models through the LM Studio application while Pi is running, just type `/reload` inside the prompt to re-trigger automatic discovery and update your selection menu dropdowns.

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com) if you want to expand support (e.g., automated context window window tracking or temperature modifiers).

## 📄 License
This project is licensed under the [MIT License](LICENSE).
