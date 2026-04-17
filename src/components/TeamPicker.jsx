import { useState } from 'react';
import { TEAMS } from '../teams';

const LEAGUES = [...new Set(TEAMS.map((t) => t.league))];
const LEAGUE_COUNTS = Object.fromEntries(
  LEAGUES.map((l) => [l, TEAMS.filter((t) => t.league === l).length]),
);

const SOCCER_COMPETITIONS = [...new Set(
  TEAMS.filter((t) => t.league === 'Soccer').map((t) => t.competition),
)];
const COMPETITION_COUNTS = Object.fromEntries(
  SOCCER_COMPETITIONS.map((c) => [c, TEAMS.filter((t) => t.competition === c).length]),
);

export default function TeamPicker({ onPick }) {
  const [league, setLeague] = useState(null);
  const [competition, setCompetition] = useState(null);

  if (!league) {
    return (
      <div className="picker">
        <h1>Pick a league</h1>
        <p className="sub">Then pick a team to start the quiz.</p>
        <div className="league-grid">
          {LEAGUES.map((l) => (
            <button
              key={l}
              className="league-card"
              onClick={() => setLeague(l)}
            >
              <span className="league-card-name">{l}</span>
              <span className="league-card-count">{LEAGUE_COUNTS[l]} teams</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (league === 'Soccer' && !competition) {
    return (
      <div className="picker">
        <button className="back-btn" onClick={() => setLeague(null)}>
          ← Leagues
        </button>
        <h1>Soccer</h1>
        <p className="sub">Pick a competition.</p>
        <div className="league-grid">
          {SOCCER_COMPETITIONS.map((c) => (
            <button
              key={c}
              className="league-card"
              onClick={() => setCompetition(c)}
            >
              <span className="league-card-name">{c}</span>
              <span className="league-card-count">{COMPETITION_COUNTS[c]} teams</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const teams = league === 'Soccer'
    ? TEAMS.filter((t) => t.competition === competition)
    : TEAMS.filter((t) => t.league === league);

  const heading = league === 'Soccer' ? competition : league;
  const handleBack = league === 'Soccer'
    ? () => setCompetition(null)
    : () => setLeague(null);
  const backLabel = league === 'Soccer' ? '← Soccer' : '← Leagues';

  return (
    <div className="picker">
      <button className="back-btn" onClick={handleBack}>
        {backLabel}
      </button>
      <h1>{heading}</h1>
      <p className="sub">Pick a team for your quiz.</p>
      <div className="team-grid">
        {teams.map((team) => (
          <button
            key={team.name}
            className="team-card"
            onClick={() => onPick(team)}
          >
            <span className="team-name">{team.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
