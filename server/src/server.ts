// server/src/server.ts (ENHANCED VERSION)

import dotenv from 'dotenv';
dotenv.config();
import path from 'path';
import fs from 'fs';

import express from 'express';
// CRITICAL: Load environment variables BEFORE any other imports that use them.

import { callGemini } from './geminiAdapter.js';
import { createStyledPDF } from './pdf.js';

const app = express();
app.use(express.json({ limit: '10mb' })); // Increased limit for larger documents

const PORT = Number(process.env.PORT || 4000);

// --- Template storage ---
const templates = {
  'business-report': `Generate a comprehensive business report on: "{topic}". Include:
    # Executive Summary
    ## Key Findings
    ## Recommendations
    ## Market Analysis
    ## Financial Projections
    ## Conclusion`,
  
  'research-paper': `Create an academic research paper on: "{topic}". Structure:
    # Abstract
    ## Introduction
    ## Literature Review
    ## Methodology
    ## Results
    ## Discussion
    ## Conclusion
    ## References`,
  
  'project-proposal': `Develop a project proposal for: "{topic}". Include:
    # Project Overview
    ## Objectives
    ## Scope and Deliverables
    ## Timeline
    ## Budget Estimation
    ## Risk Assessment
    ## Success Metrics`,
  
  'user-manual': `Create a comprehensive user manual for: "{topic}". Structure:
    # Getting Started
    ## Installation/Setup
    ## Basic Features
    ## Advanced Features
    ## Troubleshooting
    ## FAQ
    ## Support Contact`,
  
  'meeting-agenda': `Create a professional meeting agenda for: "{topic}". Include:
    # Meeting Information
    ## Attendees
    ## Agenda Items
    ## Discussion Points
    ## Action Items
    ## Next Steps`,
  
  'training-guide': `Develop a training guide for: "{topic}". Structure:
    # Learning Objectives
    ## Prerequisites
    ## Module 1: Fundamentals
    ## Module 2: Intermediate Concepts
    ## Module 3: Advanced Topics
    ## Exercises and Practice
    ## Assessment
    ## Resources for Further Learning`
};

// --- Main PDF generation endpoint ---
app.post('/api/generate-pdf', async (req, res) => {
  try {
    const { 
      prompt, 
      useAI = true, 
      title = 'generated',
      template,
      theme = 'professional',
      fontSize = 12,
      includeTOC = false,
      includeImages = false,
      language = 'english'
    } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'A non-empty prompt is required.' });
    }

    let finalText = prompt;
    
    if (useAI) {
      console.log('Generating content with Gemini AI...');

      let enhancedPrompt = prompt;
      
      // Apply template if selected
      if (template && templates[template as keyof typeof templates]) {
        enhancedPrompt = templates[template as keyof typeof templates].replace('{topic}', prompt);
      }

      // Add language instruction
      const languageInstruction = language !== 'english' 
        ? `Please write the entire response in ${language}.` 
        : '';

      const fullPrompt = `
        ${languageInstruction}
        
        ${enhancedPrompt}

        Format your entire response using Markdown:
        - Use headings (#, ##, ###) for structure
        - Use bullet points (*) for lists
        - Use **bold** for emphasis
        - Use *italic* for secondary emphasis
        - Use > for quotes/callouts
        - Use \`code\` for technical terms
        - Use --- for section breaks
        - Ensure clear, readable paragraphs
        - Make the content comprehensive and well-organized
      `;

      finalText = await callGemini(fullPrompt, { maxTokens: 2000 });
    }

    // Generate PDF with enhanced styling
    createStyledPDF(res, title, finalText, theme as any, {
      fontSize,
      includeTOC,
      includeImages
    });

  } catch (err: any) {
    console.error('Error in /api/generate-pdf:', err);
    const clientMessage = err.message.includes("API key not valid")
      ? "The server's API key is invalid or missing. Please contact the administrator."
      : "An error occurred while generating the document.";
    res.status(500).json({ error: clientMessage });
  }
});

// --- Get available templates ---
app.get('/api/templates', (req, res) => {
  const templateList = Object.keys(templates).map(key => ({
    id: key,
    name: key.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' '),
    description: templates[key as keyof typeof templates].split('\n')[0].replace('Generate a ', '').replace('Create an ', '').replace('Create a ', '').replace('Develop a ', '')
  }));
  
  res.json(templateList);
});

// --- Get available themes ---
app.get('/api/themes', (req, res) => {
  const themeList = [
    { id: 'professional', name: 'Professional', description: 'Clean blue corporate style' },
    { id: 'modern', name: 'Modern', description: 'Purple gradient contemporary design' },
    { id: 'elegant', name: 'Elegant', description: 'Green sophisticated layout' },
    { id: 'dark', name: 'Dark Mode', description: 'Dark background with golden accents' }
  ];
  
  res.json(themeList);
});

// --- Document history endpoint (mock for now) ---
app.get('/api/history', (req, res) => {
  // In a real app, this would connect to a database
  res.json([
    { id: 1, title: 'Business Plan 2024', created: new Date().toISOString(), theme: 'professional' },
    { id: 2, title: 'Research Paper', created: new Date().toISOString(), theme: 'elegant' },
    { id: 3, title: 'User Manual', created: new Date().toISOString(), theme: 'modern' }
  ]);
});

// --- Health check endpoint ---
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '2.0.0'
  });
});

app.listen(PORT, () => {
  console.log(`✅ Enhanced AI PDF Server listening on http://localhost:${PORT}`);
  console.log(`📚 Available templates: ${Object.keys(templates).length}`);
  console.log(`🎨 Available themes: professional, modern, elegant, dark`);
});