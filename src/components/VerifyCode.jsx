import { useState } from 'react';
import { supabase } from '../api/supabase';

export default function VerifyCode({ email, onBack }) {
  const [code, setCode] = useState('');
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmed = code.trim();
    if (trimmed.length < 6) return;
    setStatus('verifying');
    setError(null);

    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: trimmed,
      type: 'email',
    });

    if (verifyError) {
      setError(verifyError.message);
      setStatus('idle');
    }
  }

  return (
    <div className="auth">
      <img src="/logo.svg" alt="Super Fan" className="auth-logo" />
      <h1 className="auth-title">Check your email</h1>
      <p className="auth-tagline">
        We sent an 8-character code to <strong>{email}</strong>.
      </p>

      <form className="auth-form" onSubmit={handleSubmit}>
        <label className="auth-field">
          <span>Verification code</span>
          <input
            type="text"
            inputMode="text"
            maxLength={10}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))}
            placeholder="Code from email"
            autoComplete="one-time-code"
            autoFocus
            required
          />
        </label>

        {error && <p className="auth-error">{error}</p>}

        <button
          type="submit"
          className="btn-primary"
          disabled={status === 'verifying' || code.length < 6}
        >
          {status === 'verifying' ? 'Verifying…' : 'Verify and sign in'}
        </button>

        <button type="button" className="back-btn" onClick={onBack}>
          ← Use a different email
        </button>
      </form>
    </div>
  );
}
