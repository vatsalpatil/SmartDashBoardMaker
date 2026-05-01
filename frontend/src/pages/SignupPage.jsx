import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Eye, EyeOff, Layers, Lock, Mail, User, AlertCircle,
  ArrowRight, Sparkles, CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../lib/AuthContext';

const PASSWORD_RULES = [
  { test: (p) => p.length >= 8,          label: 'At least 8 characters' },
  { test: (p) => /[A-Z]/.test(p),        label: 'One uppercase letter' },
  { test: (p) => /[0-9]/.test(p),        label: 'One number' },
];

export default function SignupPage() {
  const { signup } = useAuth();
  const navigate   = useNavigate();

  const [form, setForm]       = useState({ username: '', email: '', password: '', fullName: '' });
  const [showPass, setShowPass] = useState(false);
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const strength = PASSWORD_RULES.map((r) => r.test(form.password));
  const strengthScore = strength.filter(Boolean).length;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.username || !form.email || !form.password) {
      setError('Please fill in all required fields.');
      return;
    }
    if (!/^[a-zA-Z0-9_]{3,30}$/.test(form.username)) {
      setError('Username must be 3-30 characters (letters, numbers, underscore).');
      return;
    }
    if (strengthScore < 2) {
      setError('Please choose a stronger password.');
      return;
    }
    setLoading(true);
    try {
      await signup({
        username: form.username,
        email: form.email,
        password: form.password,
        fullName: form.fullName,
      });
      navigate('/', { replace: true });
    } catch (err) {
      const msg = err?.response?.data?.detail;
      if (err?.response?.status === 409) setError('Email or username is already taken.');
      else setError(msg || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const strengthLabel = ['', 'Weak', 'Fair', 'Strong'][strengthScore];
  const strengthColor = ['', '#ef4444', '#f59e0b', '#10b981'][strengthScore];

  return (
    <div className="auth-page">
      {/* ── Animated background ── */}
      <div className="auth-bg">
        <div className="auth-orb auth-orb-1" />
        <div className="auth-orb auth-orb-2" />
        <div className="auth-orb auth-orb-3" />
      </div>

      <div className="auth-container auth-container-signup">
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
              Start building<br />
              <span className="auth-headline-accent">in seconds.</span>
            </h1>
            <p className="auth-subline">
              Create your free account and get full access to all analytics features.
              No credit card required.
            </p>
          </div>

          <div className="auth-perks">
            {[
              'Upload unlimited datasets',
              'Build & share dashboards',
              'SQL editor + visual builder',
              'Connect any data source',
              'Real-time chart updates',
              'Full data isolation per user',
            ].map((perk) => (
              <div key={perk} className="auth-perk-item">
                <CheckCircle2 size={15} className="auth-perk-check" />
                <span>{perk}</span>
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
                <span>Free forever</span>
              </div>
              <h2 className="auth-card-title">Create your account</h2>
              <p className="auth-card-sub">
                Already have an account?{' '}
                <Link to="/login" className="auth-link">Sign in</Link>
              </p>
            </div>

            {error && (
              <div className="auth-error">
                <AlertCircle size={15} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form" noValidate>
              {/* Full Name */}
              <div className="auth-field">
                <label className="auth-label" htmlFor="signup-fullname">Full name <span className="auth-optional">(optional)</span></label>
                <div className="auth-input-wrap">
                  <User size={16} className="auth-input-icon" />
                  <input
                    id="signup-fullname"
                    type="text"
                    placeholder="John Doe"
                    value={form.fullName}
                    onChange={set('fullName')}
                    className="auth-input"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Username */}
              <div className="auth-field">
                <label className="auth-label" htmlFor="signup-username">Username <span className="auth-required">*</span></label>
                <div className="auth-input-wrap">
                  <span className="auth-input-prefix">@</span>
                  <input
                    id="signup-username"
                    type="text"
                    placeholder="your_username"
                    value={form.username}
                    onChange={set('username')}
                    className="auth-input auth-input-prefixed"
                    disabled={loading}
                    autoComplete="username"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="auth-field">
                <label className="auth-label" htmlFor="signup-email">Email address <span className="auth-required">*</span></label>
                <div className="auth-input-wrap">
                  <Mail size={16} className="auth-input-icon" />
                  <input
                    id="signup-email"
                    type="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={set('email')}
                    className="auth-input"
                    disabled={loading}
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="auth-field">
                <label className="auth-label" htmlFor="signup-password">Password <span className="auth-required">*</span></label>
                <div className="auth-input-wrap">
                  <Lock size={16} className="auth-input-icon" />
                  <input
                    id="signup-password"
                    type={showPass ? 'text' : 'password'}
                    placeholder="Min. 8 characters"
                    value={form.password}
                    onChange={set('password')}
                    className="auth-input"
                    disabled={loading}
                    autoComplete="new-password"
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

                {/* Strength meter */}
                {form.password && (
                  <div className="auth-strength">
                    <div className="auth-strength-bars">
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          className="auth-strength-bar"
                          style={{ background: i < strengthScore ? strengthColor : undefined }}
                        />
                      ))}
                    </div>
                    <span className="auth-strength-label" style={{ color: strengthColor }}>
                      {strengthLabel}
                    </span>
                  </div>
                )}

                {/* Rules checklist */}
                {form.password && (
                  <div className="auth-rules">
                    {PASSWORD_RULES.map((r, i) => (
                      <div key={i} className={`auth-rule ${strength[i] ? 'auth-rule-ok' : ''}`}>
                        <CheckCircle2 size={12} />
                        <span>{r.label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                id="signup-submit"
                type="submit"
                className="auth-submit-btn"
                disabled={loading}
              >
                {loading ? (
                  <span className="auth-btn-spinner" />
                ) : (
                  <>
                    <span>Create Account</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>

              <p className="auth-tos">
                By creating an account you agree to our{' '}
                <span className="auth-link">Terms of Service</span>{' '}
                and{' '}
                <span className="auth-link">Privacy Policy</span>.
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
