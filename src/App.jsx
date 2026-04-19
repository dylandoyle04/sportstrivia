import { useEffect, useState } from 'react';
import TeamPicker from './components/TeamPicker';
import QuizScreen from './components/QuizScreen';
import ScoreScreen from './components/ScoreScreen';
import SignIn from './components/SignIn';
import VerifyCode from './components/VerifyCode';
import { supabase, upsertProfile } from './api/supabase';
import './App.css';

export default function App() {
  const [authStatus, setAuthStatus] = useState('loading');
  const [session, setSession] = useState(null);
  const [pending, setPending] = useState(null);

  const [screen, setScreen] = useState('picking');
  const [team, setTeam] = useState(null);
  const [result, setResult] = useState({ score: 0, total: 0 });

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

  async function handleLogout() {
    await supabase.auth.signOut();
    setPending(null);
    setScreen('picking');
    setTeam(null);
    setResult({ score: 0, total: 0 });
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
        <span className="app-header-name">{displayName}</span>
        <button className="back-btn" onClick={handleLogout}>Log out</button>
      </header>

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
