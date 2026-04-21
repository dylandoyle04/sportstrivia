import { useState } from 'react';
import { findGroupByCode, joinGroup } from '../api/supabase';

export default function JoinGroup({ userId, onJoined, onBack }) {
  const [code, setCode] = useState('');
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length !== 6) return;
    setStatus('joining');
    setError(null);

    const { data: group, error: findErr } = await findGroupByCode(trimmed);
    if (findErr) {
      setError(findErr.message);
      setStatus('idle');
      return;
    }
    if (!group) {
      setError('No group found with that code.');
      setStatus('idle');
      return;
    }

    const { error: joinErr } = await joinGroup(group.id, userId);
    if (joinErr && joinErr.code !== '23505') {
      setError(joinErr.message);
      setStatus('idle');
      return;
    }
    onJoined(group.id);
  }

  return (
    <div className="home">
      <button className="back-btn" onClick={onBack}>← Groups</button>
      <h1>Join Group</h1>
      <p className="sub">Enter the 6-character invite code.</p>
      <form className="auth-form" onSubmit={handleSubmit}>
        <label className="auth-field">
          <span>Invite code</span>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase())}
            maxLength={6}
            placeholder="ABC234"
            autoFocus
            required
          />
        </label>
        {error && <p className="auth-error">{error}</p>}
        <button
          type="submit"
          className="btn-primary"
          disabled={code.trim().length !== 6 || status === 'joining'}
        >
          {status === 'joining' ? 'Joining…' : 'Join group'}
        </button>
      </form>
    </div>
  );
}
