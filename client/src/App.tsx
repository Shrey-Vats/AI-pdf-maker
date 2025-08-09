// client/src/App.tsx (ENHANCED VERSION WITH ADVANCED STYLING)

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
  template?: string;
}

export default function App() {
  // --- State Management ---
  const [prompt, setPrompt] = useState('React.js fundamentals and hooks');
  const [useAI, setUseAI] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Enhanced features state
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('coding-learning');
  const [themes, setThemes] = useState<Theme[]>([]);
  const [selectedTheme, setSelectedTheme] = useState<string>('coding');
  const [title, setTitle] = useState('Programming Learning Guide');
  const [fontSize, setFontSize] = useState(12);
  const [includeTOC, setIncludeTOC] = useState(true);
  const [language, setLanguage] = useState('english');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [activeTab, setActiveTab] = useState<'generate' | 'history' | 'settings'>('generate');
  const [templatePreview, setTemplatePreview] = useState<string>('');

  // --- Load data on component mount ---
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

  // --- Load template preview ---
  useEffect(() => {
    const loadTemplatePreview = async () => {
      if (selectedTemplate) {
        try {
          const res = await axios.get(`/api/template-preview/${selectedTemplate}`);
          setTemplatePreview(res.data.preview);
        } catch (err) {
          console.error('Failed to load template preview:', err);
        }
      } else {
        setTemplatePreview('');
      }
    };
    loadTemplatePreview();
  }, [selectedTemplate]);

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
        timeout: 90000 // 90 second timeout for complex documents
      });
      
      const blob = new Blob([resp.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
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
        
        // Auto-select appropriate theme and settings for coding template
        if (templateId === 'coding-learning') {
          setSelectedTheme('coding');
          setIncludeTOC(true);
          setFontSize(11);
          if (!prompt.includes('React') && !prompt.includes('Python')) {
            setPrompt('React.js fundamentals and hooks');
          }
        }
      }
    }
  };

  // --- Regenerate from history ---
  const regenerateDocument = async (historyItem: HistoryItem) => {
    setLoading(true);
    try {
      const resp = await axios.post(`/api/regenerate/${historyItem.id}`, {
        theme: historyItem.theme,
        customizations: { fontSize, includeTOC }
      }, { 
        responseType: 'blob'
      });
      
      const blob = new Blob([resp.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${historyItem.title}_regenerated.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
    } catch (err: any) {
      setError('Failed to regenerate document');
    } finally {
      setLoading(false);
    }
  };

  // --- Render Functions ---
  const renderGenerateTab = () => (
    <div className="tab-content">
      {/* Title Input with enhanced styling */}
      <div className="form-group enhanced">
        <label htmlFor="title">
          <span className="label-icon">📄</span>
          Document Title
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          disabled={loading}
          placeholder="Enter your document title..."
          className="enhanced-input"
        />
      </div>

      {/* Template Selection with preview */}
      <div className="form-group enhanced">
        <label htmlFor="template">
          <span className="label-icon">📋</span>
          Document Template
        </label>
        <select
          id="template"
          value={selectedTemplate}
          onChange={e => handleTemplateSelect(e.target.value)}
          disabled={loading}
          className="enhanced-select"
        >
          <option value="">Custom (No Template)</option>
          {templates.map(template => (
            <option key={template.id} value={template.id}>
              {template.name}
            </option>
          ))}
        </select>
        {selectedTemplate && (
          <div className="template-info">
            <p className="template-description">
              {templates.find(t => t.id === selectedTemplate)?.description}
            </p>
            {templatePreview && (
              <div className="template-preview">
                <h4>Template Structure Preview:</h4>
                <pre>{templatePreview}</pre>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Prompt with enhanced UX */}
      <div className="form-group enhanced">
        <label htmlFor="prompt">
          <span className="label-icon">✨</span>
          Content Prompt
          {selectedTemplate === 'coding-learning' && (
            <span className="template-hint">
              💡 Specify a programming language, framework, or library
            </span>
          )}
        </label>
        <textarea
          id="prompt"
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          disabled={loading}
          placeholder={
            selectedTemplate === 'coding-learning' 
              ? "e.g., Python machine learning, Vue.js components, Node.js APIs..."
              : "Describe what you want in your document..."
          }
          className="enhanced-textarea"
          rows={4}
        />
        <div className="character-count">
          {prompt.length} characters
        </div>
      </div>

      {/* AI Toggle with enhanced styling */}
      <div className="form-group enhanced">
        <div className="toggle-container">
          <label className="toggle-label">
            <input 
              type="checkbox" 
              checked={useAI} 
              onChange={e => setUseAI(e.target.checked)} 
              disabled={loading}
              className="toggle-input"
            />
            <span className="toggle-slider"></span>
            <span className="toggle-text">
              🤖 AI Enhancement
              <small>Generate intelligent, structured content</small>
            </span>
          </label>
        </div>
      </div>

      {/* Advanced Options */}
      <div className="advanced-section">
        <button 
          type="button" 
          className="toggle-advanced"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          <span className={`arrow ${showAdvanced ? 'open' : ''}`}>▶</span>
          Advanced Options
          <span className="options-count">
            {[selectedTheme !== 'professional', fontSize !== 12, includeTOC, language !== 'english'].filter(Boolean).length}
          </span>
        </button>

        {showAdvanced && (
          <div className="advanced-options">
            <div className="options-grid">
              <div className="form-group">
                <label htmlFor="theme">
                  <span className="label-icon">🎨</span>
                  Theme
                </label>
                <select
                  id="theme"
                  value={selectedTheme}
                  onChange={e => setSelectedTheme(e.target.value)}
                  disabled={loading}
                  className="enhanced-select"
                >
                  {themes.map(theme => (
                    <option key={theme.id} value={theme.id}>
                      {theme.name}
                    </option>
                  ))}
                </select>
                <small className="field-description">
                  {themes.find(t => t.id === selectedTheme)?.description}
                </small>
              </div>

              <div className="form-group">
                <label htmlFor="language">
                  <span className="label-icon">🌍</span>
                  Language
                </label>
                <select
                  id="language"
                  value={language}
                  onChange={e => setLanguage(e.target.value)}
                  disabled={loading}
                  className="enhanced-select"
                >
                  <option value="english">🇺🇸 English</option>
                  <option value="spanish">🇪🇸 Spanish</option>
                  <option value="french">🇫🇷 French</option>
                  <option value="german">🇩🇪 German</option>
                  <option value="hindi">🇮🇳 Hindi</option>
                  <option value="chinese">🇨🇳 Chinese</option>
                  <option value="japanese">🇯🇵 Japanese</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="fontSize">
                  <span className="label-icon">🔤</span>
                  Font Size
                </label>
                <div className="slider-container">
                  <input
                    id="fontSize"
                    type="range"
                    min="8"
                    max="18"
                    value={fontSize}
                    onChange={e => setFontSize(Number(e.target.value))}
                    disabled={loading}
                    className="enhanced-slider"
                  />
                  <span className="slider-value">{fontSize}pt</span>
                </div>
              </div>

              <div className="form-group">
                <div className="toggle-container">
                  <label className="toggle-label">
                    <input 
                      type="checkbox" 
                      checked={includeTOC} 
                      onChange={e => setIncludeTOC(e.target.checked)} 
                      disabled={loading}
                      className="toggle-input"
                    />
                    <span className="toggle-slider small"></span>
                    <span className="toggle-text">
                      📑 Table of Contents
                      <small>Auto-generate navigation</small>
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Generate Button with enhanced styling */}
      <div className="generate-section">
        <button 
          onClick={generate} 
          disabled={loading || !prompt.trim()}
          className={`generate-btn ${loading ? 'loading' : ''} ${selectedTemplate === 'coding-learning' ? 'coding-style' : ''}`}
        >
          {loading ? (
            <>
              <div className="loading-animation">
                <div className="spinner"></div>
                <div className="pulse-ring"></div>
              </div>
              <span>Generating Amazing Content...</span>
            </>
          ) : (
            <>
              <span className="btn-icon">
                {selectedTemplate === 'coding-learning' ? '👨‍💻' : '📄'}
              </span>
              <span>Generate PDF</span>
              <div className="btn-shine"></div>
            </>
          )}
        </button>
        
        {selectedTemplate === 'coding-learning' && (
          <p className="coding-tip">
            💡 This will create a comprehensive programming tutorial with examples and projects!
          </p>
        )}
      </div>

      {/* Enhanced Error Display */}
      {error && (
        <div className="error-message enhanced">
          <div className="error-icon">❌</div>
          <div className="error-content">
            <strong>Oops! Something went wrong</strong>
            <p>{error}</p>
            <button onClick={() => setError(null)} className="dismiss-error">
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const renderHistoryTab = () => (
    <div className="tab-content">
      <div className="section-header">
        <h3>📚 Document History</h3>
        <p>Your previously generated documents</p>
      </div>
      
      {history.length === 0 ? (
        <div className="empty-state enhanced">
          <div className="empty-icon">📄</div>
          <h4>No documents yet</h4>
          <p>Generate your first PDF to see it here!</p>
          <button 
            onClick={() => setActiveTab('generate')}
            className="cta-button"
          >
            Create Document
          </button>
        </div>
      ) : (
        <div className="history-grid">
          {history.map(item => (
            <div key={item.id} className="history-card">
              <div className="card-header">
                <h4>{item.title}</h4>
                <span className={`theme-badge ${item.theme}`}>
                  {themes.find(t => t.id === item.theme)?.name || item.theme}
                </span>
              </div>
              
              <div className="card-meta">
                <span className="created-date">
                  📅 {new Date(item.created).toLocaleDateString()}
                </span>
                {item.template && (
                  <span className="template-info">
                    📋 {templates.find(t => t.id === item.template)?.name || 'Custom'}
                  </span>
                )}
              </div>
              
              <div className="card-actions">
                <button 
                  className="action-btn regenerate"
                  onClick={() => regenerateDocument(item)}
                  disabled={loading}
                >
                  🔄 Regenerate
                </button>
                <button className="action-btn edit" disabled={loading}>
                  ✏️ Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderSettingsTab = () => (
    <div className="tab-content">
      <div className="section-header">
        <h3>⚙️ Settings & Information</h3>
        <p>Customize your document generation experience</p>
      </div>
      
      <div className="settings-grid">
        <div className="settings-section">
          <h4>🎨 Available Themes</h4>
          <div className="theme-showcase">
            {themes.map(theme => (
              <div key={theme.id} className={`theme-card ${theme.id} ${selectedTheme === theme.id ? 'selected' : ''}`}>
                <div className="theme-preview">
                  <div className="preview-header"></div>
                  <div className="preview-content">
                    <div className="preview-line long"></div>
                    <div className="preview-line short"></div>
                    <div className="preview-line medium"></div>
                  </div>
                </div>
                <div className="theme-info">
                  <h5>{theme.name}</h5>
                  <p>{theme.description}</p>
                  <button 
                    className="select-theme-btn"
                    onClick={() => setSelectedTheme(theme.id)}
                  >
                    {selectedTheme === theme.id ? '✓ Selected' : 'Select'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="settings-section">
          <h4>📋 Document Templates</h4>
          <div className="template-showcase">
            {templates.map(template => (
              <div key={template.id} className={`template-card ${selectedTemplate === template.id ? 'selected' : ''}`}>
                <div className="template-icon">
                  {template.id === 'coding-learning' ? '👨‍💻' : 
                   template.id === 'business-report' ? '📊' :
                   template.id === 'research-paper' ? '🔬' :
                   template.id === 'user-manual' ? '📖' :
                   template.id === 'meeting-agenda' ? '📋' :
                   template.id === 'training-guide' ? '🎓' : '📄'}
                </div>
                <div className="template-info">
                  <h5>{template.name}</h5>
                  <p>{template.description}</p>
                  {template.id === 'coding-learning' && (
                    <div className="special-badge">
                      ⭐ New Template
                    </div>
                  )}
                  <button 
                    className="select-template-btn"
                    onClick={() => {
                      handleTemplateSelect(template.id);
                      setActiveTab('generate');
                    }}
                  >
                    Use Template
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="settings-section">
          <h4>ℹ️ Application Info</h4>
          <div className="info-cards">
            <div className="info-card">
              <h5>🚀 Version</h5>
              <p>Enhanced AI PDF Generator v2.1</p>
            </div>
            <div className="info-card">
              <h5>✨ Features</h5>
              <ul>
                <li>AI-powered content generation</li>
                <li>Multiple document templates</li>
                <li>Custom themes and styling</li>
                <li>Multilingual support</li>
                <li>Table of contents generation</li>
                <li>Fixed text positioning</li>
              </ul>
            </div>
            <div className="info-card">
              <h5>🆕 New in v2.1</h5>
              <ul>
                <li>Coding Learning template</li>
                <li>Advanced PDF styling</li>
                <li>Fixed text overlapping issues</li>
                <li>Enhanced UI/UX</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // --- Main Render ---
  return (
    <div className="app-container">
      {/* Animated Background */}
      <div className="animated-bg">
        <div className="bg-shape shape-1"></div>
        <div className="bg-shape shape-2"></div>
        <div className="bg-shape shape-3"></div>
      </div>

      <header className="app-header">
        <div className="header-content">
          <h1>
            <span className="header-icon">🤖</span>
            AI PDF Generator
            <span className="version-badge">v2.1</span>
          </h1>
          <p>Transform your ideas into beautifully formatted PDF documents</p>
        </div>
      </header>

      {/* Enhanced Navigation */}
      <nav className="tab-navigation">
        {[
          { id: 'generate', icon: '📝', label: 'Generate' },
          { id: 'history', icon: '📚', label: 'History' },
          { id: 'settings', icon: '⚙️', label: 'Settings' }
        ].map(tab => (
          <button 
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id as any)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
            <div className="tab-indicator"></div>
          </button>
        ))}
      </nav>

      {/* Tab Content */}
      <main className="main-content">
        {activeTab === 'generate' && renderGenerateTab()}
        {activeTab === 'history' && renderHistoryTab()}
        {activeTab === 'settings' && renderSettingsTab()}
      </main>

      <style>{`
        * {
          box-sizing: border-box;
        }

        .app-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Inter', sans-serif;
          min-height: 100vh;
          position: relative;
          overflow-x: hidden;
        }

        /* Animated Background */
        .animated-bg {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: -1;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #667eea 100%);
          background-size: 200% 200%;
          animation: gradientShift 20s ease infinite;
        }

        .bg-shape {
          position: absolute;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.1);
          animation: float 6s ease-in-out infinite;
        }

        .shape-1 {
          width: 100px;
          height: 100px;
          top: 20%;
          left: 10%;
          animation-delay: 0s;
        }

        .shape-2 {
          width: 150px;
          height: 150px;
          top: 60%;
          right: 10%;
          animation-delay: 2s;
        }

        .shape-3 {
          width: 80px;
          height: 80px;
          bottom: 20%;
          left: 70%;
          animation-delay: 4s;
        }

        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }

        /* Enhanced Header */
        .app-header {
          text-align: center;
          margin-bottom: 40px;
          position: relative;
        }

        .header-content {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border-radius: 20px;
          padding: 30px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .app-header h1 {
          font-size: 3rem;
          margin-bottom: 10px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 15px;
          flex-wrap: wrap;
        }

        .header-icon {
          font-size: 3rem;
          animation: bounce 2s infinite;
        }

        .version-badge {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          font-size: 0.8rem;
          padding: 4px 12px;
          border-radius: 20px;
          font-weight: 600;
          margin-left: 10px;
        }

        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-10px); }
          60% { transform: translateY(-5px); }
        }

        .app-header p {
          font-size: 1.2rem;
          color: #64748b;
          margin: 0;
          font-weight: 500;
        }

        /* Enhanced Navigation */
        .tab-navigation {
          display: flex;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border-radius: 16px;
          padding: 8px;
          margin-bottom: 30px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          position: relative;
          overflow: hidden;
        }

        .tab-btn {
          flex: 1;
          padding: 16px 24px;
          border: none;
          background: transparent;
          color: #64748b;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          font-weight: 600;
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          overflow: hidden;
        }

        .tab-btn:hover:not(.active) {
          background: rgba(102, 126, 234, 0.1);
          color: #4f46e5;
          transform: translateY(-2px);
        }

        .tab-btn.active {
          background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
          color: white;
          box-shadow: 0 8px 25px rgba(79, 70, 229, 0.3);
          transform: translateY(-3px);
        }

        .tab-icon {
          font-size: 1.2rem;
        }

        .tab-label {
          font-size: 0.9rem;
        }

        .tab-indicator {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, transparent, #fbbf24, transparent);
          opacity: 0;
          transition: opacity 0.3s;
        }

        .tab-btn.active .tab-indicator {
          opacity: 1;
        }

        /* Enhanced Main Content */
        .main-content {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border-radius: 20px;
          padding: 40px;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          position: relative;
          overflow: hidden;
        }

        .main-content::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #667eea, #764ba2, #f093fb, #667eea);
          background-size: 200% 100%;
          animation: shimmer 3s linear infinite;
        }

        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }

        .tab-content {
          animation: slideInUp 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }

        @keyframes slideInUp {
          from { 
            opacity: 0; 
            transform: translateY(30px);
          }
          to { 
            opacity: 1; 
            transform: translateY(0);
          }
        }

        /* Enhanced Form Elements */
        .form-group.enhanced {
          margin-bottom: 30px;
          position: relative;
        }

        .form-group.enhanced label {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
          font-weight: 700;
          color: #1f2937;
          font-size: 1rem;
        }

        .label-icon {
          font-size: 1.1rem;
        }

        .template-hint {
          font-size: 0.8rem;
          color: #6366f1;
          font-weight: 500;
          margin-left: 8px;
        }

        .enhanced-input, .enhanced-select, .enhanced-textarea {
          width: 100%;
          padding: 16px 20px;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          font-size: 15px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(10px);
        }

        .enhanced-input:focus, .enhanced-select:focus, .enhanced-textarea:focus {
          outline: none;
          border-color: #4f46e5;
          box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.1);
          background: white;
          transform: translateY(-1px);
        }

        .enhanced-textarea {
          min-height: 120px;
          resize: vertical;
          font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
          line-height: 1.6;
        }

        .character-count {
          text-align: right;
          font-size: 0.8rem;
          color: #6b7280;
          margin-top: 4px;
        }

        /* Enhanced Toggle Switches */
        .toggle-container {
          display: flex;
          align-items: center;
        }

        .toggle-label {
          display: flex;
          align-items: center;
          cursor: pointer;
          gap: 12px;
        }

        .toggle-input {
          display: none;
        }

        .toggle-slider {
          width: 60px;
          height: 32px;
          background: #e5e7eb;
          border-radius: 20px;
          position: relative;
          transition: all 0.3s ease;
        }

        .toggle-slider.small {
          width: 48px;
          height: 26px;
        }

        .toggle-slider::before {
          content: '';
          position: absolute;
          top: 2px;
          left: 2px;
          width: 28px;
          height: 28px;
          background: white;
          border-radius: 50%;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        }

        .toggle-slider.small::before {
          width: 22px;
          height: 22px;
        }

        .toggle-input:checked + .toggle-slider {
          background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
        }

        .toggle-input:checked + .toggle-slider::before {
          transform: translateX(28px);
        }

        .toggle-input:checked + .toggle-slider.small::before {
          transform: translateX(22px);
        }

        .toggle-text {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .toggle-text small {
          color: #6b7280;
          font-size: 0.8rem;
        }

        /* Advanced Options Section */
        .advanced-section {
          margin-top: 30px;
          border-top: 1px solid #e5e7eb;
          padding-top: 25px;
        }

        .toggle-advanced {
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          border: 2px solid #e2e8f0;
          padding: 15px 20px;
          border-radius: 12px;
          cursor: pointer;
          font-size: 15px;
          font-weight: 600;
          margin-bottom: 20px;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          position: relative;
          overflow: hidden;
        }

        .toggle-advanced:hover {
          background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .arrow {
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          font-size: 0.9rem;
        }

        .arrow.open {
          transform: rotate(90deg);
        }

        .options-count {
          background: #4f46e5;
          color: white;
          font-size: 0.8rem;
          padding: 2px 8px;
          border-radius: 12px;
          margin-left: auto;
          min-width: 20px;
          text-align: center;
        }

        .advanced-options {
          background: rgba(248, 250, 252, 0.8);
          backdrop-filter: blur(10px);
          border: 2px solid #e2e8f0;
          border-radius: 16px;
          padding: 25px;
          margin-bottom: 25px;
          animation: slideDown 0.3s ease-out;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
            max-height: 0;
          }
          to {
            opacity: 1;
            transform: translateY(0);
            max-height: 500px;
          }
        }

        .options-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
        }

        /* Enhanced Slider */
        .slider-container {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .enhanced-slider {
          flex: 1;
          height: 8px;
          border-radius: 4px;
          background: #e5e7eb;
          outline: none;
          -webkit-appearance: none;
        }

        .enhanced-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(79, 70, 229, 0.3);
          transition: all 0.2s ease;
        }

        .enhanced-slider::-webkit-slider-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 4px 12px rgba(79, 70, 229, 0.4);
        }

        .slider-value {
          background: #4f46e5;
          color: white;
          padding: 4px 12px;
          border-radius: 8px;
          font-size: 0.9rem;
          font-weight: 600;
          min-width: 50px;
          text-align: center;
        }

        .field-description {
          color: #6b7280;
          font-size: 0.85rem;
          margin-top: 4px;
          font-style: italic;
        }

        /* Enhanced Generate Button */
        .generate-section {
          text-align: center;
          margin-top: 40px;
        }

        .generate-btn {
          background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
          color: white;
          border: none;
          padding: 20px 50px;
          border-radius: 16px;
          font-size: 18px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          min-width: 280px;
          margin: 0 auto;
          position: relative;
          overflow: hidden;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .generate-btn.coding-style {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        }

        .generate-btn:hover:not(:disabled) {
          transform: translateY(-4px);
          box-shadow: 0 15px 35px rgba(79, 70, 229, 0.4);
          scale: 1.02;
        }

        .generate-btn.coding-style:hover:not(:disabled) {
          box-shadow: 0 15px 35px rgba(16, 185, 129, 0.4);
        }

        .generate-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
          scale: 1;
        }

        .btn-icon {
          font-size: 1.2rem;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }

        .btn-shine {
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
          transition: left 0.6s;
        }

        .generate-btn:hover .btn-shine {
          left: 100%;
        }

        /* Loading Animation */
        .loading-animation {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .spinner {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .pulse-ring {
          position: absolute;
          width: 40px;
          height: 40px;
          border: 2px solid rgba(255,255,255,0.3);
          border-radius: 50%;
          animation: pulseRing 2s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes pulseRing {
          0% { transform: scale(0.8); opacity: 1; }
          100% { transform: scale(2); opacity: 0; }
        }

        .coding-tip {
          margin-top: 15px;
          color: #10b981;
          font-size: 0.95rem;
          font-weight: 500;
        }

        /* Enhanced Error Messages */
        .error-message.enhanced {
          background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
          border: 2px solid #fca5a5;
          border-radius: 16px;
          padding: 20px;
          margin-top: 25px;
          display: flex;
          align-items: flex-start;
          gap: 15px;
          animation: slideInDown 0.3s ease-out;
        }

        @keyframes slideInDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .error-icon {
          font-size: 1.5rem;
          flex-shrink: 0;
        }

        .error-content {
          flex: 1;
        }

        .error-content strong {
          color: #dc2626;
          display: block;
          margin-bottom: 8px;
          font-size: 1.1rem;
        }

        .error-content p {
          color: #7f1d1d;
          margin: 0 0 12px 0;
          line-height: 1.5;
        }

        .dismiss-error {
          background: #dc2626;
          color: white;
          border: none;
          padding: 6px 16px;
          border-radius: 6px;
          font-size: 0.85rem;
          cursor: pointer;
          transition: background 0.2s;
        }

        .dismiss-error:hover {
          background: #b91c1c;
        }

        /* Template Information */
        .template-info {
          margin-top: 15px;
          padding: 15px;
          background: rgba(79, 70, 229, 0.05);
          border-radius: 10px;
          border: 1px solid rgba(79, 70, 229, 0.1);
        }

        .template-description {
          font-size: 0.9rem;
          color: #4f46e5;
          margin: 0 0 10px 0;
          font-weight: 500;
        }

        .template-preview {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 15px;
          margin-top: 10px;
        }

        .template-preview h4 {
          margin: 0 0 10px 0;
          color: #374151;
          font-size: 0.9rem;
        }

        .template-preview pre {
          font-size: 0.8rem;
          color: #6b7280;
          margin: 0;
          white-space: pre-wrap;
          font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
        }

        /* Section Headers */
        .section-header {
          text-align: center;
          margin-bottom: 30px;
        }

        .section-header h3 {
          font-size: 2rem;
          color: #1f2937;
          margin-bottom: 8px;
          background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .section-header p {
          color: #6b7280;
          font-size: 1.1rem;
          margin: 0;
        }

        /* Enhanced History Cards */
        .history-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 20px;
        }

        .history-card {
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(10px);
          border: 2px solid #e5e7eb;
          border-radius: 16px;
          padding: 25px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }

        .history-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #667eea, #764ba2);
        }

        .history-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
          border-color: #4f46e5;
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 15px;
        }

        .card-header h4 {
          margin: 0;
          color: #1f2937;
          font-size: 1.2rem;
          font-weight: 700;
        }

        .theme-badge {
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .theme-badge.professional { 
          background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); 
          color: #1e40af; 
        }
        .theme-badge.modern { 
          background: linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%); 
          color: #7c3aed; 
        }
        .theme-badge.elegant { 
          background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%); 
          color: #059669; 
        }
        .theme-badge.dark { 
          background: linear-gradient(135deg, #374151 0%, #111827 100%); 
          color: #fbbf24; 
        }
        .theme-badge.coding { 
          background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); 
          color: #065f46; 
        }

        .card-meta {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 20px;
        }

        .created-date, .template-info {
          font-size: 0.9rem;
          color: #6b7280;
        }

        .card-actions {
          display: flex;
          gap: 10px;
        }

        .action-btn {
          flex: 1;
          padding: 10px 16px;
          border: none;
          border-radius: 8px;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .action-btn.regenerate {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
        }

        .action-btn.edit {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          color: white;
        }

        .action-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }

        .action-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        /* Enhanced Empty State */
        .empty-state.enhanced {
          text-align: center;
          padding: 60px 20px;
          background: rgba(79, 70, 229, 0.05);
          border-radius: 16px;
          border: 2px dashed #c7d2fe;
        }

        .empty-icon {
          font-size: 4rem;
          margin-bottom: 20px;
          opacity: 0.6;
        }

        .empty-state h4 {
          color: #4f46e5;
          font-size: 1.5rem;
          margin-bottom: 10px;
        }

        .empty-state p {
          color: #6b7280;
          font-size: 1.1rem;
          margin-bottom: 25px;
        }

        .cta-button {
          background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 10px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .cta-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(79, 70, 229, 0.3);
        }

        /* Settings Grid */
        .settings-grid {
          display: flex;
          flex-direction: column;
          gap: 40px;
        }

        .settings-section {
          background: rgba(248, 250, 252, 0.6);
          border-radius: 16px;
          padding: 30px;
          border: 1px solid #e2e8f0;
        }

        .settings-section h4 {
          color: #1f2937;
          margin-bottom: 20px;
          font-size: 1.4rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        /* Enhanced Theme Showcase */
        .theme-showcase {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
        }

        .theme-card {
          background: white;
          border: 2px solid #e5e7eb;
          border-radius: 16px;
          padding: 20px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
          position: relative;
          overflow: hidden;
        }

        .theme-card.selected {
          border-color: #4f46e5;
          box-shadow: 0 10px 25px rgba(79, 70, 229, 0.2);
          transform: translateY(-2px);
        }

        .theme-card.selected::before {
          content: '✓';
          position: absolute;
          top: 15px;
          right: 15px;
          background: #4f46e5;
          color: white;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.8rem;
          font-weight: bold;
        }

        .theme-preview {
          height: 120px;
          background: #f8fafc;
          border-radius: 8px;
          margin-bottom: 15px;
          position: relative;
          overflow: hidden;
        }

        .theme-card.professional .theme-preview {
          background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
        }
        .theme-card.modern .theme-preview {
          background: linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%);
        }
        .theme-card.elegant .theme-preview {
          background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
        }
        .theme-card.dark .theme-preview {
          background: linear-gradient(135deg, #374151 0%, #111827 100%);
        }
        .theme-card.coding .theme-preview {
          background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
        }

        .preview-header {
          height: 20px;
          background: rgba(0, 0, 0, 0.1);
          margin-bottom: 8px;
        }

        .preview-content {
          padding: 0 10px;
        }

        .preview-line {
          height: 8px;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 4px;
          margin-bottom: 6px;
        }

        .preview-line.long { width: 90%; }
        .preview-line.medium { width: 70%; }
        .preview-line.short { width: 50%; }

        .theme-info h5 {
          margin: 0 0 8px 0;
          color: #1f2937;
          font-size: 1.1rem;
          font-weight: 700;
        }

        .theme-info p {
          margin: 0 0 15px 0;
          color: #6b7280;
          font-size: 0.9rem;
          line-height: 1.4;
        }

        .select-theme-btn {
          background: transparent;
          border: 2px solid #4f46e5;
          color: #4f46e5;
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          width: 100%;
        }

        .select-theme-btn:hover {
          background: #4f46e5;
          color: white;
        }

        .theme-card.selected .select-theme-btn {
          background: #4f46e5;
          color: white;
        }

        /* Enhanced Template Showcase */
        .template-showcase {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 25px;
        }

        .template-card {
          background: white;
          border: 2px solid #e5e7eb;
          border-radius: 16px;
          padding: 25px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }

        .template-card.selected {
          border-color: #10b981;
          box-shadow: 0 15px 30px rgba(16, 185, 129, 0.2);
          transform: translateY(-3px);
        }

        .template-card:hover:not(.selected) {
          border-color: #6b7280;
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        }

        .template-icon {
          font-size: 2.5rem;
          margin-bottom: 15px;
          display: block;
        }

        .template-info h5 {
          margin: 0 0 10px 0;
          color: #1f2937;
          font-size: 1.3rem;
          font-weight: 700;
        }

        .template-info p {
          margin: 0 0 15px 0;
          color: #6b7280;
          font-size: 0.95rem;
          line-height: 1.5;
        }

        .special-badge {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          color: white;
          font-size: 0.8rem;
          padding: 4px 10px;
          border-radius: 12px;
          font-weight: 600;
          display: inline-block;
          margin-bottom: 10px;
          animation: glow 2s ease-in-out infinite alternate;
        }

        @keyframes glow {
          from { box-shadow: 0 0 5px rgba(245, 158, 11, 0.3); }
          to { box-shadow: 0 0 20px rgba(245, 158, 11, 0.6); }
        }

        .select-template-btn {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          border: none;
          padding: 12px 20px;
          border-radius: 10px;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          width: 100%;
        }

        .select-template-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 15px rgba(16, 185, 129, 0.3);
        }

        /* Info Cards */
        .info-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
        }

        .info-card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 20px;
          transition: all 0.3s ease;
        }

        .info-card:hover {
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
          transform: translateY(-2px);
        }

        .info-card h5 {
          margin: 0 0 12px 0;
          color: #4f46e5;
          font-size: 1.1rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .info-card p {
          margin: 0;
          color: #6b7280;
          line-height: 1.5;
        }

        .info-card ul {
          margin: 10px 0 0 0;
          padding-left: 20px;
          color: #6b7280;
        }

        .info-card li {
          margin-bottom: 6px;
          line-height: 1.4;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .app-container {
            padding: 15px;
          }
          
          .app-header h1 {
            font-size: 2rem;
            flex-direction: column;
            gap: 10px;
          }
          
          .options-grid, .history-grid, .theme-showcase, .template-showcase, .info-cards {
            grid-template-columns: 1fr;
          }
          
          .tab-navigation {
            padding: 6px;
          }
          
          .tab-btn {
            padding: 12px 16px;
            font-size: 0.9rem;
          }
          
          .generate-btn {
            min-width: 100%;
            padding: 18px 30px;
          }

          .main-content {
            padding: 25px;
          }

          .card-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
          }

          .card-actions {
            flex-direction: column;
          }
        }

        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
          .main-content {
            background: rgba(17, 24, 39, 0.95);
            color: #f9fafb;
          }

          .enhanced-input, .enhanced-select, .enhanced-textarea {
            background: rgba(31, 41, 55, 0.8);
            border-color: #374151;
            color: #f9fafb;
          }

          .form-group.enhanced label {
            color: #f3f4f6;
          }

          .section-header h3, .card-header h4, .template-info h5, .info-card h5 {
            color: #f9fafb;
          }
        }

        /* Performance optimizations */
        .tab-content {
          contain: layout style paint;
        }

        .generate-btn, .theme-card, .template-card, .history-card {
          will-change: transform;
        }

        /* Accessibility improvements */
        .enhanced-input:focus-visible,
        .enhanced-select:focus-visible,
        .enhanced-textarea:focus-visible,
        .generate-btn:focus-visible,
        .tab-btn:focus-visible {
          outline: 3px solid #fbbf24;
          outline-offset: 2px;
        }

        /* Custom scrollbar */
        .template-preview pre::-webkit-scrollbar {
          width: 6px;
        }

        .template-preview pre::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 3px;
        }

        .template-preview pre::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }

        .template-preview pre::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
}