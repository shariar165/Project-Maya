// Onboarding intro + main App

// ── session helpers ───────────────────────────────────────────────────
function loadSession() {
  try {
    const raw = localStorage.getItem('maya_session');
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (new Date(s.expiresAt) < new Date()) { localStorage.removeItem('maya_session'); return null; }
    return s;
  } catch { return null; }
}

function loadUser() {
  try {
    const raw = localStorage.getItem('maya_user');
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

// ── Onboarding (shown to authenticated users on first visit) ──────────
function Onboarding({ onDone, state, setState }) {
  const [step, setStep] = React.useState(0);
  const lang = state.lang || 'mixed';
  const L = (key, type) => window.tStr(key, lang, type);
  const steps = [
    {
      mood: 'happy',
      title: L('ob1Title', 'tara'),
      sub:   L('ob1Sub',   'tara'),
      action: L('ob1Action'),
    },
    {
      mood: 'idle',
      title: L('ob2Title', 'tara'),
      sub:   L('ob2Sub',   'tara'),
      action: L('ob2Action'),
    },
    {
      mood: 'listening',
      title: L('ob3Title', 'tara'),
      sub:   L('ob3Sub',   'tara'),
      action: L('ob3Action'),
    },
  ];
  const s = steps[step];
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 50,
      background: 'linear-gradient(180deg, #FFEFE2 0%, #F4D7E5 60%, #E0D5F0 100%)',
      display: 'flex', flexDirection: 'column', padding: '60px 28px 28px',
    }}>
      <Grain/>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', position: 'relative' }}>
        <Tara size={260} mood={s.mood}/>
        <div style={{ fontFamily: 'var(--display)', fontSize: 32, color: '#2A1A36', marginTop: 30, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
          {s.title}
        </div>
        <div style={{ fontSize: 15, color: '#5A3E5F', marginTop: 16, lineHeight: 1.5, maxWidth: 300 }}>
          {s.sub}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 18 }}>
        {steps.map((_, i) => (
          <div key={i} style={{
            width: i === step ? 24 : 8, height: 8, borderRadius: 99,
            background: i === step ? '#3D2840' : 'rgba(61,40,64,0.2)',
            transition: 'all 300ms',
          }}/>
        ))}
      </div>
      <button onClick={() => step < steps.length - 1 ? setStep(step + 1) : onDone()} style={{
        padding: '16px 24px', borderRadius: 99, border: 'none',
        background: '#3D2840', color: '#FFF1E4',
        fontSize: 15, fontWeight: 600, letterSpacing: '-0.01em', cursor: 'pointer',
        boxShadow: '0 14px 30px -10px rgba(61,40,64,0.5)',
      }}>
        {s.action}
      </button>
      <button onClick={onDone} style={{
        marginTop: 8, padding: 8, background: 'transparent', border: 'none',
        color: '#5A3E5F', fontSize: 12, cursor: 'pointer',
      }}>
        {L('skipIntro')}
      </button>
    </div>
  );
}

