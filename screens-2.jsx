// Wellness + Care screens (v2)

// ── Shared constants ──────────────────────────────────────────────────────────

const _MOOD_META = [
  { k: 'tender',  label_en: 'Tender',  label_bn: 'কোমল',       emoji: '🫶',  color: '#F4D7E5' },
  { k: 'okay',    label_en: 'Okay',    label_bn: 'ঠিকই আছি',   emoji: '🌤️', color: '#F2EBDA' },
  { k: 'tired',   label_en: 'Tired',   label_bn: 'ক্লান্ত',    emoji: '😴',  color: '#E5D8E8' },
  { k: 'worried', label_en: 'Worried', label_bn: 'চিন্তিত',    emoji: '🌧️', color: '#DDE3F0' },
  { k: 'heavy',   label_en: 'Heavy',   label_bn: 'ভারাক্রান্ত',emoji: '🪨',  color: '#E8DEF5' },
  { k: 'happy',   label_en: 'Happy',   label_bn: 'খুশি',        emoji: '🌸',  color: '#FBE5D6' },
];

const _MOOD_SCORES = { happy: 5, tender: 4, okay: 3, tired: 2, heavy: 2, worried: 1 };

const _AFFIRMATION_MAP = {
  tender:  { key: 'affirmation1', bg: 'linear-gradient(135deg, #FBD7C6, #F4B4C8)' },
  happy:   { key: 'affirmation1', bg: 'linear-gradient(135deg, #FBD7C6, #F4B4C8)' },
  okay:    { key: 'affirmation3', bg: 'linear-gradient(135deg, #F2EBDA, #F4D7E5)' },
  tired:   { key: 'affirmation2', bg: 'linear-gradient(135deg, #E0D5F0, #C9BEE4)' },
  worried: { key: 'affirmation4', bg: 'linear-gradient(135deg, #F8D5DF, #E0D5F0)' },
  heavy:   { key: 'affirmation2', bg: 'linear-gradient(135deg, #E0D5F0, #C9BEE4)' },
};

const _CAT_META = {
  breathe: { icon: '🌬️', en: 'Breathe', bn: 'শ্বাস',    from: '#E0D5F0', to: '#F4D7E5' },
  move:    { icon: '🌿', en: 'Move',    bn: 'নড়াচড়া', from: '#D5EBE0', to: '#E5EDD5' },
  calm:    { icon: '🌸', en: 'Calm',    bn: 'শান্তি',   from: '#F2EBDA', to: '#FBE5D6' },
  sleep:   { icon: '🌙', en: 'Sleep',   bn: 'ঘুম',      from: '#D8D5F0', to: '#C8D5F0' },
};

const _TRIMESTER = (week) => week <= 13 ? 1 : week <= 26 ? 2 : 3;

const _TRIM_LABEL = {
  en: { 1: '1st trimester', 2: '2nd trimester', 3: '3rd trimester' },
  bn: { 1: 'প্রথম ত্রৈমাসিক', 2: 'দ্বিতীয় ত্রৈমাসিক', 3: 'তৃতীয় ত্রৈমাসিক' },
};

function _preGreeting(name, week, mood, lang) {
  const g = {
    en: {
      tender:  `${name}, feeling tender today. Let's spend a few gentle minutes together.`,
      okay:    `${name}, week ${week}. Let's do something good for your body.`,
      tired:   `${name}, tired is allowed. Let's breathe and restore your energy.`,
      worried: `${name}, I hear you. Let's breathe through this together.`,
      heavy:   `${name}, feeling heavy today. Let's gently stretch and create some space.`,
      happy:   `${name}, you're glowing today! Let's celebrate with something beautiful.`,
    },
    bn: {
      tender:  `${name}, আজ কোমল অনুভব করছেন। চলুন কিছুটা সময় কাটাই।`,
      okay:    `${name}, সপ্তাহ ${week}। চলুন একসাথে কিছু ভালো করি।`,
      tired:   `${name}, ক্লান্তি স্বাভাবিক। চলুন শ্বাস নিই এবং শক্তি ফেরাই।`,
      worried: `${name}, বুঝতে পারছি। চলুন একসাথে শ্বাস নিই।`,
      heavy:   `${name}, আজ ভারী লাগছে। চলুন আস্তে স্ট্রেচ করি।`,
      happy:   `${name}, আজ উজ্জ্বল দেখাচ্ছেন! চলুন কিছু সুন্দর করি।`,
    },
  };
  const d = (lang === 'bn' || lang === 'mixed') ? g.bn : g.en;
  return d[mood] || d.okay;
}

