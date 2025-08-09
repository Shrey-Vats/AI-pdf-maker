// server/src/server.ts (ENHANCED VERSION WITH CODING TEMPLATE)

import dotenv from 'dotenv';
dotenv.config();
import path from 'path';
import fs from 'fs';

import express from 'express';
import { callGemini } from './geminiAdapter.js';
import { createStyledPDF } from './pdf.js';

const app = express();
app.use(express.json({ limit: '10mb' }));

const PORT = Number(process.env.PORT || 4000);

// --- Enhanced Template storage with new coding template ---
const templates = {
  'business-report': `Generate a comprehensive business report on: "{topic}". Include:
    # Executive Summary
    ## Key Findings
    ## Recommendations
    ## Market Analysis
    ## Financial Projections
    ## Risk Assessment
    ## Implementation Timeline
    ## Conclusion`,
  
  'research-paper': `Create an academic research paper on: "{topic}". Structure:
    # Abstract
    ## Introduction
    ## Literature Review
    ## Methodology
    ## Results and Analysis
    ## Discussion
    ## Limitations
    ## Conclusion
    ## References`,
  
  'project-proposal': `Develop a detailed project proposal for: "{topic}". Include:
    # Project Overview
    ## Problem Statement
    ## Objectives and Goals
    ## Scope and Deliverables
    ## Methodology and Approach
    ## Timeline and Milestones
    ## Budget Estimation
    ## Risk Assessment
    ## Success Metrics
    ## Team Requirements`,
  
  'user-manual': `Create a comprehensive user manual for: "{topic}". Structure:
    # Introduction
    ## System Requirements
    ## Installation and Setup
    ## Getting Started Guide
    ## Basic Features and Functions
    ## Advanced Features
    ## Configuration Options
    ## Troubleshooting Guide
    ## FAQ
    ## Support and Resources`,
  
  'meeting-agenda': `Create a professional meeting agenda for: "{topic}". Include:
    # Meeting Information
    ## Date, Time, and Location
    ## Attendees and Roles
    ## Meeting Objectives
    ## Agenda Items with Time Allocations
    ## Discussion Points
    ## Decision Items
    ## Action Items and Assignments
    ## Next Steps and Follow-up`,
  
  'training-guide': `Develop a comprehensive training guide for: "{topic}". Structure:
    # Course Overview
    ## Learning Objectives
    ## Prerequisites and Requirements
    ## Course Structure
    ## Module 1: Fundamentals and Basics
    ## Module 2: Intermediate Concepts and Applications
    ## Module 3: Advanced Topics and Best Practices
    ## Hands-on Exercises and Labs
    ## Projects and Practical Applications
    ## Assessment and Evaluation
    ## Additional Resources and References
    ## Certification Path`,

  // NEW: Coding Learning Template
  'coding-learning': `Create a detailed programming learning guide for: "{topic}". This should be a comprehensive tutorial that covers:

    # {topic} - Complete Learning Guide

    ## 🎯 Learning Objectives
    - What you'll learn by the end of this guide
    - Prerequisites and recommended background
    - Time commitment and difficulty level

    ## 📚 Introduction and Overview
    - What is {topic} and why is it important?
    - Real-world applications and use cases
    - Ecosystem and community overview

    ## 🛠️ Environment Setup
    - Installation requirements
    - Development environment configuration
    - Essential tools and IDE setup
    - Package managers and dependencies

    ## 🏗️ Core Fundamentals
    - Basic syntax and structure
    - Key concepts and terminology
    - Data types, variables, and operators
    - Control structures and flow

    ## 🔧 Essential Features and Functions
    - Important built-in functions/methods
    - Common patterns and best practices
    - Error handling and debugging
    - Code organization and structure

    ## 🚀 Practical Examples and Code Snippets
    - Step-by-step tutorials with code examples
    - Common problems and solutions
    - Mini-projects to practice concepts
    - Code explanations and breakdowns

    ## 🎨 Advanced Topics and Techniques
    - Advanced features and capabilities
    - Performance optimization
    - Design patterns and architectural concepts
    - Integration with other technologies

    ## 🧪 Hands-on Projects
    - Beginner project ideas
    - Intermediate challenges
    - Advanced project suggestions
    - Portfolio-worthy applications

    ## 🔍 Best Practices and Common Pitfalls
    - Industry standard practices
    - Code quality and maintainability
    - Security considerations
    - Common mistakes to avoid

    ## 📖 Additional Resources
    - Official documentation links
    - Recommended books and tutorials
    - Community resources and forums
    - Useful libraries and frameworks

    ## 🎓 Next Steps and Career Path
    - Advanced learning paths
    - Specialization areas
    - Job market insights
    - Portfolio development tips

    Make this guide comprehensive, practical, and beginner-friendly while also including advanced concepts. Use plenty of code examples with detailed explanations. Format everything with proper Markdown including code blocks, emphasis, and clear section organization.`
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
        enhancedPrompt = templates[template as keyof typeof templates].replace(/{topic}/g, prompt);
      }

      // Enhanced language instructions
      const languageInstruction = language !== 'english' 
        ? `IMPORTANT: Write the ENTIRE response in ${language}. All headings, content, and explanations must be in ${language}.` 
        : '';

      // Special instructions for coding template
      const codingInstructions = template === 'coding-learning' 
        ? `
        You are creating a comprehensive programming tutorial. Make sure to:
        - Include practical code examples with explanations
        - Use proper markdown code blocks with syntax highlighting
        - Provide step-by-step instructions
        - Include both basic and advanced concepts
        - Add real-world examples and use cases
        - Make it suitable for beginners but comprehensive enough for intermediate learners
        - Use emojis in headings for better visual organization
        ` : '';

      const fullPrompt = `
        ${languageInstruction}
        ${codingInstructions}
        
        ${enhancedPrompt}

        FORMATTING REQUIREMENTS:
        - Use proper Markdown formatting throughout
        - Use # for main titles, ## for major sections, ### for subsections
        - Use **bold** for important terms and concepts
        - Use *italic* for emphasis and variable names
        - Use bullet points (*) for lists and features
        - Use numbered lists (1.) for step-by-step instructions
        - Use > for important quotes, tips, or callouts
        - Use \`inline code\` for technical terms and short code snippets
        - Use \`\`\`language for multi-line code blocks
        - Use --- for section breaks when needed
        - Ensure proper paragraph spacing and structure
        - Make the content comprehensive, well-organized, and professionally written
      `;

      finalText = await callGemini(fullPrompt, { 
        maxTokens: template === 'coding-learning' ? 3000 : 2000,
        temperature: 0.8,
        model: 'pro' // Use pro model for better quality
      });
    }

    // Auto-select coding theme for coding-learning template
    const selectedTheme = template === 'coding-learning' ? 'coding' : theme;

    // Generate PDF with enhanced styling
    createStyledPDF(res, title, finalText, selectedTheme as any, {
      fontSize,
      includeTOC,
      includeImages
    });

  } catch (err: any) {
    console.error('Error in /api/generate-pdf:', err);
    const clientMessage = err.message.includes("API key")
      ? "The server's API key is invalid or missing. Please contact the administrator."
      : `Document generation failed: ${err.message}`;
    res.status(500).json({ error: clientMessage });
  }
});

