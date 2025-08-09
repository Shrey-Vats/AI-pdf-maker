// client/src/App.tsx (ENHANCED VERSION)

import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Template {
  id: string;
  name: string;
  description: string;
}

interface Theme {
  id: string;
  name: string;
  description: string;
}

interface HistoryItem {
  id: number;
  title: string;
  created: string;
  theme: string;
}

export default function App() {
  // --- State Management ---
  const [prompt, setPrompt] = useState('Create a comprehensive guide for starting a small business');
  const [useAI, setUseAI] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // New features state
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [themes, setThemes] = useState<Theme[]>([]);
  const [selectedTheme, setSelectedTheme] = useState<string>('professional');
  const [title, setTitle] = useState('My Document');
  const [fontSize, setFontSize] = useState(12);
  const [includeTOC, setIncludeTOC] = useState(false);
  const [language, setLanguage] = useState('english');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [activeTab, setActiveTab] = useState<'generate' | 'history' | 'settings'>('generate');

  // --- Load templates and themes on component mount ---
  useEffect(() => {
    const loadData = async () => {
      try {
        const [templatesRes, themesRes, historyRes] = await Promise.all([
          axios.get('/api/templates'),
          axios.get('/api/themes'),
          axios.get('/api/history')
        ]);
        setTemplates(templatesRes.data);
        setThemes(themesRes.data);
        setHistory(historyRes.data);
      } catch (err) {
        console.error('Failed to load app data:', err);
      }
    };
    loadData();
  }, []);

  // --- PDF Generation Function ---
  const generate = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const payload = {
        prompt,
        useAI,
        title,
        template: selectedTemplate,
        theme: selectedTheme,
        fontSize,
        includeTOC,
        language
      };

      const resp = await axios.post('/api/generate-pdf', payload, { 
        responseType: 'blob',
        timeout: 60000 // 60 second timeout for AI generation
      });
      
      const blob = new Blob([resp.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      
      // Refresh history after successful generation
      const historyRes = await axios.get('/api/history');
      setHistory(historyRes.data);
      
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'An unknown error occurred.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // --- Template Selection Handler ---
  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    if (templateId) {
      const template = templates.find(t => t.id === templateId);
      if (template) {
        setTitle(template.name);
      }
    }
  };

  // --- Render Functions ---
  const renderGenerateTab = () => (
    <div className="tab-content">
      {/* Title Input */}
      <div className="form-group">
        <label htmlFor="title">Document Title</label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          disabled={loading}
          placeholder="Enter document title..."
        />
      </div>

      {/* Template Selection */}
      <div className="form-group">
        <label htmlFor="template">Document Template</label>
        <select
          id="template"
          value={selectedTemplate}
          onChange={e => handleTemplateSelect(e.target.value)}
          disabled={loading}
        >
          <option value="">Custom (No Template)</option>
          {templates.map(template => (
            <option key={template.id} value={template.id}>
              {template.name}
            </option>
          ))}
        </select>
        {selectedTemplate && (
          <p className="template-description">
            {templates.find(t => t.id === selectedTemplate)?.description}
          </p>
        )}
      </div>

      {/* Main Prompt */}
      <div className="form-group">
        <label htmlFor="prompt">Content Prompt</label>
        <textarea
          id="prompt"
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          disabled={loading}
          placeholder="Describe what you want in your document..."
        />
      </div>

      {/* AI Toggle */}
      <div className="form-group checkbox-group">
        <label>
          <input 
            type="checkbox" 
            checked={useAI} 
            onChange={e => setUseAI(e.target.checked)} 
            disabled={loading} 
          />
          <span>Use AI Enhancement</span>
        </label>
      </div>

      {/* Advanced Options Toggle */}
      <button 
        type="button" 
        className="toggle-advanced"
        onClick={() => setShowAdvanced(!showAdvanced)}
      >
        {showAdvanced ? '▼' : '▶'} Advanced Options
      </button>

      {/* Advanced Options */}
      {showAdvanced && (
        <div className="advanced-options">
          <div className="options-grid">
            <div className="form-group">
              <label htmlFor="theme">Theme</label>
              <select
                id="theme"
                value={selectedTheme}
                onChange={e => setSelectedTheme(e.target.value)}
                disabled={loading}
              >
                {themes.map(theme => (
                  <option key={theme.id} value={theme.id}>
                    {theme.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="language">Language</label>
              <select
                id="language"
                value={language}
                onChange={e => setLanguage(e.target.value)}
                disabled={loading}
              >
                <option value="english">English</option>
                <option value="spanish">Spanish</option>
                <option value="french">French</option>
                <option value="german">German</option>
                <option value="hindi">Hindi</option>
                <option value="chinese">Chinese</option>
                <option value="japanese">Japanese</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="fontSize">Font Size</label>
              <input
                id="fontSize"
                type="number"
                min="8"
                max="18"
                value={fontSize}
                onChange={e => setFontSize(Number(e.target.value))}
                disabled={loading}
              />
            </div>

            <div className="form-group checkbox-group">
              <label>
                <input 
                  type="checkbox" 
                  checked={includeTOC} 
                  onChange={e => setIncludeTOC(e.target.checked)} 
                  disabled={loading} 
                />
                <span>Include Table of Contents</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Generate Button */}
      <div className="generate-section">
        <button 
          onClick={generate} 
          disabled={loading || !prompt.trim()}
          className={`generate-btn ${loading ? 'loading' : ''}`}
        >
          {loading ? (
            <>
              <span className="spinner"></span>
              Generating...
            </>
          ) : (
            '📄 Generate PDF'
          )}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="error-message">
          <strong>❌ Error:</strong> {error}
        </div>
      )}
    </div>
  );

  const renderHistoryTab = () => (
    <div className="tab-content">
      <h3>Document History</h3>
      {history.length === 0 ? (
        <div className="empty-state">
          <p>📄 No documents generated yet</p>
          <p>Generate your first PDF to see it here!</p>
        </div>
      ) : (
        <div className="history-list">
          {history.map(item => (
            <div key={item.id} className="history-item">
              <div className="history-info">
                <h4>{item.title}</h4>
                <p>Created: {new Date(item.created).toLocaleDateString()}</p>
                <span className={`theme-badge ${item.theme}`}>{item.theme}</span>
              </div>
              <button className="regenerate-btn" disabled={loading}>
                🔄 Regenerate
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderSettingsTab = () => (
    <div className="tab-content">
      <h3>Settings & Information</h3>
      
      <div className="settings-section">
        <h4>🎨 Available Themes</h4>
        <div className="theme-preview">
          {themes.map(theme => (
            <div key={theme.id} className={`theme-card ${theme.id}`}>
              <h5>{theme.name}</h5>
              <p>{theme.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="settings-section">
        <h4>📋 Available Templates</h4>
        <div className="template-list">
          {templates.map(template => (
            <div key={template.id} className="template-card">
              <h5>{template.name}</h5>
              <p>{template.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="settings-section">
        <h4>ℹ️ About</h4>
        <p>Enhanced AI Text → PDF Generator v2.0</p>
        <p>Features: Custom themes, templates, multilingual support, and advanced formatting</p>
      </div>
    </div>
  );

  // --- Main Render ---
  return (
    <div className="app-container">
      <header className="app-header">
        <h1>🤖 AI Text → PDF Generator</h1>
        <p>Transform your ideas into beautifully formatted PDF documents</p>
      </header>

      {/* Navigation Tabs */}
      <nav className="tab-navigation">
        <button 
          className={`tab-btn ${activeTab === 'generate' ? 'active' : ''}`}
          onClick={() => setActiveTab('generate')}
        >
          📝 Generate
        </button>
        <button 
          className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          📚 History
        </button>
        <button 
          className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          ⚙️ Settings
        </button>
      </nav>

      {/* Tab Content */}
      <main className="main-content">
        {activeTab === 'generate' && renderGenerateTab()}
        {activeTab === 'history' && renderHistoryTab()}
        {activeTab === 'settings' && renderSettingsTab()}
      </main>

      <style>{`
        .app-container {
          max-width: 900px;
          margin: 0 auto;
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
        }

        .app-header {
          text-align: center;
          margin-bottom: 30px;
          color: white;
        }

        .app-header h1 {
          font-size: 2.5rem;
          margin-bottom: 10px;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }

        .app-header p {
          font-size: 1.1rem;
          opacity: 0.9;
        }

        .tab-navigation {
          display: flex;
          background: rgba(255,255,255,0.1);
          border-radius: 12px;
          padding: 8px;
          margin-bottom: 30px;
          backdrop-filter: blur(10px);
        }

        .tab-btn {
          flex: 1;
          padding: 12px 20px;
          border: none;
          background: transparent;
          color: white;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
          font-weight: 500;
        }

        .tab-btn:hover {
          background: rgba(255,255,255,0.2);
        }

        .tab-btn.active {
          background: white;
          color: #4f46e5;
        }

        .main-content {
          background: white;
          border-radius: 16px;
          padding: 30px;
          box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
        }

        .tab-content {
          animation: fadeIn 0.3s ease-in;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
          color: #374151;
        }

        .form-group input, .form-group select, .form-group textarea {
          width: 100%;
          padding: 12px;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          font-size: 14px;
          transition: border-color 0.3s ease;
          box-sizing: border-box;
        }

        .form-group input:focus, .form-group select:focus, .form-group textarea:focus {
          outline: none;
          border-color: #4f46e5;
          box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
        }

        .form-group textarea {
          min-height: 120px;
          resize: vertical;
          font-family: 'Monaco', 'Consolas', monospace;
          line-height: 1.5;
        }

        .checkbox-group {
          flex-direction: row;
          align-items: center;
        }

        .checkbox-group label {
          display: flex;
          align-items: center;
          margin-bottom: 0;
          cursor: pointer;
        }

        .checkbox-group input[type="checkbox"] {
          width: auto;
          margin-right: 10px;
          transform: scale(1.2);
        }

        .toggle-advanced {
          background: #f3f4f6;
          border: 1px solid #d1d5db;
          padding: 10px 15px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          margin-bottom: 15px;
          transition: all 0.3s ease;
        }

        .toggle-advanced:hover {
          background: #e5e7eb;
        }

        .advanced-options {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 20px;
        }

        .options-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
        }

        .generate-section {
          text-align: center;
          margin-top: 30px;
        }

        .generate-btn {
          background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
          color: white;
          border: none;
          padding: 15px 40px;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          min-width: 200px;
          margin: 0 auto;
        }

        .generate-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(79, 70, 229, 0.3);
        }

        .generate-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .error-message {
          background: #fef2f2;
          border: 1px solid #fca5a5;
          color: #dc2626;
          padding: 15px;
          border-radius: 8px;
          margin-top: 20px;
        }

        .template-description {
          font-size: 13px;
          color: #6b7280;
          margin-top: 5px;
          font-style: italic;
        }

        .history-list {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .history-item {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .history-info h4 {
          margin: 0 0 5px 0;
          color: #374151;
        }

        .history-info p {
          margin: 0;
          color: #6b7280;
          font-size: 14px;
        }

        .theme-badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
          margin-top: 5px;
        }

        .theme-badge.professional { background: #dbeafe; color: #1e40af; }
        .theme-badge.modern { background: #ede9fe; color: #7c3aed; }
        .theme-badge.elegant { background: #d1fae5; color: #059669; }
        .theme-badge.dark { background: #fef3c7; color: #d97706; }

        .regenerate-btn {
          background: #4f46e5;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
        }

        .regenerate-btn:hover:not(:disabled) {
          background: #4338ca;
        }

        .empty-state {
          text-align: center;
          color: #6b7280;
          padding: 40px 20px;
        }

        .settings-section {
          margin-bottom: 30px;
        }

        .settings-section h4 {
          color: #374151;
          margin-bottom: 15px;
          font-size: 18px;
        }

        .theme-preview {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
        }

        .theme-card {
          padding: 15px;
          border-radius: 8px;
          border: 2px solid #e5e7eb;
          transition: all 0.3s ease;
        }

        .theme-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .theme-card.professional {
          background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
          border-color: #3b82f6;
        }

        .theme-card.modern {
          background: linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%);
          border-color: #7c3aed;
        }

        .theme-card.elegant {
          background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
          border-color: #059669;
        }

        .theme-card.dark {
          background: linear-gradient(135deg, #374151 0%, #111827 100%);
          border-color: #fbbf24;
          color: white;
        }

        .theme-card h5 {
          margin: 0 0 8px 0;
          font-size: 16px;
        }

        .theme-card p {
          margin: 0;
          font-size: 13px;
          opacity: 0.8;
        }

        .template-list {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 15px;
        }

        .template-card {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 15px;
          transition: all 0.3s ease;
        }

        .template-card:hover {
          border-color: #4f46e5;
          box-shadow: 0 4px 12px rgba(79, 70, 229, 0.1);
        }

        .template-card h5 {
          margin: 0 0 8px 0;
          color: #4f46e5;
          font-size: 16px;
        }

        .template-card p {
          margin: 0;
          color: #6b7280;
          font-size: 14px;
          line-height: 1.4;
        }

        @media (max-width: 768px) {
          .app-container {
            padding: 15px;
          }
          
          .options-grid {
            grid-template-columns: 1fr;
          }
          
          .tab-navigation {
            flex-direction: column;
          }
          
          .theme-preview, .template-list {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}