function _fmtTime(sec) {
  const s = Math.max(0, Math.floor(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

// ── Session Player ────────────────────────────────────────────────────────────

function SessionPlayer({ session, lang, patientName, week, mood, onClose, onComplete }) {
  const L = (key) => window.tStr(key, lang);

  const taraRef        = React.useRef(null);
  const stepStartRef   = React.useRef(null);
  const breatheTimer   = React.useRef(null);
  const pauseTimer     = React.useRef(null);

  const [phase,       setPhase]       = React.useState('pre');  // pre|in|post|done
  const [stepIdx,     setStepIdx]     = React.useState(0);
  const [stepElapsed, setStepElapsed] = React.useState(0);
  const [isPlaying,   setIsPlaying]   = React.useState(true);
  const [breatheP,    setBreatheP]    = React.useState({ p: 'idle', dur: 600 });
  const [longPaused,  setLongPaused]  = React.useState(false);
  const [postMood,    setPostMood]    = React.useState(null);
  const [preProgress, setPreProgress] = React.useState(0);

  const steps       = session?.steps || [];
  const currentStep = steps[stepIdx] || null;
  const PRE_DUR     = 12;

  const completedSec  = steps.slice(0, stepIdx).reduce((a, s) => a + (s.duration_sec || 0), 0);
  const totalDuration = steps.reduce((a, s) => a + (s.duration_sec || 0), 0);
  const totalElapsed  = completedSec + stepElapsed;
  const progressPct   = totalDuration > 0 ? Math.min(totalElapsed / totalDuration, 1) : 0;

  // ── Pre-phase auto-advance ────────────────────────────────────────────────
  React.useEffect(() => {
    if (phase !== 'pre') return;
    const start = Date.now();
    setTimeout(() => { taraRef.current?.speak('caring', (PRE_DUR - 3) * 1000); }, 400);
    const id = setInterval(() => {
      const elapsed = (Date.now() - start) / 1000;
      setPreProgress(Math.min(elapsed / PRE_DUR, 1));
      if (elapsed >= PRE_DUR) {
        clearInterval(id);
        setPhase('in');
        stepStartRef.current = Date.now();
      }
    }, 100);
    return () => clearInterval(id);
  }, [phase]);

  // ── In-phase step timer ───────────────────────────────────────────────────
  React.useEffect(() => {
    if (phase !== 'in' || !isPlaying) return;
    if (!stepStartRef.current) stepStartRef.current = Date.now();

    const id = setInterval(() => {
      const elapsed = (Date.now() - stepStartRef.current) / 1000;
      const dur = steps[stepIdx]?.duration_sec || 999;
      setStepElapsed(Math.min(elapsed, dur));
      if (elapsed >= dur) {
        clearInterval(id);
        if (stepIdx < steps.length - 1) {
          stepStartRef.current = Date.now();
          setStepIdx(s => s + 1);
          setStepElapsed(0);
        } else {
          setPhase('post');
        }
      }
    }, 200);
    return () => clearInterval(id);
  }, [phase, isPlaying, stepIdx]);

  // ── Breathing cycle ───────────────────────────────────────────────────────
  React.useEffect(() => {
    if (breatheTimer.current) { clearTimeout(breatheTimer.current); breatheTimer.current = null; }
    if (phase !== 'in' || !isPlaying || !currentStep?.breathing_pace) {
      setBreatheP({ p: 'idle', dur: 600 });
      return;
    }
    const bp = currentStep.breathing_pace;
    const cycles = [
      bp.in    && { p: 'in',   dur: bp.in    * 1000 },
      bp.hold  && { p: 'hold', dur: bp.hold  * 1000 },
      bp.out   && { p: 'out',  dur: bp.out   * 1000 },
      bp.hold2 && { p: 'hold', dur: bp.hold2 * 1000 },
    ].filter(Boolean);
    if (!cycles.length) { setBreatheP({ p: 'idle', dur: 600 }); return; }
    let ci = 0;
    setBreatheP(cycles[0]);
    const advance = () => {
      ci = (ci + 1) % cycles.length;
      setBreatheP(cycles[ci]);
      breatheTimer.current = setTimeout(advance, cycles[ci].dur);
    };
    breatheTimer.current = setTimeout(advance, cycles[0].dur);
    return () => { if (breatheTimer.current) clearTimeout(breatheTimer.current); };
  }, [phase, isPlaying, stepIdx]);

  // ── Long pause detection ──────────────────────────────────────────────────
  React.useEffect(() => {
    if (pauseTimer.current) clearTimeout(pauseTimer.current);
    if (!isPlaying && phase === 'in') {
      pauseTimer.current = setTimeout(() => {
        setLongPaused(true);
        taraRef.current?.playCaring(4000);
      }, 30000);
    } else {
      setLongPaused(false);
    }
    return () => { if (pauseTimer.current) clearTimeout(pauseTimer.current); };
  }, [isPlaying, phase]);

  // ── Controls ──────────────────────────────────────────────────────────────
  const handlePause = () => {
    setIsPlaying(p => {
      if (p) {
        // pausing — record pause start so we can adjust stepStartRef on resume
        pauseTimer._pauseAt = Date.now();
      } else {
        // resuming — shift stepStart forward by pause duration
        if (pauseTimer._pauseAt && stepStartRef.current) {
          stepStartRef.current += (Date.now() - pauseTimer._pauseAt);
        }
        setLongPaused(false);
      }
      return !p;
    });
  };

  const handleNext = () => {
    if (stepIdx < steps.length - 1) {
      stepStartRef.current = Date.now();
      setStepIdx(s => s + 1);
      setStepElapsed(0);
    } else if (phase === 'in') {
      setPhase('post');
    }
  };

  const handlePrev = () => {
    if (stepIdx > 0) {
      stepStartRef.current = Date.now();
      setStepIdx(s => s - 1);
      setStepElapsed(0);
    }
  };

  const handleBeginNow = () => {
    setPhase('in');
    stepStartRef.current = Date.now();
  };

  const handleLogComplete = () => {
    setPhase('done');
    taraRef.current?.playCelebration(3000);
    onComplete && onComplete(postMood);
    setTimeout(onClose, 3500);
  };

  // Tara mood
  const prevMoodScore = _MOOD_SCORES[mood] || 3;
  const taraMood = phase === 'pre'  ? 'caring'
    : phase === 'post' ? (postMood && _MOOD_SCORES[postMood] >= prevMoodScore ? 'happy' : 'caring')
    : phase === 'done' ? 'celebration'
    : longPaused       ? 'caring'
    : (currentStep?.tara_mood || 'idle');

  const ringScale = { idle: 1.0, in: 1.3, hold: 1.1, out: 0.72 }[breatheP.p] ?? 1.0;

  const tlang = (lang === 'bn' || lang === 'mixed') ? 'bn' : 'en';
  const titleText   = session?.title?.[tlang]    || session?.title?.en    || '';
  const instrText   = currentStep?.instruction_text?.[tlang] || currentStep?.instruction_text?.en || '';
  const durationMin = Math.ceil((session?.duration_sec || 0) / 60);
  const trimester   = _TRIMESTER(week || 20);
  const trimLabel   = (_TRIM_LABEL[tlang] || _TRIM_LABEL.en)[trimester];
  const catMeta     = _CAT_META[session?.category] || {};
  const catLabel    = catMeta[tlang] || catMeta.en || '';

  // ── DONE ─────────────────────────────────────────────────────────────────
  if (phase === 'done') {
    return (
      <div style={{
        position: 'absolute', inset: 0, zIndex: 50,
        background: 'linear-gradient(160deg, #1E0E2C, #3D2840)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        <Tara ref={taraRef} size={200} mood="celebration"/>
        <div style={{ fontFamily: 'var(--display)', fontSize: 30, color: '#FFF1E4', marginTop: 16, letterSpacing: '-0.02em' }}>
          {L('playerDoneTitle')}
        </div>
        <div style={{ fontSize: 14, color: 'rgba(255,241,228,0.6)', marginTop: 8 }}>{L('playerDoneSub')}</div>
      </div>
    );
  }

  // ── POST ──────────────────────────────────────────────────────────────────
  if (phase === 'post') {
    return (
      <div style={{
        position: 'absolute', inset: 0, zIndex: 50,
        background: 'linear-gradient(160deg, #1E0E2C, #2A1A36)',
        display: 'flex', flexDirection: 'column', overflowY: 'auto',
      }}>
        <div style={{ display: 'flex', padding: '18px 20px 0' }}>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,241,228,0.5)', fontSize: 14, cursor: 'pointer', padding: 0 }}>
            ← {L('playerBack')}
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 24px 32px', flex: 1 }}>
          <Tara ref={taraRef} size={190} mood={postMood && _MOOD_SCORES[postMood] >= prevMoodScore ? 'happy' : 'caring'}/>
          <div style={{ fontFamily: 'var(--display)', fontSize: 22, color: '#FFF1E4', marginTop: 14, textAlign: 'center', letterSpacing: '-0.02em' }}>
            {L('playerPostTitle')}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginTop: 22, width: '100%' }}>
            {_MOOD_META.map(m => (
              <button key={m.k} onClick={() => setPostMood(m.k)} style={{
                padding: '14px 8px', borderRadius: 20, border: 'none',
                background: postMood === m.k ? m.color : 'rgba(255,255,255,0.08)',
                cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                outline: postMood === m.k ? '2px solid rgba(255,241,228,0.8)' : 'none',
                outlineOffset: -2, transition: 'all 200ms',
              }}>
                <span style={{ fontSize: 22 }}>{m.emoji}</span>
                <span style={{ fontSize: 11, color: postMood === m.k ? '#2A1A36' : 'rgba(255,241,228,0.8)', fontWeight: 600 }}>
                  {tlang === 'bn' ? m.label_bn : m.label_en}
                </span>
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 28, width: '100%' }}>
            <button onClick={handleLogComplete} disabled={!postMood} style={{
              flex: 1, padding: '14px', borderRadius: 99, border: 'none',
              background: postMood ? '#FFF1E4' : 'rgba(255,255,255,0.15)',
              color: '#2A1A36', fontSize: 14, fontWeight: 700,
              cursor: postMood ? 'pointer' : 'not-allowed', transition: 'all 200ms',
            }}>
              {L('playerPostLog')}
            </button>
            <button onClick={() => { onComplete && onComplete(null); onClose(); }} style={{
              padding: '14px 20px', borderRadius: 99, border: '1.5px solid rgba(255,241,228,0.25)',
              background: 'transparent', color: 'rgba(255,241,228,0.6)', fontSize: 14, cursor: 'pointer',
            }}>
              {L('playerPostSkip')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── PRE + IN ──────────────────────────────────────────────────────────────
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 50,
      background: 'linear-gradient(160deg, #1E0E2C, #2A1A36)',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px 0', flexShrink: 0 }}>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,241,228,0.5)', fontSize: 14, cursor: 'pointer', padding: 0 }}>
          ← {L('playerBack')}
        </button>
        <div style={{ fontSize: 11, color: 'rgba(255,241,228,0.4)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          {catLabel} · {durationMin} {L('minLabel')}
        </div>
      </div>

      {/* Session title */}
      <div style={{ padding: '10px 22px 0', textAlign: 'center', flexShrink: 0 }}>
        <div style={{ fontFamily: 'var(--display)', fontSize: 20, color: '#FFF1E4', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
          {titleText}
        </div>
        <div style={{ fontSize: 11, color: 'rgba(255,241,228,0.4)', marginTop: 4 }}>
          {tlang === 'bn' ? `সপ্তাহ ${week || 20}` : `Week ${week || 20}`} · {trimLabel}
        </div>
      </div>

      {/* Tara + breathing rings */}
      <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1, minHeight: 0 }}>
        <div style={{
          position: 'absolute', width: 310, height: 310, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.07), transparent 70%)',
          transform: `scale(${ringScale})`,
          transition: `transform ${breatheP.dur}ms cubic-bezier(0.4,0,0.2,1)`,
        }}/>
        <div style={{
          position: 'absolute', width: 200, height: 200, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(240,138,110,0.15), transparent 70%)',
          transform: `scale(${ringScale * 0.85})`,
          transition: `transform ${breatheP.dur}ms cubic-bezier(0.4,0,0.2,1)`,
        }}/>
        <Tara ref={taraRef} size={270} mood={taraMood} style={{ position: 'relative', zIndex: 1 }}/>
      </div>

      {/* Instruction / greeting */}
      <div style={{ padding: '0 26px', textAlign: 'center', flexShrink: 0, minHeight: 96 }}>
        {phase === 'pre' ? (
          <div>
            <div style={{ fontSize: 15, color: 'rgba(255,241,228,0.85)', lineHeight: 1.7, fontFamily: 'var(--ui)' }}>
              {_preGreeting(patientName, week || 20, mood, tlang)}
            </div>
            <button onClick={handleBeginNow} style={{
              marginTop: 14, padding: '9px 26px', borderRadius: 99,
              border: '1.5px solid rgba(255,241,228,0.35)', background: 'transparent',
              color: 'rgba(255,241,228,0.75)', fontSize: 13, cursor: 'pointer',
            }}>
              {L('sessionBegin')} →
            </button>
          </div>
        ) : (
          <div style={{ fontFamily: 'var(--display)', fontSize: 18, color: '#FFF1E4', lineHeight: 1.55, letterSpacing: '-0.01em' }}>
            {longPaused ? L('pausePrompt') : instrText}
          </div>
        )}
      </div>

      {/* Bottom controls */}
      <div style={{ padding: '0 22px 28px', flexShrink: 0 }}>
        {/* Step dots */}
        {phase === 'in' && steps.length > 1 && (
          <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginBottom: 14 }}>
            {steps.map((_, i) => (
              <div key={i} style={{
                height: 6, borderRadius: 3,
                width: i === stepIdx ? 18 : 6,
                background: i < stepIdx ? 'rgba(255,241,228,0.6)' : i === stepIdx ? '#F08A6E' : 'rgba(255,241,228,0.18)',
                transition: 'all 300ms',
              }}/>
            ))}
          </div>
        )}

        {/* Pre-phase progress bar */}
        {phase === 'pre' && (
          <div style={{ height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.1)', marginBottom: 16, overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 2, background: 'rgba(255,241,228,0.4)', width: `${preProgress * 100}%`, transition: 'width 150ms linear' }}/>
          </div>
        )}

        {/* Time scrubber */}
        {phase === 'in' && (
          <div style={{ marginBottom: 18 }}>
            <div style={{ height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: 2, background: 'linear-gradient(90deg, #F08A6E, #F4B4C8)', width: `${progressPct * 100}%`, transition: 'width 200ms linear' }}/>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
              <span style={{ fontSize: 11, color: 'rgba(255,241,228,0.45)' }}>{_fmtTime(totalElapsed)}</span>
              <span style={{ fontSize: 11, color: 'rgba(255,241,228,0.25)' }}>{_fmtTime(totalDuration)}</span>
            </div>
          </div>
        )}

        {/* Controls */}
        {phase === 'in' && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 28 }}>
            <button onClick={handlePrev} disabled={stepIdx === 0} style={{
              width: 44, height: 44, borderRadius: '50%', border: 'none',
              background: stepIdx === 0 ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.1)',
              color: stepIdx === 0 ? 'rgba(255,241,228,0.15)' : 'rgba(255,241,228,0.7)',
              fontSize: 17, cursor: stepIdx === 0 ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>⏮</button>

            <button onClick={handlePause} style={{
              width: 62, height: 62, borderRadius: '50%', border: 'none',
              background: '#FFF1E4', color: '#2A1A36', fontSize: 22, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
            }}>
              {isPlaying ? '⏸' : '▶'}
            </button>

            <button onClick={handleNext} style={{
              width: 44, height: 44, borderRadius: '50%', border: 'none',
              background: 'rgba(255,255,255,0.1)',
              color: 'rgba(255,241,228,0.7)', fontSize: 17, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>⏭</button>
          </div>
        )}

        {phase === 'in' && (
          <div style={{ textAlign: 'center', marginTop: 10 }}>
            <span style={{ fontSize: 11, color: 'rgba(255,241,228,0.25)', letterSpacing: '0.06em' }}>
              {L('playerStep').replace('{a}', stepIdx + 1).replace('{b}', steps.length)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Health Log Sheet ──────────────────────────────────────────────────────────

function HealthLogSheet({ lang, patientId, authToken, onClose, onSaved }) {
  const tlang = (lang === 'bn' || lang === 'mixed') ? 'bn' : 'en';
  const t = (en, bn) => tlang === 'bn' ? bn : en;

  const [bp_sys,  setBpSys]  = React.useState('');
  const [bp_dia,  setBpDia]  = React.useState('');
  const [weight,  setWeight] = React.useState('');
  const [sleep,   setSleep]  = React.useState('');
  const [hydration, setHydration] = React.useState('');

  const [fieldErrors, setFieldErrors] = React.useState({});
  const [netError,  setNetError]  = React.useState('');
  const [saving,    setSaving]    = React.useState(false);
  const [savedOk,   setSavedOk]   = React.useState(false);

  const B = window.BACKEND_URL;

  const validate = () => {
    const errs = {};
    const sys = bp_sys.trim(), dia = bp_dia.trim();
    if (sys || dia) {
      if (!sys || !dia) errs.bp = t('Enter both systolic and diastolic.', 'সিস্টোলিক ও ডায়াস্টোলিক উভয়ই লিখুন।');
      else if (isNaN(sys) || Number(sys) < 60 || Number(sys) > 200) errs.bp = t('Systolic must be 60–200.', 'সিস্টোলিক ৬০–২০০ এর মধ্যে হতে হবে।');
      else if (isNaN(dia) || Number(dia) < 40 || Number(dia) > 120) errs.bp = t('Diastolic must be 40–120.', 'ডায়াস্টোলিক ৪০–১২০ এর মধ্যে হতে হবে।');
    }
    if (weight.trim()) {
      const w = Number(weight);
      if (isNaN(w) || w < 30 || w > 150) errs.weight = t('Weight must be 30–150 kg.', 'ওজন ৩০–১৫০ কেজির মধ্যে হতে হবে।');
    }
    if (sleep.trim()) {
      const s = Number(sleep);
      if (isNaN(s) || s < 0 || s > 24) errs.sleep = t('Sleep must be 0–24 hours.', 'ঘুম ০–২৪ ঘণ্টার মধ্যে হতে হবে।');
    }
    if (hydration.trim()) {
      const h = Number(hydration);
      if (isNaN(h) || h < 0 || h > 20) errs.hydration = t('Glasses must be 0–20.', 'গ্লাস সংখ্যা ০–২০ এর মধ্যে হতে হবে।');
    }
    return errs;
  };

  const hasAnyInput = bp_sys.trim() || bp_dia.trim() || weight.trim() || sleep.trim() || hydration.trim();

  const handleSave = async () => {
    const errs = validate();
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setSaving(true);
    setNetError('');
    const hdrs = { 'Content-Type': 'application/json' };
    const logs = [];
    if (bp_sys.trim() && bp_dia.trim()) logs.push({ data_type: 'bp',        value: `${bp_sys.trim()}/${bp_dia.trim()}` });
    if (weight.trim())                   logs.push({ data_type: 'weight',    value: weight.trim() });
    if (sleep.trim())                    logs.push({ data_type: 'sleep',     value: sleep.trim() });
    if (hydration.trim())                logs.push({ data_type: 'hydration', value: hydration.trim() });

    const failed = [];
    for (const log of logs) {
      try {
        const res = await fetch(`${B}/health-log`, {
          method: 'POST', headers: hdrs,
          body: JSON.stringify({ patient_id: patientId, ...log }),
        });
        if (!res.ok) failed.push(log.data_type);
      } catch {
        failed.push(log.data_type);
      }
    }
    setSaving(false);
    if (failed.length === logs.length) {
      setNetError(t("Couldn't save. Check your connection and retry.", 'সংযোগ সমস্যা। আবার চেষ্টা করুন।'));
      return;
    }
    if (failed.length > 0) {
      setNetError(t(`Saved some readings. Failed: ${failed.join(', ')}.`, `কিছু তথ্য সেভ হয়নি: ${failed.join(', ')}।`));
    }
    setSavedOk(true);
    onSaved();
    setTimeout(onClose, 1400);
  };

  const inputStyle = {
    flex: 1, padding: '12px 14px', borderRadius: 14,
    border: '1.5px solid rgba(61,40,64,0.14)',
    background: 'rgba(255,255,255,0.9)', fontSize: 15,
    fontFamily: 'var(--ui)', color: '#2A1A36', outline: 'none',
    WebkitAppearance: 'none', boxSizing: 'border-box',
  };
  const labelStyle = { fontSize: 11, color: '#7A5E78', fontWeight: 700, marginBottom: 6, display: 'block', letterSpacing: '0.06em', textTransform: 'uppercase' };
  const errStyle   = { fontSize: 11, color: '#C0392B', marginTop: 5 };

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 60,
      background: 'linear-gradient(180deg, #FFEFE2 0%, #F4D7E5 60%, #E0D5F0 100%)',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      <Grain/>
      {/* Header */}
      <div style={{ padding: '54px 22px 16px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <button onClick={onClose} style={window.uiBtns.iconBtn}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3D2840" strokeWidth="2" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'var(--display)', fontSize: 22, color: '#2A1A36', letterSpacing: '-0.01em', lineHeight: 1 }}>
            {t("Log today's readings", 'আজকের রিডিং লগ করুন')}
          </div>
          <div style={{ fontSize: 12, color: '#5A3E5F', marginTop: 4 }}>
            {t('Fill any field you have measured today.', 'আজকে যা মেপেছেন তা লিখুন।')}
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 22px 24px' }}>
        {/* Network error banner */}
        {netError && (
          <div style={{ background: '#FBD6CB', borderRadius: 14, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#7A2020', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>⚠️</span> {netError}
          </div>
        )}
        {/* Success banner */}
        {savedOk && (
          <div style={{ background: '#D4EDDA', borderRadius: 14, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#1B5E20', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>✓</span> {t('Readings saved!', 'রিডিং সেভ হয়েছে!')}
          </div>
        )}

        {/* Blood Pressure */}
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>🩺 {t('Blood Pressure', 'রক্তচাপ')}</label>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              style={{ ...inputStyle, borderColor: fieldErrors.bp ? '#C0392B' : 'rgba(61,40,64,0.14)' }}
              type="number" inputMode="numeric" placeholder={t('Systolic (e.g. 120)', 'সিস্টোলিক (যেমন ১২০)')}
              value={bp_sys} onChange={e => { setBpSys(e.target.value); setFieldErrors(er => ({ ...er, bp: '' })); }}
            />
            <span style={{ color: '#7A5E78', fontWeight: 700, fontSize: 18 }}>/</span>
            <input
              style={{ ...inputStyle, borderColor: fieldErrors.bp ? '#C0392B' : 'rgba(61,40,64,0.14)' }}
              type="number" inputMode="numeric" placeholder={t('Diastolic (e.g. 80)', 'ডায়াস্টোলিক (যেমন ৮০)')}
              value={bp_dia} onChange={e => { setBpDia(e.target.value); setFieldErrors(er => ({ ...er, bp: '' })); }}
            />
            <span style={{ fontSize: 12, color: '#7A5E78', whiteSpace: 'nowrap' }}>mmHg</span>
          </div>
          {fieldErrors.bp && <div style={errStyle}>{fieldErrors.bp}</div>}
        </div>

        {/* Weight */}
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>⚖️ {t('Weight', 'ওজন')}</label>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              style={{ ...inputStyle, borderColor: fieldErrors.weight ? '#C0392B' : 'rgba(61,40,64,0.14)' }}
              type="number" inputMode="decimal" placeholder={t('e.g. 62.5', 'যেমন ৬২.৫')}
              value={weight} onChange={e => { setWeight(e.target.value); setFieldErrors(er => ({ ...er, weight: '' })); }}
            />
            <span style={{ fontSize: 12, color: '#7A5E78' }}>kg</span>
          </div>
          {fieldErrors.weight && <div style={errStyle}>{fieldErrors.weight}</div>}
        </div>

        {/* Sleep */}
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>🌙 {t('Sleep last night', 'গতরাতের ঘুম')}</label>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              style={{ ...inputStyle, borderColor: fieldErrors.sleep ? '#C0392B' : 'rgba(61,40,64,0.14)' }}
              type="number" inputMode="decimal" placeholder={t('e.g. 7.5', 'যেমন ৭.৫')}
              value={sleep} onChange={e => { setSleep(e.target.value); setFieldErrors(er => ({ ...er, sleep: '' })); }}
            />
            <span style={{ fontSize: 12, color: '#7A5E78' }}>{t('hrs', 'ঘণ্টা')}</span>
          </div>
          {fieldErrors.sleep && <div style={errStyle}>{fieldErrors.sleep}</div>}
        </div>

        {/* Hydration */}
        <div style={{ marginBottom: 28 }}>
          <label style={labelStyle}>💧 {t('Water intake today', 'আজকের পানি')}</label>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              style={{ ...inputStyle, borderColor: fieldErrors.hydration ? '#C0392B' : 'rgba(61,40,64,0.14)' }}
              type="number" inputMode="numeric" placeholder={t('Glasses of water', 'পানির গ্লাস')}
              value={hydration} onChange={e => { setHydration(e.target.value); setFieldErrors(er => ({ ...er, hydration: '' })); }}
            />
            <span style={{ fontSize: 12, color: '#7A5E78' }}>{t('glasses', 'গ্লাস')}</span>
          </div>
          {fieldErrors.hydration && <div style={errStyle}>{fieldErrors.hydration}</div>}
        </div>

        <button
          onClick={handleSave}
          disabled={!hasAnyInput || saving || savedOk}
          style={{
            width: '100%', padding: '16px', borderRadius: 99, border: 'none',
            background: (!hasAnyInput || saving || savedOk) ? 'rgba(61,40,64,0.2)' : '#3D2840',
            color: '#FFF1E4', fontSize: 15, fontWeight: 700,
            cursor: (!hasAnyInput || saving || savedOk) ? 'not-allowed' : 'pointer',
            boxShadow: (!hasAnyInput || saving || savedOk) ? 'none' : '0 14px 30px -10px rgba(61,40,64,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          {saving
            ? <><span style={{ opacity: 0.7 }}>⏳</span> {t('Saving…', 'সেভ হচ্ছে…')}</>
            : savedOk
            ? <><span>✓</span> {t('Saved!', 'সেভ হয়েছে!')}</>
            : t('Save readings', 'রিডিং সেভ করুন')
          }
        </button>
        <div style={{ fontSize: 11, color: '#7A5E78', textAlign: 'center', marginTop: 10 }}>
          {t('You only need to fill the fields you measured.', 'শুধু যেগুলো মেপেছেন সেগুলো লিখতে হবে।')}
        </div>
      </div>
    </div>
  );
}

// ── Book Appointment Sheet ────────────────────────────────────────────────────

function BookAppointmentSheet({ lang, patientId, authToken, prefillType, onClose, onSaved }) {
  const tlang = (lang === 'bn' || lang === 'mixed') ? 'bn' : 'en';
  const t = (en, bn) => tlang === 'bn' ? bn : en;

  const APPT_TYPES = [
    { v: 'anc',        en: 'ANC Checkup',  bn: 'ANC চেকআপ'   },
    { v: 'ultrasound', en: 'Ultrasound',   bn: 'আল্ট্রাসাউন্ড' },
    { v: 'followup',   en: 'Follow-up',    bn: 'ফলো-আপ'       },
    { v: 'general',    en: 'General',      bn: 'সাধারণ'        },
  ];

  const todayStr = new Date().toISOString().split('T')[0];
  const minDate  = (() => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0]; })();

  const [apptType, setApptType] = React.useState(prefillType || 'anc');
  const [date,     setDate]     = React.useState('');
  const [time,     setTime]     = React.useState('09:00');
  const [location, setLocation] = React.useState('');
  const [errors,   setErrors]   = React.useState({});
  const [netError, setNetError] = React.useState('');
  const [saving,   setSaving]   = React.useState(false);
  const [success,  setSuccess]  = React.useState(false);
  const taraRef = React.useRef(null);

  const B = window.BACKEND_URL;

  const validate = () => {
    const errs = {};
    if (!date) { errs.date = t('Please pick a date.', 'তারিখ বেছে নিন।'); }
    else {
      const chosen = new Date(`${date}T${time || '00:00'}:00`);
      if (chosen <= new Date()) errs.date = t('Please choose a future date and time.', 'ভবিষ্যতের তারিখ ও সময় বেছে নিন।');
    }
    return errs;
  };

  const handleBook = async () => {
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setSaving(true);
    setNetError('');
    try {
      const scheduledAt = `${date}T${time || '09:00'}:00`;
      const res = await fetch(`${B}/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({
          patient_id:       patientId,
          appointment_type: apptType,
          scheduled_at:     scheduledAt,
          location:         location.trim() || null,
        }),
      });
      if (!res.ok) {
        let detail = t('Could not book. Try again.', 'বুক করা যায়নি। আবার চেষ্টা করুন।');
        try { const d = await res.json(); detail = d.detail || detail; } catch {}
        throw new Error(detail);
      }
      setSaving(false);
      setSuccess(true);
      taraRef.current?.playCelebration();
      onSaved();
      setTimeout(onClose, 2200);
    } catch (e) {
      setSaving(false);
      setNetError(e.message || t('Network error. Check connection and retry.', 'নেটওয়ার্ক সমস্যা। আবার চেষ্টা করুন।'));
    }
  };

  const inputStyle = {
    width: '100%', padding: '13px 14px', borderRadius: 14,
    border: '1.5px solid rgba(61,40,64,0.14)',
    background: 'rgba(255,255,255,0.9)', fontSize: 15,
    fontFamily: 'var(--ui)', color: '#2A1A36', outline: 'none',
    WebkitAppearance: 'none', boxSizing: 'border-box',
  };

  if (success) {
    return (
      <div style={{
        position: 'absolute', inset: 0, zIndex: 60,
        background: 'linear-gradient(180deg, #FFEFE2 0%, #F4D7E5 60%, #E0D5F0 100%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16,
      }}>
        <Grain/>
        <Tara ref={taraRef} size={180} mood="celebration"/>
        <div style={{ fontFamily: 'var(--display)', fontSize: 26, color: '#2A1A36', textAlign: 'center', letterSpacing: '-0.02em', padding: '0 32px' }}>
          {t('Appointment booked!', 'অ্যাপয়েন্টমেন্ট বুক হয়েছে!')}
        </div>
        <div style={{ fontSize: 13, color: '#5A3E5F' }}>
          {t("I'll remind you closer to the date.", 'তারিখের আগে আমি মনে করিয়ে দেব।')}
        </div>
      </div>
    );
  }

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 60,
      background: 'linear-gradient(180deg, #FFEFE2 0%, #F4D7E5 60%, #E0D5F0 100%)',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      <Grain/>
      <Tara ref={taraRef} size={0} mood="happy"/>

      {/* Header */}
      <div style={{ padding: '54px 22px 16px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <button onClick={onClose} style={window.uiBtns.iconBtn}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3D2840" strokeWidth="2" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'var(--display)', fontSize: 22, color: '#2A1A36', letterSpacing: '-0.01em', lineHeight: 1 }}>
            {t('Book a checkup', 'চেকআপ বুক করুন')}
          </div>
          <div style={{ fontSize: 12, color: '#5A3E5F', marginTop: 4 }}>
            {t('Choose a type, date, and time.', 'ধরন, তারিখ ও সময় বেছে নিন।')}
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 22px 28px' }}>
        {/* Network error */}
        {netError && (
          <div style={{ background: '#FBD6CB', borderRadius: 14, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#7A2020', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>⚠️</span> {netError}
          </div>
        )}

        {/* Appointment type */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: '#7A5E78', fontWeight: 700, marginBottom: 8, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            {t('Appointment type', 'অ্যাপয়েন্টমেন্টের ধরন')}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {APPT_TYPES.map(at => (
              <button key={at.v} onClick={() => setApptType(at.v)} style={{
                padding: '12px 10px', borderRadius: 16, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13,
                background: apptType === at.v ? '#3D2840' : 'rgba(255,255,255,0.8)',
                color:      apptType === at.v ? '#FFF1E4' : '#2A1A36',
                boxShadow:  apptType === at.v ? '0 6px 16px -8px rgba(61,40,64,0.4)' : 'none',
                transition: 'all 200ms',
              }}>
                {tlang === 'bn' ? at.bn : at.en}
              </button>
            ))}
          </div>
        </div>

        {/* Date */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: '#7A5E78', fontWeight: 700, marginBottom: 8, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            📅 {t('Date', 'তারিখ')}
          </div>
          <input
            type="date"
            min={minDate}
            value={date}
            onChange={e => { setDate(e.target.value); setErrors(er => ({ ...er, date: '' })); }}
            style={{ ...inputStyle, borderColor: errors.date ? '#C0392B' : 'rgba(61,40,64,0.14)' }}
          />
          {errors.date && <div style={{ fontSize: 11, color: '#C0392B', marginTop: 5 }}>{errors.date}</div>}
        </div>

        {/* Time */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: '#7A5E78', fontWeight: 700, marginBottom: 8, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            🕐 {t('Time', 'সময়')}
          </div>
          <input
            type="time"
            value={time}
            onChange={e => setTime(e.target.value)}
            style={inputStyle}
          />
        </div>

        {/* Location */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 11, color: '#7A5E78', fontWeight: 700, marginBottom: 8, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            📍 {t('Location', 'স্থান')} <span style={{ opacity: 0.5, fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>({t('optional', 'ঐচ্ছিক')})</span>
          </div>
          <input
            type="text"
            placeholder={t('Hospital / Clinic name', 'হাসপাতাল / ক্লিনিকের নাম')}
            value={location}
            onChange={e => setLocation(e.target.value)}
            maxLength={120}
            style={inputStyle}
          />
        </div>

        <button
          onClick={handleBook}
          disabled={saving}
          style={{
            width: '100%', padding: '16px', borderRadius: 99, border: 'none',
            background: saving ? 'rgba(61,40,64,0.2)' : '#3D2840',
            color: '#FFF1E4', fontSize: 15, fontWeight: 700,
            cursor: saving ? 'not-allowed' : 'pointer',
            boxShadow: saving ? 'none' : '0 14px 30px -10px rgba(61,40,64,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          {saving
            ? <><span style={{ opacity: 0.7 }}>⏳</span> {t('Booking…', 'বুক হচ্ছে…')}</>
            : <><span>📅</span> {t('Confirm appointment', 'অ্যাপয়েন্টমেন্ট নিশ্চিত করুন')}</>
          }
        </button>
      </div>
    </div>
  );
}

// ── Session Card ──────────────────────────────────────────────────────────────

function SessionCard({ session, lang, onBegin, loading }) {
  const tlang = (lang === 'bn' || lang === 'mixed') ? 'bn' : 'en';
  const cat   = _CAT_META[session.category] || {};
  const title = session.title?.[tlang] || session.title?.en || session.id;
  const sub   = session.subtitle?.[tlang] || session.subtitle?.en || '';
  const isLoading = loading === session.id;

  return (
    <div style={{
      background: `linear-gradient(135deg, ${cat.from || '#F2EBDA'}, ${cat.to || '#FBE5D6'})`,
      borderRadius: 20, padding: '16px 16px 14px', cursor: 'pointer',
      transition: 'transform 150ms', boxShadow: '0 6px 20px -8px rgba(61,40,64,0.3)',
      position: 'relative', overflow: 'hidden',
    }} onClick={() => !isLoading && onBegin(session)}>
      <div style={{ fontSize: 24, marginBottom: 8 }}>{cat.icon || '🌸'}</div>
      <div style={{ fontFamily: 'var(--display)', fontSize: 15, color: '#2A1A36', lineHeight: 1.25, letterSpacing: '-0.01em' }}>{title}</div>
      <div style={{ fontSize: 11, color: '#5A3E5F', marginTop: 4, lineHeight: 1.4 }}>{sub}</div>
      <div style={{ position: 'absolute', bottom: 12, right: 12, fontSize: 11, fontWeight: 700, color: '#3D2840', opacity: 0.6 }}>
        {isLoading ? '...' : '→'}
      </div>
    </div>
  );
}

// ── Mood History Graph ────────────────────────────────────────────────────────

function MoodHistoryGraph({ data, lang, loading }) {
  const L = (key) => window.tStr(key, lang);
  const tlang = (lang === 'bn' || lang === 'mixed') ? 'bn' : 'en';
  const DAY_LABELS_EN = ['Su','Mo','Tu','We','Th','Fr','Sa'];
  const DAY_LABELS_BN = ['রবি','সোম','মঙ্গ','বুধ','বৃহ','শুক্র','শনি'];

  const days = React.useMemo(() => {
    const today = new Date();
    const result = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const iso = d.toISOString().split('T')[0];
      const entry = (data || []).filter(l => l.date === iso).pop();
      result.push({
        iso, isToday: i === 0,
        label: tlang === 'bn' ? DAY_LABELS_BN[d.getDay()] : DAY_LABELS_EN[d.getDay()],
        score: entry ? entry.score : 0,
        mood: entry?.mood || null,
      });
    }
    return result;
  }, [data, tlang]);

  if (loading) {
    return (
      <Card>
        <div style={{ height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontSize: 13, color: '#7A5E78' }}>…</div>
        </div>
      </Card>
    );
  }

  const hasData = days.some(d => d.score > 0);

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
        <div>
          <Pill tone="lav">{L('moodHistoryTitle')}</Pill>
        </div>
      </div>
      {!hasData ? (
        <div style={{ textAlign: 'center', padding: '18px 0', fontSize: 12, color: '#7A5E78', lineHeight: 1.6 }}>
          {L('moodHistoryEmpty')} 🌸
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: 80, padding: '0 4px' }}>
          {days.map((d, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div title={d.mood || ''} style={{
                width: 18,
                height: d.score > 0 ? `${(d.score / 5) * 80}%` : '12%',
                borderRadius: 9,
                background: d.isToday
                  ? 'linear-gradient(180deg, #F08A6E, #F4B4C8)'
                  : d.score > 0
                  ? 'linear-gradient(180deg, #C9BEE4, #E0D5F0)'
                  : 'rgba(90,62,95,0.12)',
                transition: 'height 400ms ease',
              }}/>
              <div style={{ fontSize: 10, color: d.isToday ? '#3D2840' : '#7A5E78', fontWeight: d.isToday ? 700 : 600 }}>
                {d.label}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

// ── Wellness Screen v2 ────────────────────────────────────────────────────────

function WellnessScreen({ state, setState, openScreen, wellnessMood, setWellnessMood, wellnessLibCat, setWellnessLibCat }) {
  const { primaryBtn } = window.uiBtns;
  const lang  = state.lang;
  const L     = (key, type) => window.tStr(key, lang, type);
  const tlang = (lang === 'bn' || lang === 'mixed') ? 'bn' : 'en';

  const week         = state.week || 20;
  const trimester    = _TRIMESTER(week);
  const trimLabel    = (_TRIM_LABEL[tlang] || _TRIM_LABEL.en)[trimester];
  const patientName  = state.mothersName || 'Maya';

  const _pid = () => { try { return JSON.parse(localStorage.getItem('maya_user') || '{}').id || 'guest'; } catch { return 'guest'; } };
  const _tok = () => { try { return JSON.parse(localStorage.getItem('maya_session') || '{}').token || ''; } catch { return ''; } };

  // mood and libCat are lifted to App so they survive navigation
  const mood    = wellnessMood;
  const setMood = setWellnessMood;
  const libCat  = wellnessLibCat;
  const setLibCat = setWellnessLibCat;
  const [activeSession, setActiveSession] = React.useState(null);
  const [recommended,   setRecommended]   = React.useState(null);
  const [recLoading,    setRecLoading]    = React.useState(false);
  const [recError,      setRecError]      = React.useState(false);
  const [libSessions,   setLibSessions]   = React.useState([]);
  const [libLoading,    setLibLoading]    = React.useState(false);
  const [loadingId,     setLoadingId]     = React.useState(null);
  const [moodHistory,   setMoodHistory]   = React.useState(null);
  const [histLoading,   setHistLoading]   = React.useState(false);

  const B    = window.BACKEND_URL;
  const hdrs = () => ({ 'Content-Type': 'application/json', 'Authorization': `Bearer ${_tok()}` });

  // Fetch recommendation on mood/week change
  React.useEffect(() => {
    setRecLoading(true);
    setRecError(false);
    const pid = _pid();
    const url = `${B}/wellness/recommend?mood=${mood}&week=${week}`;
    const fetchOpts = pid !== 'guest'
      ? { headers: hdrs() }
      : {};
    fetch(url, fetchOpts)
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(data => { setRecommended(data); setRecLoading(false); })
      .catch(() => { setRecError(true); setRecLoading(false); });
  }, [mood, week]);

  // Fetch library sessions on category/week change
  React.useEffect(() => {
    setLibLoading(true);
    const cat = libCat === 'all' ? '' : libCat;
    const url = `${B}/wellness/sessions?week=${week}${cat ? `&category=${cat}` : ''}`;
    fetch(url)
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(data => { setLibSessions(Array.isArray(data) ? data : []); setLibLoading(false); })
      .catch(() => { setLibSessions([]); setLibLoading(false); });
  }, [libCat, week]);

  // Fetch mood history on mount
  React.useEffect(() => {
    const pid = _pid();
    if (pid === 'guest') return;
    setHistLoading(true);
    fetch(`${B}/wellness/mood-history/${pid}?days=7`, { headers: hdrs() })
      .then(r => r.ok ? r.json() : [])
      .then(data => { setMoodHistory(Array.isArray(data) ? data : []); setHistLoading(false); })
      .catch(() => { setMoodHistory([]); setHistLoading(false); });
  }, []);

  // Begin session: fetch full session JSON (with steps) then open player
  const handleBeginSession = React.useCallback((sessionMeta) => {
    if (sessionMeta.steps) {
      setActiveSession(sessionMeta);
      return;
    }
    setLoadingId(sessionMeta.id);
    fetch(`${B}/wellness/sessions/${sessionMeta.id}`)
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(full => { setActiveSession(full); setLoadingId(null); })
      .catch(() => {
        setLoadingId(null);
        // fallback: open with partial data (no steps = player shows pre only)
        setActiveSession(sessionMeta);
      });
  }, [B]);

  // Log session completion
  const handleComplete = React.useCallback((postMood) => {
    const pid = _pid();
    if (!activeSession || pid === 'guest') return;
    fetch(`${B}/wellness/sessions/complete`, {
      method: 'POST',
      headers: hdrs(),
      body: JSON.stringify({
        patient_id: pid,
        session_template_id: activeSession.id,
        completion_pct: 100,
        mood_before: mood,
        mood_after: postMood || undefined,
      }),
    }).then(r => r.json()).then(() => {
      // refresh mood history after log
      fetch(`${B}/wellness/mood-history/${pid}?days=7`, { headers: hdrs() })
        .then(r => r.ok ? r.json() : [])
        .then(data => setMoodHistory(Array.isArray(data) ? data : []))
        .catch(() => {});
    }).catch(() => {});
  }, [activeSession, mood, B]);

  // If session player is active, render it fullscreen
  if (activeSession) {
    return (
      <div className="screen wellness" style={{ position: 'relative', overflow: 'hidden' }}>
        <SessionPlayer
          session={activeSession}
          lang={lang}
          patientName={patientName}
          week={week}
          mood={mood}
          onClose={() => setActiveSession(null)}
          onComplete={handleComplete}
        />
      </div>
    );
  }

  const primSession = recommended?.primary;
  const affirmation = _AFFIRMATION_MAP[mood] || _AFFIRMATION_MAP.okay;
  const catTabs     = ['all', 'breathe', 'move', 'calm', 'sleep'];
  const weekLabel   = tlang === 'bn' ? `সপ্তাহ ${week}` : `Week ${week}`;

  return (
    <div className="screen wellness">
      {/* Header */}
      <div style={{ padding: '8px 22px 0' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#7A5E78', letterSpacing: '0.09em', textTransform: 'uppercase' }}>
          {L('forYourHeart')}
        </div>
        <div style={{ fontFamily: 'var(--display)', fontSize: 26, color: '#2A1A36', marginTop: 4, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
          {L('howDoesToday', 'tara')}<br/><span style={{ fontStyle: 'italic' }}>{L('actuallyFeel', 'tara')}</span>
        </div>
        <div style={{ fontSize: 12, color: '#7A5E78', marginTop: 5, fontWeight: 600 }}>
          {weekLabel} · {trimLabel}
        </div>
      </div>

      {/* Mood chips */}
      <div style={{ padding: '14px 22px 0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
          {_MOOD_META.map(m => (
            <button key={m.k} onClick={() => setMood(m.k)} style={{
              padding: '14px 8px', borderRadius: 20, border: 'none',
              background: mood === m.k ? m.color : 'rgba(255,255,255,0.6)',
              cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              outline: mood === m.k ? '2px solid #3D2840' : 'none',
              outlineOffset: -2, transition: 'all 200ms',
            }}>
              <span style={{ fontSize: 24 }}>{m.emoji}</span>
              <span style={{ fontSize: 11, color: '#3D2840', fontWeight: 600 }}>
                {tlang === 'bn' ? m.label_bn : m.label_en}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Tara's Pick */}
      <div style={{ padding: '18px 22px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
          <div style={{ fontFamily: 'var(--display)', fontSize: 18, color: '#3D2840', letterSpacing: '-0.01em' }}>
            {L('wellnessPick')}
          </div>
          <span style={{ fontSize: 11, color: '#7A5E78' }}>{L('wellnessPickSub')}</span>
        </div>

        {recLoading ? (
          <Card style={{ height: 130, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontSize: 13, color: '#7A5E78' }}>{L('sessionLoading')}</div>
          </Card>
        ) : recError || !primSession ? (
          <Card style={{ padding: 18 }}>
            <div style={{ fontSize: 13, color: '#7A5E78' }}>{L('sessionError')} ·&nbsp;
              <button onClick={() => { setRecError(false); setMood(m => m); }} style={{ color: '#3D2840', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13 }}>
                retry
              </button>
            </div>
          </Card>
        ) : (
          <Card style={{
            background: `linear-gradient(135deg, ${(_CAT_META[primSession.category] || {}).from || '#F2EBDA'}, ${(_CAT_META[primSession.category] || {}).to || '#FBE5D6'})`,
            padding: 0, overflow: 'hidden',
          }}>
            <div style={{ display: 'flex', gap: 16, padding: '18px 18px 12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <Tara size={88} mood="caring"/>
              </div>
              <div style={{ flex: 1 }}>
                <Pill tone="lav">{(_CAT_META[primSession.category] || {})[tlang] || primSession.category}</Pill>
                <div style={{ fontFamily: 'var(--display)', fontSize: 20, color: '#2A1A36', marginTop: 6, letterSpacing: '-0.01em', lineHeight: 1.2 }}>
                  {primSession.title?.[tlang] || primSession.title?.en}
                </div>
                <div style={{ fontSize: 11, color: '#5A3E5F', marginTop: 3 }}>
                  {primSession.subtitle?.[tlang] || primSession.subtitle?.en}
                </div>
              </div>
            </div>
            <div style={{ padding: '0 18px 16px' }}>
              <button onClick={() => handleBeginSession(primSession)} style={{
                ...primaryBtn, width: '100%', justifyContent: 'center',
                opacity: loadingId === primSession.id ? 0.6 : 1,
              }}>
                {loadingId === primSession.id ? '…' : L('sessionBegin')}
              </button>
            </div>
          </Card>
        )}
      </div>

      {/* Library */}
      <div style={{ padding: '18px 22px 0' }}>
        <div style={{ fontFamily: 'var(--display)', fontSize: 18, color: '#3D2840', letterSpacing: '-0.01em', marginBottom: 10 }}>
          {L('wellnessLibrary')}
        </div>

        {/* Category tabs */}
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 2 }}>
          {catTabs.map(tab => {
            const tabMeta = _CAT_META[tab] || {};
            const active  = libCat === tab;
            const tabLabel = tab === 'all'
              ? (tlang === 'bn' ? 'সব' : 'All')
              : (tabMeta[tlang] || tabMeta.en || tab);
            return (
              <button key={tab} onClick={() => setLibCat(tab)} style={{
                flexShrink: 0, padding: '7px 14px', borderRadius: 99,
                border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700,
                background: active ? '#3D2840' : 'rgba(255,255,255,0.7)',
                color: active ? '#FFF1E4' : '#5A3E5F',
                transition: 'all 200ms',
              }}>
                {tab !== 'all' && tabMeta.icon + ' '}
                {tabLabel}
              </button>
            );
          })}
        </div>

        {/* Session cards grid */}
        <div style={{ marginTop: 10 }}>
          {libLoading ? (
            <div style={{ textAlign: 'center', padding: '20px 0', fontSize: 13, color: '#7A5E78' }}>…</div>
          ) : libSessions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '16px 0', fontSize: 12, color: '#7A5E78' }}>
              {L('noSessionsFound')}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }}>
              {libSessions.map(s => (
                <SessionCard
                  key={s.id}
                  session={s}
                  lang={lang}
                  onBegin={handleBeginSession}
                  loading={loadingId}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Affirmation (context-aware, single card) */}
      <div style={{ padding: '18px 22px 0' }}>
        <div style={{ fontFamily: 'var(--display)', fontSize: 17, color: '#3D2840', letterSpacing: '-0.01em', marginBottom: 10 }}>
          {L('fromTaraToday', 'tara')}
        </div>
        <div style={{
          borderRadius: 24, padding: 22, height: 130,
          background: affirmation.bg,
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          boxShadow: '0 16px 28px -20px rgba(61,40,64,0.35)',
        }}>
          <div style={{ fontFamily: 'var(--display)', fontSize: 18, color: '#3D2840', lineHeight: 1.3, letterSpacing: '-0.01em', whiteSpace: 'pre-line' }}>
            "{L(affirmation.key, 'tara')}"
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 10, color: '#5A3E5F', fontWeight: 700, letterSpacing: '0.1em' }}>— TARA</span>
            <span style={{ fontSize: 14 }}>🌸</span>
          </div>
        </div>
      </div>

      {/* Real mood history graph */}
      <div style={{ padding: '18px 22px 22px' }}>
        <MoodHistoryGraph data={moodHistory} lang={lang} loading={histLoading}/>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────
// CARE (unchanged)
// ──────────────────────────────────────────────────────────────────
function CareScreen({ state, setState, openScreen }) {
  const { iconBtn, primaryBtn, ghostBtn } = window.uiBtns;
  const lang  = state.lang;
  const tlang = (lang === 'bn' || lang === 'mixed') ? 'bn' : 'en';
  const L = (key, type) => window.tStr(key, lang, type);

  const [kicks, setKicks] = React.useState(0);
  const [kickSessionStart, setKickSessionStart] = React.useState(null);
  const [emergency, setEmergency] = React.useState(false);
  const [sosLoading, setSosLoading] = React.useState(null);
  const [sosReply, setSosReply] = React.useState(null);
  const [profile, setProfile] = React.useState(null);
  const [appointments, setAppointments] = React.useState([]);
  const [healthLogs, setHealthLogs] = React.useState([]);
  const [fetchError, setFetchError] = React.useState(false);
  const [showHealthLog, setShowHealthLog] = React.useState(false);
  const [showBookAppt, setShowBookAppt] = React.useState(false);
  const [rescheduleType, setRescheduleType] = React.useState(null);

  const _pid = () => { try { return JSON.parse(localStorage.getItem('maya_user') || '{}').id || 'guest'; } catch { return 'guest'; } };
  const _tok = () => { try { return JSON.parse(localStorage.getItem('maya_session') || '{}').token || ''; } catch { return ''; } };

  const fetchCareData = React.useCallback(() => {
    const pid = _pid();
    if (pid === 'guest') return;
    const B = window.BACKEND_URL;
    const hdrs = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${_tok()}` };
    Promise.all([
      fetch(`${B}/profile/${pid}`, { headers: hdrs }).then(r => r.ok ? r.json() : null).catch(() => null),
      fetch(`${B}/appointments/${pid}`, { headers: hdrs }).then(r => r.ok ? r.json() : []).catch(() => []),
      fetch(`${B}/health-logs/${pid}?limit=50`, { headers: hdrs }).then(r => r.ok ? r.json() : []).catch(() => []),
    ]).then(([prof, appts, logs]) => {
      setFetchError(false);
      if (prof) setProfile(prof);
      if (Array.isArray(appts)) setAppointments(appts);
      if (Array.isArray(logs)) {
        setHealthLogs(logs);
        const today = new Date().toDateString();
        const tKicks = logs.filter(l => l.data_type === 'kick_count' && new Date(l.created_at).toDateString() === today);
        setKicks(tKicks.length);
        if (tKicks.length > 0) setKickSessionStart(tKicks[tKicks.length - 1].created_at);
      }
    }).catch(() => setFetchError(true));
  }, []);

  React.useEffect(() => { fetchCareData(); }, []);

  const handleKickTap = () => {
    if (kicks >= 10) return;
    const pid = _pid();
    setKicks(k => k + 1);
    if (!kickSessionStart) setKickSessionStart(new Date().toISOString());
    fetch(`${window.BACKEND_URL}/health-log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${_tok()}` },
      body: JSON.stringify({ patient_id: pid, data_type: 'kick_count', value: '1' }),
    }).catch(() => {});
  };

  const handleSos = async (lKey, msg) => {
    setSosLoading(lKey);
    setSosReply(null);
    try {
      const res = await fetch(`${window.BACKEND_URL}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${_tok()}` },
        body: JSON.stringify({ patient_id: _pid(), message: msg, source: 'chat' }),
      });
      const data = await res.json();
      setSosReply(data.message || data.voice_text || '');
    } catch {
      setSosReply(lang === 'bn' ? 'সংযোগে সমস্যা হচ্ছে। জরুরি প্রয়োজনে কাছের হাসপাতালে যান।' : 'Connection error. Please go to the nearest hospital.');
    } finally {
      setSosLoading(null);
    }
  };

  const now = new Date();
  const fmtDate = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (d.toDateString() === now.toDateString()) return 'Today';
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };
  const apptLabel = (t) => ({ anc: 'ANC Checkup', scan: 'Scan', blood_test: 'Blood Test', follow_up: 'Follow-up' }[t] || 'Checkup');
  const logTitle  = (dtype, val) => ({ weight: `Weight · ${val} kg`, bp: `BP · ${val}`, sleep: `Sleep · ${val} hrs`, symptom: 'Symptom logged', mood: 'Mood logged', medication: 'Medication logged' }[dtype] || dtype);

  const nextAppt   = appointments.find(a => a.scheduled_at && !a.attended && new Date(a.scheduled_at) > now);
  const lastWeight = profile?.lastWeight;
  const lastBp     = profile?.lastBpReading;
  const sleepLog   = healthLogs.find(l => l.data_type === 'sleep');
  const wLogs      = healthLogs.filter(l => l.data_type === 'weight');
  const wTrend     = wLogs.length >= 2
    ? (() => { const d = (parseFloat(wLogs[0].value) - parseFloat(wLogs[1].value)).toFixed(1); return (parseFloat(d) > 0 ? '+' : '') + d; })()
    : null;

  const kickStart = kickSessionStart
    ? new Date(kickSessionStart).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    : null;

  const pastAppts = appointments
    .filter(a => a.scheduled_at && new Date(a.scheduled_at) < now)
    .reverse().slice(0, 3)
    .map(a => ({ d: fmtDate(a.scheduled_at), t: apptLabel(a.appointment_type), s: a.location || '', ts: new Date(a.scheduled_at).getTime() }));
  const logEvents = healthLogs
    .filter(l => l.data_type !== 'kick_count').slice(0, 8)
    .map(l => ({ d: fmtDate(l.created_at), t: logTitle(l.data_type, l.value), s: (l.data_type === 'symptom' || l.data_type === 'mood') ? l.value : '', ts: new Date(l.created_at).getTime() }));
  const timeline = [...pastAppts, ...logEvents]
    .sort((a, b) => b.ts - a.ts).slice(0, 5)
    .map((ev, i) => ({ ...ev, cur: i === 0 }));

  const _authTok = _tok();
  const _patId   = _pid();

  return (
    <div className="screen care" style={{ position: 'relative' }}>
      {showHealthLog && (
        <HealthLogSheet
          lang={lang}
          patientId={_patId}
          authToken={_authTok}
          onClose={() => setShowHealthLog(false)}
          onSaved={() => fetchCareData()}
        />
      )}
      {showBookAppt && (
        <BookAppointmentSheet
          lang={lang}
          patientId={_patId}
          authToken={_authTok}
          prefillType={rescheduleType || 'anc'}
          onClose={() => { setShowBookAppt(false); setRescheduleType(null); }}
          onSaved={() => fetchCareData()}
        />
      )}
      <div style={{ padding: '8px 22px 0' }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#7A5E78', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{L('careForBoth')}</div>
        <div style={{ fontFamily: 'var(--display)', fontSize: 28, color: '#2A1A36', marginTop: 4, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
          {L('careTitle', 'tara')}<br/><span style={{ fontStyle: 'italic' }}>{L('careTitleItalic', 'tara')}</span>
        </div>
      </div>

      {fetchError && (
        <div style={{ margin: '12px 22px 0', borderRadius: 14, background: '#FBD6CB', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 16 }}>⚠️</span>
          <span style={{ flex: 1, fontSize: 12, color: '#3D2840' }}>
            {lang === 'bn' ? 'ডেটা লোড করা যায়নি।' : 'Could not load your health data.'}
          </span>
          <button onClick={fetchCareData} style={{ fontSize: 11, fontWeight: 700, color: '#3D2840', background: 'rgba(61,40,64,0.12)', border: 'none', borderRadius: 8, padding: '4px 10px', cursor: 'pointer' }}>
            {lang === 'bn' ? 'আবার চেষ্টা' : 'Retry'}
          </button>
        </div>
      )}

      <div style={{ padding: '16px 22px 0' }}>
        <Card style={{ background: 'linear-gradient(135deg, #FFFCF7, #FBE5D6)' }}>
          {nextAppt ? (
            <>
              <div style={{ display: 'flex', gap: 14 }}>
                <div style={{ width: 60, height: 60, borderRadius: 18, background: '#3D2840', color: '#FFF1E4', display: 'grid', placeItems: 'center', textAlign: 'center', lineHeight: 1 }}>
                  <div>
                    <div style={{ fontSize: 10, opacity: 0.7, letterSpacing: '0.1em' }}>{new Date(nextAppt.scheduled_at).toLocaleDateString('en-GB', { weekday: 'short' }).toUpperCase()}</div>
                    <div style={{ fontFamily: 'var(--display)', fontSize: 26, marginTop: 4 }}>{new Date(nextAppt.scheduled_at).getDate()}</div>
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <Pill tone="peach">Next checkup</Pill>
                  <div style={{ fontFamily: 'var(--display)', fontSize: 17, color: '#3D2840', marginTop: 6, letterSpacing: '-0.01em' }}>{apptLabel(nextAppt.appointment_type)}</div>
                  <div style={{ fontSize: 12, color: '#5A3E5F', marginTop: 3, lineHeight: 1.5 }}>
                    {new Date(nextAppt.scheduled_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })} · {nextAppt.location || '—'}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                {nextAppt.location ? (
                  <button
                    onClick={() => window.open('https://maps.google.com/?q=' + encodeURIComponent(nextAppt.location), '_blank')}
                    style={{ ...primaryBtn, flex: 1 }}
                  >
                    Get directions
                  </button>
                ) : (
                  <button style={{ ...primaryBtn, flex: 1, opacity: 0.4, cursor: 'not-allowed' }} disabled>No location set</button>
                )}
                <button
                  onClick={() => { setRescheduleType(nextAppt.appointment_type || 'anc'); setShowBookAppt(true); }}
                  style={{ ...primaryBtn, flex: 1, background: 'rgba(61,40,64,0.1)', color: '#3D2840' }}
                >
                  Reschedule
                </button>
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '12px 0' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>📅</div>
              <div style={{ fontFamily: 'var(--display)', fontSize: 16, color: '#3D2840' }}>No upcoming checkup</div>
              <div style={{ fontSize: 12, color: '#7A5E78', marginTop: 4, marginBottom: 14 }}>Book your next visit below</div>
              <button
                onClick={() => { setRescheduleType(null); setShowBookAppt(true); }}
                style={{ ...primaryBtn, margin: '0 auto', display: 'inline-flex' }}
              >
                📅 {tlang === 'bn' ? 'চেকআপ বুক করুন' : 'Book a checkup'}
              </button>
            </div>
          )}
        </Card>
      </div>

      <div style={{ padding: '14px 22px 0' }}>
        <Card style={{ background: 'linear-gradient(160deg, #F4D7E5, #FBE5D6)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <div>
              <Pill tone="cream">Kick counter</Pill>
              <div style={{ fontFamily: 'var(--display)', fontSize: 17, color: '#3D2840', marginTop: 8, letterSpacing: '-0.01em' }}>
                {kicks > 0 ? 'Baby is moving today' : 'No kicks recorded yet'}
              </div>
              <div style={{ fontSize: 11, color: '#5A3E5F', marginTop: 2 }}>
                {kickStart ? `Started ${kickStart} · target 10` : 'Target: 10 kicks in 2 hours'}
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--display)', fontSize: 44, color: '#3D2840', lineHeight: 1, letterSpacing: '-0.02em' }}>{kicks}</div>
              <div style={{ fontSize: 10, color: '#7A5E78', fontWeight: 600, letterSpacing: '0.1em' }}>OF 10</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 14, justifyContent: 'space-between' }}>
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} style={{ width: 22, height: 22, borderRadius: 7, background: i < kicks ? '#3D2840' : 'rgba(255,255,255,0.5)', display: 'grid', placeItems: 'center' }}>
                {i < kicks && <span style={{ fontSize: 12 }}>🤍</span>}
              </div>
            ))}
          </div>
          <button onClick={handleKickTap} disabled={kicks >= 10} style={{ ...primaryBtn, width: '100%', marginTop: 14, padding: '14px', opacity: kicks >= 10 ? 0.6 : 1 }}>
            <span style={{ fontSize: 18, marginRight: 4 }}>👣</span>
            {kicks >= 10 ? '✓ 10 kicks reached!' : 'Tap when baby kicks'}
          </button>
        </Card>
      </div>

      <div style={{ padding: '14px 22px 0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {[
            { l: 'Weight', v: lastWeight != null ? lastWeight.toFixed(1) : '—', u: 'kg',   trend: wTrend || (lastWeight ? 'latest' : 'no data'), color: '#F2EBDA' },
            { l: 'BP',     v: lastBp || '—',                                     u: 'mmHg', trend: lastBp ? 'latest' : 'no data',                 color: '#E6F1DC' },
            { l: 'Sleep',  v: sleepLog ? parseFloat(sleepLog.value).toFixed(1) : '—', u: 'hrs', trend: sleepLog ? 'logged' : 'no data',           color: '#E0D5F0' },
          ].map(stat => (
            <Card key={stat.l} style={{ background: stat.color, padding: 14 }}>
              <div style={{ fontSize: 10, color: '#7A5E78', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{stat.l}</div>
              <div style={{ fontFamily: 'var(--display)', fontSize: 20, color: '#3D2840', marginTop: 4, letterSpacing: '-0.02em', lineHeight: 1 }}>{stat.v}</div>
              <div style={{ fontSize: 9, color: '#5A3E5F', marginTop: 2 }}>{stat.u} · {stat.trend}</div>
            </Card>
          ))}
        </div>
      </div>

      {/* Log readings button */}
      <div style={{ padding: '10px 22px 0' }}>
        <button
          onClick={() => setShowHealthLog(true)}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '13px', borderRadius: 16, border: '1.5px dashed rgba(61,40,64,0.25)',
            background: 'rgba(255,255,255,0.6)', color: '#3D2840',
            fontSize: 13, fontWeight: 700, cursor: 'pointer', backdropFilter: 'blur(8px)',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3D2840" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>
          </svg>
          {tlang === 'bn' ? 'আজকের রিডিং লগ করুন' : "Log today's readings"}
        </button>
      </div>

      <div style={{ padding: '16px 22px 0' }}>
        <div style={{ fontFamily: 'var(--display)', fontSize: 18, color: '#3D2840', marginBottom: 8, letterSpacing: '-0.01em' }}>Your timeline</div>
        <Card>
          {timeline.length > 0 ? timeline.map((it, i, arr) => (
            <div key={i} style={{ display: 'flex', gap: 12, padding: '8px 0', position: 'relative' }}>
              <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: 10, height: 10, borderRadius: 99, background: it.cur ? '#F08A6E' : '#3D2840', boxShadow: it.cur ? '0 0 0 4px rgba(240,138,110,0.2)' : 'none', marginTop: 6 }}/>
                {i < arr.length - 1 && <div style={{ flex: 1, width: 2, background: 'rgba(61,40,64,0.1)', marginTop: 4 }}/>}
              </div>
              <div style={{ flex: 1, paddingBottom: 4 }}>
                <div style={{ fontSize: 10, color: '#7A5E78', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{it.d}</div>
                <div style={{ fontSize: 14, color: '#2A1A36', fontWeight: 600, marginTop: 2 }}>{it.t}</div>
                <div style={{ fontSize: 11, color: '#5A3E5F', marginTop: 2 }}>{it.s}</div>
              </div>
            </div>
          )) : (
            <div style={{ textAlign: 'center', padding: '16px 0', color: '#7A5E78', fontSize: 13 }}>Your journey starts here ✨</div>
          )}
        </Card>
      </div>

      <div style={{ padding: '16px 22px 20px' }}>
        <Card style={{ background: emergency ? 'linear-gradient(160deg, #FBD6CB, #F8C9C0)' : '#FFFCF7' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 48, height: 48, borderRadius: 16, background: emergency ? '#F08A6E' : '#FBD6CB', display: 'grid', placeItems: 'center', fontSize: 22 }}>🆘</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--display)', fontSize: 17, color: '#3D2840', letterSpacing: '-0.01em' }}>{L('needHelpNow', 'tara')}</div>
              <div style={{ fontSize: 11, color: '#5A3E5F', marginTop: 2, lineHeight: 1.5 }}>{L('taraGuide', 'tara')}</div>
            </div>
            <button onClick={() => { setEmergency(e => !e); setSosReply(null); }} style={{
              padding: '10px 14px', borderRadius: 99, border: 'none',
              background: emergency ? '#3D2840' : '#F08A6E',
              color: '#FFF1E4', fontSize: 12, fontWeight: 700, cursor: 'pointer', letterSpacing: '0.02em',
            }}>
              {emergency ? L('hide') : L('iNeedHelp')}
            </button>
          </div>
          {emergency && (
            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { i: '🩸', lKey: 'bleeding',     msg: 'I see bleeding',                c: '#F08A6E' },
                { i: '💧', lKey: 'waterBroke',   msg: 'My water broke',                c: '#A88DD1' },
                { i: '⚡', lKey: 'sharpPain',    msg: 'I have sharp or constant pain', c: '#E5A064' },
                { i: '🤱', lKey: 'babyNotMoved', msg: "Baby hasn't moved in hours",     c: '#D17BB0' },
                { i: '☎️', lKey: 'callDoctor',   msg: 'Please call my doctor right now',c: '#3D2840' },
              ].map(opt => (
                <button key={opt.lKey} onClick={() => handleSos(opt.lKey, opt.msg)} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                  borderRadius: 16, border: 'none', background: 'rgba(255,255,255,0.7)',
                  cursor: sosLoading ? 'not-allowed' : 'pointer', textAlign: 'left',
                  opacity: sosLoading && sosLoading !== opt.lKey ? 0.5 : 1,
                }}>
                  <div style={{ width: 32, height: 32, borderRadius: 12, background: opt.c, color: '#FFF1E4', display: 'grid', placeItems: 'center', fontSize: 14 }}>
                    {sosLoading === opt.lKey ? '⏳' : opt.i}
                  </div>
                  <div style={{ flex: 1, fontSize: 13, color: '#2A1A36', fontWeight: 600 }}>{L(opt.lKey)}</div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3D2840" strokeWidth="2" strokeLinecap="round"><path d="M9 6l6 6-6 6"/></svg>
                </button>
              ))}
              {sosReply && (
                <div style={{ background: 'rgba(255,255,255,0.85)', borderRadius: 16, padding: '12px 14px', fontSize: 13, color: '#2A1A36', lineHeight: 1.6, marginTop: 4 }}>
                  <div style={{ fontWeight: 700, color: '#F08A6E', marginBottom: 4 }}>🤍 Tara</div>
                  {sosReply}
                </div>
              )}
              <div style={{ fontSize: 11, color: '#5A3E5F', padding: '6px 4px', lineHeight: 1.5 }}>{L('taraStaysCalm', 'tara')}</div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

window.WellnessScreen = WellnessScreen;
window.CareScreen = CareScreen;
