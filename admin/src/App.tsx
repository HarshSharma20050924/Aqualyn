import React, { useState, useEffect } from 'react';
import AdminDashboardScreen from './AdminDashboardScreen';
import { ADMIN_ENDPOINTS } from './config/api';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSetupMode, setIsSetupMode] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  // On mount: check if there's a valid token in localStorage
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      // Quick validation: try hitting a protected endpoint
      fetch(ADMIN_ENDPOINTS.STATS, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => {
          if (res.ok) {
            setIsAuthenticated(true);
          } else {
            // Token is stale/invalid — clear it
            localStorage.removeItem('adminToken');
          }
        })
        .catch(() => {
          localStorage.removeItem('adminToken');
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setIsAuthenticated(false);
    setError('');
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    if (isSetupMode && password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    try {
      const endpoint = isSetupMode ? ADMIN_ENDPOINTS.SETUP : ADMIN_ENDPOINTS.LOGIN;
      const payload = isSetupMode ? { email, password, name } : { email, password };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok && data.token) {
        localStorage.setItem('adminToken', data.token);
        setIsAuthenticated(true);
      } else if (response.status === 403) {
        setError('An admin already exists. Please use the Login form.');
        setIsSetupMode(false);
      } else {
        setError(data.error || 'Authentication failed.');
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError('Network error. Is the backend running on port 5000?');
    }
  };

  // Show a loading spinner while validating token
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <p className="text-white text-lg animate-pulse">Checking session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <form onSubmit={handleAuth} className="bg-gray-800 p-8 rounded-2xl w-96 flex flex-col gap-4 shadow-2xl border border-gray-700">
          <h2 className="text-2xl font-bold text-center text-white mb-2">
            🛡️ {isSetupMode ? 'Setup Admin' : 'Admin Login'}
          </h2>

          {error && (
            <div className="bg-red-500/20 border border-red-500 text-red-300 text-sm p-3 rounded-lg">
              {error}
            </div>
          )}

          {isSetupMode && (
            <input
              type="text"
              placeholder="Admin Name"
              className="p-3 bg-gray-700 border border-gray-600 rounded-lg outline-none text-white placeholder-gray-400 focus:border-blue-500"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          )}

          <input
            type="email"
            placeholder="Admin Email"
            className="p-3 bg-gray-700 border border-gray-600 rounded-lg outline-none text-white placeholder-gray-400 focus:border-blue-500"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password (min 6 chars)"
            className="p-3 bg-gray-700 border border-gray-600 rounded-lg outline-none text-white placeholder-gray-400 focus:border-blue-500"
            value={password}
            onChange={e => setPassword(e.target.value)}
            minLength={6}
            required
          />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg font-bold mt-2 transition-colors"
          >
            {isSetupMode ? 'Create Admin Account' : 'Login'}
          </button>

          <p className="text-sm text-center text-gray-400 mt-4">
            {isSetupMode ? 'Already have an admin?' : 'First time setup?'}
            <button
              type="button"
              onClick={() => { setIsSetupMode(!isSetupMode); setError(''); }}
              className="text-blue-400 font-bold ml-1 hover:underline"
            >
              {isSetupMode ? 'Login here' : 'Create Admin'}
            </button>
          </p>
        </form>
      </div>
    );
  }

  return (
    <div className="App">
      <AdminDashboardScreen onBack={handleLogout} />
    </div>
  );
}

export default App;
