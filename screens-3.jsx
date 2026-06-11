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
function getWeekInfo(week) {
  const w = Math.min(40, Math.max(1, week || 1));
  const trimesterKey = w <= 13 ? 'trimester1' : w <= 27 ? 'trimester2' : 'trimester3';
  const fruit = (window.WEEK_FRUITS || {})[w] || { emoji: '🌱', name: 'tiny' };
  return { trimesterKey, fetalEmoji: fruit.emoji, fetalName: fruit.name };
}

function ProfileEditModal({ profile, lang, L, saving, saveError, onSave, onCancel }) {
  const [draft, setDraft] = React.useState({ ...profile });
  const set = (k, v) => setDraft(d => ({ ...d, [k]: v }));
  const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  const inputStyle = {
    width: '100%', padding: '12px 14px', borderRadius: 14,
    border: '1.5px solid rgba(61,40,64,0.12)',
    background: 'rgba(255,255,255,0.85)', fontSize: 15,
    fontFamily: 'var(--ui)', color: '#2A1A36', outline: 'none', boxSizing: 'border-box',
  };
  const labelStyle = { fontSize: 11, color: '#7A5E78', fontWeight: 600, marginBottom: 4, display: 'block' };

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 60,
      background: 'linear-gradient(180deg, #FFEFE2 0%, #F4D7E5 60%, #E0D5F0 100%)',
      overflow: 'auto', padding: '54px 22px 40px',
    }}>
      <Grain/>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
        <button onClick={onCancel} style={window.uiBtns.iconBtn}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3D2840" strokeWidth="2" strokeLinecap="round">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </button>
        <div style={{ fontFamily: 'var(--display)', fontSize: 22, color: '#2A1A36', letterSpacing: '-0.01em', flex: 1 }}>
          {L('editProfile')}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={labelStyle}>{L('fieldName')}</label>
          <input style={inputStyle} value={draft.name || ''} onChange={e => set('name', e.target.value)} maxLength={80}/>
        </div>

        <div>
          <label style={labelStyle}>{L('fieldWeek')} — {draft.pregnancyWeek || 20}</label>
          <input type="range" min={4} max={40} step={1}
            value={draft.pregnancyWeek || 20}
            onChange={e => set('pregnancyWeek', Number(e.target.value))}
            style={{ width: '100%', accentColor: '#3D2840' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#9A8595' }}>
            <span>Week 4</span><span>Week 40</span>
          </div>
        </div>

        <div>
          <label style={labelStyle}>{L('fieldAge')}</label>
          <input style={inputStyle} type="number" min={14} max={60}
            value={draft.age || ''} onChange={e => set('age', e.target.value ? Number(e.target.value) : null)}/>
        </div>

        <div>
          <label style={labelStyle}>{L('fieldCity')}</label>
          <input style={inputStyle} value={draft.city || ''} onChange={e => set('city', e.target.value)} maxLength={80}/>
        </div>

        <div>
          <label style={labelStyle}>{L('fieldBlood')}</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
            {BLOOD_GROUPS.map(bg => (
              <button key={bg} onClick={() => set('bloodGroup', bg)} style={{
                padding: '10px 6px', borderRadius: 12, border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: 600,
                background: draft.bloodGroup === bg ? '#3D2840' : 'rgba(255,255,255,0.85)',
                color: draft.bloodGroup === bg ? '#FFF1E4' : '#2A1A36',
              }}>{bg}</button>
            ))}
          </div>
        </div>

        <div>
          <label style={labelStyle}>{L('fieldFirstPreg')}</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {[true, false].map(v => (
              <button key={String(v)} onClick={() => set('isFirstPregnancy', v)} style={{
                flex: 1, padding: '12px', borderRadius: 14, border: 'none', cursor: 'pointer',
                fontSize: 14, fontWeight: 600,
                background: draft.isFirstPregnancy === v ? '#3D2840' : 'rgba(255,255,255,0.85)',
                color: draft.isFirstPregnancy === v ? '#FFF1E4' : '#2A1A36',
              }}>
                {v ? L('firstPregYes') : L('firstPregNo')}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label style={labelStyle}>{L('fieldLang')}</label>
          <div style={{ display: 'flex', gap: 6 }}>
            {[{v:'bn',l:'বাংলা'},{v:'mixed',l:'Both'},{v:'en',l:'English'}].map(opt => (
              <button key={opt.v} onClick={() => set('lang', opt.v)} style={{
                flex: 1, padding: '10px 6px', borderRadius: 12, border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: 700,
                background: draft.lang === opt.v ? '#3D2840' : 'rgba(255,255,255,0.85)',
                color: draft.lang === opt.v ? '#FFF1E4' : '#2A1A36',
              }}>{opt.l}</button>
            ))}
          </div>
        </div>

        <div>
          <label style={labelStyle}>{L('fieldGuardianName')}</label>
          <input style={inputStyle} value={draft.guardianName || ''} onChange={e => set('guardianName', e.target.value)} maxLength={80}/>
        </div>

        <div>
          <label style={labelStyle}>{L('fieldGuardianPhone')}</label>
          <input style={inputStyle} type="tel" value={draft.guardianPhone || ''} onChange={e => set('guardianPhone', e.target.value)} maxLength={20}/>
        </div>

        <div>
          <label style={labelStyle}>{L('fieldDoctorName')}</label>
          <input style={inputStyle} placeholder={lang === 'bn' ? 'ডাক্তারের নাম' : "e.g. Dr. Rahman"} value={draft.doctorName || ''} onChange={e => set('doctorName', e.target.value)} maxLength={80}/>
        </div>

        <div>
          <label style={labelStyle}>{L('fieldDoctorEmail')}</label>
          <input style={inputStyle} type="email" placeholder="doctor@example.com" value={draft.doctorEmail || ''} onChange={e => set('doctorEmail', e.target.value)} maxLength={120}/>
          <div style={{ fontSize: 10, color: '#7A5E78', marginTop: 4, lineHeight: 1.5 }}>
            {lang === 'bn' ? 'তারা ঝুঁকি শনাক্ত করলে এই ঠিকানায় ইমেইল পাঠাবে।' : 'Tara will email this address when danger is detected.'}
          </div>
        </div>

        {saveError && (
          <div style={{ fontSize: 12, color: '#C0392B', textAlign: 'center' }}>{saveError}</div>
        )}

        <button onClick={() => onSave(draft)} disabled={saving} style={{
          padding: '16px', borderRadius: 99, border: 'none',
          background: saving ? 'rgba(61,40,64,0.3)' : '#3D2840',
          color: '#FFF1E4', fontSize: 15, fontWeight: 600,
          cursor: saving ? 'not-allowed' : 'pointer',
          boxShadow: saving ? 'none' : '0 14px 30px -10px rgba(61,40,64,0.5)',
        }}>
          {saving ? L('saving') : L('saveChanges')}
        </button>
      </div>
    </div>
  );
}

function ProfileScreen({ state, setState, openScreen, tweak, setTweak, onLogout }) {
  const { iconBtn } = window.uiBtns;
  const lang = tweak.lang;
  const L = (key, type) => window.tStr(key, lang, type);

  const storedUser = React.useMemo(() => {
    try { return JSON.parse(localStorage.getItem('maya_user') || 'null'); } catch { return null; }
  }, []);

  const [profile, setProfile] = React.useState({
    name:             storedUser?.name             ?? tweak.mothersName ?? 'Maya',
    pregnancyWeek:    storedUser?.pregnancyWeek    ?? state.week,
    lang:             storedUser?.lang             ?? tweak.lang,
    age:              storedUser?.age              ?? null,
    city:             storedUser?.city             ?? null,
    bloodGroup:       storedUser?.bloodGroup       ?? null,
    isFirstPregnancy: storedUser?.isFirstPregnancy ?? null,
    guardianName:     storedUser?.guardianName     ?? null,
    guardianPhone:    storedUser?.guardianPhone    ?? null,
    doctorName:       storedUser?.doctorName       ?? null,
    doctorEmail:      storedUser?.doctorEmail      ?? null,
    lastWeight:       storedUser?.lastWeight       ?? null,
    lastBpReading:    storedUser?.lastBpReading    ?? null,
  });

  const [showEdit, setShowEdit]   = React.useState(false);
  const [saving, setSaving]       = React.useState(false);
  const [saveError, setSaveError] = React.useState('');

  const { trimesterKey, fetalEmoji, fetalName } = getWeekInfo(profile.pregnancyWeek);

  const dueDate = (() => {
    const daysRemaining = (40 - (profile.pregnancyWeek || state.week)) * 7;
    const d = new Date(Date.now() + daysRemaining * 86400000);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  })();

  React.useEffect(() => {
    const sessionRaw = localStorage.getItem('maya_session');
    const userRaw    = localStorage.getItem('maya_user');
    if (!sessionRaw || !userRaw) return;
    let session, user;
    try { session = JSON.parse(sessionRaw); user = JSON.parse(userRaw); } catch { return; }
    if (!session.token || !user.id) return;

    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), 5000);
    fetch(`${window.BACKEND_URL}/profile/${user.id}`, {
      headers: { Authorization: `Bearer ${session.token}` },
      signal: controller.signal,
    })
      .then(r => r.ok ? r.json().catch(() => null) : null)
      .then(data => {
        clearTimeout(tid);
        if (!data) return;
        setProfile(p => ({ ...p, ...data }));
        if (window.saveUser) window.saveUser({ ...user, ...data });
        setState(s => ({ ...s, name: data.name ?? s.name, week: data.pregnancyWeek ?? s.week, lang: data.lang ?? s.lang }));
        if (data.name)          setTweak('mothersName', data.name);
        if (data.pregnancyWeek) setTweak('week', data.pregnancyWeek);
        if (data.lang)          setTweak('lang', data.lang);
      })
      .catch(() => clearTimeout(tid));
    return () => { controller.abort(); clearTimeout(tid); };
  }, []);

  const handleSave = async (draft) => {
    setSaving(true);
    setSaveError('');

    const sessionRaw = localStorage.getItem('maya_session');
    const userRaw    = localStorage.getItem('maya_user');

    const applyLocally = (d) => {
      try {
        const base = userRaw ? JSON.parse(userRaw) : {};
        if (window.saveUser) window.saveUser({ ...base, ...d });
      } catch {}
      setProfile(d);
      setState(s => ({ ...s, name: d.name, week: d.pregnancyWeek, lang: d.lang }));
      setTweak('mothersName', d.name);
      setTweak('week', d.pregnancyWeek);
      setTweak('lang', d.lang);
      setSaving(false);
      setShowEdit(false);
    };

    let session, user;
    try {
      if (sessionRaw && userRaw) {
        session = JSON.parse(sessionRaw);
        user    = JSON.parse(userRaw);
      }
    } catch {}

    if (!session?.token || !user?.id) { applyLocally(draft); return; }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    try {
      const res = await fetch(`${window.BACKEND_URL}/profile/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}` },
        body: JSON.stringify({
          name:               draft.name,
          pregnancy_week:     draft.pregnancyWeek,
          lang:               draft.lang,
          age:                draft.age,
          city:               draft.city,
          blood_group:        draft.bloodGroup,
          is_first_pregnancy: draft.isFirstPregnancy,
          guardian_name:      draft.guardianName,
          guardian_phone:     draft.guardianPhone,
          doctor_name:        draft.doctorName,
          doctor_email:       draft.doctorEmail,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!res.ok) {
        let detail = 'Save failed';
        try { detail = (await res.json()).detail || detail; } catch {}
        throw new Error(detail);
      }
      const data = await res.json();
      const merged = { ...draft, ...data };
      if (window.saveUser) window.saveUser({ ...user, ...merged });
      setProfile(p => ({ ...p, ...merged }));
      setState(s => ({ ...s, name: data.name, week: data.pregnancyWeek, lang: data.lang }));
      setTweak('mothersName', data.name);
      setTweak('week',        data.pregnancyWeek);
      setTweak('lang',        data.lang);
      setSaving(false);
      setShowEdit(false);
    } catch (e) {
      clearTimeout(timeoutId);
      if (e.name === 'AbortError') {
        // Timeout: fall back to localStorage-only save so the user isn't stuck
        applyLocally(draft);
      } else {
        setSaving(false);
        setSaveError(e.message || 'Could not save. Please try again.');
      }
    }
  };

  const langLabel = profile.lang === 'bn' ? 'বাংলা' : profile.lang === 'en' ? 'English' : 'Mixed';
  const firstPregLabel = profile.isFirstPregnancy === null || profile.isFirstPregnancy === undefined
    ? '—'
    : profile.isFirstPregnancy ? L('firstPregYes') : L('firstPregNo');

  return (
    <div className="screen profile">
      <div style={{ padding: '0 18px 8px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={() => openScreen('home')} style={iconBtn}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3D2840" strokeWidth="2" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <div style={{ fontFamily: 'var(--display)', fontSize: 22, color: '#2A1A36', letterSpacing: '-0.01em' }}>
          {L('yourProfile')}
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
            {(profile.name || tweak.mothersName || 'M').slice(0,1).toUpperCase()}
          </div>
          <div style={{ fontFamily: 'var(--display)', fontSize: 26, color: '#3D2840', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
            {profile.name}
          </div>
          <div style={{ fontSize: 12, color: '#5A3E5F', marginTop: 4 }}>
            {L('motherToBe')} · Week {profile.pregnancyWeek}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 12 }}>
            <Pill tone="cream">{fetalEmoji} {fetalName}</Pill>
            <Pill tone="cream">{L(trimesterKey)}</Pill>
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
                <div style={{ fontFamily: 'var(--display)', fontSize: 20, marginTop: 3 }}>{40 - (profile.pregnancyWeek || state.week)}w</div>
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: '#7A5E78', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Estimated due date</div>
              <div style={{ fontFamily: 'var(--display)', fontSize: 19, color: '#3D2840', marginTop: 2, letterSpacing: '-0.01em' }}>{dueDate}</div>
              <div style={{ fontSize: 11, color: '#5A3E5F', marginTop: 2 }}>Week {profile.pregnancyWeek} of 40</div>
            </div>
          </div>
        </Card>
      </div>

      {/* personal details */}
      <div style={{ padding: '16px 22px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ fontFamily: 'var(--display)', fontSize: 18, color: '#3D2840', letterSpacing: '-0.01em' }}>
            Personal details
          </div>
          <button onClick={() => setShowEdit(true)} style={{
            padding: '6px 12px', borderRadius: 99, border: '1px solid rgba(61,40,64,0.15)',
            background: 'transparent', color: '#5A3E5F', cursor: 'pointer', fontSize: 11, fontWeight: 600,
          }}>
            {L('editProfile')}
          </button>
        </div>
        <Card style={{ padding: 0 }}>
          {[
            { label: L('fieldName'),      value: profile.name || '—',        icon: '👤' },
            { label: L('fieldWeek'),      value: `Week ${profile.pregnancyWeek}`, icon: '🌱' },
            { label: L('fieldAge'),       value: profile.age       ? `${profile.age}` : '—', icon: '🎂' },
            { label: L('fieldCity'),      value: profile.city      || '—',   icon: '📍' },
            { label: L('fieldBlood'),     value: profile.bloodGroup || '—',  icon: '🩸' },
            { label: L('fieldFirstPreg'), value: firstPregLabel,             icon: '✨' },
            { label: L('fieldLang'),      value: langLabel,                  icon: '🌐' },
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

      {/* health snapshot — only shown when real data exists */}
      {(profile.lastWeight || profile.lastBpReading) && (
        <div style={{ padding: '16px 22px 0' }}>
          <div style={{ fontFamily: 'var(--display)', fontSize: 18, color: '#3D2840', marginBottom: 8, letterSpacing: '-0.01em' }}>
            {L('healthSnapshot')}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${profile.lastWeight && profile.lastBpReading ? 2 : 1}, 1fr)`, gap: 8 }}>
            {profile.lastWeight && (
              <Card style={{ background: '#FBE5D6', padding: 14 }}>
                <div style={{ fontSize: 10, color: '#7A5E78', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Current weight</div>
                <div style={{ fontFamily: 'var(--display)', fontSize: 20, color: '#3D2840', marginTop: 4, letterSpacing: '-0.02em', lineHeight: 1 }}>{profile.lastWeight}</div>
                <div style={{ fontSize: 9, color: '#5A3E5F', marginTop: 2 }}>kg</div>
              </Card>
            )}
            {profile.lastBpReading && (
              <Card style={{ background: '#E6F1DC', padding: 14 }}>
                <div style={{ fontSize: 10, color: '#7A5E78', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Blood pressure</div>
                <div style={{ fontFamily: 'var(--display)', fontSize: 20, color: '#3D2840', marginTop: 4, letterSpacing: '-0.02em', lineHeight: 1 }}>{profile.lastBpReading}</div>
                <div style={{ fontSize: 9, color: '#5A3E5F', marginTop: 2 }}>mmHg</div>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* care circle — guardian + doctor */}
      {(profile.guardianName || profile.guardianPhone || profile.doctorEmail) && (
        <div style={{ padding: '16px 22px 0' }}>
          <div style={{ fontFamily: 'var(--display)', fontSize: 18, color: '#3D2840', marginBottom: 8, letterSpacing: '-0.01em' }}>
            {L('careCircle')}
          </div>
          <Card style={{ padding: 0 }}>
            {(profile.guardianName || profile.guardianPhone) && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: profile.doctorEmail ? '1px solid rgba(61,40,64,0.06)' : 'none' }}>
                <div style={{
                  width: 38, height: 38, borderRadius: '50%', background: '#E0D5F0',
                  display: 'grid', placeItems: 'center', fontWeight: 700,
                  color: '#3D2840', fontFamily: 'var(--display)', fontSize: 18,
                }}>
                  {profile.guardianName ? profile.guardianName.slice(0,1).toUpperCase() : '?'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, color: '#2A1A36', fontWeight: 600 }}>{profile.guardianName || 'Guardian'}</div>
                  <div style={{ fontSize: 11, color: '#7A5E78' }}>Emergency contact</div>
                </div>
                {profile.guardianPhone && (
                  <a href={`tel:${profile.guardianPhone}`} style={{
                    width: 32, height: 32, borderRadius: 99, border: 'none', background: '#F4ECE0',
                    display: 'grid', placeItems: 'center', cursor: 'pointer', textDecoration: 'none',
                  }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3D2840" strokeWidth="2" strokeLinecap="round">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>
                    </svg>
                  </a>
                )}
              </div>
            )}
            {profile.doctorEmail && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px' }}>
                <div style={{
                  width: 38, height: 38, borderRadius: '50%', background: '#EBF5FF',
                  display: 'grid', placeItems: 'center', fontSize: 20,
                }}>👨‍⚕️</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, color: '#2A1A36', fontWeight: 600 }}>{profile.doctorName || profile.doctorEmail}</div>
                  {profile.doctorName && <div style={{ fontSize: 11, color: '#7A5E78', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profile.doctorEmail}</div>}
                  <div style={{ fontSize: 10, color: '#9A8595', marginTop: 1 }}>
                    {lang === 'bn' ? 'তারা বিপদে ইমেইল পাঠাবে' : 'Tara will email on danger'}
                  </div>
                </div>
                <a href={`mailto:${profile.doctorEmail}`} style={{
                  width: 32, height: 32, borderRadius: 99, border: 'none', background: '#F4ECE0',
                  display: 'grid', placeItems: 'center', cursor: 'pointer', textDecoration: 'none',
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3D2840" strokeWidth="2" strokeLinecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                </a>
              </div>
            )}
          </Card>
        </div>
      )}

      <div style={{ padding: '14px 22px 20px' }}>
        <button onClick={onLogout} style={{
          width: '100%', padding: '14px', borderRadius: 16, border: '1px solid rgba(61,40,64,0.15)',
          background: 'transparent', color: '#5A3E5F', cursor: 'pointer',
          fontSize: 13, fontWeight: 600,
        }}>Sign out</button>
      </div>

      {showEdit && (
        <ProfileEditModal
          profile={profile}
          lang={lang}
          L={L}
          saving={saving}
          saveError={saveError}
          onSave={handleSave}
          onCancel={() => { setShowEdit(false); setSaveError(''); }}
        />
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────
// SETTINGS
// ──────────────────────────────────────────────────────────────────
function SettingsScreen({ state, setState, openScreen, tweak, setTweak, onLogout }) {
  const { iconBtn } = window.uiBtns;
  const lang = tweak.lang;
  const L = (key, type) => window.tStr(key, lang, type);

  const _loadPrefs = () => { try { return JSON.parse(localStorage.getItem('maya_prefs') || 'null'); } catch { return null; } };
  const _initPrefs = _loadPrefs() || {};
  const [notifications, setNotif] = React.useState(_initPrefs.notifications || { daily: true, kicks: true, meds: true, mood: false });
  const [voice, setVoice] = React.useState(_initPrefs.voice || { wake: true, tone: 'warm' });
  const [confirmLogout, setConfirmLogout] = React.useState(false);
  const _saveTimer = React.useRef(null);

  const storedUser = React.useMemo(() => {
    try { return JSON.parse(localStorage.getItem('maya_user') || 'null'); } catch { return null; }
  }, []);
  const phone = storedUser && storedUser.phone !== 'guest' ? storedUser.phone : null;

  // Sync preferences from backend on mount (handles cross-device login)
  React.useEffect(() => {
    const session = (() => { try { return JSON.parse(localStorage.getItem('maya_session') || 'null'); } catch { return null; } })();
    if (!session || session.isGuest || !session.patientId || !session.token) return;
    fetch(`${window.BACKEND_URL}/profile/${session.patientId}`, {
      headers: { Authorization: `Bearer ${session.token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(profile => {
        if (!profile) return;
        if (profile.notifications) {
          try { const n = JSON.parse(profile.notifications); setNotif(n); } catch {}
        }
        if (profile.voiceSettings) {
          try { const v = JSON.parse(profile.voiceSettings); setVoice(v); } catch {}
        }
        if (profile.theme && profile.theme !== tweak.theme) setTweak('theme', profile.theme);
        if (profile.lang  && profile.lang  !== tweak.lang)  setTweak('lang',  profile.lang);
      })
      .catch(() => {});
  }, []);

  const savePrefs = (patch) => {
    const prefs = { ...(_loadPrefs() || {}), ...patch };
    localStorage.setItem('maya_prefs', JSON.stringify(prefs));
    const session = (() => { try { return JSON.parse(localStorage.getItem('maya_session') || 'null'); } catch { return null; } })();
    if (!session || session.isGuest || !session.patientId || !session.token) return;
    if (_saveTimer.current) clearTimeout(_saveTimer.current);
    _saveTimer.current = setTimeout(() => {
      const body = {};
      if (patch.theme         != null) body.theme          = patch.theme;
      if (patch.lang          != null) body.lang           = patch.lang;
      if (patch.notifications != null) body.notifications  = JSON.stringify(patch.notifications);
      if (patch.voice         != null) body.voice_settings = JSON.stringify(patch.voice);
      fetch(`${window.BACKEND_URL}/profile/${session.patientId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}` },
        body: JSON.stringify(body),
      }).catch(() => {});
    }, 600);
  };

  const setLang = (l) => { setTweak('lang', l); savePrefs({ lang: l }); };

  return (
    <div className="screen settings">
      <div style={{ padding: '0 18px 8px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={() => openScreen('home')} style={iconBtn}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3D2840" strokeWidth="2" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <div style={{ fontFamily: 'var(--display)', fontSize: 22, color: '#2A1A36', letterSpacing: '-0.01em' }}>
          {L('settingsTitle')}
        </div>
      </div>

      {/* LANGUAGE — the headline setting */}
      <div style={{ padding: '14px 22px 0' }}>
        <div style={{ fontSize: 11, color: '#7A5E78', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8, padding: '0 4px' }}>
          {L('sectionLanguage')}
        </div>
        <Card style={{ background: 'linear-gradient(135deg, #FBE5D6, #F4D7E5)', padding: 18 }}>
          <div style={{ fontFamily: 'var(--display)', fontSize: 18, color: '#3D2840', letterSpacing: '-0.01em' }}>
            {L('howShouldTaraTalk')}
          </div>
          <div style={{ fontSize: 12, color: '#5A3E5F', marginTop: 4 }}>
            {L('switchAnytime')}
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
          {L('sectionNotifications')}
        </div>
        <Card style={{ padding: 0 }}>
          {[
            { k: 'daily', l: L('notifDaily'),   s: L('notifDailySub') },
            { k: 'kicks', l: L('notifKicks'),   s: L('notifKicksSub') },
            { k: 'meds',  l: L('notifMeds'),    s: L('notifMedsSub') },
            { k: 'mood',  l: L('notifMood'),    s: L('notifMoodSub') },
          ].map((it, i, arr) => (
            <ToggleRow key={it.k} title={it.l} sub={it.s} on={notifications[it.k]} onChange={v => { const n = { ...notifications, [it.k]: v }; setNotif(n); savePrefs({ notifications: n }); }} last={i === arr.length - 1}/>
          ))}
        </Card>
      </div>

      {/* Voice + appearance */}
      <div style={{ padding: '16px 22px 0' }}>
        <div style={{ fontSize: 11, color: '#7A5E78', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8, padding: '0 4px' }}>
          {L('sectionVoice')}
        </div>
        <Card style={{ padding: 0 }}>
          <ToggleRow title={L('wakeOnHiTara')} sub={L('wakeOnHiTaraSub')} on={voice.wake} onChange={v => { const s = { ...voice, wake: v }; setVoice(s); savePrefs({ voice: s }); }}/>
          <Row title="Tara's voice tone" value="Warm & soft">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9A8595" strokeWidth="2" strokeLinecap="round"><path d="M9 6l6 6-6 6"/></svg>
          </Row>
          <Row title="Theme" value={tweak.theme === 'dawn' ? 'Dawn' : tweak.theme === 'dusk' ? 'Dusk' : 'Night'}>
            <div style={{ display: 'flex', gap: 4 }}>
              {['dawn', 'dusk', 'night'].map(th => (
                <button key={th} onClick={() => { setTweak('theme', th); savePrefs({ theme: th }); }} style={{
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
  const lang = state.lang;
  const L = (key, type) => window.tStr(key, lang, type);
  const SYMPTOMS = [
    { k: 'headache', lKey: 'symHeadache', w: 2, c: '🤕' },
    { k: 'swelling', lKey: 'symSwelling', w: 4, c: '🫆' },
    { k: 'vision',   lKey: 'symVision',   w: 4, c: '👁️' },
    { k: 'bleeding', lKey: 'symBleeding', w: 5, c: '🩸' },
    { k: 'pain',     lKey: 'symPain',     w: 4, c: '⚡' },
    { k: 'fever',    lKey: 'symFever',    w: 3, c: '🌡️' },
    { k: 'kicks',    lKey: 'symKicks',    w: 3, c: '🤰' },
    { k: 'nausea',   lKey: 'symNausea',   w: 2, c: '🤢' },
    { k: 'breath',   lKey: 'symBreath',   w: 4, c: '😮‍💨' },
    { k: 'mood',     lKey: 'symMood',     w: 3, c: '🌧️' },
  ];
  const [sel, setSel] = React.useState({});
  const [submitted, setSubmitted] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [taraMsg, setTaraMsg] = React.useState(null);
  const [apiError, setApiError] = React.useState(false);
  const [vitals, setVitals] = React.useState({ bp: null, sleep: null, hydration: null });
  const [backendLevel, setBackendLevel] = React.useState(null);
  const [doctorAlerted, setDoctorAlerted] = React.useState(false);
  const [alertingDoctor, setAlertingDoctor] = React.useState(false);

  React.useEffect(() => {
    const patientId = (() => { try { return JSON.parse(localStorage.getItem('maya_user') || '{}').id || null; } catch { return null; } })();
    const token = (() => { try { return JSON.parse(localStorage.getItem('maya_session') || '{}').token || ''; } catch { return ''; } })();
    if (!patientId || !token) return;
    const authHeader = { 'Authorization': `Bearer ${token}` };
    Promise.all([
      fetch(`${window.BACKEND_URL}/profile/${patientId}`, { headers: authHeader })
        .then(r => r.ok ? r.json() : null).catch(() => null),
      fetch(`${window.BACKEND_URL}/health-logs/${patientId}?data_type=sleep&limit=1`, { headers: authHeader })
        .then(r => r.ok ? r.json() : []).catch(() => []),
      fetch(`${window.BACKEND_URL}/health-logs/${patientId}?data_type=hydration&limit=1`, { headers: authHeader })
        .then(r => r.ok ? r.json() : []).catch(() => []),
    ]).then(([profile, sleepLogs, hydrationLogs]) => {
      setVitals({
        bp: profile?.lastBpReading || null,
        sleep: sleepLogs?.[0]?.value || null,
        hydration: hydrationLogs?.[0]?.value || null,
      });
    });
  }, []);

  const score = Object.entries(sel).reduce((acc, [k, on]) => acc + (on ? SYMPTOMS.find(s => s.k === k).w : 0), 0);
  const previewLevel = score === 0 ? 'safe' : score <= 3 ? 'low' : score <= 7 ? 'moderate' : 'high';
  const level = (submitted && backendLevel) ? backendLevel : previewLevel;
  const levelMap = {
    safe:     { label: L('riskLabelSafe'),     tone: 'linear-gradient(135deg, #E6F1DC, #DDEEFF)', dot: '#7BC894', taraMood: 'happy',   msg: L('riskSafe', 'tara') },
    low:      { label: L('riskLabelLow'),      tone: 'linear-gradient(135deg, #F2EBDA, #FBE5D6)', dot: '#E5A064', taraMood: 'idle',    msg: L('riskLow', 'tara') },
    moderate: { label: L('riskLabelModerate'), tone: 'linear-gradient(135deg, #FBD6CB, #F4D7E5)', dot: '#E5773A', taraMood: 'worried', msg: L('riskModerate', 'tara') },
    high:     { label: L('riskLabelHigh'),     tone: 'linear-gradient(135deg, #F8C9C0, #F4A4B8)', dot: '#D14040', taraMood: 'worried', msg: L('riskHigh', 'tara') },
  };
  const lvl = levelMap[level];

  const toggle = (k) => setSel(s => ({ ...s, [k]: !s[k] }));
  const reset = () => { setSel({}); setSubmitted(false); setTaraMsg(null); setApiError(false); setBackendLevel(null); setDoctorAlerted(false); };

  const alertMyDoctor = async (symptoms, level) => {
    const pid = (() => { try { return JSON.parse(localStorage.getItem('maya_user') || '{}').id || ''; } catch { return ''; } })();
    const tok = (() => { try { return JSON.parse(localStorage.getItem('maya_session') || '{}').token || ''; } catch { return ''; } })();
    if (!pid || !tok || pid === 'guest') return;
    setAlertingDoctor(true);
    try {
      const res = await fetch(`${window.BACKEND_URL}/doctor/alert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tok}` },
        body: JSON.stringify({ patient_id: pid, trigger: 'risk', symptoms, level }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.sent) { setDoctorAlerted(true); setTimeout(() => setDoctorAlerted(false), 6000); }
      }
    } catch {} finally { setAlertingDoctor(false); }
  };

  const analyse = async () => {
    const selectedSymKeys  = Object.entries(sel).filter(([, on]) => on).map(([k]) => k);
    const selectedSymNames = selectedSymKeys.map(k => L(SYMPTOMS.find(s => s.k === k).lKey));
    const patientId = (() => { try { return JSON.parse(localStorage.getItem('maya_user') || '{}').id || 'guest'; } catch { return 'guest'; } })();
    const token = (() => { try { return JSON.parse(localStorage.getItem('maya_session') || '{}').token || ''; } catch { return ''; } })();
    setLoading(true);
    setApiError(false);
    try {
      // Step 1: backend computes authoritative risk level + logs symptoms
      let finalLevel = previewLevel;
      try {
        const riskRes = await fetch(`${window.BACKEND_URL}/risk-score`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
          body: JSON.stringify({ patient_id: patientId, symptoms: selectedSymKeys }),
        });
        if (riskRes.ok) {
          const riskData = await riskRes.json();
          finalLevel = riskData.level || previewLevel;
        }
      } catch {}
      setBackendLevel(finalLevel);

      // Step 2: get Tara's AI response
      const msgText = `আমার আজ এই লক্ষণগুলো আছে: ${selectedSymNames.join(', ')}। রিস্ক স্তর: ${finalLevel}`;
      const res = await fetch(`${window.BACKEND_URL}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ patient_id: patientId, message: msgText, source: 'risk_screen' }),
      });
      const data = await res.json();
      setTaraMsg(data.message || data.voice_text || levelMap[finalLevel].msg);
      setSubmitted(true);

      // Auto-alert doctor on high risk
      if (finalLevel === 'high' && patientId !== 'guest') {
        alertMyDoctor(selectedSymNames, finalLevel);
      }
    } catch (_) {
      setApiError(true);
      setTaraMsg(levelMap[backendLevel || previewLevel].msg);
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="screen risk">
      <div style={{ padding: '0 18px 8px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={() => openScreen('home')} style={iconBtn}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3D2840" strokeWidth="2" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: '#7A5E78', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{L('forYourSafety')}</div>
          <div style={{ fontFamily: 'var(--display)', fontSize: 22, color: '#2A1A36', letterSpacing: '-0.01em', lineHeight: 1.1 }}>
            {L('riskAnalyser')}
          </div>
        </div>
        <button onClick={reset} style={{
          padding: '6px 12px', borderRadius: 99, border: '1px solid rgba(61,40,64,0.15)',
          background: 'transparent', color: '#5A3E5F', cursor: 'pointer', fontSize: 11, fontWeight: 600,
        }}>{L('reset')}</button>
      </div>

      {/* meter */}
      <div style={{ padding: '8px 22px 0' }}>
        <Card style={{ background: lvl.tone, padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <Tara size={92} mood={lvl.taraMood}/>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 10, height: 10, borderRadius: 99, background: lvl.dot }}/>
                <span style={{ fontSize: 11, color: '#5A3E5F', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{lvl.label}</span>
              </div>
              <div style={{ fontFamily: 'var(--display)', fontSize: 22, color: '#3D2840', marginTop: 4, letterSpacing: '-0.01em', lineHeight: 1.2 }}>
                {lvl.msg}
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
            <span>{L('riskLabelSafe')}</span><span>{L('riskLabelLow')}</span><span>{L('riskLabelModerate')}</span><span>{L('riskLabelHigh')}</span>
          </div>
        </Card>
      </div>

      {/* symptom picker */}
      <div style={{ padding: '16px 22px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
          <div style={{ fontFamily: 'var(--display)', fontSize: 18, color: '#3D2840', letterSpacing: '-0.01em' }}>
            {L('whatAreYouFeeling')}
          </div>
          <div style={{ fontSize: 11, color: '#7A5E78' }}>{L('tapAllThatApply')}</div>
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
                <span style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.2, flex: 1 }}>{L(sym.lKey)}</span>
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
          {L('todaysReadings')}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {(() => {
            const bpSys = vitals.bp ? parseInt(vitals.bp.split('/')[0]) : null;
            const bpCard = {
              l: 'BP',
              v: vitals.bp || '—',
              s: bpSys === null ? 'N/A' : bpSys >= 140 ? 'high' : bpSys >= 120 ? 'caution' : 'normal',
              c: bpSys === null ? '#ADA3B0' : bpSys >= 140 ? '#D14040' : bpSys >= 120 ? '#E5773A' : '#7BC894',
            };
            const slpVal = vitals.sleep ? parseFloat(vitals.sleep) : null;
            const slpCard = {
              l: 'Sleep',
              v: slpVal !== null ? slpVal + 'h' : '—',
              s: slpVal === null ? 'N/A' : slpVal >= 7 ? 'good' : slpVal >= 5 ? 'okay' : 'low',
              c: slpVal === null ? '#ADA3B0' : slpVal >= 7 ? '#7BC894' : slpVal >= 5 ? '#E5A064' : '#D14040',
            };
            const hydVal = vitals.hydration ? parseInt(vitals.hydration) : null;
            const hydCard = {
              l: 'Hydration',
              v: hydVal !== null ? hydVal + ' gl' : '—',
              s: hydVal === null ? 'N/A' : hydVal >= 8 ? 'good' : hydVal >= 5 ? 'okay' : 'low',
              c: hydVal === null ? '#ADA3B0' : hydVal >= 8 ? '#7BC894' : hydVal >= 5 ? '#E5A064' : '#D14040',
            };
            return [bpCard, slpCard, hydCard];
          })().map(s => (
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
                {lang === 'bn' ? 'তারার বিশ্লেষণ' : "Tara's read of this"}
              </div>
            </div>
            {apiError && (
              <div style={{ fontSize: 10, color: '#F4B4C8', marginBottom: 6, opacity: 0.8 }}>
                {lang === 'bn' ? '(অফলাইন — স্থানীয় বিশ্লেষণ)' : '(offline — local analysis)'}
              </div>
            )}
            <div style={{ fontFamily: 'var(--display)', fontSize: 17, lineHeight: 1.4, letterSpacing: '-0.01em' }}>
              "{taraMsg}"
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
              <button onClick={() => openScreen('chat')} style={{ ...primaryBtn, background: '#F08A6E', flex: 1, minWidth: 100 }}>
                {level === 'high' ? ('☎️ ' + L('callDoctor')) : ('💬 ' + (lang === 'bn' ? 'ডাক্তারকে বলুন' : 'Tell my doctor'))}
              </button>
              {level === 'moderate' && !doctorAlerted && (
                <button onClick={() => alertMyDoctor(Object.entries(sel).filter(([,on]) => on).map(([k]) => L(SYMPTOMS.find(s => s.k === k).lKey)), level)} disabled={alertingDoctor} style={{ ...primaryBtn, background: 'rgba(255,200,100,0.25)', color: '#FFF1E4', flex: 1, minWidth: 100 }}>
                  {alertingDoctor ? '⏳' : '🔔 ' + L('alertDoctor')}
                </button>
              )}
              {doctorAlerted && (
                <div style={{ flex: 1, minWidth: 100, padding: '10px 12px', borderRadius: 12, background: 'rgba(39,174,96,0.3)', color: '#7FEFAB', fontSize: 13, fontWeight: 600, textAlign: 'center' }}>
                  ✓ {L('doctorAlerted')}
                </div>
              )}
              <button onClick={() => {
                setState(s => ({ ...s, riskContext: {
                  symptoms: Object.entries(sel).filter(([, on]) => on).map(([k]) => L(SYMPTOMS.find(sym => sym.k === k).lKey)),
                  level,
                  score,
                  taraAnalysis: taraMsg,
                }}));
                openScreen('chat');
              }} style={{ ...primaryBtn, background: 'rgba(255,241,228,0.15)', color: '#FFF1E4', flex: 1, minWidth: 100 }}>
                {lang === 'bn' ? 'তারার সাথে কথা বলুন' : 'Talk to Tara'}
              </button>
            </div>
          </Card>
        </div>
      )}

      {/* analyse button */}
      <div style={{ padding: '16px 22px 24px' }}>
        <button onClick={analyse} disabled={Object.values(sel).every(v => !v) || loading} style={{
          width: '100%', padding: '16px', borderRadius: 18, border: 'none',
          background: (Object.values(sel).every(v => !v) || loading) ? 'rgba(61,40,64,0.2)' : 'linear-gradient(135deg, #3D2840, #5A3E5F)',
          color: '#FFF1E4', cursor: (Object.values(sel).every(v => !v) || loading) ? 'not-allowed' : 'pointer',
          fontSize: 14, fontWeight: 700, letterSpacing: '-0.01em',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          boxShadow: '0 14px 30px -10px rgba(61,40,64,0.5)',
        }}>
          {loading
            ? <span style={{ opacity: 0.7 }}>{lang === 'bn' ? '⏳ বিশ্লেষণ হচ্ছে…' : '⏳ Analysing…'}</span>
            : <React.Fragment><span>✨</span> {L('analyseButton')}</React.Fragment>
          }
        </button>
        <div style={{ fontSize: 10, color: '#7A5E78', textAlign: 'center', marginTop: 8, lineHeight: 1.5 }}>
          {L('notMedical')}
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
