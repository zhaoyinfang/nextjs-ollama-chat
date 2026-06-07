This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

# Zhaoyins KI-Projekt 🚀

Eine moderne, blitzschnelle Chat-Schnittstelle basierend auf **Next.js**, **Material-UI (MUI)** und dem brandneuen **Vercel AI SDK v5**. Das Projekt kommuniziert direkt mit einem lokalen **Llama 3.2** Modell über **Ollama**. Das bedeutet: 100% Datenschutz, alle Daten bleiben lokal auf deinem Rechner!

---

## 🛠️ Features

- **Lokale KI-Power:** Nutzt Llama 3.2 über Ollama völlig kostenlos und offline.
- **Modernste UI:** Schicke, responsive Chat-Oberfläche mit Material-UI-Komponenten.
- **Echtzeit-Streaming:** Text-Streaming (Zeichen für Zeichen) im modernen v5-UIMessage-Format.
- **RAG-Ready:** Integrierter PDF-Upload-Button (Vorbereitet für zukünftige Dokumenten-Analyse).

---

## 📋 Voraussetzungen

Bevor du das Projekt startest, müssen folgende Werkzeuge auf deinem System installiert sein:

1. **Node.js** (Version 18 oder neuer)
2. **Ollama** (Lokaler KI-Server)
   - [Ollama für Linux/Mac/Windows herunterladen](https://ollama.com)

---

## 🚀 Lokale Einrichtung & Start

Folge diesen Schritten, um das Projekt nach dem Klonen auf deinem lokalen Rechner einzurichten.

### 1. Repository klonen und Ordner wechseln

```bash
git clone [https://github.com/zhaoyinfang/nextjs-ollama-chat.git](https://github.com/zhaoyinfang/nextjs-ollama-chat.git)
cd nextjs-ollama-chat


# 1. download Ollama (Lokaler KI-Server)
https://ollama.com/ (only for the first time)

# 2.download modell llama3.2 (only for the first time)
command: ollama pull llama3.2

# 3. start Ollama-Dienst # Auf Linux (Ubuntu):
command: sudo systemctl start ollama

#4: update vektoren.json, if fakten.json is changed. Before the Embedding-Modell should be downloaded with ollama pull nomic-embed-text
command: ollama pull nomic-embed-text (only once)
command: npx tsx scripts/embed.ts

# 5 start nextjs
command: npm run dev
```
