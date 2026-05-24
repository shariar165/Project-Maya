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
const _getConvos = () => { try { return JSON.parse(localStorage.getItem('maya_conversations') || '[]'); } catch { return []; } };
const _saveConvo = (id, messages, nameHint) => {
  const list = _getConvos();
  const idx = list.findIndex(c => c.id === id);
  const now = new Date().toISOString();
  if (idx >= 0) { list[idx] = { ...list[idx], messages, updatedAt: now }; }
  else { list.unshift({ id, name: nameHint || 'Conversation', messages, startedAt: now, updatedAt: now }); }
  localStorage.setItem('maya_conversations', JSON.stringify(list));
};
const _delConvo = (id) => {
  localStorage.setItem('maya_conversations', JSON.stringify(_getConvos().filter(c => c.id !== id)));
};

function ChatScreen({ state, setState, openScreen }) {
  const { iconBtn, primaryBtn } = window.uiBtns;
  const [msgs, setMsgs] = React.useState([
    { who: 'tara', t: 'আমি Tara। কেমন আছো? / I\'m Tara. How are you feeling?', emo: 'caring' }
  ]);
  const [input, setInput] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [showHistory, setShowHistory] = React.useState(false);
  const [convId, setConvId] = React.useState(null);
  const scrollRef = React.useRef(null);

  React.useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [msgs]);

  const send = async (text) => {
    if (!text.trim()) return;
    let cid = convId;
    if (!cid) { cid = Date.now().toString(); setConvId(cid); }
    setMsgs((m) => [...m, { who: 'user', t: text }]);
    setInput('');
    setLoading(true);
    const patientId = (() => { try { return JSON.parse(localStorage.getItem('maya_user') || '{}').id || 'guest'; } catch { return 'guest'; } })();
    const authToken = (() => { try { return JSON.parse(localStorage.getItem('maya_session') || '{}').token || ''; } catch { return ''; } })();
    try {
      const res = await fetch(`${window.BACKEND_URL}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
        body: JSON.stringify({ patient_id: patientId, message: text, source: 'chat' }),
      });
      const data = await res.json();
      const emo = data.emotion || 'caring';
      setMsgs((m) => { const next = [...m, { who: 'tara', t: data.message || '...', emo }]; _saveConvo(cid, next, text.slice(0, 40)); return next; });
      if (data.guardian_alert?.sent) {
        console.warn('[Maya] Guardian alerted:', data.guardian_alert.severity);
      }
    } catch (e) {
      setMsgs((m) => { const next = [...m, { who: 'tara', t: "I'm here with you. Take a slow breath — we have all the time we need.", emo: 'soft' }]; _saveConvo(cid, next, text.slice(0, 40)); return next; });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="screen chat" style={{ position: 'relative', display: 'flex', flexDirection: 'column', height: '100%' }}>
      {showHistory && (
        <ConversationHistoryPanel
          iconBtn={iconBtn}
          activeConvId={convId}
          onClose={() => setShowHistory(false)}
          onSelect={(c) => { setMsgs(c.messages); setConvId(c.id); setShowHistory(false); }}
          onDelete={(id) => { _delConvo(id); }}
          onNew={() => {
            setMsgs([{ who: 'tara', t: 'আমি Tara। কেমন আছো? / I\'m Tara. How are you feeling?', emo: 'caring' }]);
            setConvId(null);
            setShowHistory(false);
          }}
        />
      )}
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
        <button onClick={() => setShowHistory(v => !v)} style={{ ...iconBtn, width: 36, height: 36 }} title="Conversation history">
          <svg width="4" height="18" viewBox="0 0 4 18" fill="#3D2840">
            <circle cx="2" cy="4" r="2"/><circle cx="2" cy="14" r="2"/>
          </svg>
        </button>
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
          Today · {new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
        </div>
        {msgs.map((m, i) =>
        <Bubble key={i} m={m} onChip={send} />
        )}
        {loading && (
          <div style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: '#FFFCF7', borderRadius: 18, borderTopLeftRadius: 6, opacity: 0.7 }}>
            <span style={{ width: 5, height: 5, borderRadius: 99, background: '#3D2840', animation: 'dot 1.2s ease-in-out infinite' }} />
            <span style={{ width: 5, height: 5, borderRadius: 99, background: '#3D2840', animation: 'dot 1.2s ease-in-out 0.15s infinite' }} />
            <span style={{ width: 5, height: 5, borderRadius: 99, background: '#3D2840', animation: 'dot 1.2s ease-in-out 0.3s infinite' }} />
          </div>
        )}
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

function ConversationHistoryPanel({ iconBtn, activeConvId, onClose, onSelect, onDelete, onNew }) {
  const [convos, setConvos] = React.useState(_getConvos());

  const handleDelete = (id) => {
    onDelete(id);
    setConvos(_getConvos());
  };

  const relDate = (iso) => {
    const d = Math.floor((Date.now() - new Date(iso)) / 86400000);
    if (d === 0) return 'Today';
    if (d === 1) return 'Yesterday';
    return `${d} days ago`;
  };

  return (
    <div style={{
      position: 'absolute', inset: 0, background: '#FFFCF7', zIndex: 100,
      display: 'flex', flexDirection: 'column'
    }}>
      <div style={{
        padding: '14px 18px', display: 'flex', alignItems: 'center',
        borderBottom: '1px solid rgba(61,40,64,0.08)'
      }}>
        <div style={{ flex: 1, fontFamily: 'var(--display)', fontSize: 20, color: '#3D2840', letterSpacing: '-0.01em' }}>Conversations</div>
        <button onClick={onClose} style={{ ...iconBtn, width: 36, height: 36 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3D2840" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
        </button>
      </div>
      {/* New conversation button */}
      <button onClick={onNew} style={{
        margin: '12px 18px 4px', padding: '11px 16px', borderRadius: 14, border: 'none', cursor: 'pointer',
        background: 'linear-gradient(135deg, #3D2840, #5A3E5F)',
        display: 'flex', alignItems: 'center', gap: 10
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFF1E4" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
        <span style={{ fontSize: 14, fontWeight: 600, color: '#FFF1E4' }}>New conversation</span>
      </button>
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {convos.length === 0 ? (
          <div style={{ padding: '50px 24px', textAlign: 'center', color: '#7A5E78', fontSize: 14, lineHeight: 1.6 }}>
            No conversations found
          </div>
        ) : convos.map((c) => {
          const isActive = c.id === activeConvId;
          return (
            <div key={c.id} onClick={() => onSelect(c)} style={{
              display: 'flex', alignItems: 'center', padding: '13px 18px', gap: 12,
              cursor: 'pointer', borderBottom: '1px solid rgba(61,40,64,0.05)',
              background: isActive ? 'rgba(61,40,64,0.04)' : 'transparent'
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 99, flexShrink: 0,
                background: isActive ? 'linear-gradient(135deg, #3D2840, #5A3E5F)' : 'linear-gradient(135deg, #F4D7E5, #E8D5F0)',
                display: 'grid', placeItems: 'center'
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={isActive ? '#FFF1E4' : '#5A3E5F'} strokeWidth="2" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, color: '#2A1A36', fontWeight: isActive ? 600 : 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</div>
                <div style={{ fontSize: 11, color: '#7A5E78', marginTop: 2 }}>{isActive ? 'Current · ' : ''}{relDate(c.updatedAt)}</div>
              </div>
              {!isActive && (
                <button onClick={(e) => { e.stopPropagation(); handleDelete(c.id); }} style={{ ...iconBtn, width: 30, height: 30, flexShrink: 0 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#B07080" strokeWidth="2" strokeLinecap="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" /></svg>
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────
// VOICE MODE
// ──────────────────────────────────────────────────────────────────

// Resolves voices array, waiting for async load if needed (voices start empty on first call)
function loadVoices() {
  return new Promise(resolve => {
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) { resolve(voices); return; }
    const handler = () => {
      window.speechSynthesis.removeEventListener('voiceschanged', handler);
      resolve(window.speechSynthesis.getVoices());
    };
    window.speechSynthesis.addEventListener('voiceschanged', handler);
    setTimeout(() => {
      window.speechSynthesis.removeEventListener('voiceschanged', handler);
      resolve(window.speechSynthesis.getVoices());
    }, 2000);
  });
}

const TARA_RESPONSES = {
  worried:    [
    { bn: 'চিন্তা করবেন না। আমি আছি তো —', en: "Don't worry — I'm here with you." },
    { bn: 'শ্বাস নিন। আমি পাশে আছি।', en: 'Take a breath. I am right beside you.' },
  ],
  alert:      [{ bn: 'আমি এখানে আছি। শ্বাস নিন।', en: "I'm here. Take a slow breath." }],
  happy:      [
    { bn: 'আপনি দারুণ করছেন! আমি খুশি।', en: 'You are doing wonderfully!' },
    { bn: 'আপনার হাসি আমাকে খুশি করে।', en: 'Your smile makes me happy too.' },
  ],
  caring:     [{ bn: 'আপনার যত্ন নেওয়া হচ্ছে। সব ঠিক হবে।', en: 'You are being cared for. Everything will be okay.' }],
  celebration:[{ bn: 'অভিনন্দন! আপনি অসাধারণ।', en: 'Congratulations — you are amazing!' }],
  week_1_12:  [
    { bn: 'প্রথম তিন মাস একটু কঠিন। আপনি সাহসী।', en: 'The first trimester is tough. You are so brave.' },
    { bn: 'বমি বা ক্লান্তি হলে বিশ্রাম নিন — এটা স্বাভাবিক।', en: 'Rest when you feel nauseous — that is completely normal.' },
  ],
  week_13_26: [
    { bn: 'মাঝামাঝি সময়ে আছেন — শিশু বাড়ছে!', en: 'You are in the second trimester — baby is growing!' },
    { bn: 'এই সময়টা উপভোগ করুন। আপনি দারুণ করছেন।', en: 'Enjoy this time — you are doing amazing.' },
  ],
  week_27_40: [
    { bn: 'প্রায় শেষ! আর একটু, আপনি পারবেন।', en: 'Almost there! Just a little more — you can do it.' },
    { bn: 'শিশুর আগমন আর বেশি দূরে নয়।', en: 'Your baby is almost ready to meet you.' },
  ],
  default:    [
    { bn: 'আমি এখানে আছি। কী বললেন?', en: "I'm here. What were you saying?" },
    { bn: 'আমি মনোযোগ দিয়ে শুনছি।', en: "I'm listening carefully to you." },
  ],
};

function pickResponse(week, mood) {
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  if (TARA_RESPONSES[mood]) return pick(TARA_RESPONSES[mood]);
  if (week <= 12) return pick(TARA_RESPONSES.week_1_12);
  if (week <= 26) return pick(TARA_RESPONSES.week_13_26);
  if (week <= 40) return pick(TARA_RESPONSES.week_27_40);
  return pick(TARA_RESPONSES.default);
}

function VoiceScreen({ state, setState, openScreen }) {
  const [phase, setPhase] = React.useState('listening');
  const [transcript, setTranscript] = React.useState('');
  const [taraText, setTaraText] = React.useState(null);
  const [isMuted, setIsMuted] = React.useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = React.useState(true);
  const [introPhase, setIntroPhase] = React.useState('funny');
  const taraRef = React.useRef(null);
  const recognitionRef = React.useRef(null);
  const audioRef = React.useRef(null); // current ElevenLabs Audio + objectURL
  const phaseRef = React.useRef('listening');
  const isMutedRef = React.useRef(false);

  const mountedRef = React.useRef(true);
  React.useEffect(() => () => { mountedRef.current = false; }, []);

  React.useEffect(() => { phaseRef.current = phase; }, [phase]);
  // isMutedRef is kept in sync both via useEffect AND synchronously in handleMute
  // (the sync update is needed so onend sees the correct value before the effect runs)
  React.useEffect(() => { isMutedRef.current = isMuted; }, [isMuted]);

  // Create SpeechRecognition instance once on mount
  React.useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return; // Firefox fallback handled in the listening useEffect
    const recog = new SR();
    recog.lang = state.lang === 'bn' ? 'bn-BD' : 'en-US';
    recog.continuous = false;
    recog.interimResults = true;

    recog.onresult = (e) => {
      const text = Array.from(e.results).map(r => r[0].transcript).join('');
      setTranscript(text);
    };

    recog.onend = () => {
      if (phaseRef.current !== 'listening' || isMutedRef.current) return;
      setPhase('speaking');
    };

    recog.onerror = (e) => {
      // mic blocked, no device, or restricted service → auto-mute
      if (['not-allowed', 'service-not-allowed', 'audio-capture'].includes(e.error)) {
        isMutedRef.current = true; // sync so onend guard fires correctly
        setIsMuted(true);
      }
      // 'network' / 'no-speech' / 'aborted': onend will still fire and advance the loop
    };

    recognitionRef.current = recog;
    return () => {
      recog.stop();
      window.speechSynthesis?.cancel();
      const a = audioRef.current;
      if (a) { a.audio.pause(); a.audio.src = ''; URL.revokeObjectURL(a.url); audioRef.current = null; }
    };
  }, []);

  // Intro: play funny clip on first session visit
  React.useEffect(() => {
    const isFirst = !sessionStorage.getItem('taraVoiceOpened');
    if (isFirst) {
      sessionStorage.setItem('taraVoiceOpened', '1');
      taraRef.current?.playRandomFunny(() => setIntroPhase('normal'));
    } else {
      setIntroPhase('normal');
    }
  }, []);

  // Sync Tara video to phase (after intro)
  React.useEffect(() => {
    if (introPhase !== 'normal' || !taraRef.current) return;
    if (phase === 'speaking') {
      taraRef.current.stopListening();   // listening → thinking crossfade
    } else {
      taraRef.current.startListening();  // → listening loop
    }
  }, [phase, introPhase]);

  // Start recognition when listening (after intro, not muted)
  React.useEffect(() => {
    if (introPhase !== 'normal' || phase !== 'listening' || isMuted) return;
    setTranscript('');
    if (!recognitionRef.current) {
      // No SpeechRecognition (Firefox etc.) — auto-advance so Tara still responds
      const t = setTimeout(() => { if (mountedRef.current) setPhase('speaking'); }, 3000);
      return () => clearTimeout(t);
    }
    try { recognitionRef.current.start(); } catch (_) {}
  }, [introPhase, phase, isMuted]);

  // When phase switches to speaking: call backend /ask then ElevenLabs TTS
  React.useEffect(() => {
    if (introPhase !== 'normal' || phase !== 'speaking') return;

    let autoReturnTimer = null;
    let speakDelayTimer = null;
    let cancelled = false;

    const scheduleReturn = (delay) => {
      clearTimeout(autoReturnTimer);
      autoReturnTimer = setTimeout(() => { if (mountedRef.current) setPhase('listening'); }, delay);
    };

    const cleanupAudio = () => {
      const a = audioRef.current;
      if (a) { a.audio.pause(); a.audio.src = ''; URL.revokeObjectURL(a.url); audioRef.current = null; }
    };

    const driveEmotion = (data) => {
      const em = data.emotion || 'happy';
      const holdMs = (data.hold_seconds ?? 4) * 1000;
      if (em === 'caring') {
        taraRef.current?.playCaring(holdMs);
      } else if (em === 'celebration' || em === 'celebration2') {
        taraRef.current?.playCelebration2();
      } else if (em === 'singing') {
        taraRef.current?.playSinging();
      } else {
        const textLen = (data.voice_text || data.message || '').length;
        taraRef.current?.speak(em, Math.min(textLen * 65, 10000) || 4000);
      }
    };

    const speakText = (textBn, textEn, onDone) => {
      if (!isSpeakerOn) { scheduleReturn(4500); return; }
      fetch('http://localhost:8000/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textBn }),
        signal: AbortSignal.timeout(10000),
      }).then(async (res) => {
        if (!mountedRef.current || cancelled) return;
        const ct = res.headers.get('content-type') || '';
        if (!res.ok || ct.includes('json')) { browserSpeak(textBn, textEn, onDone); return; }
        const blob = await res.blob();
        if (!mountedRef.current || cancelled) return;
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audioRef.current = { audio, url };
        audio.onended = () => { cleanupAudio(); scheduleReturn(800); if (onDone) onDone(); };
        audio.onerror = () => { cleanupAudio(); browserSpeak(textBn, textEn, onDone); };
        audio.play().catch(() => { cleanupAudio(); browserSpeak(textBn, textEn, onDone); });
      }).catch(() => {
        if (!mountedRef.current || cancelled) return;
        browserSpeak(textBn, textEn, onDone);
      });
    };

    const browserSpeak = (textBn, textEn, onDone) => {
      if (!window.speechSynthesis || !isSpeakerOn) { scheduleReturn(4500); return; }
      if (window.speechSynthesis.paused) window.speechSynthesis.resume();
      const voices = window.speechSynthesis.getVoices();
      const bnVoice = voices.find(v => v.lang.startsWith('bn'));
      const utt = new SpeechSynthesisUtterance(bnVoice ? textBn : textEn);
      utt.lang = bnVoice ? 'bn-BD' : 'en-US';
      utt.rate = 0.88;
      if (bnVoice) utt.voice = bnVoice;
      let done = false;
      const finish = (d) => { if (done) return; done = true; scheduleReturn(d); if (onDone) onDone(); };
      utt.onend = () => finish(800);
      utt.onerror = () => finish(4500);
      window.speechSynthesis.speak(utt);
    };

    const useFallback = () => {
      const response = pickResponse(state.week, state.mood);
      setTaraText(response);
      taraRef.current?.speak('happy', 4000);
      speakText(response.bn, response.en, null);
    };

    speakDelayTimer = setTimeout(async () => {
      if (!mountedRef.current || cancelled) return;

      // Skip backend call if nothing was said
      const msg = transcript.trim();
      if (!msg) { useFallback(); return; }

      try {
        const userRaw = localStorage.getItem('maya_user');
        const patientId = userRaw ? (JSON.parse(userRaw).id || JSON.parse(userRaw).patient_id || '') : '';

        const res = await fetch('http://localhost:8000/ask', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ patient_id: patientId, message: msg, source: 'voice' }),
          signal: AbortSignal.timeout(15000),
        });
        if (!mountedRef.current || cancelled) return;

        if (!res.ok) { useFallback(); return; }

        const data = await res.json();
        if (!mountedRef.current || cancelled) return;

        const replyBn = data.voice_text || data.message || '';
        const replyEn = data.message || '';
        setTaraText({ bn: replyBn, en: replyEn });

        driveEmotion(data);
        speakText(replyBn, replyEn, null);

        if (data.tara_trigger === 'meditation') {
          setTimeout(() => { if (mountedRef.current) openScreen('wellness'); }, 1200);
        }
      } catch (_) {
        if (!mountedRef.current || cancelled) return;
        useFallback();
      }
    }, 50);

    return () => {
      cancelled = true;
      clearTimeout(speakDelayTimer);
      clearTimeout(autoReturnTimer);
      cleanupAudio();
      window.speechSynthesis?.cancel();
    };
  }, [phase, introPhase, transcript]);

  const handleMute = () => {
    const next = !isMuted;
    isMutedRef.current = next; // sync update: onend guard sees this before useEffect runs
    setIsMuted(next);
    if (next) recognitionRef.current?.stop();
  };

  const handleSpeaker = () => {
    const next = !isSpeakerOn;
    setIsSpeakerOn(next);
    if (!next) {
      window.speechSynthesis?.cancel();
      if (phaseRef.current === 'speaking') {
        setTimeout(() => setPhase('listening'), 800);
      }
    }
  };

  const handleEnd = () => {
    recognitionRef.current?.stop();
    window.speechSynthesis?.cancel();
    openScreen('chat');
  };

  return (
    <div className="screen voice" style={{ height: '100%', display: 'flex', flexDirection: 'column', color: '#FFF1E4', position: 'relative', overflow: 'hidden' }}>
      <Tara
        ref={taraRef}
        mood="idle"
        style={{
          position: 'absolute', top: 0, left: '50%',
          transform: 'translateX(-50%)',
          width: '100%', height: '100%', display: 'block', zIndex: 0,
        }}
      />

      {/* dark gradient overlay */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
        background: 'linear-gradient(180deg, rgba(20,10,28,0.55) 0%, rgba(20,10,28,0.15) 30%, rgba(20,10,28,0.25) 60%, rgba(20,10,28,0.85) 100%)',
      }} />

      {/* header */}
      <div style={{ position: 'relative', padding: '54px 18px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 5 }}>
        <button onClick={handleEnd} style={{
          width: 36, height: 36, borderRadius: 99, border: 'none',
          background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)',
          display: 'grid', placeItems: 'center', cursor: 'pointer',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#FFF1E4" strokeWidth="2" strokeLinecap="round"><path d="M15 18l-6-6 6-6" /></svg>
        </button>
        <div style={{
          fontSize: 11, color: '#FFF1E4', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600,
          padding: '6px 12px', borderRadius: 99,
          background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: 99, background: phase === 'speaking' ? '#F08A6E' : '#F4B4C8' }} />
          {isMuted ? 'muted' : phase === 'listening' ? 'listening' : 'speaking'}
        </div>
        <div style={{
          width: 36, height: 36, borderRadius: 99,
          background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(12px)',
          display: 'grid', placeItems: 'center',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFF1E4" strokeWidth="2" strokeLinecap="round">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
        </div>
      </div>

      <div style={{ flex: 1, position: 'relative', zIndex: 5 }} />

      {/* transcript / response card */}
      <div style={{ position: 'relative', zIndex: 5, padding: '0 22px 16px' }}>
        <div style={{
          textAlign: 'center', maxWidth: 340, margin: '0 auto',
          padding: '16px 20px', borderRadius: 24,
          background: 'rgba(20,10,28,0.55)', backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,241,228,0.12)',
        }}>
          {phase === 'listening' ? (
            <>
              <div style={{ fontFamily: 'var(--display)', fontSize: 22, color: '#FFF1E4', lineHeight: 1.3, letterSpacing: '-0.01em' }}>
                {transcript ? `"${transcript}"` : '"বলুন — আমি শুনছি..."'}
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,241,228,0.65)', marginTop: 12 }}>
                {transcript ? "You're talking · I'm listening carefully" : 'Say something — I\'m listening'}
              </div>
            </>
          ) : (
            <>
              <div style={{ fontFamily: 'var(--display)', fontSize: 22, color: '#FFF1E4', lineHeight: 1.3, letterSpacing: '-0.01em' }}>
                {taraText ? `"${taraText.bn}"` : '"...আমি ভাবছি..."'}
              </div>
              {taraText && (
                <div style={{ fontSize: 13, color: 'rgba(255,241,228,0.72)', marginTop: 12, fontStyle: 'italic', lineHeight: 1.4 }}>
                  "{taraText.en}"
                </div>
              )}
            </>
          )}
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
          border: '1px solid rgba(255,255,255,0.12)', background: 'rgb(140, 63, 63)',
        }}>
          <VoiceBtn label={isMuted ? 'Unmute' : 'Mute'} icon="mute" active={isMuted} onClick={handleMute} />
          <button onClick={handleEnd} style={{
            width: 64, height: 64, borderRadius: 99, border: 'none',
            background: 'linear-gradient(135deg, #F08A6E, #F4B4C8)',
            display: 'grid', placeItems: 'center', cursor: 'pointer',
            boxShadow: '0 10px 30px -8px rgba(240,138,110,0.6)',
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFF1E4" strokeWidth="2.4" strokeLinecap="round"><path d="M6 6l12 12M6 18L18 6" /></svg>
          </button>
          <VoiceBtn label="Speaker" icon="spk" active={isSpeakerOn} onClick={handleSpeaker} />
        </div>
        <div style={{ textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 10 }}>
          Tap × to end · everything stays private to you and Tara
        </div>
      </div>

      <style>{`
        @keyframes orbBreathe { 0%, 100% { transform: scale(0.9); opacity: 0.5 } 50% { transform: scale(1.1); opacity: 0.9 } }
        @keyframes voiceRing { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
      `}</style>
    </div>
  );
}

function VoiceBtn({ label, icon, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
      background: 'transparent', border: 'none', cursor: 'pointer',
      width: 56, padding: 6,
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 99,
        background: active ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.1)',
        display: 'grid', placeItems: 'center',
        transition: 'background 0.2s',
      }}>
        {icon === 'mute' ? (
          active ? (
            // mic is muted — strikethrough mic in pink
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F4B4C8" strokeWidth="2" strokeLinecap="round">
              <line x1="2" y1="2" x2="22" y2="22" />
              <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V5a3 3 0 0 0-5.94-.6" />
              <path d="M17 16.95A7 7 0 0 1 5 12v-2M19 10v2a7 7 0 0 1-.11 1.23" />
            </svg>
          ) : (
            // mic is live — solid microphone
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFF1E4" strokeWidth="2" strokeLinecap="round">
              <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </svg>
          )
        ) : (
          active ? (
            // speaker on — speaker with waves
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFF1E4" strokeWidth="2" strokeLinecap="round">
              <path d="M11 5L6 9H2v6h4l5 4z" />
              <path d="M19 12c0-2-1-4-3-5" />
              <path d="M16 8c1 1 1.5 2.5 1.5 4s-.5 3-1.5 4" />
            </svg>
          ) : (
            // speaker off — speaker with X
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,241,228,0.5)" strokeWidth="2" strokeLinecap="round">
              <path d="M11 5L6 9H2v6h4l5 4z" />
              <line x1="23" y1="9" x2="17" y2="15" />
              <line x1="17" y1="9" x2="23" y2="15" />
            </svg>
          )
        )}
      </div>
      <div style={{ fontSize: 10, color: active ? 'rgba(255,241,228,0.95)' : 'rgba(255,255,255,0.7)', fontWeight: 600 }}>{label}</div>
    </button>
  );
}

window.JourneyScreen = JourneyScreen;
window.ChatScreen = ChatScreen;
window.VoiceScreen = VoiceScreen;