// client/src/App.tsx (Improved)
import React, { useState } from 'react';
import axios from 'axios';

export default function App() {
  const [prompt, setPrompt] = useState('Write a short guide: goals, steps, checklist.');
  const [useAI, setUseAI] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null); // State for the error message

  const generate = async () => {
    setLoading(true);
    setError(null); // Clear previous errors
    try {
      const resp = await axios.post('/api/generate-pdf', { prompt, useAI, title: 'my-document' }, { responseType: 'blob' });
      const blob = new Blob([resp.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'generated.pdf';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'An unknown error occurred.';
      setError(errorMessage); // Set the error message to be displayed
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: '40px auto', fontFamily: 'system-ui, Arial' }}>
      <h1>AI Text → PDF (TS + Vite)</h1>
      <label style={{ display: 'block', marginBottom: 8 }}>
        {/* Disable controls while loading */}
        <input type="checkbox" checked={useAI} onChange={e => setUseAI(e.target.checked)} disabled={loading} /> Use Gemini AI
      </label>

      <textarea
        value={prompt}
        onChange={e => setPrompt(e.target.value)}
        style={{ width: '100%', minHeight: 240, fontFamily: 'monospace' }}
        disabled={loading} // Disable textarea while loading
      />

      <div style={{ marginTop: 12 }}>
        <button onClick={generate} disabled={loading}>{loading ? 'Generating...' : 'Generate PDF'}</button>
      </div>

      {/* Display error message here */}
      {error && (
        <div style={{ marginTop: 15, color: 'red', border: '1px solid red', padding: 10, borderRadius: 5 }}>
          <strong>Error:</strong> {error}
        </div>
      )}
    </div>
  );
}