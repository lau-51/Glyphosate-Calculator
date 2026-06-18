import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, ThinkingLevel, Type } from "@google/genai";
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
  app.get("/api/ephy/search", async (req, res) => {
    try {
      const q = req.query.q as string;
      if (!q || q.trim().length < 2) {
        return res.json([]);
      }

      if (!genaiApiKey) {
        return res.status(403).json({
          error: "Clé d'API manquante. Veuillez configurer GEMINI_API_KEY dans l'onglet Paramètres > Secrets.",
        });
      }

      // We call Gemini with Google Search to look up commercial name details on ephy.anses.fr
      const prompt = `Recherche sur le site officiel "ephy.anses.fr" les produits phytosanitaires ou herbicides dont le nom commercial ressemble ou commence par "${q}". Identifie jusqu'à 5 produits les plus pertinents. Pour chaque produit trouvé, fournis EXACTEMENT ces informations sous forme de tableau JSON d'objets :
- "name": le nom commercial exact du produit sur e-Phy.
- "ammNumber": le numéro d'AMM (Autorisation de Mise sur le Marché) à 7 chiffres du produit.
- "substanceName": le nom de la matière active ou substance active principale du produit.
- "concentration": la concentration numérique de cette matière active (ex: 360, 400).
- "unit": l'unité de concentration: "g/L" si c'est un produit liquide, ou "g/kg" si c'est un produit solide/sec/poudre.
- "isDry": true si le produit est sous forme solide (granulés WG/SG/poudre), false si c'est un liquide.

Recherche bien "site:ephy.anses.fr ${q}" pour ramener des données réelles et valides de la base Anses. Réponds UNIQUEMENT avec un tableau JSON valide. Pas de texte en dehors.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                ammNumber: { type: Type.STRING },
                substanceName: { type: Type.STRING },
                concentration: { type: Type.NUMBER },
                unit: { type: Type.STRING },
                isDry: { type: Type.BOOLEAN }
              },
              required: ["name", "substanceName", "concentration", "unit", "isDry"]
            }
          }
        }
      });

      const responseText = response.text || "[]";
      let results = [];
      try {
        results = JSON.parse(responseText.trim());
      } catch (e) {
        console.error("Failed to parse Gemini JSON:", responseText);
        // Fallback robust json extraction
        const jsonMatch = responseText.match(/\[\s*\{[\s\S]*\}\s*\]/);
        if (jsonMatch) {
          results = JSON.parse(jsonMatch[0]);
        } else {
          results = [];
        }
      }

      res.json(results);
    } catch (error: any) {
      console.error("E-Phy ANSES dynamic search error:", error);
      res.status(500).json({
        error: error.message || "Erreur de recherche sur e-phy.",
      });
    }
  });

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
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

startServer();
