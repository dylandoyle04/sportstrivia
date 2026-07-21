import { useState } from 'react';

export default function NameGate({ onEnter, initialName = '' }) {
  const [name, setName] = useState(initialName);

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onEnter(trimmed);
  }

  return (
    <div className="auth">
      <img src="/logo.png" alt="You Know Ball?" className="auth-logo" />
      <h1 className="auth-title">You Know Ball?</h1>

      <form className="auth-form" onSubmit={handleSubmit}>
        <label className="auth-field">
          <span>Your name</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Shown on the leaderboard"
            autoComplete="name"
            required
            autoFocus
            maxLength={30}
          />
        </label>
        <button type="submit" className="btn-primary" disabled={!name.trim()}>
          Play
        </button>
        <p className="auth-fineprint">
          No account, no email. Just pick a name and go.
        </p>
      </form>
    </div>
  );
}
