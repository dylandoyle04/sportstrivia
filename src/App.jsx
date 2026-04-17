import { useState } from 'react';
import TeamPicker from './components/TeamPicker';
import QuizScreen from './components/QuizScreen';
import ScoreScreen from './components/ScoreScreen';
import './App.css';

export default function App() {
  const [screen, setScreen] = useState('picking');
  const [team, setTeam] = useState(null);
  const [result, setResult] = useState({ score: 0, total: 0 });

  function handlePick(picked) {
    setTeam(picked);
    setScreen('quiz');
  }

  function handleQuizDone(score, total) {
    setResult({ score, total });
    setScreen('score');
  }

  function handleReplay() {
    setResult({ score: 0, total: 0 });
    setScreen('quiz');
  }

  function handlePickNew() {
    setTeam(null);
    setResult({ score: 0, total: 0 });
    setScreen('picking');
  }

  return (
    <main className="app">
      {screen === 'picking' && <TeamPicker onPick={handlePick} />}
      {screen === 'quiz' && (
        <QuizScreen team={team} onDone={handleQuizDone} onBack={handlePickNew} />
      )}
      {screen === 'score' && (
        <ScoreScreen
          team={team}
          score={result.score}
          total={result.total}
          onReplay={handleReplay}
          onPickNew={handlePickNew}
        />
      )}
    </main>
  );
}
