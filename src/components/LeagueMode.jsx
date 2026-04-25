import { useState } from 'react';
import { loadLeagueQuiz } from '../questions/loadLeagueQuiz';
import { TEAMS } from '../teams';
import { leagueLogoUrl, leagueLogoFallback, leagueSlug } from '../api/logos';
import QuizRunner from './QuizRunner';

const LEAGUES = ['NFL', 'NBA', 'MLB', 'NHL', 'Soccer'];
const SOCCER_COMPETITIONS = [...new Set(
  TEAMS.filter((t) => t.league === 'Soccer').map((t) => t.competition),
)];

export default function LeagueMode({ onBack }) {
  const [league, setLeague] = useState(null);
  const [competition, setCompetition] = useState(null);
  const [phase, setPhase] = useState('picking');
  const [quiz, setQuiz] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  function reset() {
    setLeague(null);
    setCompetition(null);
    setQuiz(null);
    setResult(null);
    setError(null);
    setPhase('picking');
  }

  async function startQuiz(l, c) {
    setPhase('loading-quiz');
    setError(null);
    try {
      const loaded = await loadLeagueQuiz({ league: l, competition: c });
      if (loaded.questions.length === 0) throw new Error('No questions could be built for this league.');
      setQuiz(loaded);
      setPhase('playing');
    } catch (err) {
      setError(err.message);
      setPhase('picking');
    }
  }

  function handleLeaguePick(l) {
    setLeague(l);
    if (l === 'Soccer') {
      setPhase('picking-competition');
    } else {
      startQuiz(l, null);
    }
  }

  function handleCompetitionPick(c) {
    setCompetition(c);
    startQuiz('Soccer', c);
  }

  function handleDone(score, total) {
    setResult({ score, total });
    setPhase('done');
  }

  if (phase === 'loading-quiz') {
    return (
      <div className="daily">
        <button className="back-btn" onClick={onBack}>← Other Modes</button>
        <div className="loader">Building your quiz…</div>
      </div>
    );
  }

  if (phase === 'playing') {
    return (
      <QuizRunner
        questions={quiz.questions}
        onDone={handleDone}
      />
    );
  }

  if (phase === 'done' && result) {
    const label = league === 'Soccer' ? competition : league;
    return (
      <div className="daily">
        <button className="back-btn" onClick={onBack}>← Other Modes</button>
        <h1>{label} Trivia</h1>
        <div className="daily-result">
          <p className="daily-result-label">You scored</p>
          <p className="daily-result-score">{result.score}/{result.total}</p>
        </div>
        <div className="daily-entry">
          <button className="btn-primary" onClick={() => startQuiz(league, competition)}>
            Play another round
          </button>
          <button className="btn-secondary" onClick={reset}>
            Pick different league
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'picking-competition') {
    return (
      <div className="home">
        <button className="back-btn" onClick={reset}>← Leagues</button>
        <h1>Soccer</h1>
        <p className="sub">Pick a competition.</p>
        <div className="league-grid">
          {SOCCER_COMPETITIONS.map((c) => (
            <button key={c} className="league-card" onClick={() => handleCompetitionPick(c)}>
              <div className="league-card-text">
                <span className="league-card-name">{c}</span>
                <span className="league-card-count">10 questions</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="home">
      <button className="back-btn" onClick={onBack}>← Other Modes</button>
      <h1>League Trivia</h1>
      <p className="sub">Pick a league. 10 questions. Unlimited attempts.</p>
      {error && <p className="auth-error">{error}</p>}
      <div className="league-grid">
        {LEAGUES.map((l) => (
          <button key={l} className="league-card" onClick={() => handleLeaguePick(l)}>
            <div className="league-card-text">
              <span className="league-card-name">{l}</span>
              <span className="league-card-count">
                {l === 'Soccer' ? 'choose competition' : '10 questions'}
              </span>
            </div>
            <img
              src={leagueLogoUrl(l)}
              alt=""
              className={`league-card-logo league-card-logo--${leagueSlug(l)}`}
              onError={(e) => {
                const fb = leagueLogoFallback(l);
                if (fb && e.currentTarget.src !== window.location.origin + fb) {
                  e.currentTarget.src = fb;
                }
              }}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
