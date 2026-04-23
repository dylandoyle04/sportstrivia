import { useRef, useState } from 'react';
import { useCountdown } from '../hooks/useCountdown';
import { teamLogoUrl, leagueLogoUrl, leagueLogoFallback, leagueSlug } from '../api/logos';
import Timer from './Timer';

function QuestionContext({ question }) {
  const team = question?.player?.team;
  if (!team) return null;
  const leagueSrc = leagueLogoUrl(team.league);
  return (
    <div className="question-context">
      {leagueSrc && (
        <img
          src={leagueSrc}
          alt=""
          className={`ctx-league-logo ctx-league-logo--${leagueSlug(team.league)}`}
          onError={(e) => {
            const fb = leagueLogoFallback(team.league);
            if (fb && e.currentTarget.src !== window.location.origin + fb) {
              e.currentTarget.src = fb;
            }
          }}
        />
      )}
      <img src={teamLogoUrl(team)} alt="" className="ctx-team-logo" />
      <span className="ctx-team-name">{team.name}</span>
    </div>
  );
}

export default function QuizRunner({
  questions,
  timerSeconds,
  timerMode = 'per-question',
  correctBonus = 0,
  wrongPenalty = 0,
  onDone,
}) {
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState(null);
  const [bonusFlash, setBonusFlash] = useState(null);
  const startedAt = useRef(Date.now());
  const scoreRef = useRef(0);
  const indexRef = useRef(0);
  scoreRef.current = score;
  indexRef.current = index;
  const endedRef = useRef(false);

  const isSession = timerMode === 'session';
  const revealMs = isSession ? 900 : 2200;

  const { remaining, addTime } = useCountdown({
    seconds: timerSeconds,
    resetKey: isSession ? 'session' : index,
    active: isSession ? !endedRef.current : selected === null,
    onExpire: () => {
      if (isSession) {
        if (endedRef.current) return;
        endedRef.current = true;
        onDone(scoreRef.current, indexRef.current + (selected !== null ? 1 : 0), timerSeconds * 1000);
      } else if (selected === null) {
        handleAnswer(-1);
      }
    },
  });

  function handleAnswer(choiceIndex) {
    if (selected !== null) return;
    setSelected(choiceIndex);
    const correct = choiceIndex === questions[index].correctIndex;
    const nextScore = correct ? score + 1 : score;
    if (correct) setScore(nextScore);

    if (isSession && (correctBonus || wrongPenalty)) {
      const delta = correct ? correctBonus : -wrongPenalty;
      if (delta) {
        addTime(delta);
        setBonusFlash({ delta, key: Date.now() });
      }
    }

    setTimeout(() => {
      if (endedRef.current) return;
      if (index + 1 >= questions.length) {
        endedRef.current = true;
        onDone(nextScore, questions.length, Date.now() - startedAt.current);
      } else {
        setIndex(index + 1);
        setSelected(null);
      }
    }, revealMs);
  }

  const q = questions[index];

  return (
    <div className="quiz">
      <div className="progress">
        {isSession ? <span /> : <span>Question {index + 1} / {questions.length}</span>}
        <span>Score: {score}</span>
      </div>
      <Timer
        remaining={remaining}
        total={timerSeconds}
        label={isSession ? 'ROUND' : 'TIME'}
      />
      {bonusFlash && (
        <div
          key={bonusFlash.key}
          className={`timer-flash timer-flash--${bonusFlash.delta > 0 ? 'plus' : 'minus'}`}
          onAnimationEnd={() => setBonusFlash(null)}
        >
          {bonusFlash.delta > 0 ? `+${bonusFlash.delta}s` : `${bonusFlash.delta}s`}
        </div>
      )}
      <QuestionContext question={q} />
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
      {selected !== null && (
        <div className="verdict-overlay">
          <h2 className={`verdict-text verdict-${selected === q.correctIndex ? 'correct' : 'wrong'}`}>
            {selected === q.correctIndex ? 'CORRECT' : 'NOPE'}
          </h2>
          {q.player?.photo && (
            <img src={q.player.photo} alt={q.player?.name ?? ''} className="player-photo" />
          )}
          {q.player?.name && <p className="player-reveal-name">{q.player.name}</p>}
          {selected !== q.correctIndex && q.choices[q.correctIndex] !== q.player?.name && (
            <p className="verdict-answer">Answer: {q.choices[q.correctIndex]}</p>
          )}
        </div>
      )}
    </div>
  );
}
