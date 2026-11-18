import React, { useState } from 'react';
import { useAuth } from '../../providers/AuthProvider';
import { User, Lock, Mail, ArrowRight, AlertCircle, Code2 } from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { login, signup } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim()) {
      setError('Please enter your username');
      return;
    }
    if (mode === 'signup' && (!email.trim() || !email.includes('@'))) {
      setError('Please enter a valid email address');
      return;
    }
    if (!password) {
      setError('Please enter your password');
      return;
    }

    try {
      setLoading(true);
      if (mode === 'signin') {
        await login(username.trim(), password);
      } else {
        await signup(username.trim(), email.trim(), password);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-matte-400/90 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-md bg-matte-200 border border-matte-border rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-matte-border text-center bg-matte-300/50">
          <div className="w-12 h-12 rounded-xl bg-matte-100 border border-matte-border flex items-center justify-center mx-auto mb-3 text-ochre shadow-inner">
            <Code2 className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-wide">Welcome to Ochre IDE</h1>
          <p className="text-xs text-matte-muted mt-1">Real-Time Collaborative Code Editor</p>

          {/* Mode Switcher Tabs */}
          <div className="flex bg-matte-100 p-1 rounded-lg border border-matte-border mt-5">
            <button
              onClick={() => { setMode('signin'); setError(''); }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded transition-all ${
                mode === 'signin' 
                  ? 'bg-ochre text-white shadow-sm' 
                  : 'text-matte-muted hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setMode('signup'); setError(''); }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded transition-all ${
                mode === 'signup' 
                  ? 'bg-ochre text-white shadow-sm' 
                  : 'text-matte-muted hover:text-white'
              }`}
            >
              Sign Up
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2 text-xs text-red-400">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Username */}
          <div>
            <label className="block text-xs font-medium text-matte-muted mb-1">Username</label>
            <div className="relative">
              <User className="w-4 h-4 text-matte-muted absolute left-3 top-3" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="developer_name"
                className="w-full bg-matte-100 border border-matte-border rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-matte-muted focus:outline-none focus:border-ochre transition-colors"
                required
              />
            </div>
          </div>

          {/* Email (Signup only) */}
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-medium text-matte-muted mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-matte-muted absolute left-3 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="dev@ochre.io"
                  className="w-full bg-matte-100 border border-matte-border rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-matte-muted focus:outline-none focus:border-ochre transition-colors"
                  required
                />
              </div>
            </div>
          )}

          {/* Password */}
          <div>
            <label className="block text-xs font-medium text-matte-muted mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-matte-muted absolute left-3 top-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-matte-100 border border-matte-border rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-matte-muted focus:outline-none focus:border-ochre transition-colors"
                required
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-ochre hover:bg-ochre-hover text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-md disabled:opacity-50 mt-2"
          >
            <span>{loading ? 'Processing...' : mode === 'signin' ? 'Sign In to Workspace' : 'Create Account'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Footer */}
        <div className="p-4 bg-matte-300/30 border-t border-matte-border text-center text-[11px] text-matte-muted">
          {mode === 'signin' ? (
            <p>Don't have an account? <button type="button" onClick={() => { setMode('signup'); setError(''); }} className="text-ochre hover:underline font-semibold">Sign Up</button></p>
          ) : (
            <p>Already registered? <button type="button" onClick={() => { setMode('signin'); setError(''); }} className="text-ochre hover:underline font-semibold">Sign In</button></p>
          )}
        </div>
      </div>
    </div>
  );
};
