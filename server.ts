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

  // API endpoint for EPHY Anses phytosanitary product scraper / importer
  app.post("/api/phytos/import", async (req, res) => {
    try {
      if (!genaiApiKey) {
        return res.status(403).json({
          error: "Clé d'API manquante. Veuillez configurer GEMINI_API_KEY dans l'onglet Paramètres > Secrets.",
        });
      }

      const { url, rawText, name } = req.body;

      if (!url && !rawText && !name) {
        return res.status(400).json({ error: "S'il vous plaît, fournissez au moins une URL, du texte brute ou un nom de produit." });
      }

      let targetText = "";
      let source = "Recherche intelligente par IA";

      if (url) {
        source = `Lien Ephy Anses (${url})`;
        try {
          // Validate hostname to ensure it's from ANSES domain
          const parsedUrl = new URL(url);
          if (!parsedUrl.hostname.endsWith("ephy.anses.fr") && !parsedUrl.hostname.endsWith("anses.fr")) {
            return res.status(400).json({ error: "L'URL fournie doit provenir du site officiel ephy.anses.fr" });
          }

          console.log(`Scraping URL: ${url}`);
          // Fetch the page using server-side fetch with headers
          const fetchRes = await fetch(url, {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
              "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
              "Accept-Language": "fr-FR,fr;q=0.8,en-US;q=0.5,en;q=0.3"
            }
          });

          if (!fetchRes.ok) {
            throw new Error(`Le site Ephy a retourné un statut HTTP ${fetchRes.status}`);
          }

          const html = await fetchRes.text();
          // Clean HTML slightly so that we don't blow up token windows unnecessarily
          targetText = html
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
            .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, '')
            .replace(/<[^>]*>/g, ' ')
            .replace(/\s+/g, ' ')
            .substring(0, 35000); // Take the first 35k chars of readable content
        } catch (fetchErr: any) {
          console.error("Scraper fetch error:", fetchErr);
          // Return a structured error indicating fetching failed, so the frontend can fallback gracefully
          return res.status(502).json({
            error: `La récupération en direct depuis ephy.anses.fr a échoué: ${fetchErr.message}. Veuillez copier-coller le texte directement ou utiliser la recherche intelligente par IA.`,
            tryFallback: true
          });
        }
      } else if (rawText) {
        source = "Copie-coller du texte EPHY";
        targetText = rawText.substring(0, 45000);
      } else if (name) {
        source = "Recherche encyclopédique IA";
        targetText = `Rechercher et modéliser de façon réglementaire le produit phytosanitaire homologué en France sous le nom commercial: "${name}".`;
      }

      console.log(`Analyzing phyto content for: ${name || url || "rawText"}`);

      // Call Gemini 3.5 Flash for structuring the text data
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `
          Tu es un ingénieur agronome expert en réglementation et traitements de protection des cultures (phytosanitaires).
          Extrais ou restitue de façon scientifique et conforme aux homologations d'Ephy Anses les informations du produit suivant:

          Texte source:
          ${targetText}

          Fais appel à tes connaissances très précises pour combler toute lacune ou manque dans les informations du texte d'Ephy (dosage par ha, AMM exact, substances actives, DAR en jours, etc.).
          L'objectif est d'aider l'agriculteur à préparer son mélange de traitement en toute sécurité et conformément aux règlements HVE / IFT. 

          Donne un résultat structuré répondant scrupuleusement au format de sortie JSON requis.
        `,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING, description: "Nom commercial complet en MAJUSCULES (ex: CHAMP FLO)" },
              amm: { type: Type.STRING, description: "Numéro de l'AMM de 7 chiffres (ex: 7000215, 2200115)" },
              substances: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING }, 
                description: "Substances de la composition avec leurs teneurs exactes (ex: [\"Cuivre 360 g/L\", \"Azoxystrobine 250 g/L\"])" 
              },
              holder: { type: Type.STRING, description: "Société titulaire ou distributrice du produit" },
              type: { type: Type.STRING, description: "Catégorie de produit (ex: Herbicide, Fongicide, Insecticide, etc.)" },
              formulation: { type: Type.STRING, description: "Type de formulation physique (ex: Suspension de contact, Dispersion huileuse (OD))" },
              usages: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    culture: { type: Type.STRING, description: "Culture cible en français (ex: Vigne, Blé, Pommier, Betterave)" },
                    target: { type: Type.STRING, description: "Maladie, ravageur ou adventice ciblé par ce traitement (ex: Mildiou, Oïdium, Adventices annuelles)" },
                    maxDose: { type: Type.NUMBER, description: "Dose maximale homologué autorisée par hectare, valeur numérique en L/ha ou kg/ha. S'il n'y a pas d'unité, renvoie la dose commerciale standard par hectare (ex: 2.5)" },
                    maxApplications: { type: Type.INTEGER, description: "Nombre maximum de traitements par an (par défaut 1 ou 2)" },
                    dar: { type: Type.STRING, description: "Délai avant récolte : DAR en jours (ex: \"21 jours\", \"7 jours\", \"F (Sans objet)\")" },
                    zntEau: { type: Type.STRING, description: "ZNT Aquatique réglementaire : Distance en mètres (ex: \"5 m\", \"20 m\", \"50 m\")" },
                    zntSante: { type: Type.STRING, description: "ZNT Personnes présentes et riverains : Distance en mètres (ex: \"10 m\", \"5 m\", \"Non spécifié\")" },
                    dre: { type: Type.STRING, description: "Délai de rentrée après application : DRE (ex: \"24 heures\", \"48 heures\", \"6 heures\")" },
                  },
                  required: ["culture", "target", "maxDose"]
                },
                description: "Les 2 ou 3 principaux usages les plus courants pour ce produit en agriculture/viticulture"
              },
              mentionDanger: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING }, 
                description: "Phrases H et pictogrammes de danger associés (ex: [\"H410: Très toxique pour l'environnement\", \"H318: Lésions oculaires graves\"])" 
              },
              epiRequis: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING }, 
                description: "Équipements de protection obligatoire (ex: [\"Gants de nitrile\", \"Masque de type FFP3\", \"Tablier à manches longues catégorie III\", \"Lunettes de protection\"])" 
              }
            },
            required: ["name", "amm", "substances", "type", "usages"]
          },
          temperature: 0.15
        }
      });

      const parsedJson = JSON.parse(response.text.trim());
      
      const enrichedProduct = {
        ...parsedJson,
        id: parsedJson.amm || "amm-" + Date.now(),
        dateImport: new Date().toLocaleDateString('fr-FR'),
        source: source
      };

      res.json({ success: true, product: enrichedProduct });
    } catch (apiErr: any) {
      console.error("Phyto Import Gemini error:", apiErr);
      res.status(500).json({
        success: false,
        error: `Une erreur s'est produite lors de l'extraction de l'homologation : ${apiErr.message}`
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
