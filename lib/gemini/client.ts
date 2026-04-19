import { GoogleGenerativeAI } from "@google/generative-ai";

if (!process.env.GEMINI_API_KEY) {
  console.warn("[Gemini] GEMINI_API_KEY is not set — Gemini decisions will be skipped.");
}

export const geminiClient = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

export const geminiModel = geminiClient
  ? geminiClient.getGenerativeModel({ model: "gemini-1.5-flash" })
  : null;
