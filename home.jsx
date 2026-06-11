// Shared UI bits + Home screen

const fmtBn = (n) => n.toString().replace(/\d/g, (d) => '০১২৩৪৫৬৭৮৯'[d]);

function Pill({ children, tone = 'cream', style = {} }) {
  const tones = {
    cream: { bg: 'rgba(255,255,255,0.7)', fg: '#3D2840' },
    plum: { bg: '#3D2840', fg: '#FFF1E4' },
    peach: { bg: '#FBD9C6', fg: '#7A3A28' },
    pink: { bg: '#F8D5DF', fg: '#7A2E48' },
    lav: { bg: '#E8DEF5', fg: '#4B3470' }
  }[tone];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '6px 11px', borderRadius: 999,
      fontSize: 11, fontWeight: 600, letterSpacing: '0.02em',
      background: tones.bg, color: tones.fg,
      backdropFilter: 'blur(8px)',
      ...style
    }}>{children}</span>);

}

function Card({ children, style = {}, onClick, accent }) {
  return (
    <div onClick={onClick} style={{
      background: '#FFFCF7',
      borderRadius: 26,
      padding: 18,
      boxShadow: '0 1px 0 rgba(255,255,255,0.9) inset, 0 14px 30px -18px rgba(61,40,64,0.18), 0 2px 6px rgba(61,40,64,0.04)',
      position: 'relative', overflow: 'hidden',
      cursor: onClick ? 'pointer' : 'default',
      ...style
    }}>
      {accent && <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: accent, opacity: 0.55
      }} />}
      <div style={{ position: 'relative' }}>{children}</div>
    </div>);

}

// Soft mesh background
function MeshBg({ variant = 'dawn' }) {
  const grads = {
    dawn: `radial-gradient(60% 50% at 18% 12%, #FBD7C6 0%, transparent 60%),
           radial-gradient(70% 55% at 90% 8%, #F1C7DA 0%, transparent 55%),
           radial-gradient(80% 70% at 50% 100%, #E5D8F2 0%, transparent 60%),
           linear-gradient(180deg, #FFF6EE 0%, #FFEFE2 100%)`,
    dusk: `radial-gradient(60% 50% at 18% 12%, #E0D5F0 0%, transparent 60%),
           radial-gradient(70% 55% at 90% 8%, #F4B4C8 0%, transparent 55%),
           radial-gradient(80% 70% at 50% 100%, #FBD7C6 0%, transparent 60%),
           linear-gradient(180deg, #FBF0E8 0%, #F3E4F0 100%)`,
    night: `radial-gradient(60% 50% at 18% 12%, #4B3470 0%, transparent 60%),
            radial-gradient(70% 55% at 90% 8%, #6A3B5F 0%, transparent 55%),
            radial-gradient(80% 70% at 50% 100%, #2A1A36 0%, transparent 60%),
            linear-gradient(180deg, #1F1228 0%, #2C1A38 100%)`
  };
  return (
    <div style={{
      position: 'absolute', inset: 0, background: grads[variant],
      transition: 'background 600ms ease'
    }} />);

}

// Grain overlay
function Grain() {
  return (
    <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', opacity: 0.35, mixBlendMode: 'overlay' }}>
      <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" /></filter>
      <rect width="100%" height="100%" filter="url(#grain)" />
    </svg>);

}

// Week ring
function WeekRing({ week, total = 40, size = 76 }) {
  const r = (size - 10) / 2;
  const c = 2 * Math.PI * r;
  const pct = week / total;
  return (
    <svg width={size} height={size} style={{ display: 'block' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(61,40,64,0.08)" strokeWidth="6" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none"
      stroke="#3D2840" strokeWidth="6" strokeLinecap="round"
      strokeDasharray={c} strokeDashoffset={c * (1 - pct)}
      transform={`rotate(-90 ${size / 2} ${size / 2})`} />

    </svg>);

}

// Wave bar
function Waveform({ playing = true, bars = 24, color = '#3D2840' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3, height: 36, textAlign: "center", justifyContent: "center" }}>
      {Array.from({ length: bars }).map((_, i) =>
      <div key={i} style={{
        width: 3, borderRadius: 3, background: color,
        height: '40%',
        animation: playing ? `wv ${600 + i * 37 % 500}ms ease-in-out infinite alternate` : 'none',
        animationDelay: `${i * 53 % 400}ms`
      }} />
      )}
      <style>{`@keyframes wv { from { height: 18%; opacity: 0.5 } to { height: 90%; opacity: 1 } }`}</style>
    </div>);

}

