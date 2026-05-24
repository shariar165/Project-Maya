// Splash + Logo + Profile + Settings + Risk Analyser

// ──────────────────────────────────────────────────────────────────
// LOGO — Maya wordmark with tiny penguin glyph
// ──────────────────────────────────────────────────────────────────
function MayaLogo({ size = 22, color = '#2A1A36', dark = false }) {
  const fg = dark ? '#FFF1E4' : color;
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
      <MayaGlyph size={size * 1.3}/>
      <span style={{
        fontFamily: 'var(--display)', fontSize: size, color: fg,
        letterSpacing: '-0.02em', lineHeight: 1,
      }}>maya<span style={{ color: '#F08A6E' }}>.</span></span>
    </div>
  );
}

function MayaGlyph({ size = 32 }) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size}>
      <defs>
        <radialGradient id="lg" cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#3A2A36"/>
          <stop offset="100%" stopColor="#1A1118"/>
        </radialGradient>
      </defs>
      {/* halo */}
      <circle cx="20" cy="20" r="18" fill="#FBD7C6" opacity="0.55"/>
      {/* penguin egg */}
      <ellipse cx="20" cy="22" rx="13" ry="14" fill="url(#lg)"/>
      {/* belly */}
      <ellipse cx="20" cy="24" rx="7" ry="8" fill="#FFF6E8"/>
      {/* beak */}
      <path d="M 16 14 Q 20 11 24 14 Q 20 17 16 14 Z" fill="#F5B042"/>
      {/* eyes */}
      <circle cx="16" cy="22" r="1.6" fill="#1A0F18"/>
      <circle cx="24" cy="22" r="1.6" fill="#1A0F18"/>
      <circle cx="16.4" cy="21.5" r="0.6" fill="#fff"/>
      <circle cx="24.4" cy="21.5" r="0.6" fill="#fff"/>
      {/* cheek */}
      <circle cx="13" cy="25" r="1.4" fill="#F49AAE" opacity="0.7"/>
      <circle cx="27" cy="25" r="1.4" fill="#F49AAE" opacity="0.7"/>
    </svg>
  );
}

