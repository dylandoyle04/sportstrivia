import { useEffect, useState } from 'react';
import { loadLastNightQuiz } from '../questions/loadLastNightQuiz';
import { todayDateString } from '../questions/seededRandom';
import { getMyDailyScore, submitDailyScore } from '../api/supabase';
import QuizRunner from './QuizRunner';
import DailyLeaderboard from './DailyLeaderboard';

const TIMER_SECONDS = 10;
const MODE = 'last_night';

export default function LastNight({ userId, onBack }) {
  const quizDate = todayDateString();
  const [phase, setPhase] = useState('loading');
  const [myScore, setMyScore] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getMyDailyScore(userId, quizDate, MODE).then(({ data, error: err }) => {
      if (cancelled) return;
      if (err) {
        setError(err.message);
        setPhase('entry');
        return;
      }
      if (data) {
        setMyScore(data);
        setPhase('done');
      } else {
        setPhase('entry');
      }
    });
    return () => { cancelled = true; };
  }, [userId, quizDate]);

  async function startQuiz() {
    setPhase('loading-quiz');
    setError(null);
    try {
      const loaded = await loadLastNightQuiz();
      if (loaded.questions.length < 5) {
        throw new Error('Not enough action last night to build a full quiz. Come back tomorrow.');
      }
      setQuiz(loaded);
      setPhase('playing');
    } catch (err) {
      setError(err.message);
      setPhase('entry');
    }
  }

  function handleQuizDone(score, total, durationMs) {
    submitDailyScore({ userId, quizDate, score, total, durationMs, mode: MODE }).then(({ error: err }) => {
      if (err) setError(err.message);
      setMyScore({ score, total, duration_ms: durationMs });
      setPhase('done');
    });
  }

  if (phase === 'loading' || phase === 'loading-quiz') {
    return (
      <div className="daily">
        <button className="back-btn" onClick={onBack}>← Home</button>
        <div className="loader">{phase === 'loading-quiz' ? 'Pulling last night\'s box scores…' : 'Loading…'}</div>
      </div>
    );
  }

  if (phase === 'playing') {
    return (
      <QuizRunner
        questions={quiz.questions}
        timerSeconds={TIMER_SECONDS}
        onDone={handleQuizDone}
      />
    );
  }

  return (
    <div className="daily">
      <button className="back-btn" onClick={onBack}>← Home</button>
      <h1>Last Night</h1>
      <p className="sub">{quizDate}</p>

      {phase === 'done' && myScore && (
        <div className="daily-result">
          <p className="daily-result-label">You played today</p>
          <p className="daily-result-score">{myScore.score}/{myScore.total ?? 10}</p>
          <p className="daily-result-note">Come back tomorrow with fresh box scores.</p>
        </div>
      )}

      {phase === 'entry' && (
        <div className="daily-entry">
          <p className="sub">Questions about last night's NBA, NHL, and MLB games. 10 seconds each. One shot.</p>
          <button className="btn-primary" onClick={startQuiz}>Play</button>
        </div>
      )}

      {error && <p className="auth-error">{error}</p>}

      <DailyLeaderboard quizDate={quizDate} highlightUserId={userId} mode={MODE} />
    </div>
  );
}
