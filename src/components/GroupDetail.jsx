import { useEffect, useState } from 'react';
import { getGroup, getMyGroupScore, submitGroupScore } from '../api/supabase';
import { loadGroupQuiz } from '../questions/loadGroupQuiz';
import { todayDateString } from '../questions/seededRandom';
import QuizRunner from './QuizRunner';
import GroupLeaderboard from './GroupLeaderboard';

const TIMER_SECONDS = 10;

export default function GroupDetail({ groupId, userId, onBack }) {
  const quizDate = todayDateString();
  const [group, setGroup] = useState(null);
  const [phase, setPhase] = useState('loading');
  const [myScore, setMyScore] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      getGroup(groupId),
      getMyGroupScore(userId, groupId, quizDate),
    ]).then(([groupRes, scoreRes]) => {
      if (cancelled) return;
      if (groupRes.error) {
        setError(groupRes.error.message);
        setPhase('entry');
        return;
      }
      setGroup(groupRes.data);
      if (scoreRes.data) {
        setMyScore(scoreRes.data);
        setPhase('done');
      } else {
        setPhase('entry');
      }
    });
    return () => { cancelled = true; };
  }, [groupId, userId, quizDate]);

  async function startQuiz() {
    if (!group) return;
    setPhase('loading-quiz');
    setError(null);
    try {
      const loaded = await loadGroupQuiz({
        groupId: group.id,
        teams: group.team_ids,
        dateStr: quizDate,
      });
      if (loaded.questions.length === 0) {
        throw new Error('Could not build this group\'s quiz.');
      }
      setQuiz(loaded);
      setPhase('playing');
    } catch (err) {
      setError(err.message);
      setPhase('entry');
    }
  }

  function handleQuizDone(score, total, durationMs) {
    submitGroupScore({ userId, groupId, quizDate, score, total, durationMs }).then(({ error: err }) => {
      if (err) setError(err.message);
      setMyScore({ score, total, duration_ms: durationMs });
      setPhase('done');
    });
  }

  if (phase === 'loading' || phase === 'loading-quiz') {
    return (
      <div className="daily">
        <button className="back-btn" onClick={onBack}>← Groups</button>
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
      <button className="back-btn" onClick={onBack}>← Groups</button>
      <h1>{group?.name ?? 'Group'}</h1>
      <p className="sub">
        Invite code: <strong>{group?.invite_code}</strong> · {quizDate}
      </p>

      {phase === 'done' && myScore && (
        <div className="daily-result">
          <p className="daily-result-label">You played today</p>
          <p className="daily-result-score">{myScore.score}/{myScore.total ?? 9}</p>
          <p className="daily-result-note">Come back tomorrow for a new quiz.</p>
        </div>
      )}

      {phase === 'entry' && (
        <div className="daily-entry">
          <p className="sub">9 questions · 10 seconds each · one shot today</p>
          <button className="btn-primary" onClick={startQuiz}>Play</button>
        </div>
      )}

      {error && <p className="auth-error">{error}</p>}

      <GroupLeaderboard groupId={groupId} highlightUserId={userId} />
    </div>
  );
}
