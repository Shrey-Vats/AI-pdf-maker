import express from 'express';
import dotenv from 'dotenv';

// CRITICAL: Load environment variables BEFORE any other imports that use them.
dotenv.config();

import { callGemini } from './geminiAdapter.js';
import { streamTextAsPDF } from './pdf.js';

const app = express();
app.use(express.json());

const PORT = Number(process.env.PORT || 4000);

app.post('/api/generate-pdf', async (req, res) => {
  try {
    const { prompt, useAI = true, title = 'generated' } = req.body as { prompt: string; useAI?: boolean; title?: string };
    if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({ error: 'A non-empty prompt is required.' });
    }

    let finalText = prompt;
    if (useAI) {
      console.log('Handing off to Gemini AI...');

      // --- NEW, ENHANCED PROMPT ---
      const enhancedPrompt = `
        Please generate a document based on the following topic: "${prompt}".

        Format your entire response using simple Markdown.
        - Use headings (#, ##, ###) for titles and sections.
        - Use bullet points (*) for lists.
        - Use bold text (**) for important keywords.
        - Ensure clear paragraphs for readability.
      `;

      finalText = await callGemini(enhancedPrompt, { maxTokens: 1500 });
    }

    // Stream the resulting text as a PDF
    streamTextAsPDF(res, title, finalText);

  } catch (err: any) {
    console.error('Error in /api/generate-pdf:', err);
    // Send a generic error to the client to avoid leaking details
    const clientMessage = err.message.includes("API key not valid")
        ? "The server's API key is invalid or missing. Please contact the administrator."
        : "An error occurred while generating the document.";
    res.status(500).json({ error: clientMessage });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server listening on http://localhost:${PORT}`);
});