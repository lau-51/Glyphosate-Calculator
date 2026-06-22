import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Let's accept JSON with sufficient limit for base64 images
  app.use(express.json({ limit: "30mb" }));

  // Initialize server-side Gemini client securely
  const genaiApiKey = process.env.GEMINI_API_KEY;
  const ai = new GoogleGenAI({
    apiKey: genaiApiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });

  // API endpoints FIRST
  app.post("/api/ai/chat", async (req, res) => {
    try {
      if (!genaiApiKey) {
        return res.status(403).json({
          error: "Clé d'API manquante. Veuillez configurer GEMINI_API_KEY dans l'onglet Paramètres > Secrets.",
        });
      }

      const { prompt, image, model, isHighThinking, isMapsGrounding, lat, lon } = req.body;

      if (!prompt && !image) {
        return res.status(400).json({ error: "Veuillez fournir une question ou une image pour l'analyse." });
      }

      let modelName = model || "gemini-3.5-flash";
      const contentsParts: any[] = [];

      // Image analysis MUST use gemini-3.1-pro-preview
      if (image) {
        modelName = "gemini-3.1-pro-preview";
        let cleanBase64 = image;
        let mimeType = "image/jpeg";
        const matches = image.match(/^data:(image\/[a-zA-Z1-9+-.]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          mimeType = matches[1];
          cleanBase64 = matches[2];
        }
        contentsParts.push({
          inlineData: {
            data: cleanBase64,
            mimeType: mimeType,
          },
        });
      }

      if (prompt) {
        contentsParts.push({ text: prompt });
      }

      const config: any = {};

      // Handle Maps grounding and High Thinking mutually exclusively
      if (isMapsGrounding) {
        // Maps Grounding uses gemini-3.5-flash
        modelName = "gemini-3.5-flash";
        config.tools = [{ googleMaps: {} }];
        if (lat !== undefined && lon !== undefined) {
          config.toolConfig = {
            retrievalConfig: {
              latLng: {
                latitude: Number(lat),
                longitude: Number(lon),
              },
            },
          };
        }
      } else if (isHighThinking && !image) {
        // High thinking requires gemini-3.1-pro-preview and `thinkingLevel` to ThinkingLevel.HIGH
        modelName = "gemini-3.1-pro-preview";
        config.thinkingConfig = {
          thinkingLevel: ThinkingLevel.HIGH,
        };
        // DO NOT set maxOutputTokens for thinking
      }

      const response = await ai.models.generateContent({
        model: modelName,
        contents: contentsParts,
        config: config,
      });

      const responseText = response.text || "";
      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || null;

      res.json({
        text: responseText,
        groundingChunks: groundingChunks,
        modelUsed: modelName,
      });
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      res.status(500).json({
        error: error.message || "Une erreur s'est produite lors de l'appel à l'API Gemini.",
      });
    }
  });

  // Serve static files / mount Vite in dev mode
  const isProduction = 
    process.env.NODE_ENV === "production" || 
    (typeof __filename !== "undefined" && (__filename.includes("dist") || __filename.includes("server.cjs")));

  if (!isProduction) {
    console.log("Starting server in DEVELOPMENT mode with Vite middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in PRODUCTION mode serving from dist/...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    var express = require('express');

// set up rate limiter: maximum of five requests per minute
var RateLimit = require('express-rate-limit');
var limiter = RateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // max 100 requests per windowMs
});

// apply rate limiter to all requests
app.use(limiter);

app.get('/:path', function(req, res) {
  const requestedPath = req.params.path;

  // Allow only simple safe file names (no path separators / traversal).
  if (!/^[a-zA-Z0-9._-]+$/.test(requestedPath)) {
    res.status(400).send("Invalid path");
    return;
  }

  const resolvedPath = path.join(distPath, requestedPath);

  if (!resolvedPath.startsWith(distPath + path.sep) && resolvedPath !== distPath) {
    res.status(403).send("Forbidden");
    return;
  }

  res.sendFile(resolvedPath);
});

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

startServer();
}
