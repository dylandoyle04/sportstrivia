import { useEffect, useState } from 'react';
import TeamPicker from './components/TeamPicker';
import QuizScreen from './components/QuizScreen';
import ScoreScreen from './components/ScoreScreen';
import SignIn from './components/SignIn';
import VerifyCode from './components/VerifyCode';
import HomeScreen from './components/HomeScreen';
import OtherModes from './components/OtherModes';
import ComingSoon from './components/ComingSoon';
import DailyTrivia from './components/DailyTrivia';
import GroupHub from './components/GroupHub';
import GroupDetail from './components/GroupDetail';
import CollegeMode from './components/CollegeMode';
import LeagueMode from './components/LeagueMode';
import LeaderboardScreen from './components/LeaderboardScreen';
import { supabase, upsertProfile } from './api/supabase';
import './App.css';

const STUB_TITLES = {
  daily: 'Daily Trivia',
  group: 'Group',
  leaderboard: 'Leaderboard',
  college: 'College Mode',
};

export default function App() {
  const [authStatus, setAuthStatus] = useState('loading');
  const [session, setSession] = useState(null);
  const [pending, setPending] = useState(null);

  const [screen, setScreen] = useState('home');
  const [stubKey, setStubKey] = useState(null);
  const [team, setTeam] = useState(null);
  const [result, setResult] = useState({ score: 0, total: 0 });
  const [groupId, setGroupId] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthStatus(data.session ? 'authed' : 'anon');
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setAuthStatus(s ? 'authed' : 'anon');
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const user = session?.user;
    const name = user?.user_metadata?.display_name;
    if (user && name) {
      upsertProfile({ id: user.id, email: user.email, displayName: name });
    }
  }, [session]);

  function handleHomeSelect(key) {
    if (key === 'other') {
      setScreen('other-modes');
    } else if (key === 'daily') {
      setScreen('daily');
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

  async function handleLogout() {
    await supabase.auth.signOut();
    setPending(null);
    setStubKey(null);
    setTeam(null);
    setResult({ score: 0, total: 0 });
    setScreen('home');
  }

  if (authStatus === 'loading') {
    return <main className="app"><div className="loader">Loading…</div></main>;
  }

  if (authStatus === 'anon') {
    return (
      <main className="app">
        {!pending && <SignIn onCodeSent={setPending} />}
        {pending && (
          <VerifyCode
            email={pending.email}
            onBack={() => setPending(null)}
          />
        )}
      </main>
    );
  }

  const displayName = session?.user?.user_metadata?.display_name ?? session?.user?.email ?? '';

  return (
    <main className="app">
      <header className="app-header">
        {screen !== 'home' && (
          <button className="back-btn" onClick={goHome}>🏠 Home</button>
        )}
        <span className="app-header-name">{displayName}</span>
        <button className="back-btn" onClick={handleLogout}>Log out</button>
      </header>

      {screen === 'home' && <HomeScreen onSelect={handleHomeSelect} />}
      {screen === 'daily' && (
        <DailyTrivia userId={session.user.id} onBack={goHome} />
      )}
      {screen === 'group-hub' && (
        <GroupHub
          userId={session.user.id}
          onSelectGroup={(id) => { setGroupId(id); setScreen('group-detail'); }}
          onBack={goHome}
        />
      )}
      {screen === 'group-detail' && groupId && (
        <GroupDetail
          groupId={groupId}
          userId={session.user.id}
          onBack={() => { setGroupId(null); setScreen('group-hub'); }}
        />
      )}
      {screen === 'college' && (
        <CollegeMode
          userId={session.user.id}
          onBack={() => setScreen('other-modes')}
        />
      )}
      {screen === 'league-mode' && (
        <LeagueMode onBack={() => setScreen('other-modes')} />
      )}
      {screen === 'leaderboard' && (
        <LeaderboardScreen userId={session.user.id} onBack={goHome} />
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
  );
}