function BottomNav({ screen, setScreen, lang }) {
  const L = (key, type) => window.tStr(key, lang || 'mixed', type);
  const items = [
    { k: 'home',    label: L('nav_home'),    icon: 'home' },
    { k: 'journey', label: L('nav_journey'), icon: 'journey' },
    { k: 'chat',    label: 'Tara',           icon: 'tara' },
    { k: 'wellness',label: L('nav_heart'),   icon: 'heart' },
    { k: 'care',    label: L('nav_care'),    icon: 'care' },
  ];
  const ICONS = {
    home:    (a) => <><path d="M3 11l9-8 9 8v10a2 2 0 0 1-2 2h-4v-7h-6v7H5a2 2 0 0 1-2-2z" {...a}/></>,
    journey: (a) => <><circle cx="12" cy="12" r="3" {...a}/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2" {...a}/></>,
    heart:   (a) => <><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" {...a}/></>,
    care:    (a) => <><path d="M9 11l-2 2 4 4 8-8M3 12a9 9 0 1 1 18 0 9 9 0 0 1-18 0z" {...a}/></>,
  };

  return (
    <>
    {/* fade behind the nav so scrolling content doesn't bleed under */}
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0, height: 140,
      pointerEvents: 'none', zIndex: 19,
      background: 'linear-gradient(180deg, rgba(255,246,238,0) 0%, rgba(255,246,238,0.7) 45%, rgba(255,246,238,0.95) 75%)',
    }}/>
    <div style={{
      position: 'absolute', bottom: 28, left: 12, right: 12,
      zIndex: 20,
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-around', alignItems: 'center',
        background: 'rgba(255,255,255,0.85)', borderRadius: 28,
        padding: '8px 6px',
        boxShadow: '0 16px 40px -20px rgba(61,40,64,0.25), 0 1px 0 rgba(255,255,255,0.9) inset',
        border: '1px solid rgba(255,255,255,0.6)',
      }}>
        {items.map(it => {
          const active = screen === it.k || (it.k === 'chat' && screen === 'voice');
          if (it.k === 'chat') {
            return (
              <button key={it.k} onClick={() => setScreen('chat')} style={{
                position: 'relative', marginTop: -20,
                width: 52, height: 52, borderRadius: 99,
                background: 'linear-gradient(135deg, #F08A6E, #F4B4C8)',
                border: '3px solid #FFFCF7',
                display: 'grid', placeItems: 'center', cursor: 'pointer',
                boxShadow: '0 10px 26px -8px rgba(240,138,110,0.6)',
              }}>
                <Tara size={50} mood="happy"/>
              </button>
            );
          }
          return (
            <button key={it.k} onClick={() => setScreen(it.k)} style={{
              padding: '6px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: active ? '#3D2840' : '#9A8595',
              fontSize: 10, fontWeight: 600,
              minWidth: 50,
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.6} strokeLinecap="round" strokeLinejoin="round">
                {ICONS[it.icon]({ })}
              </svg>
              <span>{it.label}</span>
            </button>
          );
        })}
      </div>
    </div>
    </>
  );
}

