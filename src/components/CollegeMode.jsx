import { useState } from 'react';
import { loadCollegeQuiz } from '../questions/loadCollegeQuiz';
import { submitCollegeScore } from '../api/supabase';
import { leagueLogoUrl, leagueLogoFallback, leagueSlug } from '../api/logos';
import QuizRunner from './QuizRunner';
import CollegeLeaderboard from './CollegeLeaderboard';

const TIMER_SECONDS = 60;
const LEAGUES = ['NFL', 'NBA', 'MLB', 'NHL'];

export default function CollegeMode({ userId, onBack }) {
  const [phase, setPhase] = useState('entry');
  const [league, setLeague] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [lastScore, setLastScore] = useState(null);
  const [error, setError] = useState(null);

  async function startPlay(chosenLeague) {
    setPhase('loading-quiz');
    setLeague(chosenLeague);
    setError(null);
    try {
      const loaded = await loadCollegeQuiz(chosenLeague);
      if (loaded.questions.length < 4) {
        throw new Error('Not enough college questions for this league right now.');
      }
      setQuiz(loaded);
      setPhase('playing');
    } catch (err) {
      setError(err.message);
      setPhase('entry');
    }
  }

  function handleDone(score, attempted, durationMs) {
    setLastScore({ score, attempted, league });
    submitCollegeScore({ userId, league, score, attempted, durationMs }).then(({ error: err }) => {
      if (err) setError(err.message);
    });
    setPhase('done');
  }

  if (phase === 'loading-quiz') {
    return (
      <div className="daily">
        <button className="back-btn" onClick={onBack}>← Other Modes</button>
        <div className="loader">Building your round…</div>
      </div>
    );
  }

  if (phase === 'playing') {
    return (
      <QuizRunner
        questions={quiz.questions}
        timerSeconds={TIMER_SECONDS}
        timerMode="session"
        onDone={handleDone}
      />
    );
  }

  return (
    <div className="daily">
      <button className="back-btn" onClick={onBack}>← Other Modes</button>
      <h1>College Mode</h1>
      <p className="sub">
        60 seconds. Most colleges guessed right wins. Unlimited attempts.
      </p>

      {phase === 'done' && lastScore && (
        <div className="daily-result">
          <p className="daily-result-label">{lastScore.league} · You scored</p>
          <p className="daily-result-score">{lastScore.score}</p>
          <p className="daily-result-note">{lastScore.attempted} questions answered</p>
        </div>
      )}

      <section className="league-group">
        <h2 className="league-heading"><span>Pick a league</span></h2>
        <div className="league-grid">
          {LEAGUES.map((l) => (
            <button
              key={l}
              className="league-card"
              onClick={() => startPlay(l)}
            >
              <div className="league-card-text">
                <span className="league-card-name">{l}</span>
                <span className="league-card-count">60s round</span>
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
      </section>

      {error && <p className="auth-error">{error}</p>}

      <CollegeLeaderboard highlightUserId={userId} />
    </div>
  );
}
