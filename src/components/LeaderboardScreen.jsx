import { useEffect, useState } from 'react';
import { getMyGroups } from '../api/supabase';
import { todayDateString } from '../questions/seededRandom';
import DailyLeaderboard from './DailyLeaderboard';
import GroupLeaderboard from './GroupLeaderboard';
import CollegeLeaderboard from './CollegeLeaderboard';

const TABS = [
  { key: 'daily', label: 'Daily' },
  { key: 'last-night', label: 'Last Night' },
  { key: 'group', label: 'Group' },
  { key: 'college', label: 'College' },
];

export default function LeaderboardScreen({ userId, onBack }) {
  const [tab, setTab] = useState('daily');
  const [groups, setGroups] = useState(null);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getMyGroups(userId).then(({ data, error: err }) => {
      if (cancelled) return;
      if (err) {
        setError(err.message);
        setGroups([]);
        return;
      }
      const list = data ?? [];
      setGroups(list);
      if (list.length > 0) setSelectedGroupId(list[0].groups.id);
    });
    return () => { cancelled = true; };
  }, [userId]);

  return (
    <div className="daily">
      <button className="back-btn" onClick={onBack}>← Home</button>
      <h1>Leaderboards</h1>

      <div className="lb-tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={t.key === tab ? 'lb-tab lb-tab--on' : 'lb-tab'}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && <p className="auth-error">{error}</p>}

      {tab === 'daily' && (
        <DailyLeaderboard quizDate={todayDateString()} highlightUserId={userId} />
      )}

      {tab === 'last-night' && (
        <DailyLeaderboard quizDate={todayDateString()} highlightUserId={userId} mode="last_night" />
      )}

      {tab === 'group' && (
        <GroupTab
          groups={groups}
          selectedGroupId={selectedGroupId}
          onSelectGroup={setSelectedGroupId}
          highlightUserId={userId}
        />
      )}

      {tab === 'college' && <CollegeLeaderboard highlightUserId={userId} />}
    </div>
  );
}

function GroupTab({ groups, selectedGroupId, onSelectGroup, highlightUserId }) {
  if (groups === null) return <p className="sub">Loading…</p>;
  if (groups.length === 0) {
    return <p className="sub">Not in any groups yet. Create or join one from the Group menu.</p>;
  }

  return (
    <>
      {groups.length > 1 && (
        <div className="lb-group-switcher">
          {groups.map((m) => {
            const g = m.groups;
            const on = g.id === selectedGroupId;
            return (
              <button
                key={g.id}
                className={on ? 'lb-group-pill lb-group-pill--on' : 'lb-group-pill'}
                onClick={() => onSelectGroup(g.id)}
              >
                {g.name}
              </button>
            );
          })}
        </div>
      )}
      {selectedGroupId && (
        <GroupLeaderboard groupId={selectedGroupId} highlightUserId={highlightUserId} />
      )}
    </>
  );
}