// ──────────────────────────────────────────────────────────────────
// SPLASH
// ──────────────────────────────────────────────────────────────────
function SplashScreen({ onDone }) {
  React.useEffect(() => {
    const t = setTimeout(onDone, 2600);
    return () => clearTimeout(t);
  }, []);
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 100,
      background: 'radial-gradient(60% 50% at 50% 40%, #2B2228 0%, #1A1418 60%, #110D11 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden',
    }}>
      <Grain/>
      <div style={{
        animation: 'splashIn 1100ms cubic-bezier(0.2, 0.7, 0.2, 1) both',
        textAlign: 'center', position: 'relative',
      }}>
        <div style={{ marginBottom: 14 }}>
          <Tara size={120} mood="happy"/>
        </div>
        <div style={{
          fontFamily: 'var(--display)',
          fontSize: 96, lineHeight: 1, letterSpacing: '-0.04em',
          color: '#FFF1E4',
          fontStyle: 'italic',
        }}>maya</div>
        <div style={{
          marginTop: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          animation: 'splashSub 1400ms ease 600ms both',
        }}>
          <span style={{ width: 28, height: 1, background: 'rgba(255,241,228,0.3)' }}/>
          <span style={{
            fontFamily: 'var(--ui)', fontSize: 11, letterSpacing: '0.32em',
            color: 'rgba(255,241,228,0.65)', textTransform: 'uppercase', fontWeight: 600,
          }}>created by AiVion</span>
          <span style={{ width: 28, height: 1, background: 'rgba(255,241,228,0.3)' }}/>
        </div>
      </div>

      <div style={{
        position: 'absolute', bottom: 50, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
        animation: 'splashSub 1400ms ease 1000ms both',
      }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {[0,1,2].map(i => (
            <div key={i} style={{
              width: 5, height: 5, borderRadius: 99, background: 'rgba(255,241,228,0.7)',
              animation: `splashDot 1.2s ease-in-out ${i * 0.15}s infinite`,
            }}/>
          ))}
        </div>
        <div style={{ fontSize: 10, color: 'rgba(255,241,228,0.4)', letterSpacing: '0.2em' }}>
          PREPARING YOUR JOURNEY
        </div>
      </div>

      <style>{`
        @keyframes splashIn { from { opacity: 0; transform: translateY(20px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes splashSub { from { opacity: 0 } to { opacity: 1 } }
        @keyframes splashDot { 0%, 100% { opacity: 0.3; transform: translateY(0) } 50% { opacity: 1; transform: translateY(-3px) } }
      `}</style>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────
// HEADER bar with logo + settings (used on home & journey)
// ──────────────────────────────────────────────────────────────────
function AppHeader({ onSettings, onProfile, t }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 22px 8px',
    }}>
      <MayaLogo size={22}/>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={onSettings} aria-label="Settings" style={{
          width: 38, height: 38, borderRadius: 99, border: 'none',
          background: 'rgba(255,255,255,0.7)', cursor: 'pointer',
          display: 'grid', placeItems: 'center', backdropFilter: 'blur(8px)',
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3D2840" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        </button>
        <button onClick={onProfile} aria-label="Profile" style={{
          width: 38, height: 38, borderRadius: 99, border: '2px solid rgba(255,255,255,0.9)',
          background: 'linear-gradient(135deg, #F4B4C8, #E0D5F0)', cursor: 'pointer',
          display: 'grid', placeItems: 'center', overflow: 'hidden',
          color: '#3D2840', fontWeight: 700, fontSize: 14,
        }}>
          {(t.mothersName || 'M').slice(0, 1).toUpperCase()}
        </button>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────
// PROFILE
// ──────────────────────────────────────────────────────────────────
function ProfileScreen({ state, setState, openScreen, tweak, setTweak, onLogout }) {
  const { primaryBtn, ghostBtn, iconBtn } = window.uiBtns;

  // load persisted user data; fall back to tweak values for prototype compatibility
  const storedUser = React.useMemo(() => {
    try { return JSON.parse(localStorage.getItem('maya_user') || 'null'); } catch { return null; }
  }, []);

  const displayName = storedUser ? storedUser.name : (tweak.mothersName || 'Maya');
  const displayWeek = storedUser ? storedUser.pregnancyWeek : state.week;
  const displayLang = storedUser ? storedUser.lang : tweak.lang;
  const displayAge  = storedUser && storedUser.age      ? storedUser.age      : '—';
  const displayCity = storedUser && storedUser.city     ? storedUser.city     : '—';
  const displayBlood= storedUser && storedUser.bloodGroup ? storedUser.bloodGroup : '—';
  const displayFirst= storedUser && storedUser.isFirstPregnancy !== null
    ? (storedUser.isFirstPregnancy ? 'Yes' : 'No') : '—';

  const dueDate = (() => {
    const today = new Date();
    const daysRemaining = (40 - displayWeek) * 7;
    const d = new Date(today.getTime() + daysRemaining * 86400000);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  })();

  return (
    <div className="screen profile">
      <div style={{ padding: '0 18px 8px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={() => openScreen('home')} style={iconBtn}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3D2840" strokeWidth="2" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <div style={{ fontFamily: 'var(--display)', fontSize: 22, color: '#2A1A36', letterSpacing: '-0.01em' }}>
          Your profile
        </div>
      </div>

      {/* avatar header */}
      <div style={{ padding: '14px 22px 0' }}>
        <Card style={{ background: 'linear-gradient(160deg, #FBD7C6, #F4D7E5)', padding: 22, textAlign: 'center' }}>
          <div style={{
            width: 96, height: 96, borderRadius: '50%', margin: '0 auto 12px',
            background: 'linear-gradient(135deg, #F4B4C8, #E0D5F0)',
            display: 'grid', placeItems: 'center',
            border: '4px solid #FFF6EE', color: '#3D2840',
            fontFamily: 'var(--display)', fontSize: 46, letterSpacing: '-0.02em',
            boxShadow: '0 20px 40px -20px rgba(61,40,64,0.4)',
          }}>
            {displayName.slice(0,1).toUpperCase()}
          </div>
          <div style={{ fontFamily: 'var(--display)', fontSize: 26, color: '#3D2840', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
            {displayName}
          </div>
          <div style={{ fontSize: 12, color: '#5A3E5F', marginTop: 4 }}>
            Mother-to-be · Week {displayWeek}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 12 }}>
            <Pill tone="cream">🥭 Mango size</Pill>
            <Pill tone="cream">2nd trimester</Pill>
          </div>
        </Card>
      </div>

      {/* due date hero */}
      <div style={{ padding: '12px 22px 0' }}>
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 56, height: 56, borderRadius: 18,
              background: '#3D2840', color: '#FFF1E4',
              display: 'grid', placeItems: 'center', textAlign: 'center', lineHeight: 1,
            }}>
              <div>
                <div style={{ fontSize: 9, opacity: 0.7, letterSpacing: '0.1em' }}>DUE</div>
                <div style={{ fontFamily: 'var(--display)', fontSize: 20, marginTop: 3 }}>{40 - state.week}w</div>
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: '#7A5E78', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Estimated due date</div>
              <div style={{ fontFamily: 'var(--display)', fontSize: 19, color: '#3D2840', marginTop: 2, letterSpacing: '-0.01em' }}>{dueDate}</div>
              <div style={{ fontSize: 11, color: '#5A3E5F', marginTop: 2 }}>Week {displayWeek} of 40</div>
            </div>
          </div>
        </Card>
      </div>

      {/* setup fields */}
      <div style={{ padding: '16px 22px 0' }}>
        <div style={{ fontFamily: 'var(--display)', fontSize: 18, color: '#3D2840', marginBottom: 8, letterSpacing: '-0.01em' }}>
          Personal details
        </div>
        <Card style={{ padding: 0 }}>
          {[
            { label: 'Name',                value: displayName,  icon: '👤' },
            { label: 'Pregnancy week',      value: `Week ${displayWeek}`, icon: '🌱' },
            { label: 'Age',                 value: displayAge,   icon: '🎂' },
            { label: 'City',                value: displayCity,  icon: '📍' },
            { label: 'Blood group',         value: displayBlood, icon: '🩸' },
            { label: 'First pregnancy',     value: displayFirst, icon: '✨' },
            { label: 'Language preference', value: displayLang === 'bn' ? 'বাংলা' : displayLang === 'en' ? 'English' : 'Mixed', icon: '🌐' },
          ].map((f, i, arr) => (
            <div key={f.label} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
              borderBottom: i < arr.length - 1 ? '1px solid rgba(61,40,64,0.05)' : 'none',
            }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: '#F4ECE0', display: 'grid', placeItems: 'center', fontSize: 16 }}>
                {f.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: '#7A5E78', fontWeight: 600 }}>{f.label}</div>
                <div style={{ fontSize: 14, color: '#2A1A36', marginTop: 1, fontWeight: 500 }}>{f.value}</div>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9A8595" strokeWidth="2" strokeLinecap="round"><path d="M9 6l6 6-6 6"/></svg>
            </div>
          ))}
        </Card>
      </div>

      {/* health snapshot */}
      <div style={{ padding: '16px 22px 0' }}>
        <div style={{ fontFamily: 'var(--display)', fontSize: 18, color: '#3D2840', marginBottom: 8, letterSpacing: '-0.01em' }}>
          Health snapshot
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {[
            { l: 'Pre-weight', v: '54', u: 'kg', c: '#F2EBDA' },
            { l: 'Current', v: '58.4', u: 'kg', c: '#FBE5D6' },
            { l: 'BMI', v: '22.3', u: 'healthy', c: '#E6F1DC' },
          ].map(s => (
            <Card key={s.l} style={{ background: s.c, padding: 14 }}>
              <div style={{ fontSize: 10, color: '#7A5E78', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{s.l}</div>
              <div style={{ fontFamily: 'var(--display)', fontSize: 20, color: '#3D2840', marginTop: 4, letterSpacing: '-0.02em', lineHeight: 1 }}>{s.v}</div>
              <div style={{ fontSize: 9, color: '#5A3E5F', marginTop: 2 }}>{s.u}</div>
            </Card>
          ))}
        </div>
      </div>

      {/* care team */}
      <div style={{ padding: '16px 22px 0' }}>
        <div style={{ fontFamily: 'var(--display)', fontSize: 18, color: '#3D2840', marginBottom: 8, letterSpacing: '-0.01em' }}>
          Your care circle
        </div>
        <Card style={{ padding: 0 }}>
          {[
            { name: 'Dr. Rashida Khan', role: 'OB-GYN · Primary', tone: '#F4D7E5', init: 'R' },
            { name: 'Anika (sister)', role: 'Emergency contact', tone: '#E0D5F0', init: 'A' },
            { name: 'Square Hospital', role: 'Dhanmondi · 5 km away', tone: '#FBE5D6', init: '🏥' },
          ].map((c, i, arr) => (
            <div key={c.name} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
              borderBottom: i < arr.length - 1 ? '1px solid rgba(61,40,64,0.05)' : 'none',
            }}>
              <div style={{
                width: 38, height: 38, borderRadius: '50%', background: c.tone,
                display: 'grid', placeItems: 'center', fontWeight: 700, color: '#3D2840',
                fontFamily: 'var(--display)', fontSize: 18,
              }}>{c.init}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, color: '#2A1A36', fontWeight: 600 }}>{c.name}</div>
                <div style={{ fontSize: 11, color: '#7A5E78' }}>{c.role}</div>
              </div>
              <button style={{
                width: 32, height: 32, borderRadius: 99, border: 'none', background: '#F4ECE0',
                display: 'grid', placeItems: 'center', cursor: 'pointer',
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3D2840" strokeWidth="2" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              </button>
            </div>
          ))}
        </Card>
      </div>

      <div style={{ padding: '14px 22px 20px' }}>
        <button onClick={onLogout} style={{
          width: '100%', padding: '14px', borderRadius: 16, border: '1px solid rgba(61,40,64,0.15)',
          background: 'transparent', color: '#5A3E5F', cursor: 'pointer',
          fontSize: 13, fontWeight: 600,
        }}>Sign out</button>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────