// --- Get available templates ---
app.get('/api/templates', (req, res) => {
  const templateList = Object.keys(templates).map(key => {
    const descriptions = {
      'business-report': 'Comprehensive business analysis with market insights and financial projections',
      'research-paper': 'Academic research paper with proper methodology and citations',
      'project-proposal': 'Detailed project proposal with timeline, budget, and risk assessment',
      'user-manual': 'Complete user documentation with setup, features, and troubleshooting',
      'meeting-agenda': 'Professional meeting agenda with objectives and action items',
      'training-guide': 'Educational training material with modules and assessments',
      'coding-learning': 'Comprehensive programming tutorial with examples, projects, and best practices'
    };

    return {
      id: key,
      name: key.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' '),
      description: descriptions[key as keyof typeof descriptions] || 'Custom template'
    };
  });
  
  res.json(templateList);
});

// --- Get available themes ---
app.get('/api/themes', (req, res) => {
  const themeList = [
    { id: 'professional', name: 'Professional', description: 'Clean blue corporate style for business documents' },
    { id: 'modern', name: 'Modern', description: 'Purple gradient contemporary design with modern aesthetics' },
    { id: 'elegant', name: 'Elegant', description: 'Green sophisticated layout with premium feel' },
    { id: 'dark', name: 'Dark Mode', description: 'Dark background with golden accents for night reading' },
    { id: 'coding', name: 'Coding Style', description: 'Developer-friendly theme optimized for technical documentation' }
  ];
  
  res.json(themeList);
});

// --- Document history endpoint (enhanced mock) ---
app.get('/api/history', (req, res) => {
  // In a real app, this would connect to a database
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  res.json([
    { 
      id: 1, 
      title: 'React.js Learning Guide', 
      created: yesterday.toISOString(), 
      theme: 'coding',
      template: 'coding-learning'
    },
    { 
      id: 2, 
      title: 'Business Plan 2024', 
      created: lastWeek.toISOString(), 
      theme: 'professional',
      template: 'business-report'
    },
    { 
      id: 3, 
      title: 'API Documentation', 
      created: lastWeek.toISOString(), 
      theme: 'modern',
      template: 'user-manual'
    },
    { 
      id: 4, 
      title: 'Python Data Science Tutorial', 
      created: now.toISOString(), 
      theme: 'coding',
      template: 'coding-learning'
    }
  ]);
});

// --- Serve frontend files (for production environment) ---
if (process.env.NODE_ENV === 'production') {
  // Correctly resolve the directory path for ES Modules
  const __dirname = path.dirname(new URL(import.meta.url).pathname.substring(process.platform === 'win32' ? 1 : 0));
  
  // Path to the frontend build output directory
  const frontendDistPath = path.join(__dirname, '..', '..', 'client', 'dist');

  // Check if the frontend build directory exists before trying to serve it
  if (fs.existsSync(frontendDistPath)) {
    console.log(`Serving static files from: ${frontendDistPath}`);
    app.use(express.static(frontendDistPath));

    // For any request that doesn't match a static file, serve index.html
    // This is crucial for single-page applications with client-side routing
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(frontendDistPath, 'index.html'));
    });
  } else {
    console.warn(`WARNING: Frontend build directory not found at ${frontendDistPath}.`);
    console.warn('The API will function, but the frontend will not be served.');
  }
}

// --- Start the server ---
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`✨ Environment: ${process.env.NODE_ENV || 'development'}`);
});