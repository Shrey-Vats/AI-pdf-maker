import { GoogleGenerativeAI } from '@google/generative-ai';

// The SDK will automatically use the GOOGLE_API_KEY from the environment variables.
// It throws an error if the key is missing or invalid, which our server.ts will catch.
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY! || "AIzaSyARUYXBgL2CZ-EHNML-aGGwCXOwYShtEoc");
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });

export async function callGemini(prompt: string, opts?: { maxTokens?: number }): Promise<string> {
  console.log('Calling Gemini API with model: gemini-1.5-flash-latest');

  const generationConfig = {
    maxOutputTokens: opts?.maxTokens ?? 800,
  };

  const result = await model.generateContent(prompt);
  const response = result.response;
  const text = response.text();

  if (!text) {
    throw new Error('No output text found in Gemini API response');
  }

  return text;
}