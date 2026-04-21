import { useState } from 'react';
import { createGroup } from '../api/supabase';
import TeamMultiPicker from './TeamMultiPicker';

export default function CreateGroup({ userId, onCreated, onBack }) {
  const [name, setName] = useState('');
  const [teams, setTeams] = useState([]);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (name.trim().length < 2 || teams.length < 2) return;
    setStatus('saving');
    setError(null);
    const { data, error: err } = await createGroup({
      name: name.trim(),
      leaderId: userId,
      teams: teams.map((t) => ({
        league: t.league,
        id: t.id,
        name: t.name,
        ...(t.competition ? { competition: t.competition } : {}),
      })),
    });
    if (err) {
      setError(err.message);
      setStatus('idle');
      return;
    }
    onCreated(data.id);
  }

  const valid = name.trim().length >= 2 && teams.length >= 2;

  return (
    <div className="home">
      <button className="back-btn" onClick={onBack}>← Groups</button>
      <h1>Create Group</h1>
      <p className="sub">Name it, pick at least 2 teams, invite friends.</p>
      <form className="auth-form" onSubmit={handleSubmit}>
        <label className="auth-field">
          <span>Group name</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={40}
            required
          />
        </label>
        <TeamMultiPicker selected={teams} onChange={setTeams} />
        {error && <p className="auth-error">{error}</p>}
        <button
          type="submit"
          className="btn-primary"
          disabled={!valid || status === 'saving'}
        >
          {status === 'saving' ? 'Creating…' : 'Create group'}
        </button>
      </form>
    </div>
  );
}