// ──────────────────────────────────────────────────────────────────
// HOME
// ──────────────────────────────────────────────────────────────────
function HomeScreen({ state, setState, openScreen }) {
  const { week, name, lang, mood } = state;
  const L = (key, type) => window.tStr(key, lang, type);
  const taraRef = React.useRef(null);
  const [proactiveMsg, setProactiveMsg] = React.useState(null);
  const [profileData, setProfileData] = React.useState(null);
  const [appointment, setAppointment] = React.useState(null); // null=loading, false=none, object=real
  const [waterGlasses, setWaterGlasses] = React.useState(0);
  const waterDebounceRef = React.useRef(null);

  // Use fresh backend profile when available; fall back to localStorage user,
  // then to app state (which itself falls back to tweakDefaults as last resort).
  const _lsUser = (() => { try { return JSON.parse(localStorage.getItem('maya_user') || '{}'); } catch { return {}; } })();
  const displayWeek = profileData?.pregnancyWeek ?? _lsUser.pregnancyWeek ?? week;
  const displayName = profileData?.name           ?? _lsUser.name          ?? name;
  const fruit = WEEK_FRUITS[Math.min(40, Math.max(1, displayWeek))];
  const trimester = L(displayWeek <= 13 ? 'trimester1' : displayWeek <= 27 ? 'trimester2' : 'trimester3');
  const monthFromWeek = displayWeek <= 40 ? Math.min(9, Math.ceil(displayWeek / 4.345)) : Math.min(12, 9 + Math.ceil((displayWeek - 40) / 4));
  const todayLabel = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  const checks = state.checks;
  const toggleCheck = (k) => {
    const newVal = !checks[k];
    setState(s => ({ ...s, checks: { ...s.checks, [k]: newVal } }));
    if (newVal) {
      try {
        const pid = JSON.parse(localStorage.getItem('maya_user') || '{}').id;
        if (pid) fetch(`${window.BACKEND_URL}/health-log`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ patient_id: pid, data_type: 'checklist', value: k }),
        }).catch(() => {});
      } catch {}
    }
  };

  // Persist daily check state so it survives a refresh and auto-resets on a new day
  React.useEffect(() => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      localStorage.setItem(`maya_checks_${today}`, JSON.stringify(checks));
    } catch {}
  }, [checks]);

  // Auto-manage water checkbox based on glass count
  React.useEffect(() => {
    const shouldCheck = waterGlasses >= 8;
    if (checks.water !== shouldCheck) {
      setState(s => ({ ...s, checks: { ...s.checks, water: shouldCheck } }));
    }
  }, [waterGlasses]);

  const fmtApptType = (type) => {
    if (!type) return L('nextCheckup');
    const map = { anc: 'ANC Checkup', ultrasound: 'Ultrasound', followup: 'Follow-up', general: 'Checkup' };
    const key = type.toLowerCase();
    return map[key] || (type.charAt(0).toUpperCase() + type.slice(1));
  };

  const fmtApptDate = (isoStr) => {
    if (!isoStr) return '';
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) +
        ' · ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } catch { return ''; }
  };

  const adjustWater = (delta) => {
    setWaterGlasses(prev => {
      const next = Math.min(12, Math.max(0, prev + delta));
      if (waterDebounceRef.current) clearTimeout(waterDebounceRef.current);
      waterDebounceRef.current = setTimeout(() => {
        try {
          const pid = JSON.parse(localStorage.getItem('maya_user') || '{}').id;
          if (pid && next > 0) fetch(`${window.BACKEND_URL}/health-log`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ patient_id: pid, data_type: 'hydration', value: String(next) }),
          }).catch(() => {});
        } catch {}
      }, 800);
      return next;
    });
  };

  React.useEffect(() => {
    const user = (() => { try { return JSON.parse(localStorage.getItem('maya_user') || '{}'); } catch { return {}; } })();
    const session = (() => { try { return JSON.parse(localStorage.getItem('maya_session') || '{}'); } catch { return {}; } })();
    const patientId = user.id;

    if (!patientId || !window.BACKEND_URL) {
      setAppointment(false);
      return;
    }

    const authHeader = session.token ? { Authorization: `Bearer ${session.token}` } : {};

    // Proactive message from monitoring agent
    fetch(`${window.BACKEND_URL}/proactive/${patientId}`)
      .then(r => r.json())
      .then(data => { if (data.has_message) setProactiveMsg(data); })
      .catch(() => {});

    // Fresh profile — resolves profile/home data conflict
    fetch(`${window.BACKEND_URL}/profile/${patientId}`, { headers: authHeader })
      .then(r => { if (!r.ok) throw new Error('profile'); return r.json(); })
      .then(data => {
        setProfileData(data);
        setState(s => ({
          ...s,
          name: data.name ?? s.name,
          week: data.pregnancyWeek ?? s.week,
          lang: data.lang ?? s.lang,
        }));
      })
      .catch(() => {}); // silently fall back to state values

    // Next upcoming appointment
    fetch(`${window.BACKEND_URL}/appointments/${patientId}`)
      .then(r => { if (!r.ok) throw new Error('appointments'); return r.json(); })
      .then(appts => {
        const now = new Date();
        const next = (Array.isArray(appts) ? appts : [])
          .find(a => !a.attended && a.scheduled_at && new Date(a.scheduled_at) > now);
        setAppointment(next || false);
      })
      .catch(() => setAppointment(false));

    // Prefetch today's hydration log to restore the water counter
    if (patientId) {
      fetch(`${window.BACKEND_URL}/health-logs/${patientId}?data_type=hydration&limit=1`, { headers: authHeader })
        .then(r => r.ok ? r.json() : [])
        .then(logs => {
          if (logs?.[0]) {
            const today = new Date().toISOString().slice(0, 10);
            if (logs[0].created_at?.slice(0, 10) === today) setWaterGlasses(parseInt(logs[0].value) || 0);
          }
        })
        .catch(() => {});
    }
  }, []);

  function handleVoiceOpen() {
    if (!taraRef.current || taraRef.current.isFunny()) { openScreen('voice'); return; }
    taraRef.current.playRandomFunny(() => setTimeout(() => openScreen('voice'), 300));
  }
  const allDone = Object.values(checks).every(Boolean);

  return (
    <div className="screen home">
      {/* greeting */}
      <div style={{ padding: '4px 22px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#7A5E78', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              {todayLabel} · Week {displayWeek}
            </div>
            <div style={{ fontFamily: 'var(--display)', fontSize: 26, lineHeight: 1.1, color: '#2A1A36', marginTop: 4, letterSpacing: '-0.02em' }}>
              <span style={{ display: 'block' }}>{L('greeting', 'tara')},</span>
              <span style={{ fontStyle: 'italic' }}>{displayName}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tara hero card */}
      <div style={{ padding: '14px 22px 10px' }}>
        <div style={{
          position: 'relative', borderRadius: 32, padding: '18px 18px 22px',
          background: 'linear-gradient(160deg, #FFE3D6 0%, #F4C9DC 60%, #E0D5F0 100%)',
          overflow: 'hidden',
          boxShadow: '0 24px 50px -28px rgba(61,40,64,0.35)'
        }}>
          {/* decoration */}
          <svg style={{ position: 'absolute', right: -20, top: -20, opacity: 0.35 }} width="120" height="120" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="50" fill="none" stroke="#FFF1E4" strokeWidth="1" strokeDasharray="2 6" />
            <circle cx="60" cy="60" r="34" fill="none" stroke="#FFF1E4" strokeWidth="1" strokeDasharray="2 6" />
          </svg>

          <div style={{ display: 'flex', gap: 8 }}>
            <Pill tone="cream">
              <span style={{ width: 6, height: 6, borderRadius: 99, background: '#7BC894' }} /> {L('taraIsHere', 'tara')}
            </Pill>
            <Pill tone="cream">Week {displayWeek} · {trimester}</Pill>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 10, gap: 8 }}>
            <div style={{ flex: 1, paddingBottom: 4 }}>
              <div style={{ fontFamily: 'var(--display)', fontSize: 22, lineHeight: 1.15, color: '#3D2840', letterSpacing: '-0.01em' }}>
                {proactiveMsg ? `"${proactiveMsg.message}"` : '"আজ আপনি একটু ক্লান্ত মনে হচ্ছেন। চলুন এক গ্লাস পানি খাই —"'}
              </div>
              <div style={{ fontSize: 13, color: '#5A3E5F', marginTop: 8, lineHeight: 1.5 }}>
                {proactiveMsg ? '— Tara' : L('taraHeroSub', 'tara')}
              </div>
            </div>
            <Tara ref={taraRef} size={170} mood={proactiveMsg ? (proactiveMsg.emotion || mood) : mood} />
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <button onClick={() => openScreen('chat')} style={{ ...primaryBtn, flex: 1 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              {L('chatWithTara')}
            </button>
            <button onClick={handleVoiceOpen} style={{ ...primaryBtn, flex: 1, background: 'rgba(255,255,255,0.5)', color: '#3D2840' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <rect x="9" y="3" width="6" height="12" rx="3" />
                <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
              </svg>
              {L('voice')}
            </button>
          </div>
        </div>
      </div>

      {/* baby size card */}
      <div style={{ padding: '4px 22px 0' }}>
        <Card style={{ padding: 0, background: '#FFF8EF' }}>
          <div style={{ display: 'flex', alignItems: 'center', padding: '16px 18px', gap: 14 }}>
            <div style={{ position: 'relative' }}>
              <WeekRing week={displayWeek} />
              <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
                <div style={{ textAlign: 'center', lineHeight: 1 }}>
                  <div style={{ fontFamily: 'var(--display)', fontSize: 22, color: '#3D2840' }}>{displayWeek}</div>
                  <div style={{ fontSize: 9, color: '#7A5E78', fontWeight: 600, letterSpacing: '0.08em' }}>{L('week').toUpperCase()}</div>
                </div>
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: '#7A5E78', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                {L('babyThisWeek')}
              </div>
              <div style={{ fontFamily: 'var(--display)', fontSize: 20, color: '#3D2840', marginTop: 2, letterSpacing: '-0.01em' }}>
                {L('sizeOfA')} {fruit.name}
              </div>
              <div style={{ fontSize: 12, color: '#5A3E5F', marginTop: 4, lineHeight: 1.5 }}>
                {fruit.note}
              </div>
            </div>
            <div style={{ fontSize: 44, lineHeight: 1, paddingRight: 4 }}>{fruit.emoji}</div>
          </div>
          <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(61,40,64,0.1), transparent)' }} />
          <div style={{ display: 'flex', padding: '12px 18px', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 12, color: '#5A3E5F' }}>
              {L('monthOf9').replace('{n}', monthFromWeek)} · <span style={{ color: '#3D2840', fontWeight: 600 }}>{L('weeksToGo').replace('{n}', 40 - displayWeek)}</span>
            </div>
            <button onClick={() => openScreen('journey')} style={ghostBtn}>{L('thisMonth')}</button>
          </div>
        </Card>
      </div>

      {/* today checklist */}
      <div style={{ padding: '16px 22px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
          <div style={{ fontFamily: 'var(--display)', fontSize: 20, color: '#3D2840', letterSpacing: '-0.01em' }}>
            {L('todaysCare')}
          </div>
          <div style={{ fontSize: 12, color: '#7A5E78' }}>
            {Object.values(checks).filter(Boolean).length}/{Object.values(checks).length}
          </div>
        </div>
        <Card style={{ padding: 6 }}>
          {/* Water glass stepper */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px' }}>
            <div style={{ width: 38, height: 38, borderRadius: 12, background: '#DDEEFF', display: 'grid', placeItems: 'center', fontSize: 18 }}>
              💧
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, color: '#2A1A36', fontWeight: 600, textDecoration: waterGlasses >= 8 ? 'line-through' : 'none', opacity: waterGlasses >= 8 ? 0.5 : 1 }}>
                {L('checkWater')}
              </div>
              <div style={{ fontSize: 11, color: '#7A5E78', marginTop: 1 }}>
                {lang === 'bn' ? 'দৈনিক লক্ষ্য: ৮ গ্লাস' : 'Daily goal: 8 glasses'}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button onClick={() => adjustWater(-1)} style={{
                width: 28, height: 28, borderRadius: 99, border: '1.5px solid #B8C8D8',
                background: 'white', cursor: 'pointer', fontSize: 16, display: 'grid', placeItems: 'center',
                color: '#3D2840', fontWeight: 700, lineHeight: 1
              }}>−</button>
              <span style={{ fontSize: 13, fontWeight: 700, color: waterGlasses >= 8 ? '#3D7BC8' : '#3D2840', minWidth: 34, textAlign: 'center' }}>
                {waterGlasses} gl
              </span>
              <button onClick={() => adjustWater(1)} style={{
                width: 28, height: 28, borderRadius: 99, border: 'none',
                background: waterGlasses >= 8 ? '#3D2840' : '#E8DEF5', cursor: 'pointer', fontSize: 16, display: 'grid', placeItems: 'center',
                color: waterGlasses >= 8 ? '#FFF1E4' : '#3D2840', fontWeight: 700, lineHeight: 1
              }}>+</button>
            </div>
          </div>
          {[
          { k: 'iron',  label: L('checkIron'),  sub: L('checkIronSub'),  icon: '🌿', tone: '#E6F1DC' },
          { k: 'walk',  label: L('checkWalk'),  sub: L('checkWalkSub'),  icon: '🚶🏽‍♀️', tone: '#FBE5D6' },
          { k: 'kicks', label: L('checkKicks'), sub: L('checkKicksSub'), icon: '👣', tone: '#F4DEEC' }].
          map((it, i, arr) =>
          <button key={it.k} onClick={() => toggleCheck(it.k)} style={{
            display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left',
            padding: '10px 12px', borderRadius: 20, border: 'none', background: 'transparent',
            cursor: 'pointer'
          }}>
              <div style={{ width: 38, height: 38, borderRadius: 12, background: it.tone, display: 'grid', placeItems: 'center', fontSize: 18 }}>
                {it.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, color: '#2A1A36', fontWeight: 600, textDecoration: checks[it.k] ? 'line-through' : 'none', opacity: checks[it.k] ? 0.5 : 1 }}>
                  {it.label}
                </div>
                <div style={{ fontSize: 11, color: '#7A5E78', marginTop: 1 }}>{it.sub}</div>
              </div>
              <div style={{
              width: 24, height: 24, borderRadius: 99, border: '2px solid ' + (checks[it.k] ? '#3D2840' : '#D7C7D2'),
              background: checks[it.k] ? '#3D2840' : 'transparent',
              display: 'grid', placeItems: 'center',
              transition: 'all 200ms'
            }}>
                {checks[it.k] &&
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#FFF1E4" strokeWidth="2" strokeLinecap="round">
                    <path d="M2 6.5 L5 9 L10 3" />
                  </svg>
              }
              </div>
            </button>
          )}
          {allDone &&
          <div style={{ padding: '8px 12px 4px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Tara size={40} mood="celebrate" />
              <div style={{ fontSize: 12, color: '#3D2840', fontWeight: 600 }}>
                {L('taraProud', 'tara')}
              </div>
            </div>
          }
        </Card>
      </div>

      {/* eat / avoid */}
      <div style={{ padding: '16px 22px 0' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ fontFamily: 'var(--display)', fontSize: 20, color: '#3D2840', letterSpacing: '-0.01em' }}>
            {L('forYourBodyToday')}
          </div>
          <div style={{ fontSize: 10, color: '#7A5E78', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Week {displayWeek}
          </div>
        </div>
        {(() => {
          const monthData = window.MAYA_JOURNEY_MONTHS?.[monthFromWeek - 1];
          const eatItems   = monthData?.eat   ?? [];
          const avoidItems = monthData?.avoid ?? [];
          const eatMain    = eatItems[0]   || L('eatContent');
          const eatSub     = eatItems.length > 1 ? eatItems.slice(1).join(' · ') : L('eatSub');
          const avoidMain  = avoidItems[0] || L('avoidContent');
          const avoidSub   = avoidItems.length > 1 ? avoidItems.slice(1).join(' · ') : L('avoidSub');
          return (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Card style={{ background: '#F2EBDA' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <Pill tone="cream">{L('eat')}</Pill>
                  <span style={{ fontSize: 22 }}>{fruit.emoji}</span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#3D2840', lineHeight: 1.35 }}>{eatMain}</div>
                <div style={{ fontSize: 10, color: '#7A5E78', marginTop: 4, lineHeight: 1.5 }}>{eatSub}</div>
              </Card>
              <Card style={{ background: '#F8E2DD' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <Pill tone="pink">{L('avoid')}</Pill>
                  <span style={{ fontSize: 22 }}>🚫</span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#3D2840', lineHeight: 1.35 }}>{avoidMain}</div>
                <div style={{ fontSize: 10, color: '#7A5E78', marginTop: 4, lineHeight: 1.5 }}>{avoidSub}</div>
              </Card>
            </div>
          );
        })()}
      </div>

      {/* mental wellness moment */}
      <div style={{ padding: '14px 22px 0' }}>
        <Card style={{ background: 'linear-gradient(135deg, #E8DEF5, #F4D7E5)', padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 18, background: 'rgba(255,255,255,0.6)',
              display: 'grid', placeItems: 'center', fontSize: 22
            }}>🌬️</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--display)', fontSize: 17, color: '#3D2840', letterSpacing: '-0.01em' }}>
                {L('breathingTitle')}
              </div>
              <div style={{ fontSize: 12, color: '#5A3E5F', marginTop: 2 }}>
                {L('breathingSub', 'tara')}
              </div>
            </div>
            <button onClick={() => openScreen('wellness')} style={{
              ...primaryBtn, padding: '8px 12px', fontSize: 12
            }}>{L('begin')}</button>
          </div>
        </Card>
      </div>

      {/* Risk analyser shortcut */}
      <div style={{ padding: '12px 22px 0' }}>
        <Card style={{ background: 'linear-gradient(135deg, #2A1A36, #4B3470)', padding: 18, color: '#FFF1E4' }} onClick={() => openScreen('risk')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 18, background: 'rgba(244,180,200,0.18)',
              display: 'grid', placeItems: 'center', fontSize: 22
            }}>✨</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 10, color: '#F4B4C8', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Maya AI</span>
                <span style={{ width: 4, height: 4, borderRadius: 99, background: '#F4B4C8' }} />
                <span style={{ fontSize: 10, color: 'rgba(255,241,228,0.55)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>30 sec check</span>
              </div>
              <div style={{ fontFamily: 'var(--display)', fontSize: 18, color: '#FFF1E4', letterSpacing: '-0.01em', marginTop: 4 }}>
                {L('riskAnalyserShort')}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,241,228,0.65)', marginTop: 2 }}>
                {L('riskSubHome', 'tara')}
              </div>
            </div>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFF1E4" strokeWidth="2" strokeLinecap="round"><path d="M9 6l6 6-6 6" /></svg>
          </div>
        </Card>
      </div>

      {/* Doctor card */}
      <div style={{ padding: '12px 22px 0' }}>
        <DoctorCard lang={lang} />
      </div>

      {/* upcoming appointment */}
      <div style={{ padding: '14px 22px 20px' }}>
        <Card>
          {appointment === null ? (
            // Loading skeleton
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <div style={{ height: 10, width: 80, borderRadius: 6, background: 'rgba(61,40,64,0.08)', marginBottom: 8 }} />
                <div style={{ height: 18, width: 180, borderRadius: 8, background: 'rgba(61,40,64,0.06)' }} />
              </div>
            </div>
          ) : appointment === false ? (
            // No upcoming appointments
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 11, color: '#7A5E78', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  {L('nextCheckup')}
                </div>
                <div style={{ fontFamily: 'var(--display)', fontSize: 16, color: '#9A8595', marginTop: 2, fontStyle: 'italic' }}>
                  {L('noCheckup')}
                </div>
              </div>
              <button onClick={() => openScreen('care')} style={ghostBtn}>{L('bookCheckup')}</button>
            </div>
          ) : (
            // Real appointment data
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 11, color: '#7A5E78', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  {L('nextCheckup')}
                </div>
                <div style={{ fontFamily: 'var(--display)', fontSize: 18, color: '#3D2840', marginTop: 2, letterSpacing: '-0.01em' }}>
                  {fmtApptType(appointment.appointment_type)} · {fmtApptDate(appointment.scheduled_at).split(' · ')[0]}
                </div>
                <div style={{ fontSize: 12, color: '#5A3E5F', marginTop: 2 }}>
                  {fmtApptDate(appointment.scheduled_at).split(' · ')[1]}
                  {appointment.location ? ` · ${appointment.location}` : ''}
                </div>
              </div>
              <button onClick={() => openScreen('care')} style={ghostBtn}>{L('details')}</button>
            </div>
          )}
        </Card>
      </div>
    </div>);

}

const iconBtn = {
  width: 40, height: 40, borderRadius: 99, border: 'none',
  background: 'rgba(255,255,255,0.7)',
  display: 'grid', placeItems: 'center',
  cursor: 'pointer',
  backdropFilter: 'blur(8px)',
  boxShadow: '0 2px 8px rgba(61,40,64,0.08)'
};

const primaryBtn = {
  display: 'inline-flex', alignItems: 'center', gap: 6, justifyContent: 'center',
  padding: '11px 14px', borderRadius: 14, border: 'none',
  background: '#3D2840', color: '#FFF1E4',
  fontSize: 13, fontWeight: 600, letterSpacing: '-0.01em',
  cursor: 'pointer'
};

const ghostBtn = {
  padding: '8px 12px', borderRadius: 99, border: '1px solid rgba(61,40,64,0.15)',
  background: 'transparent', color: '#3D2840',
  fontSize: 12, fontWeight: 600, cursor: 'pointer'
};

const WEEK_FRUITS = (() => {
  const list = [
  [1, 'poppy seed', '🌱', 'Tiny but already growing.'],
  [4, 'poppy seed', '🌱', 'A speck of wonder.'],
  [6, 'pomegranate seed', '🫘', 'Heart starting to beat.'],
  [8, 'raspberry', '🫐', 'Little fingers forming.'],
  [10, 'strawberry', '🍓', 'Now moving inside you.'],
  [12, 'plum', '🟣', 'Reflexes are kicking in.'],
  [14, 'lemon', '🍋', 'Squinting and frowning practice.'],
  [16, 'avocado', '🥑', 'Hearing your voice now.'],
  [18, 'sweet potato', '🍠', 'Big stretches and kicks.'],
  [20, 'mango', '🥭', 'Halfway! Hair beginning to grow.'],
  [22, 'papaya', '🥭', 'Lips and eyebrows forming.'],
  [24, 'corn', '🌽', 'Skin getting less translucent.'],
  [26, 'coconut', '🥥', 'Eyes opening for the first time.'],
  [28, 'eggplant', '🍆', 'Dreaming in REM sleep.'],
  [30, 'cabbage', '🥬', 'Eyesight is developing.'],
  [32, 'jicama', '🍈', 'Getting fuller and stronger.'],
  [34, 'cantaloupe', '🍈', 'Settling into position.'],
  [36, 'romaine lettuce', '🥬', 'Almost full term.'],
  [38, 'leek', '🌿', 'Ready when baby is.'],
  [40, 'small pumpkin', '🎃', 'Any day now, mama.']];

  const out = {};
  for (let w = 1; w <= 40; w++) {
    let last = list[0];
    for (const item of list) {if (item[0] <= w) last = item;else break;}
    out[w] = { name: last[1], emoji: last[2], note: last[3] };
  }
  return out;
})();

// ──────────────────────────────────────────────────────────────────
// DOCTOR CARD — shared across HomeScreen, CareScreen
// ──────────────────────────────────────────────────────────────────
function DoctorCard({ lang }) {
  const L = (key) => window.tStr(key, lang, 'ui');
  const _pid = () => { try { return JSON.parse(localStorage.getItem('maya_user') || '{}').id || ''; } catch { return ''; } };
  const _tok = () => { try { return JSON.parse(localStorage.getItem('maya_session') || '{}').token || ''; } catch { return ''; } };
  const _isAuth = () => { const p = _pid(); const t = _tok(); return !!(p && t); };
  const _validEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const [doctor, setDoctor] = React.useState(() => {
    try { const u = JSON.parse(localStorage.getItem('maya_user') || '{}');
          return { name: u.doctorName || '', email: u.doctorEmail || '' }; }
    catch { return { name: '', email: '' }; }
  });
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState({ name: '', email: '' });
  const [saving, setSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState('');
  const [alertSent, setAlertSent] = React.useState(false);
  const [alertError, setAlertError] = React.useState(false);
  const [alerting, setAlerting] = React.useState(false);

  const startEdit = () => { setDraft({ name: doctor.name, email: doctor.email }); setSaveError(''); setEditing(true); };

  const save = async () => {
    if (!_validEmail(draft.email)) { setSaveError(lang === 'bn' ? 'সঠিক ইমেইল দিন' : 'Enter a valid email'); return; }
    const pid = _pid(); const tok = _tok();
    if (!pid || !tok) { setSaveError(lang === 'bn' ? 'লগ ইন করুন' : 'Please log in first'); return; }
    setSaving(true); setSaveError('');
    try {
      const res = await fetch(`${window.BACKEND_URL}/profile/${pid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tok}` },
        body: JSON.stringify({ doctor_name: draft.name, doctor_email: draft.email }),
      });
      if (res.ok) {
        setDoctor({ name: draft.name, email: draft.email });
        try {
          const u = JSON.parse(localStorage.getItem('maya_user') || '{}');
          u.doctorName = draft.name; u.doctorEmail = draft.email;
          localStorage.setItem('maya_user', JSON.stringify(u));
        } catch {}
        setEditing(false);
      } else {
        setSaveError(lang === 'bn' ? 'সেভ হয়নি। আবার চেষ্টা করুন।' : 'Could not save. Try again.');
      }
    } catch {
      setSaveError(lang === 'bn' ? 'সংযোগ সমস্যা। আবার চেষ্টা করুন।' : 'Connection error. Try again.');
    } finally { setSaving(false); }
  };

  const alertDoctor = async (trigger = 'manual') => {
    if (!doctor.email) return;
    const pid = _pid(); const tok = _tok();
    if (!pid || !tok) return;
    setAlerting(true); setAlertError(false);
    try {
      const res = await fetch(`${window.BACKEND_URL}/doctor/alert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tok}` },
        body: JSON.stringify({ patient_id: pid, trigger }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.sent) {
          setAlertSent(true);
          setTimeout(() => setAlertSent(false), 5000);
        } else {
          setAlertError(true);
          setTimeout(() => setAlertError(false), 4000);
        }
      } else {
        setAlertError(true);
        setTimeout(() => setAlertError(false), 4000);
      }
    } catch {
      setAlertError(true);
      setTimeout(() => setAlertError(false), 4000);
    } finally { setAlerting(false); }
  };

  const inputStyle = {
    width: '100%', padding: '10px 14px', borderRadius: 12, border: '1.5px solid rgba(61,40,64,0.15)',
    fontSize: 14, color: '#2A1A36', background: '#FAFAFA', outline: 'none', boxSizing: 'border-box',
  };
  const canSave = _validEmail(draft.email) && !saving;

  return (
    <Card style={{ padding: '14px 16px' }}>
      {!editing ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 14, background: doctor.email ? '#EBF5FF' : '#F0E8F5', display: 'grid', placeItems: 'center', fontSize: 20, flexShrink: 0 }}>
            {doctor.email ? '👨‍⚕️' : '➕'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, color: '#7A5E78', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{L('doctorCardTitle')}</div>
            {doctor.email ? (
              <div>
                <div style={{ fontSize: 14, color: '#2A1A36', fontWeight: 600, marginTop: 1 }}>{doctor.name || doctor.email}</div>
                {doctor.name && <div style={{ fontSize: 11, color: '#7A5E78', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doctor.email}</div>}
                {alertError && <div style={{ fontSize: 11, color: '#E74C3C', marginTop: 2 }}>{lang === 'bn' ? 'পাঠানো যায়নি' : 'Could not send'}</div>}
              </div>
            ) : (
              <div style={{ fontSize: 13, color: '#9A8595', marginTop: 2, lineHeight: 1.4 }}>{L('addDoctorPrompt')}</div>
            )}
          </div>
          {doctor.email ? (
            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
              <button onClick={() => alertDoctor()} disabled={alerting || alertSent} style={{
                padding: '7px 12px', borderRadius: 99, border: 'none',
                background: alertSent ? '#27AE60' : alertError ? '#E74C3C' : '#F08A6E', color: '#FFF1E4',
                fontSize: 11, fontWeight: 700, cursor: (alerting || alertSent) ? 'not-allowed' : 'pointer', letterSpacing: '0.02em',
              }}>
                {alertSent ? '✓ ' + L('doctorAlerted') : alerting ? '⏳' : '🔔 ' + L('alertDoctor')}
              </button>
              <button onClick={startEdit} style={{ padding: '7px 10px', borderRadius: 99, border: '1.5px solid rgba(61,40,64,0.18)', background: 'transparent', color: '#5A3E5F', fontSize: 12, cursor: 'pointer' }}>✏️</button>
            </div>
          ) : (
            <button onClick={startEdit} style={{ padding: '8px 14px', borderRadius: 99, border: 'none', background: '#3D2840', color: '#FFF1E4', fontSize: 12, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
              {lang === 'bn' ? 'যোগ করুন' : 'Add'}
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 12, color: '#7A5E78', fontWeight: 600 }}>{L('doctorCardTitle')}</div>
          <input style={inputStyle} placeholder={L('fieldDoctorName')} value={draft.name} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))} maxLength={80} />
          <input style={{ ...inputStyle, borderColor: draft.email && !_validEmail(draft.email) ? '#E74C3C' : 'rgba(61,40,64,0.15)' }} placeholder={L('fieldDoctorEmail')} type="email" value={draft.email} onChange={e => { setDraft(d => ({ ...d, email: e.target.value })); setSaveError(''); }} maxLength={120} />
          {saveError && <div style={{ fontSize: 12, color: '#E74C3C', marginTop: -4 }}>{saveError}</div>}
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={save} disabled={!canSave} style={{
              flex: 1, padding: '11px', borderRadius: 12, border: 'none',
              background: !canSave ? 'rgba(61,40,64,0.2)' : '#3D2840',
              color: '#FFF1E4', fontSize: 13, fontWeight: 700, cursor: !canSave ? 'not-allowed' : 'pointer',
            }}>{saving ? L('saving') : L('saveChanges')}</button>
            <button onClick={() => { setEditing(false); setSaveError(''); }} style={{ padding: '11px 16px', borderRadius: 12, border: '1.5px solid rgba(61,40,64,0.18)', background: 'transparent', color: '#5A3E5F', fontSize: 13, cursor: 'pointer' }}>{L('cancel')}</button>
          </div>
        </div>
      )}
    </Card>
  );
}

window.HomeScreen = HomeScreen;
window.DoctorCard = DoctorCard;
window.MeshBg = MeshBg;
window.Grain = Grain;
window.Pill = Pill;
window.Card = Card;
window.WeekRing = WeekRing;
window.Waveform = Waveform;
window.WEEK_FRUITS = WEEK_FRUITS;
window.uiBtns = { iconBtn, primaryBtn, ghostBtn };
