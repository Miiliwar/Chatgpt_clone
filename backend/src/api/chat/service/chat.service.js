import db from "../../../../db/db.config.js";
import { GoogleGenAI } from "@google/genai";

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
const geminiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const getRecentConversationRows = async (limit = 5) => {
  const normalizedLimit = Number.parseInt(limit, 10);
  const safeLimit =
    Number.isNaN(normalizedLimit) || normalizedLimit <= 0 ? 5 : normalizedLimit;

  const [rows] = await db.execute(
    `SELECT id, role, content, created_at FROM conversations ORDER BY id DESC LIMIT ${safeLimit}`,
  );

  return rows.reverse();
};

const generateAssistantAnswer = async (historyRows, question) => {
  const formattedHistory = historyRows.map((row) => ({
    role: row.role === "assistant" ? "model" : "user",
    parts: [{ text: row.content }],
  }));

  const chat = geminiClient.chats.create({
    model: GEMINI_MODEL,
    history: formattedHistory,
  });

  // ✅ Fixed: Wrapped in an object, and moved config here
  const result = await chat.sendMessage({
    message: question,
    config: { maxOutputTokens: 1024 },
  });

  return {
    text: result.text,
    totalTokens: result.usageMetadata?.totalTokenCount || 0,
  };
};

export async function createConversationService(question) {
  if (!question || !question.trim()) {
    const error = new Error("Question is required");
    error.status = 400;
    throw error;
  }

  const historyRows = await getRecentConversationRows(5);

  const { text, totalTokens } = await generateAssistantAnswer(
    historyRows,
    question,
  );

  await db.execute(
    "INSERT INTO conversations (content, role) VALUES (?, 'user')",
    [question],
  );

  await db.execute(
    "INSERT INTO conversations (content, token_count, role) VALUES (?, ?, 'assistant')",
    [text, totalTokens],
  );

  return {
    assistantAnswer: text,
  };
}

export const getMessageById = async (messageId) => {
  const [rows] = await db.execute(
    "SELECT id, role, content, token_count, created_at FROM conversations WHERE id = ? LIMIT 1",
    [messageId],
  );

  if (rows.length === 0) return null;

  return {
    id: rows[0].id,
    role: rows[0].role,
    content: rows[0].content,
    tokenCount: Number(rows[0].token_count || 0),
    createdAt: rows[0].created_at,
  };
};

export async function getConversationService() {
  const [rows] = await db.query(
    "SELECT * FROM conversations ORDER BY created_at ASC",
  );
  return rows;
}