// SETTINGS
// ──────────────────────────────────────────────────────────────────
function SettingsScreen({ state, setState, openScreen, tweak, setTweak, onLogout }) {
  const { iconBtn } = window.uiBtns;
  const [notifications, setNotif] = React.useState({ daily: true, kicks: true, meds: true, mood: false });
  const [voice, setVoice] = React.useState({ wake: true, tone: 'warm' });
  const [confirmLogout, setConfirmLogout] = React.useState(false);

  const storedUser = React.useMemo(() => {
    try { return JSON.parse(localStorage.getItem('maya_user') || 'null'); } catch { return null; }
  }, []);
  const phone = storedUser && storedUser.phone !== 'guest' ? storedUser.phone : null;

  const setLang = (l) => setTweak('lang', l);

  return (
    <div className="screen settings">
      <div style={{ padding: '0 18px 8px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={() => openScreen('home')} style={iconBtn}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3D2840" strokeWidth="2" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <div style={{ fontFamily: 'var(--display)', fontSize: 22, color: '#2A1A36', letterSpacing: '-0.01em' }}>
          Settings
        </div>
      </div>

      {/* LANGUAGE — the headline setting */}
      <div style={{ padding: '14px 22px 0' }}>
        <div style={{ fontSize: 11, color: '#7A5E78', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8, padding: '0 4px' }}>
          Language
        </div>
        <Card style={{ background: 'linear-gradient(135deg, #FBE5D6, #F4D7E5)', padding: 18 }}>
          <div style={{ fontFamily: 'var(--display)', fontSize: 18, color: '#3D2840', letterSpacing: '-0.01em' }}>
            How should Tara talk to you?
          </div>
          <div style={{ fontSize: 12, color: '#5A3E5F', marginTop: 4 }}>
            Switch anytime · she understands both
          </div>
          {/* segmented control */}
          <div style={{
            marginTop: 14, padding: 4, borderRadius: 14,
            background: 'rgba(255,255,255,0.6)', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4,
          }}>
            {[
              { v: 'bn', label: 'বাংলা', sub: 'Bangla' },
              { v: 'mixed', label: 'Both', sub: 'Mixed' },
              { v: 'en', label: 'English', sub: 'English' },
            ].map(opt => (
              <button key={opt.v} onClick={() => setLang(opt.v)} style={{
                padding: '10px 6px', borderRadius: 10, border: 'none', cursor: 'pointer',
                background: tweak.lang === opt.v ? '#3D2840' : 'transparent',
                color: tweak.lang === opt.v ? '#FFF1E4' : '#3D2840',
                fontWeight: 700, fontSize: 13,
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                transition: 'all 200ms',
              }}>
                <span>{opt.label}</span>
                <span style={{ fontSize: 9, opacity: 0.6, fontWeight: 500, letterSpacing: '0.04em' }}>{opt.sub}</span>
              </button>
            ))}
          </div>
          {/* swap row */}
          <div style={{
            marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.5)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontFamily: 'var(--display)', fontSize: 16, color: '#3D2840' }}>বাংলা</span>
              <svg width="20" height="14" viewBox="0 0 24 16" fill="none" stroke="#3D2840" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 8h18M16 3l5 5-5 5M8 3L3 8l5 5"/>
              </svg>
              <span style={{ fontFamily: 'var(--display)', fontSize: 16, color: '#3D2840' }}>English</span>
            </div>
            <span style={{ fontSize: 11, color: '#5A3E5F', fontWeight: 600 }}>Auto-translate on</span>
          </div>
        </Card>
      </div>

      {/* Notifications */}
      <div style={{ padding: '16px 22px 0' }}>
        <div style={{ fontSize: 11, color: '#7A5E78', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8, padding: '0 4px' }}>
          Notifications
        </div>
        <Card style={{ padding: 0 }}>
          {[
            { k: 'daily', l: "Tara's daily check-in", s: "9:00 AM · we'll start the day together" },
            { k: 'kicks', l: 'Kick count reminders', s: 'Evenings after dinner' },
            { k: 'meds', l: 'Iron + folic acid reminder', s: 'After lunch' },
            { k: 'mood', l: 'Mood check-ins', s: 'Twice a week' },
          ].map((it, i, arr) => (
            <ToggleRow key={it.k} title={it.l} sub={it.s} on={notifications[it.k]} onChange={v => setNotif(n => ({ ...n, [it.k]: v }))} last={i === arr.length - 1}/>
          ))}
        </Card>
      </div>

      {/* Voice + appearance */}
      <div style={{ padding: '16px 22px 0' }}>
        <div style={{ fontSize: 11, color: '#7A5E78', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8, padding: '0 4px' }}>
          Voice & appearance
        </div>
        <Card style={{ padding: 0 }}>
          <ToggleRow title="Wake on 'Hi Tara'" sub="Listen even when app is closed" on={voice.wake} onChange={v => setVoice(s => ({ ...s, wake: v }))}/>
          <Row title="Tara's voice tone" value="Warm & soft">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9A8595" strokeWidth="2" strokeLinecap="round"><path d="M9 6l6 6-6 6"/></svg>
          </Row>
          <Row title="Theme" value={tweak.theme === 'dawn' ? 'Dawn' : tweak.theme === 'dusk' ? 'Dusk' : 'Night'}>
            <div style={{ display: 'flex', gap: 4 }}>
              {['dawn', 'dusk', 'night'].map(th => (
                <button key={th} onClick={() => setTweak('theme', th)} style={{
                  width: 22, height: 22, borderRadius: 99, border: tweak.theme === th ? '2px solid #3D2840' : '2px solid transparent',
                  background: th === 'dawn' ? 'linear-gradient(135deg, #FBD7C6, #F4D7E5)' :
                              th === 'dusk' ? 'linear-gradient(135deg, #E0D5F0, #F4B4C8)' :
                                              'linear-gradient(135deg, #2A1A36, #4B3470)',
                  cursor: 'pointer', padding: 0,
                }}/>
              ))}
            </div>
          </Row>
          <Row title="Text size" value="Normal" last>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9A8595" strokeWidth="2" strokeLinecap="round"><path d="M9 6l6 6-6 6"/></svg>
          </Row>
        </Card>
      </div>

      {/* Privacy + about */}
      <div style={{ padding: '16px 22px 0' }}>
        <div style={{ fontSize: 11, color: '#7A5E78', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8, padding: '0 4px' }}>
          Privacy & data
        </div>
        <Card style={{ padding: 0 }}>
          <Row title="Conversations" value="Stored on device only">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9A8595" strokeWidth="2" strokeLinecap="round"><path d="M9 6l6 6-6 6"/></svg>
          </Row>
          <Row title="Share data with doctor" value="With consent">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9A8595" strokeWidth="2" strokeLinecap="round"><path d="M9 6l6 6-6 6"/></svg>
          </Row>
          <Row title="Download my data" value="" last>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9A8595" strokeWidth="2" strokeLinecap="round"><path d="M9 6l6 6-6 6"/></svg>
          </Row>
        </Card>
      </div>

      {/* Account */}
      <div style={{ padding: '16px 22px 0' }}>
        <div style={{ fontSize: 11, color: '#7A5E78', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8, padding: '0 4px' }}>
          Account
        </div>
        <Card style={{ padding: 0 }}>
          {phone && (
            <Row title="Phone number" value={phone}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9A8595" strokeWidth="2" strokeLinecap="round"><path d="M9 6l6 6-6 6"/></svg>
            </Row>
          )}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, color: '#C0392B', fontWeight: 600 }}>Sign out</div>
              <div style={{ fontSize: 11, color: '#7A5E78', marginTop: 2 }}>
                {confirmLogout ? 'Tap again to confirm' : 'You can sign back in anytime'}
              </div>
            </div>
            <button
              onClick={() => confirmLogout ? onLogout && onLogout() : setConfirmLogout(true)}
              onBlur={() => setConfirmLogout(false)}
              style={{
                padding: '8px 16px', borderRadius: 99, border: 'none',
                background: confirmLogout ? '#C0392B' : 'rgba(192,57,43,0.1)',
                color: confirmLogout ? '#fff' : '#C0392B',
                fontSize: 12, fontWeight: 700, cursor: 'pointer',
                transition: 'all 200ms',
              }}
            >
              {confirmLogout ? 'Confirm' : 'Sign out'}
            </button>
          </div>
        </Card>
      </div>

      <div style={{ padding: '20px 22px 20px', textAlign: 'center' }}>
        <MayaLogo size={18}/>
        <div style={{ fontSize: 10, color: '#9A8595', marginTop: 6, letterSpacing: '0.2em' }}>
          VERSION 0.4 · CREATED BY AIVION
        </div>
      </div>
    </div>
  );
}

