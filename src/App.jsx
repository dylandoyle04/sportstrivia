import { useEffect, useState } from 'react';
import TeamPicker from './components/TeamPicker';
import QuizScreen from './components/QuizScreen';
import ScoreScreen from './components/ScoreScreen';
import NameGate from './components/NameGate';
import HomeScreen from './components/HomeScreen';
import OtherModes from './components/OtherModes';
import ComingSoon from './components/ComingSoon';
import DailyTrivia from './components/DailyTrivia';
import LastNight from './components/LastNight';
import GroupHub from './components/GroupHub';
import GroupDetail from './components/GroupDetail';
import CollegeMode from './components/CollegeMode';
import LeagueMode from './components/LeagueMode';
import LeaderboardScreen from './components/LeaderboardScreen';
import SynthwaveBg from './components/SynthwaveBg';
import { upsertProfile } from './api/supabase';
import { loadIdentity, saveIdentity, clearIdentity } from './lib/identity';
import './App.css';

const STUB_TITLES = {
  daily: 'Daily Trivia',
  group: 'Group',
  leaderboard: 'Leaderboard',
  college: 'College Mode',
};

export default function App() {
  const [identity, setIdentity] = useState(() => loadIdentity());
  const [changingName, setChangingName] = useState(false);

  const [screen, setScreen] = useState('home');
  const [stubKey, setStubKey] = useState(null);
  const [team, setTeam] = useState(null);
  const [result, setResult] = useState({ score: 0, total: 0 });
  const [groupId, setGroupId] = useState(null);

  useEffect(() => {
    if (!identity) return;
    upsertProfile({
      id: identity.id,
      email: `${identity.id}@guest.local`,
      displayName: identity.name,
    }).catch(() => {});
  }, [identity]);

  function handleEnterName(name) {
    const saved = saveIdentity({ name });
    setIdentity(saved);
    setChangingName(false);
  }

  function handleHomeSelect(key) {
    if (key === 'other') {
      setScreen('other-modes');
    } else if (key === 'daily') {
      setScreen('daily');
    } else if (key === 'last-night') {
      setScreen('last-night');
    } else if (key === 'group') {
      setGroupId(null);
      setScreen('group-hub');
    } else if (key === 'leaderboard') {
      setScreen('leaderboard');
    } else {
      setStubKey(key);
      setScreen('coming-soon');
    }
  }

  function handleOtherSelect(key) {
    if (key === 'free-play') {
      setScreen('picking');
    } else if (key === 'college') {
      setScreen('college');
    } else if (key === 'league') {
      setScreen('league-mode');
    } else {
      setStubKey(key);
      setScreen('coming-soon');
    }
  }

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

  function goHome() {
    setStubKey(null);
    setTeam(null);
    setResult({ score: 0, total: 0 });
    setScreen('home');
  }

  function handleChangeName() {
    setChangingName(true);
  }

  function handleClearIdentity() {
    clearIdentity();
    setIdentity(null);
    setChangingName(false);
    setStubKey(null);
    setTeam(null);
    setResult({ score: 0, total: 0 });
    setScreen('home');
  }

  if (!identity || changingName) {
    return (
      <>
        <SynthwaveBg />
        <main className="app">
          <NameGate
            onEnter={handleEnterName}
            initialName={changingName ? identity?.name ?? '' : ''}
          />
        </main>
      </>
    );
  }

  const displayName = identity.name;

  return (
    <>
    <SynthwaveBg />
    <main className="app">
      <header className="app-header">
        {screen !== 'home' && (
          <button className="back-btn" onClick={goHome}>🏠 Home</button>
        )}
        <span className="app-header-title">Do You Know Ball?</span>
        <span className="app-header-name">{displayName}</span>
        <button className="back-btn" onClick={handleChangeName}>Change name</button>
      </header>

      {screen === 'home' && <HomeScreen onSelect={handleHomeSelect} />}
      {screen === 'daily' && (
        <DailyTrivia userId={identity.id} onBack={goHome} />
      )}
      {screen === 'last-night' && (
        <LastNight userId={identity.id} onBack={goHome} />
      )}
      {screen === 'group-hub' && (
        <GroupHub
          userId={identity.id}
          onSelectGroup={(id) => { setGroupId(id); setScreen('group-detail'); }}
          onBack={goHome}
        />
      )}
      {screen === 'group-detail' && groupId && (
        <GroupDetail
          groupId={groupId}
          userId={identity.id}
          onBack={() => { setGroupId(null); setScreen('group-hub'); }}
        />
      )}
      {screen === 'college' && (
        <CollegeMode
          userId={identity.id}
          onBack={() => setScreen('other-modes')}
        />
      )}
      {screen === 'league-mode' && (
        <LeagueMode onBack={() => setScreen('other-modes')} />
      )}
      {screen === 'leaderboard' && (
        <LeaderboardScreen userId={identity.id} onBack={goHome} />
      )}
      {screen === 'other-modes' && (
        <OtherModes onSelect={handleOtherSelect} onBack={goHome} />
      )}
      {screen === 'coming-soon' && (
        <ComingSoon
          title={STUB_TITLES[stubKey] ?? 'Coming Soon'}
          onBack={goHome}
        />
      )}
      {screen === 'picking' && (
        <TeamPicker onPick={handlePick} onBack={() => setScreen('other-modes')} />
      )}
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
    </>
  );
}
