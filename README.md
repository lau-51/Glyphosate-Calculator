# Guide d'Installation et d'Exécution Locale - Calculateur de Dose Roundup

Ce projet est une application web moderne (PWA) de calcul agronomique, de dosage de précision et d'aide à la décision pour le remplissage de cuve ou de pulvérisateur portatif (Roundup et produits de substitution).

---

## 📋 Prérequis

Pour exécuter cette application sur votre ordinateur, vous devez avoir installé :
1. **Node.js** (Version 18.0.0 ou supérieure recommandée) :
   - [Télécharger Node.js](https://nodejs.org/) (choisir la version LTS pour plus de stabilité).
2. **Un terminal de commande** (Command Prompt sur Windows, Terminal sur macOS/Linux).
3. **Un navigateur moderne** (Chrome, Firefox, Edge, Safari).

---

## 🚀 Étape 1 : Téléchargement du Projet

1. Cliquez sur l'icône d'exportation dans le menu de Google AI Studio (ou via les options d'exportation de l'interface) et sélectionnez **Télécharger ZIP** (Export to ZIP).
2. Extrayez l'archive `.zip` obtenue dans le dossier de votre choix sur votre ordinateur.

---

## 🛠️ Étape 2 : Installation des Dépendances

1. Ouvrez votre terminal ou invite de commandes.
2. Naviguez vers le dossier désarchivé du projet en utilisant la commande `cd` :
   ```bash
   cd /chemin/vers/votre/dossier/extrait
   ```
3. Installez toutes les dépendances requises en exécutant la commande suivante :
   ```bash
   npm install
   ```

---

## 💻 Étape 3 : Exécution en Mode Développement

Pour lancer l'application en mode interactif local et tester vos modifications en temps réel :

1. Dans votre terminal, lancez le serveur de développement :
   ```bash
   npm run dev
   ```
2. Ouvrez votre navigateur et accédez à l'URL locale indiquée dans le terminal (généralement `http://localhost:3000` ou `http://localhost:5173`).

---

## 📦 Étape 4 : Compilation de Production (Build)

Pour générer la version optimisée et finale, prête à être mise en ligne sur un serveur statique ou partagée :

1. Exécutez la commande de build :
   ```bash
   npm run build
   ```
2. Les fichiers statiques prêts pour le déploiement seront générés dans le dossier **`dist/`** à la racine de votre dossier.

---

## 📄 Étape 5 : Exporter ce guide en PDF

Pour transformer ce guide en document PDF imprimable :
- **Via VS Code / Markdown Editor** : Cliquez droit sur ce fichier `README.md`, choisissez *Markdown PDF: Export (pdf)* si vous avez l'extension adéquate.
- **Via Navigateur** : Ouvrez ce fichier dans n'importe quel visualisateur Markdown web, puis faites `Ctrl + P` (ou `Cmd + P`) et choisissez **Enregistrer au format PDF**.

---

## ✨ Fonctionnalités Incluses

- **Onglet Agricole** : Plan de remplissage intelligent de cuves d'engins agricoles avec calcul du taux de produit pur requis, gestion du reliquat partiel, volumes de bouillie et consignes réglementaires (C.E.P.A).
- **Onglet Jardinier** : Calcul en millilitres pour pulvérisateurs portatifs manuels (de 1 à 20 litres) avec prise en compte du rendement de buse et de la concentration choisie (360, 450, 480 ou 500 g/L de glyphosate ou équivalents biocontrôles).
- **Aide Décisionnelle Météo** : Évaluation en temps réel des risques de dérive par le vent (limite de 19 km/h), évaporation (température) et niveau hygrométrique.
- **Guide de Sécurité** : Rappel des Équipements de Protection Individuelle (EPI) obligatoires et fiches de premiers secours rapides.