function ToggleRow({ title, sub, on, onChange, last }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
      borderBottom: last ? 'none' : '1px solid rgba(61,40,64,0.05)',
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, color: '#2A1A36', fontWeight: 600 }}>{title}</div>
        {sub && <div style={{ fontSize: 11, color: '#7A5E78', marginTop: 2 }}>{sub}</div>}
      </div>
      <button onClick={() => onChange(!on)} style={{
        width: 42, height: 24, borderRadius: 99, border: 'none',
        background: on ? '#3D2840' : 'rgba(61,40,64,0.18)',
        position: 'relative', cursor: 'pointer', padding: 0,
        transition: 'background 200ms',
      }}>
        <div style={{
          position: 'absolute', top: 2, left: on ? 20 : 2,
          width: 20, height: 20, borderRadius: '50%', background: '#FFF6EE',
          transition: 'left 200ms',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        }}/>
      </button>
    </div>
  );
}

function Row({ title, value, children, last }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
      borderBottom: last ? 'none' : '1px solid rgba(61,40,64,0.05)',
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, color: '#2A1A36', fontWeight: 600 }}>{title}</div>
        {value && <div style={{ fontSize: 11, color: '#7A5E78', marginTop: 2 }}>{value}</div>}
      </div>
      {children}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────
// RISK ANALYSER
// ──────────────────────────────────────────────────────────────────
function RiskScreen({ state, setState, openScreen }) {
  const { iconBtn, primaryBtn } = window.uiBtns;
  const SYMPTOMS = [
    { k: 'headache', l: 'Bad headache', w: 2, c: '🤕' },
    { k: 'swelling', l: 'Sudden swelling in face/hands', w: 4, c: '🫆' },
    { k: 'vision', l: 'Blurry vision', w: 4, c: '👁️' },
    { k: 'bleeding', l: 'Any bleeding', w: 5, c: '🩸' },
    { k: 'pain', l: 'Sharp abdominal pain', w: 4, c: '⚡' },
    { k: 'fever', l: 'Fever > 38°C', w: 3, c: '🌡️' },
    { k: 'kicks', l: 'Baby moving less today', w: 3, c: '🤰' },
    { k: 'nausea', l: 'Cannot keep food down', w: 2, c: '🤢' },
    { k: 'breath', l: 'Trouble breathing', w: 4, c: '😮‍💨' },
    { k: 'mood', l: 'Feeling very low / hopeless', w: 3, c: '🌧️' },
  ];
  const [sel, setSel] = React.useState({});
  const [submitted, setSubmitted] = React.useState(false);

  const score = Object.entries(sel).reduce((acc, [k, on]) => acc + (on ? SYMPTOMS.find(s => s.k === k).w : 0), 0);
  const level = score === 0 ? 'safe' : score <= 3 ? 'low' : score <= 7 ? 'moderate' : 'high';
  const levelMap = {
    safe:     { label: 'All clear',      tone: 'linear-gradient(135deg, #E6F1DC, #DDEEFF)', dot: '#7BC894', taraMood: 'happy', msg: "Nothing flagged today. Keep doing what you're doing 🌸" },
    low:      { label: 'Low concern',    tone: 'linear-gradient(135deg, #F2EBDA, #FBE5D6)', dot: '#E5A064', taraMood: 'idle', msg: 'Probably normal pregnancy discomfort. Watch how it changes today.' },
    moderate: { label: 'Worth a call',   tone: 'linear-gradient(135deg, #FBD6CB, #F4D7E5)', dot: '#E5773A', taraMood: 'worried', msg: 'Please tell your doctor today. Not urgent, but not ignoring either.' },
    high:     { label: 'Call now',       tone: 'linear-gradient(135deg, #F8C9C0, #F4A4B8)', dot: '#D14040', taraMood: 'worried', msg: 'This needs care right away. Tara will help you make the call.' },
  };
  const L = levelMap[level];

  const toggle = (k) => setSel(s => ({ ...s, [k]: !s[k] }));
  const reset = () => { setSel({}); setSubmitted(false); };

  return (
    <div className="screen risk">
      <div style={{ padding: '0 18px 8px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={() => openScreen('home')} style={iconBtn}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3D2840" strokeWidth="2" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: '#7A5E78', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>For your safety</div>
          <div style={{ fontFamily: 'var(--display)', fontSize: 22, color: '#2A1A36', letterSpacing: '-0.01em', lineHeight: 1.1 }}>
            Risk analyser
          </div>
        </div>
        <button onClick={reset} style={{
          padding: '6px 12px', borderRadius: 99, border: '1px solid rgba(61,40,64,0.15)',
          background: 'transparent', color: '#5A3E5F', cursor: 'pointer', fontSize: 11, fontWeight: 600,
        }}>Reset</button>
      </div>

      {/* meter */}
      <div style={{ padding: '8px 22px 0' }}>
        <Card style={{ background: L.tone, padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <Tara size={92} mood={L.taraMood}/>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 10, height: 10, borderRadius: 99, background: L.dot }}/>
                <span style={{ fontSize: 11, color: '#5A3E5F', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{L.label}</span>
              </div>
              <div style={{ fontFamily: 'var(--display)', fontSize: 22, color: '#3D2840', marginTop: 4, letterSpacing: '-0.01em', lineHeight: 1.2 }}>
                {L.msg}
              </div>
            </div>
          </div>
          {/* 4-step meter */}
          <div style={{ display: 'flex', gap: 4, marginTop: 14 }}>
            {['safe', 'low', 'moderate', 'high'].map((lv, i) => (
              <div key={lv} style={{
                flex: 1, height: 6, borderRadius: 99,
                background: ['safe', 'low', 'moderate', 'high'].indexOf(level) >= i ? levelMap[lv].dot : 'rgba(61,40,64,0.12)',
                transition: 'background 300ms',
              }}/>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 9, color: '#7A5E78', fontWeight: 600, letterSpacing: '0.04em' }}>
            <span>Safe</span><span>Low</span><span>Moderate</span><span>High</span>
          </div>
        </Card>
      </div>

      {/* symptom picker */}
      <div style={{ padding: '16px 22px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
          <div style={{ fontFamily: 'var(--display)', fontSize: 18, color: '#3D2840', letterSpacing: '-0.01em' }}>
            What are you feeling today?
          </div>
          <div style={{ fontSize: 11, color: '#7A5E78' }}>Tap all that apply</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {SYMPTOMS.map(sym => {
            const on = sel[sym.k];
            return (
              <button key={sym.k} onClick={() => toggle(sym.k)} style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '12px 12px',
                borderRadius: 16, border: 'none', cursor: 'pointer', textAlign: 'left',
                background: on ? '#3D2840' : 'rgba(255,252,247,0.9)',
                color: on ? '#FFF1E4' : '#2A1A36',
                outline: on ? '2px solid #F08A6E' : 'none',
                outlineOffset: -2,
                transition: 'all 200ms',
                boxShadow: on ? '0 6px 16px -8px rgba(61,40,64,0.4)' : '0 1px 0 rgba(255,255,255,0.9) inset',
              }}>
                <span style={{ fontSize: 18 }}>{sym.c}</span>
                <span style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.2, flex: 1 }}>{sym.l}</span>
                {on && (
                  <span style={{ width: 16, height: 16, borderRadius: 99, background: '#F08A6E', display: 'grid', placeItems: 'center' }}>
                    <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="#FFF1E4" strokeWidth="2.4" strokeLinecap="round"><path d="M2 6.5 L5 9 L10 3"/></svg>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* vitals quick check */}
      <div style={{ padding: '16px 22px 0' }}>
        <div style={{ fontFamily: 'var(--display)', fontSize: 18, color: '#3D2840', marginBottom: 8, letterSpacing: '-0.01em' }}>
          Today's readings
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {[
            { l: 'BP', v: '118/76', s: 'normal', c: '#7BC894' },
            { l: 'Sleep', v: '6.8h', s: 'okay', c: '#E5A064' },
            { l: 'Hydration', v: '5/8', s: 'low', c: '#E5773A' },
          ].map(s => (
            <Card key={s.l} style={{ padding: 12 }}>
              <div style={{ fontSize: 10, color: '#7A5E78', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{s.l}</div>
              <div style={{ fontFamily: 'var(--display)', fontSize: 16, color: '#3D2840', marginTop: 4, letterSpacing: '-0.01em', lineHeight: 1 }}>{s.v}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                <span style={{ width: 6, height: 6, borderRadius: 99, background: s.c }}/>
                <span style={{ fontSize: 9, color: '#5A3E5F', fontWeight: 600 }}>{s.s}</span>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* AI analysis */}
      {submitted && level !== 'safe' && (
        <div style={{ padding: '16px 22px 0' }}>
          <Card style={{ background: 'linear-gradient(135deg, #2A1A36, #3D2840)', color: '#FFF1E4' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <MayaGlyph size={22}/>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#F4B4C8' }}>
                Tara's read of this
              </div>
            </div>
            <div style={{ fontFamily: 'var(--display)', fontSize: 17, lineHeight: 1.4, letterSpacing: '-0.01em' }}>
              "{level === 'high' ? "Some of what you're feeling could be early signs of pre-eclampsia. Please don't wait — let me help you call Dr. Rashida now." : level === 'moderate' ? "These symptoms together are worth checking. I'll prep a note for your doctor with what you've logged this week." : "I hear you. Let's keep an eye on this — drink some water, rest, and tell me if anything changes."}"
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <button style={{ ...primaryBtn, background: '#F08A6E', flex: 1 }}>
                {level === 'high' ? '☎️ Call doctor now' : '💬 Tell my doctor'}
              </button>
              <button style={{ ...primaryBtn, background: 'rgba(255,241,228,0.15)', color: '#FFF1E4', flex: 1 }}>
                Talk to Tara
              </button>
            </div>
          </Card>
        </div>
      )}

      {/* analyse button */}
      <div style={{ padding: '16px 22px 24px' }}>
        <button onClick={() => setSubmitted(true)} disabled={Object.values(sel).every(v => !v)} style={{
          width: '100%', padding: '16px', borderRadius: 18, border: 'none',
          background: Object.values(sel).every(v => !v) ? 'rgba(61,40,64,0.2)' : 'linear-gradient(135deg, #3D2840, #5A3E5F)',
          color: '#FFF1E4', cursor: Object.values(sel).every(v => !v) ? 'not-allowed' : 'pointer',
          fontSize: 14, fontWeight: 700, letterSpacing: '-0.01em',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          boxShadow: '0 14px 30px -10px rgba(61,40,64,0.5)',
        }}>
          <span>✨</span> Analyse with Maya AI
        </button>
        <div style={{ fontSize: 10, color: '#7A5E78', textAlign: 'center', marginTop: 8, lineHeight: 1.5 }}>
          Not a medical diagnosis · always call your doctor for emergencies
        </div>
      </div>
    </div>
  );
}

window.SplashScreen = SplashScreen;
window.AppHeader = AppHeader;
window.MayaLogo = MayaLogo;
window.MayaGlyph = MayaGlyph;
window.ProfileScreen = ProfileScreen;
window.SettingsScreen = SettingsScreen;
window.RiskScreen = RiskScreen;
