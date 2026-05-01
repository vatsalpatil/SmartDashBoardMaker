import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Layers, Lock, Mail, AlertCircle, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';

const FEATURES = [
  { icon: '⚡', title: 'Real-time Analytics', desc: 'Query millions of rows instantly with DuckDB' },
  { icon: '📊', title: 'Smart Dashboards', desc: 'Drag & drop visualizations, KPIs, and charts' },
  { icon: '🔗', title: 'Any Data Source', desc: 'CSV, REST APIs, PostgreSQL, MySQL, WebSockets' },
  { icon: '🤖', title: 'Visual SQL Builder', desc: 'Build complex queries without writing a line' },
];

export default function LoginPage() {
  const { login } = useAuth();
  const navigate   = useNavigate();
  const location   = useLocation();
  const from       = location.state?.from?.pathname || '/';

  const [form, setForm]       = useState({ email: '', password: '', rememberMe: false });
  const [showPass, setShowPass] = useState(false);
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.email || !form.password) { setError('Please fill in all fields.'); return; }
    setLoading(true);
    try {
      await login({ email: form.email, password: form.password, rememberMe: form.rememberMe });
      navigate(from, { replace: true });
    } catch (err) {
      const msg = err?.response?.data?.detail;
      if (err?.response?.status === 429) setError('Too many attempts. Please wait 15 minutes.');
      else setError(msg || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* ── Animated background ── */}
      <div className="auth-bg">
        <div className="auth-orb auth-orb-1" />
        <div className="auth-orb auth-orb-2" />
        <div className="auth-orb auth-orb-3" />
      </div>

      <div className="auth-container">
        {/* ── Left panel: branding ── */}
        <div className="auth-left">
          <div className="auth-brand">
            <div className="auth-brand-icon">
              <Layers size={28} className="text-white" />
            </div>
            <span className="auth-brand-name">DASHTOR</span>
          </div>

          <div className="auth-tagline">
            <h1 className="auth-headline">
              Your data,<br />
              <span className="auth-headline-accent">your insights.</span>
            </h1>
            <p className="auth-subline">
              The smart analytics platform that turns raw data into powerful, real-time dashboards.
            </p>
          </div>

          <div className="auth-features">
            {FEATURES.map((f) => (
              <div key={f.title} className="auth-feature-item">
                <span className="auth-feature-icon">{f.icon}</span>
                <div>
                  <div className="auth-feature-title">{f.title}</div>
                  <div className="auth-feature-desc">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right panel: form ── */}
        <div className="auth-right">
          <div className="auth-card">
            <div className="auth-card-header">
              <div className="auth-card-badge">
                <Sparkles size={13} />
                <span>Welcome back</span>
              </div>
              <h2 className="auth-card-title">Sign in to your account</h2>
              <p className="auth-card-sub">
                Don't have an account?{' '}
                <Link to="/signup" className="auth-link">Create one free</Link>
              </p>
            </div>

            {error && (
              <div className="auth-error">
                <AlertCircle size={15} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form" noValidate>
              {/* Email */}
              <div className="auth-field">
                <label className="auth-label" htmlFor="login-email">Email address</label>
                <div className="auth-input-wrap">
                  <Mail size={16} className="auth-input-icon" />
                  <input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={set('email')}
                    className="auth-input"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="auth-field">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="auth-label" htmlFor="login-password">Password</label>
                </div>
                <div className="auth-input-wrap">
                  <Lock size={16} className="auth-input-icon" />
                  <input
                    id="login-password"
                    type={showPass ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={set('password')}
                    className="auth-input"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="auth-pass-toggle"
                    onClick={() => setShowPass((v) => !v)}
                    tabIndex={-1}
                    aria-label="Toggle password visibility"
                  >
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Remember me */}
              <label className="auth-checkbox-label">
                <input
                  id="login-remember"
                  type="checkbox"
                  checked={form.rememberMe}
                  onChange={set('rememberMe')}
                  className="auth-checkbox"
                  disabled={loading}
                />
                <span>Stay signed in for 30 days</span>
              </label>

              <button
                id="login-submit"
                type="submit"
                className="auth-submit-btn"
                disabled={loading}
              >
                {loading ? (
                  <span className="auth-btn-spinner" />
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
