"use client";

import React, { useState } from "react";
import { useChat, UIMessage } from "@ai-sdk/react";
import {
  Container,
  Typography,
  TextField,
  Button,
  Paper,
  Box,
  List,
  ListItem,
  CircularProgress,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";

export default function ChatSchnittstelle() {
  const { messages, sendMessage, status } = useChat();
  const [input, setInput] = useState("");

  const isChatLoading = status === "submitted" || status === "streaming";

  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!input.trim() || isChatLoading) return;

    // In v5+ heißt das Feld für den Inhalt "text" statt "content"!
    sendMessage({
      text: input,
    });

    setInput("");
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      alert(
        `Datei "${file.name}" ausgewählt! Bereit für den nächsten RAG-Schritt.`,
      );
    }
  };

  const getMessageText = (m: UIMessage) => {
    if (Array.isArray(m.parts)) {
      return m.parts
        .filter(
          (part): part is { type: "text"; text: string } =>
            part.type === "text",
        )
        .map((part) => part.text)
        .join("");
    }
    return "";
  };

  return (
    <Container
      maxWidth="md"
      sx={{ py: 4, height: "100vh", display: "flex", flexDirection: "column" }}
    >
      {/* Header Bereich */}
      <Box sx={{ mb: 3, textAlign: "center" }}>
        <Typography
          variant="h4"
          component="h1"
          sx={{ fontWeight: "bold", color: "#1976d2" }}
        >
          Zhaoyins KI-Projekt 🚀
        </Typography>
        <Typography variant="subtitle2" color="text.secondary">
          Next.js + Material-UI + Lokales Llama 3.2 (AI SDK v5 Bereinigt)
        </Typography>
      </Box>

      {/* Chat-Fenster */}
      <Paper
        elevation={2}
        sx={{
          flex: 1,
          p: 3,
          mb: 3,
          overflowY: "auto",
          bgcolor: "#fafafa",
          borderRadius: 3,
          border: "1px solid #e0e0e0",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <List sx={{ width: "100%", p: 0 }}>
          {messages.map((m) => (
            <ListItem
              key={m.id}
              sx={{
                justifyContent: m.role === "user" ? "flex-end" : "flex-start",
                px: 0,
                mb: 1.5,
              }}
            >
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  maxWidth: "80%",
                  bgcolor: m.role === "user" ? "#1976d2" : "#f0f0f0",
                  color: m.role === "user" ? "#ffffff" : "#212121",
                  borderRadius:
                    m.role === "user"
                      ? "20px 20px 4px 20px"
                      : "20px 20px 20px 4px",
                  boxShadow: "0px 2px 4px rgba(0,0,0,0.05)",
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    display: "block",
                    fontWeight: "bold",
                    mb: 0.5,
                    opacity: 0.7,
                  }}
                >
                  {m.role === "user" ? "Du" : "Llama 3.2"}
                </Typography>
                <Typography
                  variant="body1"
                  sx={{ whiteSpace: "pre-wrap", lineHeight: 1.5 }}
                >
                  {getMessageText(m)}
                </Typography>
              </Paper>
            </ListItem>
          ))}

          {/* Lade-Indikator */}
          {isChatLoading && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                mt: 1,
                color: "text.secondary",
              }}
            >
              <CircularProgress size={18} color="inherit" />
              <Typography variant="body2" sx={{ fontStyle: "italic" }}>
                Llama antwortet...
              </Typography>
            </Box>
          )}
        </List>
      </Paper>

      {/* Eingabe- und Upload-Leiste */}
      <Box
        component="form"
        onSubmit={handleFormSubmit}
        sx={{ display: "flex", gap: 1.5, alignItems: "center" }}
      >
        {/* PDF Upload-Button */}
        <Button
          component="label"
          variant="outlined"
          color="primary"
          startIcon={<CloudUploadIcon />}
          sx={{
            height: "56px",
            px: 2,
            borderRadius: 2,
            textTransform: "none",
            fontWeight: "medium",
          }}
        >
          PDF
          <input type="file" accept=".pdf" hidden onChange={handleFileUpload} />
        </Button>

        {/* Chat Textfeld */}
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Schreibe eine Nachricht an deine lokale KI..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          slotProps={{ htmlInput: { style: { color: "black" } } }}
          sx={{
            bgcolor: "white",
            borderRadius: 2,
            "& .MuiOutlinedInput-root": { borderRadius: 2 },
          }}
        />

        {/* Senden-Button */}
        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={isChatLoading || !input.trim()}
          sx={{ height: "56px", minWidth: "56px", borderRadius: 2 }}
        >
          <SendIcon />
        </Button>
      </Box>
    </Container>
  );
}
