import { TEAMS } from '../teams';
import { teamLogoUrl } from '../api/logos';

const LEAGUES = [...new Set(TEAMS.map((t) => t.league))];

function teamKey(t) {
  return `${t.league}|${t.competition ?? ''}|${t.id}`;
}

export default function TeamMultiPicker({ selected, onChange }) {
  const selectedKeys = new Set(selected.map(teamKey));

  function toggle(team) {
    const k = teamKey(team);
    if (selectedKeys.has(k)) {
      onChange(selected.filter((t) => teamKey(t) !== k));
    } else {
      onChange([...selected, team]);
    }
  }

  return (
    <div className="multi-picker">
      <p className="multi-picker-count">{selected.length} selected (minimum 2)</p>
      {LEAGUES.map((league) => (
        <section key={league} className="multi-picker-section">
          <h3 className="multi-picker-league">{league}</h3>
          <div className="multi-picker-grid">
            {TEAMS.filter((t) => t.league === league).map((team) => {
              const k = teamKey(team);
              const on = selectedKeys.has(k);
              return (
                <button
                  key={k}
                  type="button"
                  className={on ? 'mp-team mp-team--on' : 'mp-team'}
                  onClick={() => toggle(team)}
                >
                  <img src={teamLogoUrl(team)} alt="" className="mp-team-logo" />
                  <span className="mp-team-name">{team.name}</span>
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
