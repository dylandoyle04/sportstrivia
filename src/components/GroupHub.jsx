import { useEffect, useState } from 'react';
import { getMyGroups } from '../api/supabase';
import CreateGroup from './CreateGroup';
import JoinGroup from './JoinGroup';

export default function GroupHub({ userId, onSelectGroup, onBack }) {
  const [view, setView] = useState('list');
  const [groups, setGroups] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (view !== 'list') return undefined;
    let cancelled = false;
    getMyGroups(userId).then(({ data, error: err }) => {
      if (cancelled) return;
      if (err) setError(err.message);
      else setGroups(data ?? []);
    });
    return () => { cancelled = true; };
  }, [userId, view]);

  if (view === 'create') {
    return (
      <CreateGroup
        userId={userId}
        onCreated={(id) => onSelectGroup(id)}
        onBack={() => setView('list')}
      />
    );
  }

  if (view === 'join') {
    return (
      <JoinGroup
        userId={userId}
        onJoined={(id) => onSelectGroup(id)}
        onBack={() => setView('list')}
      />
    );
  }

  return (
    <div className="home">
      <button className="back-btn" onClick={onBack}>← Home</button>
      <h1>Groups</h1>
      <p className="sub">Play daily trivia with your friend group.</p>

      {error && <p className="auth-error">{error}</p>}

      {groups === null && <p className="sub">Loading…</p>}

      {groups && groups.length > 0 && (
        <section className="league-group">
          <h2 className="league-heading"><span>My Groups</span></h2>
          <div className="mode-grid">
            {groups.map((m) => {
              const g = m.groups;
              const teamCount = Array.isArray(g.team_ids) ? g.team_ids.length : 0;
              return (
                <button
                  key={g.id}
                  className="mode-card"
                  onClick={() => onSelectGroup(g.id)}
                >
                  <span className="mode-card-title">{g.name}</span>
                  <span className="mode-card-desc">
                    {teamCount} teams · code {g.invite_code}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      <section className="league-group">
        <h2 className="league-heading"><span>New</span></h2>
        <div className="mode-grid">
          <button className="mode-card" onClick={() => setView('create')}>
            <span className="mode-card-title">Create</span>
            <span className="mode-card-desc">Start a group. Pick the teams. Invite friends.</span>
          </button>
          <button className="mode-card" onClick={() => setView('join')}>
            <span className="mode-card-title">Join</span>
            <span className="mode-card-desc">Enter a 6-character invite code.</span>
          </button>
        </div>
      </section>
    </div>
  );
}
