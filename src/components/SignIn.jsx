import { useState } from 'react';
import { supabase } from '../api/supabase';

export default function SignIn({ onCodeSent }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setStatus('sending');
    setError(null);

    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        shouldCreateUser: true,
        data: { display_name: name.trim() },
      },
    });

    if (otpError) {
      setError(otpError.message);
      setStatus('idle');
      return;
    }

    onCodeSent({ name: name.trim(), email: email.trim() });
  }

  return (
    <div className="auth">
      <img src="/logo.svg" alt="Super Fan" className="auth-logo" />
      <h1 className="auth-title">Super Fan</h1>
      <p className="auth-tagline">Sign in to play sports trivia.</p>

      <form className="auth-form" onSubmit={handleSubmit}>
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

        {error && <p className="auth-error">{error}</p>}

        <button type="submit" className="btn-primary" disabled={status === 'sending'}>
          {status === 'sending' ? 'Sending code…' : 'Send verification code'}
        </button>

        <p className="auth-fineprint">
          Your name is shown to other players. We'll email you an 8-character code to verify.
        </p>
      </form>
    </div>
  );
}
