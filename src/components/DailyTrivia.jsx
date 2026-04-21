import { useEffect, useState } from 'react';
import { loadDailyQuiz } from '../questions/loadDailyQuiz';
import { todayDateString } from '../questions/seededRandom';
import { getMyDailyScore, submitDailyScore } from '../api/supabase';
import QuizRunner from './QuizRunner';
import DailyLeaderboard from './DailyLeaderboard';

const TIMER_SECONDS = 10;

export default function DailyTrivia({ userId, onBack }) {
  const quizDate = todayDateString();
  const [phase, setPhase] = useState('loading');
  const [myScore, setMyScore] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getMyDailyScore(userId, quizDate).then(({ data, error: err }) => {
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
      const loaded = await loadDailyQuiz(quizDate);
      if (loaded.questions.length === 0) {
        throw new Error('Could not build today\'s quiz.');
      }
      setQuiz(loaded);
      setPhase('playing');
    } catch (err) {
      setError(err.message);
      setPhase('entry');
    }
  }

  function handleQuizDone(score, total, durationMs) {
    submitDailyScore({ userId, quizDate, score, total, durationMs }).then(({ error: err }) => {
      if (err) setError(err.message);
      setMyScore({ score, total, duration_ms: durationMs });
      setPhase('done');
    });
  }

  if (phase === 'loading' || phase === 'loading-quiz') {
    return (
      <div className="daily">
        <button className="back-btn" onClick={onBack}>← Home</button>
        <div className="loader">{phase === 'loading-quiz' ? 'Building today\'s quiz…' : 'Loading…'}</div>
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
      <h1>Daily Trivia</h1>
      <p className="sub">{quizDate}</p>

      {phase === 'done' && myScore && (
        <div className="daily-result">
          <p className="daily-result-label">You played today</p>
          <p className="daily-result-score">{myScore.score}/{myScore.total ?? 9}</p>
          <p className="daily-result-note">Come back tomorrow for a new quiz.</p>
        </div>
      )}

      {phase === 'entry' && (
        <div className="daily-entry">
          <p className="sub">9 questions · 10 seconds each · one shot</p>
          <button className="btn-primary" onClick={startQuiz}>Play</button>
        </div>
      )}

      {error && <p className="auth-error">{error}</p>}

      <DailyLeaderboard quizDate={quizDate} highlightUserId={userId} />
    </div>
  );
}
