// Journey + Chat + Voice screens

// ──────────────────────────────────────────────────────────────────
// JOURNEY (monthly guidance)
// ──────────────────────────────────────────────────────────────────
function JourneyScreen({ state, setState, openScreen }) {
  const { iconBtn, primaryBtn, ghostBtn } = window.uiBtns;
  const monthFromWeek = Math.min(9, Math.ceil(state.week / 4.345));
  const [active, setActive] = React.useState(monthFromWeek);

  const months = [
  { n: 1, t: 'A tiny spark', accent: '#FCE0D4', tara: 'sleepy', body: 'You may feel very tired — please rest often.', baby: "Baby's heart starts beating around week 6.", eat: ['Folic acid daily', 'Fresh fruits', 'Yogurt + nuts'], avoid: ['Raw fish or eggs', 'Soft cheese', 'Smoking around you'] },
  { n: 2, t: 'First flutter', accent: '#FBD6CB', tara: 'idle', body: 'Morning nausea is normal. Eat small meals.', baby: 'Tiny arm and leg buds are forming.', eat: ['Ginger tea', 'Crackers in the morning', 'Lentils'], avoid: ['Strong perfumes', 'Long bus rides', 'Skipping meals'] },
  { n: 3, t: 'Becoming you', accent: '#F8CCD9', tara: 'happy', body: 'Energy may return. First scan this month.', baby: 'Fingers, toes, eyelids forming.', eat: ['Spinach + beef liver', 'Eggs', 'Citrus fruits'], avoid: ['Heavy lifting', 'Hot baths', 'Self-medicating'] },
  { n: 4, t: 'A quieter calm', accent: '#F1C7DA', tara: 'happy', body: 'You may feel calmer. Belly starts to show.', baby: "Baby can hear muffled sounds now.", eat: ['Dal + rice', 'Milk daily', 'Seasonal fruits'], avoid: ['Caffeine > 1 cup', 'Sleeping on back', 'Late-night junk'] },
  { n: 5, t: 'First kicks', accent: '#EBC0E0', tara: 'celebrate', body: 'You may feel the first soft flutters.', baby: 'Baby starts kicking and turning.', eat: ['Calcium-rich foods', 'Whole grains', 'Sweet potato'], avoid: ['Long standing', 'Tight clothes', 'Skipping checkups'] },
  { n: 6, t: 'Your voice, their world', accent: '#E0D5F0', tara: 'listening', body: 'Talk and sing to baby — they hear you.', baby: 'Eyelids open, eyebrows growing.', eat: ['Iron-rich greens', 'Plenty of water', 'Nuts + seeds'], avoid: ['Stress where you can', 'Heavy spices', 'Long travel'] },
  { n: 7, t: 'Slowing down', accent: '#D6CCEC', tara: 'idle', body: 'Backaches may begin. Use a pillow at night.', baby: 'Baby practices breathing motions.', eat: ['Omega-3 rich fish (cooked)', 'Almonds', 'Bananas'], avoid: ['Sleeping on right side long', 'Heavy housework', 'Tight belts'] },
  { n: 8, t: 'Heavy and held', accent: '#E5D8E8', tara: 'idle', body: 'Swelling in feet is common. Elevate them.', baby: 'Baby gains weight quickly now.', eat: ['Low-salt meals', 'Fresh fruit', 'Coconut water'], avoid: ['Standing > 30 min', 'Long car rides', 'Forgetting kick counts'] },
  { n: 9, t: 'Almost here', accent: '#FBD6CB', tara: 'celebrate', body: 'Pack your bag. Rest, eat, breathe.', baby: 'Baby is full term, ready to meet you.', eat: ['Dates (helps labor!)', 'Small frequent meals', 'Warm soup'], avoid: ['Panic — Tara is here', 'Being alone far from help', 'Skipping signs of labor'] }];

  const m = months[active - 1];

  return (
    <div className="screen journey">
      <div style={{ padding: '8px 22px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#7A5E78', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Your journey
            </div>
            <div style={{ fontFamily: 'var(--display)', fontSize: 28, color: '#2A1A36', marginTop: 4, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              Month <span style={{ fontStyle: 'italic' }}>{m.n}</span><br />
              <span style={{ fontSize: 22, color: '#5A3E5F' }}>{m.t}</span>
            </div>
          </div>
          <Tara size={108} mood={m.tara} />
        </div>
      </div>

      {/* month rail */}
      <div style={{ padding: '14px 0 0', overflowX: 'auto', scrollbarWidth: 'none' }}>
        <div style={{ display: 'flex', gap: 8, padding: '0 22px' }}>
          {months.map((mm) =>
          <button key={mm.n} onClick={() => setActive(mm.n)} style={{
            flex: '0 0 auto', padding: '8px 14px', borderRadius: 99,
            border: 'none', cursor: 'pointer',
            background: active === mm.n ? '#3D2840' : 'rgba(255,255,255,0.7)',
            color: active === mm.n ? '#FFF1E4' : '#3D2840',
            fontSize: 12, fontWeight: 600, letterSpacing: '-0.01em',
            boxShadow: active === mm.n ? '0 6px 18px -8px rgba(61,40,64,0.5)' : 'none'
          }}>
              Month {mm.n}
            </button>
          )}
        </div>
      </div>

      {/* hero of month */}
      <div style={{ padding: '14px 22px 0' }}>
        <Card style={{ background: m.accent, padding: 22 }}>
          <Pill tone="cream">For your baby</Pill>
          <div style={{ fontFamily: 'var(--display)', fontSize: 19, color: '#3D2840', marginTop: 8, lineHeight: 1.35, letterSpacing: '-0.01em' }}>
            {m.baby}
          </div>
        </Card>
      </div>

      <div style={{ padding: '12px 22px 0' }}>
        <Card style={{ background: '#FFFCF7' }}>
          <Pill tone="lav">For your body</Pill>
          <div style={{ fontFamily: 'var(--display)', fontSize: 18, color: '#3D2840', marginTop: 8, lineHeight: 1.35, letterSpacing: '-0.01em' }}>
            {m.body}
          </div>
        </Card>
      </div>

      <div style={{ padding: '12px 22px 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Card style={{ background: '#F2EBDA' }}>
          <Pill tone="peach">Eat</Pill>
          <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {m.eat.map((e, i) =>
            <div key={i} style={{ display: 'flex', gap: 8, fontSize: 13, color: '#3D2840', lineHeight: 1.35 }}>
                <span style={{ color: '#7BC894' }}>✓</span> {e}
              </div>
            )}
          </div>
        </Card>
        <Card style={{ background: '#F8E2DD' }}>
          <Pill tone="pink">Avoid</Pill>
          <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {m.avoid.map((e, i) =>
            <div key={i} style={{ display: 'flex', gap: 8, fontSize: 13, color: '#3D2840', lineHeight: 1.35 }}>
                <span style={{ color: '#F08A6E' }}>✕</span> {e}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* emotional changes */}
      <div style={{ padding: '12px 22px 20px' }}>
        <Card style={{ background: 'linear-gradient(135deg, #FBE5D6, #F4D7E5)' }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ fontSize: 26, lineHeight: 1 }}>💗</div>
            <div>
              <Pill tone="cream">Emotional weather</Pill>
              <div style={{ fontSize: 13, color: '#3D2840', marginTop: 8, lineHeight: 1.5 }}>
                Feelings may swing fast this month — calm, then teary, then proud, then anxious. That's not weakness. That's hormones building a person.<br />
                <span style={{ color: '#7A5E78' }}>If sadness lasts more than 2 weeks, please tell me. We can talk anytime.</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>);

}

// ──────────────────────────────────────────────────────────────────
// CHAT
// ──────────────────────────────────────────────────────────────────
function ChatScreen({ state, setState, openScreen }) {
  const { iconBtn, primaryBtn } = window.uiBtns;
  const [msgs, setMsgs] = React.useState([
  { who: 'tara', t: 'শুভ সকাল, Maya 🌸', sub: 'Good morning' },
  { who: 'tara', t: 'How are you feeling today?', kind: 'q' },
  { who: 'user', t: 'একটু ক্লান্ত লাগছে...' },
  { who: 'tara', t: "I hear you. Pregnancy tiredness is so real.", emo: 'soft' },
  { who: 'tara', t: "Let's do something gentle. Pick one?", chips: ['Breathe with me 🌬️', 'Tell me a story 📖', 'Log a meal 🍚', 'Just listen 💗'] }]
  );
  const [input, setInput] = React.useState('');
  const scrollRef = React.useRef(null);

  React.useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [msgs]);

  const send = (text) => {
    if (!text.trim()) return;
    setMsgs((m) => [...m, { who: 'user', t: text }]);
    setInput('');
    setTimeout(() => {
      setMsgs((m) => [...m, { who: 'tara', t: "I'm here with you. Take a slow breath — we have all the time we need.", emo: 'soft' }]);
    }, 700);
  };

  return (
    <div className="screen chat" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* chat header */}
      <div style={{
        padding: '8px 18px 14px', display: 'flex', alignItems: 'center', gap: 12,
        borderBottom: '1px solid rgba(61,40,64,0.06)'
      }}>
        <button onClick={() => openScreen('home')} style={{ ...iconBtn, width: 36, height: 36 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3D2840" strokeWidth="2" strokeLinecap="round"><path d="M15 18l-6-6 6-6" /></svg>
        </button>
        <div style={{ position: 'relative' }}>
          <Tara size={64} mood="happy" />
          <div style={{ position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, borderRadius: 99, background: '#7BC894', border: '2px solid #FFFCF7' }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'var(--display)', fontSize: 18, color: '#3D2840', lineHeight: 1, letterSpacing: '-0.01em' }}>Tara</div>
          <div style={{ fontSize: 11, color: '#5A8A6A', marginTop: 3 }}>● Listening · ভালো আছি</div>
        </div>
        <button onClick={() => openScreen('voice')} style={{
          ...primaryBtn, padding: '8px 12px', fontSize: 12, background: 'linear-gradient(135deg, #F08A6E, #F4B4C8)'
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFF1E4" strokeWidth="2" strokeLinecap="round">
            <rect x="9" y="3" width="6" height="12" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
          </svg>
          Voice
        </button>
      </div>

      {/* messages */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '14px 18px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ alignSelf: 'center', fontSize: 10, color: '#7A5E78', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '4px 12px', borderRadius: 99, background: 'rgba(255,255,255,0.5)' }}>
          Today · 9:14 AM
        </div>
        {msgs.map((m, i) =>
        <Bubble key={i} m={m} onChip={send} />
        )}
        <div style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: '#FFFCF7', borderRadius: 18, borderTopLeftRadius: 6, opacity: 0.7 }}>
          <span style={{ width: 5, height: 5, borderRadius: 99, background: '#3D2840', animation: 'dot 1.2s ease-in-out infinite' }} />
          <span style={{ width: 5, height: 5, borderRadius: 99, background: '#3D2840', animation: 'dot 1.2s ease-in-out 0.15s infinite' }} />
          <span style={{ width: 5, height: 5, borderRadius: 99, background: '#3D2840', animation: 'dot 1.2s ease-in-out 0.3s infinite' }} />
        </div>
        <style>{`@keyframes dot { 0%, 100% { opacity: 0.2; transform: translateY(0) } 50% { opacity: 1; transform: translateY(-3px) } }`}</style>
      </div>

      {/* composer */}
      <div style={{ padding: '8px 14px 14px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 8px 8px 16px', borderRadius: 28,
          background: '#FFFCF7',
          boxShadow: '0 10px 30px -16px rgba(61,40,64,0.2), 0 1px 0 rgba(255,255,255,0.9) inset'
        }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send(input)}
            placeholder="Tell Tara anything..."
            style={{
              flex: 1, border: 'none', outline: 'none', background: 'transparent',
              fontSize: 14, color: '#2A1A36', fontFamily: 'inherit'
            }} />
          
          <button style={{
            width: 36, height: 36, borderRadius: 99, border: 'none', background: '#F4ECE0',
            display: 'grid', placeItems: 'center', cursor: 'pointer'
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3D2840" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="9" /><path d="M8 12h8M12 8v8" /></svg>
          </button>
          <button onClick={() => send(input)} style={{
            width: 40, height: 40, borderRadius: 99, border: 'none',
            background: '#3D2840', display: 'grid', placeItems: 'center', cursor: 'pointer'
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFF1E4" strokeWidth="2" strokeLinecap="round"><path d="M3 12l18-9-7 18-2-8z" /></svg>
          </button>
        </div>
      </div>
    </div>);

}

function Bubble({ m, onChip }) {
  if (m.who === 'tara') {
    return (
      <div style={{ alignSelf: 'flex-start', maxWidth: '82%' }}>
        <div style={{
          padding: '10px 14px', borderRadius: 20, borderTopLeftRadius: 6,
          background: 'linear-gradient(140deg, #FFFCF7, #FBEFE3)',
          color: '#2A1A36', fontSize: 14, lineHeight: 1.45,
          boxShadow: '0 8px 18px -12px rgba(61,40,64,0.2)'
        }}>
          {m.t}
        </div>
        {m.sub && <div style={{ fontSize: 10, color: '#7A5E78', padding: '4px 8px 0' }}>{m.sub}</div>}
        {m.chips &&
        <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
            {m.chips.map((c) =>
          <button key={c} onClick={() => onChip(c)} style={{
            padding: '8px 12px', borderRadius: 99, border: '1px solid rgba(61,40,64,0.12)',
            background: 'rgba(255,255,255,0.7)', cursor: 'pointer',
            fontSize: 12, fontWeight: 600, color: '#3D2840',
            whiteSpace: 'nowrap'
          }}>{c}</button>
          )}
          </div>
        }
      </div>);

  }
  return (
    <div style={{ alignSelf: 'flex-end', maxWidth: '78%' }}>
      <div style={{
        padding: '10px 14px', borderRadius: 20, borderTopRightRadius: 6,
        background: '#3D2840', color: '#FFF1E4',
        fontSize: 14, lineHeight: 1.45
      }}>{m.t}</div>
    </div>);

}

// ──────────────────────────────────────────────────────────────────
// VOICE MODE
// ──────────────────────────────────────────────────────────────────
function VoiceScreen({ state, setState, openScreen }) {
  const [phase, setPhase] = React.useState('listening'); // listening | speaking
  const [transcript, setTranscript] = React.useState('আজকে আমি একটু চিন্তিত...');
  const [videoReady, setVideoReady] = React.useState(false);
  const videoRef = React.useRef(null);

  React.useEffect(() => {
    const t = setTimeout(() => setPhase('speaking'), 2200);
    return () => clearTimeout(t);
  }, []);

  // Try to autoplay the video as soon as VoiceScreen mounts.
  React.useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = true; // mobile autoplay requirement
    const p = v.play();
    if (p && typeof p.catch === 'function') p.catch(() => {});
  }, []);

  return (
    <div className="screen voice" style={{ height: '100%', display: 'flex', flexDirection: 'column', color: '#FFF1E4', position: 'relative', overflow: 'hidden' }}>
      {/* full-screen video background */}
      <video
        ref={videoRef}
        src="assets/tara-voice.mp4"
        muted
        loop
        playsInline
        autoPlay
        onCanPlay={() => setVideoReady(true)}
        onLoadedData={() => setVideoReady(true)}
        style={{
          position: 'absolute', top: 0, left: '50%',
          transform: 'translateX(-50%)',
          width: '100%', height: '100%',
          objectFit: 'contain',
          opacity: videoReady ? 1 : 0,
          transition: 'opacity 500ms ease',
          zIndex: 0
        }} />
      

      {/* fallback solid background until video loads */}
      {!videoReady &&
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0,
        background: `
            radial-gradient(40% 30% at 50% 25%, rgba(244,180,200,0.45), transparent 65%),
            radial-gradient(50% 35% at 50% 65%, rgba(224,213,240,0.3), transparent 70%),
            linear-gradient(180deg, #2C1A38 0%, #1F1228 100%)
          `,
        display: 'grid', placeItems: 'center'
      }}>
          <Tara size={260} mood="listening" halo />
        </div>
      }

      {/* dark gradient overlay for readability */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
        background: `
          linear-gradient(180deg, rgba(20,10,28,0.55) 0%, rgba(20,10,28,0.15) 30%, rgba(20,10,28,0.25) 60%, rgba(20,10,28,0.85) 100%)
        `
      }} />

      <div style={{ position: 'relative', padding: '54px 18px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 5 }}>
        <button onClick={() => openScreen('chat')} style={{
          width: 36, height: 36, borderRadius: 99, border: 'none',
          background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)',
          display: 'grid', placeItems: 'center', cursor: 'pointer'
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFF1E4" strokeWidth="2" strokeLinecap="round"><path d="M15 18l-6-6 6-6" /></svg>
        </button>
        <div style={{
          fontSize: 11, color: '#FFF1E4', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600,
          padding: '6px 12px', borderRadius: 99,
          background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)',
          display: 'flex', alignItems: 'center', gap: 6
        }}>
          <span style={{ width: 6, height: 6, borderRadius: 99, background: phase === 'speaking' ? '#F08A6E' : '#F4B4C8', boxShadow: `0 0 8px ${phase === 'speaking' ? '#F08A6E' : '#F4B4C8'}` }} />
          {phase === 'listening' ? 'listening' : 'speaking'}
        </div>
        <div style={{
          width: 36, height: 36, borderRadius: 99,
          background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)',
          display: 'grid', placeItems: 'center'
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFF1E4" strokeWidth="2" strokeLinecap="round">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
        </div>
      </div>

      {/* spacer so transcript sits in lower third over the video */}
      <div style={{ flex: 1, position: 'relative', zIndex: 5 }} />

      {/* transcript card — glass overlay */}
      <div style={{ position: 'relative', zIndex: 5, padding: '0 22px 16px' }}>
        <div style={{
          textAlign: 'center', maxWidth: 340, margin: '0 auto',
          padding: '16px 20px', borderRadius: 24,
          background: 'rgba(20,10,28,0.55)', backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,241,228,0.12)'
        }}>
          {phase === 'listening' ?
          <>
              <div style={{ fontFamily: 'var(--display)', fontSize: 22, color: '#FFF1E4', lineHeight: 1.3, letterSpacing: '-0.01em' }}>
                "{transcript}"
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,241,228,0.65)', marginTop: 12 }}>
                You're talking · I'm listening carefully
              </div>
            </> :

          <>
              <div style={{ fontFamily: 'var(--display)', fontSize: 22, color: '#FFF1E4', lineHeight: 1.3, letterSpacing: '-0.01em' }}>
                "চিন্তা করবেন না। আমি আছি তো —"
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,241,228,0.72)', marginTop: 12, fontStyle: 'italic', lineHeight: 1.4 }}>
                "Don't worry — I'm here. Let's breathe together."
              </div>
            </>
          }
        </div>
        <div style={{ marginTop: 18 }}>
          <Waveform playing={true} bars={28} color="#F4B4C8" />
        </div>
      </div>

      {/* control bar */}
      <div style={{ position: 'relative', zIndex: 5, padding: '0 22px 40px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-around',
          padding: 10, borderRadius: 28,
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.12)', background: "rgb(140, 63, 63)"
        }}>
          <VoiceBtn label="Mute" icon="mute" />
          <button onClick={() => openScreen('chat')} style={{
            width: 64, height: 64, borderRadius: 99, border: 'none',
            background: 'linear-gradient(135deg, #F08A6E, #F4B4C8)',
            display: 'grid', placeItems: 'center', cursor: 'pointer',
            boxShadow: '0 10px 30px -8px rgba(240,138,110,0.6)'
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFF1E4" strokeWidth="2.4" strokeLinecap="round"><path d="M6 6l12 12M6 18L18 6" /></svg>
          </button>
          <VoiceBtn label="Speaker" icon="spk" />
        </div>
        <div style={{ textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 10 }}>
          Tap × to end · everything stays private to you and Tara
        </div>
      </div>

      <style>{`
        @keyframes orbBreathe { 0%, 100% { transform: scale(0.9); opacity: 0.5 } 50% { transform: scale(1.1); opacity: 0.9 } }
        @keyframes voiceRing { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
      `}</style>
    </div>);

}

function VoiceBtn({ label, icon }) {
  return (
    <button style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
      background: 'transparent', border: 'none', cursor: 'pointer',
      width: 56, padding: 6
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 99,
        background: 'rgba(255,255,255,0.1)',
        display: 'grid', placeItems: 'center'
      }}>
        {icon === 'mute' ?
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFF1E4" strokeWidth="2" strokeLinecap="round">
            <line x1="2" y1="2" x2="22" y2="22" /><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V5a3 3 0 0 0-5.94-.6" /><path d="M17 16.95A7 7 0 0 1 5 12v-2M19 10v2a7 7 0 0 1-.11 1.23" />
          </svg> :

        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFF1E4" strokeWidth="2" strokeLinecap="round">
            <path d="M11 5L6 9H2v6h4l5 4z" /><path d="M19 12c0-2-1-4-3-5M16 8c1 1 1.5 2.5 1.5 4s-.5 3-1.5 4" />
          </svg>
        }
      </div>
      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>{label}</div>
    </button>);

}

window.JourneyScreen = JourneyScreen;
window.ChatScreen = ChatScreen;
window.VoiceScreen = VoiceScreen;