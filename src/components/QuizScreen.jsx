import { useEffect, useState } from 'react';
import { loadQuiz } from '../questions/loadQuiz';

export default function QuizScreen({ team, onDone, onBack }) {
  const [status, setStatus] = useState('loading');
  const [questions, setQuestions] = useState([]);
  const [error, setError] = useState(null);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    loadQuiz(team)
      .then(({ questions }) => {
        if (cancelled) return;
        if (questions.length === 0) {
          setError('Not enough data to build a quiz for this team.');
          setStatus('error');
          return;
        }
        setQuestions(questions);
        setStatus('ready');
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message);
        setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [team]);

  function handleAnswer(choiceIndex) {
    if (selected !== null) return;
    setSelected(choiceIndex);
    const correct = choiceIndex === questions[index].correctIndex;
    const nextScore = correct ? score + 1 : score;
    if (correct) setScore(nextScore);
    setTimeout(() => {
      if (index + 1 >= questions.length) {
        onDone(nextScore, questions.length);
      } else {
        setIndex(index + 1);
        setSelected(null);
      }
    }, 900);
  }

  if (status === 'loading') {
    return (
      <div className="loader">
        <p>Loading {team.name} trivia…</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="placeholder">
        <p>⚠️ {error}</p>
        <button onClick={onBack}>Back to team picker</button>
      </div>
    );
  }

  const q = questions[index];

  return (
    <div className="quiz">
      <div className="progress">
        <span>Question {index + 1} / {questions.length}</span>
        <span>Score: {score}</span>
      </div>
      <h2 className="prompt">{q.prompt}</h2>
      <div className="choices">
        {q.choices.map((choice, i) => {
          let cls = 'choice';
          if (selected !== null) {
            if (i === q.correctIndex) cls += ' correct';
            else if (i === selected) cls += ' wrong';
          }
          return (
            <button
              key={i}
              className={cls}
              onClick={() => handleAnswer(i)}
              disabled={selected !== null}
            >
              {choice}
            </button>
          );
        })}
      </div>
    </div>
  );
}
