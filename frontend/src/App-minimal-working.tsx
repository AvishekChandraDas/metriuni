import React from 'react';

const App: React.FC = () => {
  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f3f4f6', 
      padding: '2rem',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ color: '#1f2937', fontSize: '2rem', marginBottom: '1rem' }}>
          🎉 MetroUni is Working!
        </h1>
        <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
          If you can see this message, React is rendering correctly.
        </p>
        <div style={{ 
          backgroundColor: '#dbeafe', 
          padding: '1rem', 
          borderRadius: '4px',
          marginBottom: '1rem'
        }}>
          <h3 style={{ color: '#1e40af', margin: '0 0 0.5rem 0' }}>System Check:</h3>
          <ul style={{ color: '#1e40af', margin: 0, paddingLeft: '1.5rem' }}>
            <li>✅ React component rendered</li>
            <li>✅ Styles applied</li>
            <li>✅ JavaScript executing</li>
            <li>✅ Vite dev server running</li>
          </ul>
        </div>
        <p style={{ fontSize: '0.875rem', color: '#9ca3af' }}>
          Current time: {new Date().toLocaleString()}
        </p>
        <p style={{ fontSize: '0.875rem', color: '#9ca3af' }}>
          URL: {window.location.href}
        </p>
      </div>
    </div>
  );
};

export default App;