function App() {
  const [showSplash, setShowSplash] = React.useState(true);
  const [showIntro, setShowIntro] = React.useState(true);
  const [screen, setScreen] = React.useState('home');

  // auth state: 'loading' | 'unauthenticated' | 'authenticated' | 'guest'
  const [authStatus, setAuthStatus] = React.useState('loading');
  // auth sub-flow: null | 'otp' | 'register'
  const [authFlow, setAuthFlow] = React.useState(null);
  const [pendingPhone, setPendingPhone] = React.useState('');
  const [pendingId, setPendingId] = React.useState('');

  // tweakable
  const tweakDefaults = /*EDITMODE-BEGIN*/{
    "theme": "dawn",
    "week": 20,
    "mothersName": "Maya",
    "taraMood": "idle",
    "lang": "mixed"
  }/*EDITMODE-END*/;
  const [t, setTweak] = window.useTweaks(tweakDefaults);

  const [state, setState] = React.useState({
    week: t.week, name: t.mothersName, lang: t.lang, mood: t.taraMood,
    checks: { water: true, iron: false, walk: false, kicks: false },
  });

  // On mount: check for existing session
  React.useEffect(() => {
    const session = loadSession();
    if (!session) { setAuthStatus('unauthenticated'); return; }
    if (session.isGuest) { setAuthStatus('guest'); return; }
    const user = loadUser();
    if (!user) { setAuthStatus('unauthenticated'); return; }
    setAuthStatus('authenticated');
    setState(s => ({
      ...s,
      name: user.name,
      week: user.pregnancyWeek,
      lang: user.lang,
    }));
    setTweak('mothersName', user.name);
    setTweak('week', user.pregnancyWeek);
    setTweak('lang', user.lang);
  }, []);

  React.useEffect(() => {
    setState(s => ({ ...s, week: t.week, name: t.mothersName, lang: t.lang, mood: t.taraMood }));
  }, [t.week, t.mothersName, t.lang, t.taraMood]);

  const handleLogout = () => {
    localStorage.removeItem('maya_session');
    localStorage.removeItem('maya_user');
    localStorage.removeItem('maya_prefs');
    setAuthStatus('unauthenticated');
    setAuthFlow(null);
    setShowSplash(true);
    setShowIntro(true);
    setScreen('home');
  };

  const openScreen = (s) => setScreen(s);

  const Screen = {
    home: HomeScreen,
    journey: JourneyScreen,
    chat: ChatScreen,
    voice: VoiceScreen,
    wellness: WellnessScreen,
    care: CareScreen,
    profile: window.ProfileScreen,
    settings: window.SettingsScreen,
    risk: window.RiskScreen,
  }[screen];

  const isVoice = screen === 'voice';
  const isChat = screen === 'chat';
  const showHeader = ['home', 'journey', 'wellness', 'care'].includes(screen);
  const isSubPage = ['profile', 'settings', 'risk'].includes(screen);

  // auth event handlers
  const handleOtpRequest = (phone) => { setPendingPhone(phone); setAuthFlow('otp'); };
  const handleOtpVerified = ({ isNew, user, id, phone }) => {
    if (!isNew) {
      setState(s => ({ ...s, name: user.name, week: user.pregnancyWeek, lang: user.lang }));
      setTweak('mothersName', user.name);
      setTweak('week', user.pregnancyWeek);
      setTweak('lang', user.lang);
      setAuthStatus('authenticated');
      setAuthFlow(null);
    } else {
      setPendingId(id);
      setPendingPhone(phone || pendingPhone);
      setAuthFlow('register');
    }
  };
  const handleRegistered = (user) => {
    setState(s => ({ ...s, name: user.name, week: user.pregnancyWeek, lang: user.lang }));
    setTweak('mothersName', user.name);
    setTweak('week', user.pregnancyWeek);
    setTweak('lang', user.lang);
    setAuthStatus('authenticated');
    setAuthFlow(null);
  };
  const handleGuest = () => { setAuthStatus('guest'); };

  if (authStatus === 'loading') return null;

  return (
    <div style={{
      position: 'relative', width: '100%', height: '100%', overflow: 'hidden',
      fontFamily: 'var(--ui)',
      color: '#2A1A36',
    }}>
      {!isVoice && <MeshBg variant={t.theme}/>}
      {!isVoice && <Grain/>}

      {/* dark-status-bar overlay for voice mode */}
      {isVoice && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 30, pointerEvents: 'none' }}>
          <window.IOSStatusBar dark={true}/>
        </div>
      )}

      {/* scrollable content area, leaves room for bottom nav + status bar */}
      <div style={{
        position: 'absolute', inset: 0,
        overflow: isChat || isVoice ? 'hidden' : 'auto',
        paddingTop: isVoice ? 0 : (isSubPage ? 54 : showHeader ? 50 : 54),
        paddingBottom: isVoice ? 0 : (isChat ? 110 : (isSubPage ? 40 : 130)),
        WebkitOverflowScrolling: 'touch',
      }} data-screen-label={`Maya · ${screen}`}>
        {showHeader && <window.AppHeader t={t} onSettings={() => setScreen('settings')} onProfile={() => setScreen('profile')}/>}
        <Screen state={state} setState={setState} openScreen={openScreen} tweak={t} setTweak={setTweak} onLogout={handleLogout}/>
      </div>

      {!isVoice && !isSubPage && <BottomNav screen={screen} setScreen={setScreen} lang={t.lang}/>}

      {showIntro && !showSplash && (authStatus === 'authenticated' || authStatus === 'guest') &&
        <Onboarding onDone={() => setShowIntro(false)} state={state} setState={setState}/>}
      {showSplash && <window.SplashScreen onDone={() => setShowSplash(false)}/>}

      {/* auth overlay — shown after splash, when unauthenticated */}
      {!showSplash && authStatus === 'unauthenticated' && authFlow === null &&
        <window.AuthScreen onOtp={handleOtpRequest} onGuest={handleGuest}/>}
      {!showSplash && authStatus === 'unauthenticated' && authFlow === 'otp' &&
        <window.OTPScreen phone={pendingPhone} onVerified={handleOtpVerified} onBack={() => setAuthFlow(null)}/>}
      {!showSplash && authFlow === 'register' &&
        <window.RegisterScreen userId={pendingId} phone={pendingPhone} onDone={handleRegistered}/>}

      {/* Tweaks */}
      <window.TweaksPanel title="Tweaks">
        <window.TweakSection label="Mother">
          <window.TweakText label="Name" value={t.mothersName} onChange={v => setTweak('mothersName', v)}/>
          <window.TweakSlider label="Pregnancy week" value={t.week} min={4} max={40} step={1} onChange={v => setTweak('week', v)}/>
        </window.TweakSection>
        <window.TweakSection label="Atmosphere">
          <window.TweakRadio label="Theme" value={t.theme} options={[
            { value: 'dawn', label: 'Dawn' },
            { value: 'dusk', label: 'Dusk' },
            { value: 'night',label: 'Night' },
          ]} onChange={v => setTweak('theme', v)}/>
          <window.TweakSelect label="Tara's mood" value={t.taraMood} options={[
            { value: 'idle', label: 'Calm idle' },
            { value: 'happy', label: 'Happy' },
            { value: 'celebrate', label: 'Celebrating' },
            { value: 'listening', label: 'Listening' },
            { value: 'sleepy', label: 'Sleepy' },
            { value: 'worried', label: 'Worried' },
          ]} onChange={v => setTweak('taraMood', v)}/>
        </window.TweakSection>
        <window.TweakSection label="Jump to">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {[['home','Home'],['journey','Journey'],['chat','Chat'],['voice','Voice'],['wellness','Wellness'],['care','Care']].map(([k, l]) => (
              <button key={k} onClick={() => setScreen(k)} style={{
                padding: '8px 10px', borderRadius: 10,
                background: screen === k ? '#3D2840' : 'rgba(61,40,64,0.06)',
                color: screen === k ? '#FFF1E4' : '#3D2840',
                border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
              }}>{l}</button>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginTop: 6 }}>
            {[['profile','Profile'],['settings','Settings'],['risk','Risk']].map(([k, l]) => (
              <button key={k} onClick={() => setScreen(k)} style={{
                padding: '8px 10px', borderRadius: 10,
                background: screen === k ? '#3D2840' : 'rgba(61,40,64,0.06)',
                color: screen === k ? '#FFF1E4' : '#3D2840',
                border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
              }}>{l}</button>
            ))}
          </div>
          <button onClick={() => { setShowSplash(true); }} style={{
            marginTop: 8, width: '100%', padding: '8px 10px', borderRadius: 10,
            background: 'rgba(61,40,64,0.06)', color: '#3D2840',
            border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
          }}>Replay splash</button>
          <button onClick={() => setShowIntro(true)} style={{
            marginTop: 6, width: '100%', padding: '8px 10px', borderRadius: 10,
            background: 'rgba(61,40,64,0.06)', color: '#3D2840',
            border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
          }}>Replay onboarding</button>
          <button onClick={handleLogout} style={{
            marginTop: 6, width: '100%', padding: '8px 10px', borderRadius: 10,
            background: 'rgba(192,57,43,0.1)', color: '#C0392B',
            border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
          }}>Sign out (test)</button>
        </window.TweakSection>
      </window.TweaksPanel>
    </div>
  );
}

window.MayaApp = App;
