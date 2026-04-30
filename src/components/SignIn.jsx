import { useState } from 'react';
import { supabase } from '../api/supabase';

export default function SignIn({ onCodeSent }) {
  const [mode, setMode] = useState('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);

  const isSignup = mode === 'signup';

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('working');
    setError(null);

    const trimmedEmail = email.trim();
    const trimmedName = name.trim();

    if (isSignup) {
      if (!trimmedName || !trimmedEmail || password.length < 6) {
        setError('Need name, email, and a password of at least 6 characters.');
        setStatus('idle');
        return;
      }
      const { error: err } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: { data: { display_name: trimmedName } },
      });
      if (err) {
        setError(err.message);
        setStatus('idle');
        return;
      }
      onCodeSent({ name: trimmedName, email: trimmedEmail, type: 'signup' });
      return;
    }

    if (!trimmedEmail || !password) {
      setError('Email and password required.');
      setStatus('idle');
      return;
    }
    const { error: err } = await supabase.auth.signInWithPassword({
      email: trimmedEmail,
      password,
    });
    if (err) {
      setError(err.message);
      setStatus('idle');
    }
    // success → auth state listener in App will swap screens
  }

  async function handleOtpFallback() {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Enter your email first, then use the code option.');
      return;
    }
    setStatus('working');
    setError(null);
    const { error: err } = await supabase.auth.signInWithOtp({
      email: trimmedEmail,
      options: { shouldCreateUser: false },
    });
    if (err) {
      setError(err.message);
      setStatus('idle');
      return;
    }
    onCodeSent({ name: '', email: trimmedEmail, type: 'email' });
  }

  return (
    <div className="auth">
      <img src="/logo.png" alt="You Know Ball?" className="auth-logo" />
      <h1 className="auth-title">You Know Ball?</h1>

      <div className="auth-tabs">
        <button
          type="button"
          className={`auth-tab ${!isSignup ? 'auth-tab--on' : ''}`}
          onClick={() => { setMode('signin'); setError(null); }}
        >
          Sign In
        </button>
        <button
          type="button"
          className={`auth-tab ${isSignup ? 'auth-tab--on' : ''}`}
          onClick={() => { setMode('signup'); setError(null); }}
        >
          Sign Up
        </button>
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        {isSignup && (
          <label className="auth-field">
            <span>Name</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="First and last"
              autoComplete="name"
              required
            />
          </label>
        )}
        <label className="auth-field">
          <span>Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
        </label>
        <label className="auth-field">
          <span>Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={isSignup ? 'At least 6 characters' : 'Your password'}
            autoComplete={isSignup ? 'new-password' : 'current-password'}
            minLength={6}
            required
          />
        </label>

        {error && <p className="auth-error">{error}</p>}

        <button type="submit" className="btn-primary" disabled={status === 'working'}>
          {status === 'working'
            ? (isSignup ? 'Creating…' : 'Signing in…')
            : (isSignup ? 'Sign up' : 'Sign in')}
        </button>

        {!isSignup && (
          <button
            type="button"
            className="back-btn auth-otp-link"
            onClick={handleOtpFallback}
            disabled={status === 'working'}
          >
            Use email code instead
          </button>
        )}

        {isSignup && (
          <p className="auth-fineprint">
            Your name is shown to other players. We'll email you a code to confirm your account.
          </p>
        )}
      </form>
    </div>
  );
}
