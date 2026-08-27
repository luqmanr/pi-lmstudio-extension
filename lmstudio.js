import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";

const MODELS_JSON_PATH = path.join(os.homedir(), ".pi", "agent", "models.json");

async function syncModelsToConfig(ctx) {
  try {
    const response = await fetch("http://localhost:1234/v1/models");
    if (!response.ok) return false;
    
    const data = await response.json();
    const modelList = data.data.map(model => ({
      id: model.id,
      input: ["text"]
    }));

    const configData = {
      providers: {
        lmstudio: {
          baseUrl: "http://localhost:1234/v1",
          api: "openai-completions",
          apiKey: "lm-studio",
          models: modelList
        }
      }
    };

    fs.mkdirSync(path.dirname(MODELS_JSON_PATH), { recursive: true });
    fs.writeFileSync(MODELS_JSON_PATH, JSON.stringify(configData, null, 2), "utf8");
    return true;
  } catch (e) {
    if (ctx) ctx.ui.notify("LM Studio Local Server is offline. Cannot sync models.", "error");
    return false;
  }
}

export default async function init(pi) {
  await syncModelsToConfig(null);

  pi.registerCommand("lmstudio", {
    description: "Manage and switch local LM Studio model states",
    arguments: async () => {
      let choices = [];
      try {
        const response = await fetch("http://localhost:1234/v1/models");
        if (response.ok) {
          const data = await response.json();
          choices = data.data.map(m => ({ value: m.id, description: "Downloaded local quant" }));
        }
      } catch (e) {
        choices = [{ value: "error", description: "LM Studio API offline" }];
      }

      choices.unshift({ value: "--all", description: "Unload every model from memory" });

      return [
        {
          name: "action",
          description: "Action to take",
          required: true,
          choices: [
            { value: "load", description: "Load model to VRAM and set as active" },
            { value: "unload", description: "Unload model / flush VRAM" }
          ]
        },
        {
          name: "model",
          description: "Target model from local disk storage",
          required: false,
          choices: choices
        }
      ];
    },

    handler: async (args, ctx) => {
      let action = "";
      let modelName = "";

      // ==========================================
      // BULLETPROOF ARGUMENT PARSER (CATCH-ALL)
      // ==========================================
      
      // Scenario A: Pi packages it as a Positional Array [ "unload", "--all" ]
      if (Array.isArray(args)) {
        action = args[0] ? String(args[0]) : "";
        modelName = args.slice(1).join(" ");
      } 
      // Scenario B: Pi packages it as a Flat String "unload --all"
      else if (typeof args === "string") {
        const parts = args.trim().split(/\s+/);
        action = parts[0] ? String(parts[0]) : "";
        modelName = parts.slice(1).join(" ");
      }
      // Scenario C: Pi packages it as a Structured Object { action: "unload", model: "--all" }
      else if (args && typeof args === "object") {
        action = typeof args.action === "string" ? args.action : "";
        modelName = typeof args.model === "string" ? args.model : "";
      }

      // Sanitize parsed strings safely
      action = action.toLowerCase().trim();
      modelName = modelName.trim();

      // ==========================================
      // ROUTING LOGIC
      // ==========================================

      if (action !== "load" && action !== "unload") {
        ctx.ui.notify("Usage: /lmstudio [load|unload] [model-name]", "error");
        return;
      }

      // Universal VRAM Flush
      if (action === "unload" && (!modelName || modelName === "--all")) {
        ctx.ui.notify("Flushing VRAM: Unloading all models...", "info");
        try {
          execSync("lms unload --all", { stdio: "ignore" });
          ctx.ui.notify("Successfully unloaded all models.", "success");
        } catch (e) {
          ctx.ui.notify("Failed to execute lms CLI.", "error");
        }
        return;
      }

      // Guard check for load actions
      if (!modelName || modelName === "error") {
        ctx.ui.notify(`Please specify a valid model name to ${action}.`, "error");
        return;
      }

      ctx.ui.notify(`Instructing LM Studio to ${action}: ${modelName}...`, "info");
      
      try {
        execSync(`lms ${action} "${modelName}"`, { stdio: "ignore" });
        ctx.ui.notify(`Model successfully ${action}ed!`, "success");

        if (action === "load") {
          ctx.ui.notify("Updating local models.json configuration file...", "info");
          await syncModelsToConfig(ctx);

          ctx.ui.notify(`Updating Pi agent context to target ${modelName}...`, "info");
          await pi.selectModel(modelName);
          ctx.ui.notify(`Active workspace model changed to: ${modelName}`, "success");
        }
      } catch (error) {
        ctx.ui.notify(`Error processing: lms ${action} "${modelName}"`, "error");
      }
    }
  });
}
