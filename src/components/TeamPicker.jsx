import { useState } from 'react';
import { TEAMS } from '../teams';
import { teamLogoUrl, leagueLogoUrl, leagueLogoFallback } from '../api/logos';

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

function divisionsFor(league) {
  const seen = new Set();
  const order = [];
  for (const t of TEAMS) {
    if (t.league === league && t.division && !seen.has(t.division)) {
      seen.add(t.division);
      order.push(t.division);
    }
  }
  return order;
}

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
              <div className="league-card-text">
                <span className="league-card-name">{l}</span>
                <span className="league-card-count">{LEAGUE_COUNTS[l]} teams</span>
              </div>
              <img
                src={leagueLogoUrl(l)}
                alt=""
                className="league-card-logo"
                onError={(e) => {
                  const fallback = leagueLogoFallback(l);
                  if (fallback && e.currentTarget.src !== window.location.origin + fallback) {
                    e.currentTarget.src = fallback;
                  }
                }}
              />
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

  const isSoccer = league === 'Soccer';
  const heading = isSoccer ? competition : league;
  const handleBack = isSoccer ? () => setCompetition(null) : () => setLeague(null);
  const backLabel = isSoccer ? '← Soccer' : '← Leagues';

  const sections = isSoccer
    ? [{ heading: null, teams: TEAMS.filter((t) => t.competition === competition) }]
    : divisionsFor(league).map((division) => ({
        heading: division,
        teams: TEAMS.filter((t) => t.league === league && t.division === division),
      }));

  return (
    <div className="picker">
      <button className="back-btn" onClick={handleBack}>
        {backLabel}
      </button>
      <h1>{heading}</h1>
      <p className="sub">Pick a team for your quiz.</p>
      {sections.map(({ heading: sectionHeading, teams }) => (
        <section key={sectionHeading ?? 'teams'} className="league-group">
          {sectionHeading && (
            <h2 className="league-heading">
              <span>{sectionHeading}</span>
              <span className="league-count">{teams.length}</span>
            </h2>
          )}
          <div className="team-grid">
            {teams.map((team) => (
              <button
                key={team.name}
                className="team-card"
                onClick={() => onPick(team)}
              >
                <img
                  src={teamLogoUrl(team)}
                  alt=""
                  className="team-card-logo"
                  onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }}
                />
                <span className="team-name">{team.name}</span>
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
