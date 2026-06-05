// Wellness + Care screens

// ──────────────────────────────────────────────────────────────────
// WELLNESS
// ──────────────────────────────────────────────────────────────────
function WellnessScreen({ state, setState, openScreen }) {
  const { iconBtn, primaryBtn, ghostBtn } = window.uiBtns;
  const lang = state.lang;
  const L = (key, type) => window.tStr(key, lang, type);
  const [breathing, setBreathing] = React.useState(false);
  const [phase, setPhase] = React.useState('in'); // in / hold / out
  const [count, setCount] = React.useState(0);

  React.useEffect(() => {
    if (!breathing) return;
    const cycle = ['in', 'in', 'in', 'in', 'hold', 'hold', 'out', 'out', 'out', 'out', 'out', 'out'];
    let i = 0;
    const id = setInterval(() => {
      setPhase(cycle[i % cycle.length]);
      i++;
      if (i % cycle.length === 0) setCount(c => c + 1);
    }, 1000);
    return () => clearInterval(id);
  }, [breathing]);

  const moods = [
    { k: 'tender', label: L('moodTender'), emoji: '🫶', color: '#F4D7E5' },
    { k: 'okay',   label: L('moodOkay'),   emoji: '🌤️', color: '#F2EBDA' },
    { k: 'tired',  label: L('moodTired'),  emoji: '😴', color: '#E5D8E8' },
    { k: 'worried',label: L('moodWorried'),emoji: '🌧️', color: '#DDE3F0' },
    { k: 'heavy',  label: L('moodHeavy'),  emoji: '🪨', color: '#E8DEF5' },
    { k: 'happy',  label: L('moodHappy'),  emoji: '🌸', color: '#FBE5D6' },
  ];
  const [mood, setMood] = React.useState('tender');

  return (
    <div className="screen wellness">
      <div style={{ padding: '8px 22px 0' }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#7A5E78', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          {L('forYourHeart')}
        </div>
        <div style={{ fontFamily: 'var(--display)', fontSize: 28, color: '#2A1A36', marginTop: 4, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
          {L('howDoesToday', 'tara')}<br/><span style={{ fontStyle: 'italic' }}>{L('actuallyFeel', 'tara')}</span>
        </div>
      </div>

      {/* mood chips */}
      <div style={{ padding: '16px 22px 0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {moods.map(m => (
            <button key={m.k} onClick={() => setMood(m.k)} style={{
              padding: '14px 8px', borderRadius: 20, border: 'none',
              background: mood === m.k ? m.color : 'rgba(255,255,255,0.6)',
              cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              outline: mood === m.k ? '2px solid #3D2840' : 'none',
              outlineOffset: -2,
              transition: 'all 200ms',
            }}>
              <span style={{ fontSize: 24 }}>{m.emoji}</span>
              <span style={{ fontSize: 11, color: '#3D2840', fontWeight: 600 }}>{m.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* breathing card */}
      <div style={{ padding: '18px 22px 0' }}>
        <Card style={{ background: 'linear-gradient(160deg, #E0D5F0, #F4D7E5)', padding: 0, overflow: 'hidden' }}>
          <div style={{
            position: 'relative', height: 240, display: 'grid', placeItems: 'center',
          }}>
            {/* breathing rings */}
            <div className="breathe-ring" style={{
              position: 'absolute', width: 180, height: 180, borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255,255,255,0.7), rgba(255,255,255,0))',
              transform: breathing ? (phase === 'in' ? 'scale(1.3)' : phase === 'out' ? 'scale(0.7)' : 'scale(1.1)') : 'scale(1)',
              transition: 'transform 1000ms cubic-bezier(0.4, 0, 0.2, 1)',
            }}/>
            <div style={{
              position: 'absolute', width: 130, height: 130, borderRadius: '50%',
              background: 'rgba(255,255,255,0.4)', backdropFilter: 'blur(10px)',
              transform: breathing ? (phase === 'in' ? 'scale(1.15)' : phase === 'out' ? 'scale(0.85)' : 'scale(1)') : 'scale(1)',
              transition: 'transform 1000ms cubic-bezier(0.4, 0, 0.2, 1)',
            }}/>
            <div style={{ position: 'relative', textAlign: 'center' }}>
              <Tara size={118} mood={breathing ? 'sleepy' : 'idle'}/>
            </div>
            <div style={{ position: 'absolute', bottom: 14, fontFamily: 'var(--display)', fontSize: 18, color: '#3D2840', letterSpacing: '-0.01em' }}>
              {breathing ? (phase === 'in' ? L('breatheIn') : phase === 'hold' ? L('hold') : L('breatheOut')) : L('boxBreathing')}
            </div>
          </div>
          <div style={{ padding: '12px 18px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontFamily: 'var(--display)', fontSize: 18, color: '#3D2840', letterSpacing: '-0.01em' }}>
                {L('breatheWithTara', 'tara')}
              </div>
              <div style={{ fontSize: 11, color: '#5A3E5F', marginTop: 2 }}>
                {breathing ? L('cycleCount').replace('{n}', count + 1) : L('breatheSub', 'tara')}
              </div>
            </div>
            <button onClick={() => setBreathing(b => !b)} style={{
              ...primaryBtn,
              background: breathing ? 'rgba(61,40,64,0.15)' : '#3D2840',
              color: breathing ? '#3D2840' : '#FFF1E4',
            }}>
              {breathing ? L('pause') : L('begin')}
            </button>
          </div>
        </Card>
      </div>

      {/* affirmations */}
      <div style={{ padding: '18px 22px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
          <div style={{ fontFamily: 'var(--display)', fontSize: 20, color: '#3D2840', letterSpacing: '-0.01em' }}>
            {L('fromTaraToday', 'tara')}
          </div>
          <span style={{ fontSize: 12, color: '#7A5E78' }}>{L('swipe')}</span>
        </div>
        <div style={{ display: 'flex', gap: 10, overflowX: 'auto', padding: '4px 0 8px', marginLeft: -2, scrollbarWidth: 'none' }}>
          {[
            { key: 'affirmation1', bg: 'linear-gradient(135deg, #FBD7C6, #F4B4C8)' },
            { key: 'affirmation2', bg: 'linear-gradient(135deg, #E0D5F0, #C9BEE4)' },
            { key: 'affirmation3', bg: 'linear-gradient(135deg, #F2EBDA, #F4D7E5)' },
            { key: 'affirmation4', bg: 'linear-gradient(135deg, #F8D5DF, #E0D5F0)' },
          ].map((a, i) => (
            <div key={i} style={{
              flex: '0 0 220px', borderRadius: 24, padding: 20, height: 140,
              background: a.bg, display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
              boxShadow: '0 18px 30px -22px rgba(61,40,64,0.4)',
            }}>
              <div style={{ fontFamily: 'var(--display)', fontSize: 18, color: '#3D2840', lineHeight: 1.25, letterSpacing: '-0.01em', whiteSpace: 'pre-line' }}>
                "{L(a.key, 'tara')}"
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 10, color: '#5A3E5F', fontWeight: 700, letterSpacing: '0.1em' }}>— TARA</span>
                <span style={{ fontSize: 14 }}>🌸</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* mood graph */}
      <div style={{ padding: '14px 22px 20px' }}>
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
            <div>
              <Pill tone="lav">Last 7 days</Pill>
              <div style={{ fontFamily: 'var(--display)', fontSize: 17, color: '#3D2840', marginTop: 8, letterSpacing: '-0.01em' }}>
                Your feelings, gently tracked
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: 80, padding: '0 4px' }}>
            {[0.6, 0.4, 0.7, 0.3, 0.8, 0.5, 0.75].map((v, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <div style={{
                  width: 18, height: `${v * 80}%`,
                  borderRadius: 9,
                  background: i === 6 ? 'linear-gradient(180deg, #F08A6E, #F4B4C8)' : 'linear-gradient(180deg, #C9BEE4, #E0D5F0)',
                }}/>
                <div style={{ fontSize: 10, color: '#7A5E78', fontWeight: 600 }}>
                  {['M','T','W','T','F','S','S'][i]}
                </div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 11, color: '#5A3E5F', marginTop: 10, lineHeight: 1.5 }}>
            You've felt brighter on Wednesdays and weekends. Worth noting 🌸
          </div>
        </Card>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────
// CARE
// ──────────────────────────────────────────────────────────────────
function CareScreen({ state, setState, openScreen }) {
  const { iconBtn, primaryBtn, ghostBtn } = window.uiBtns;
  const lang = state.lang;
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
  const logTitle = (dtype, val) => ({ weight: `Weight · ${val} kg`, bp: `BP · ${val}`, sleep: `Sleep · ${val} hrs`, symptom: 'Symptom logged', mood: 'Mood logged', medication: 'Medication logged' }[dtype] || dtype);

  const nextAppt = appointments.find(a => a.scheduled_at && !a.attended && new Date(a.scheduled_at) > now);
  const lastWeight = profile?.lastWeight;
  const lastBp = profile?.lastBpReading;
  const sleepLog = healthLogs.find(l => l.data_type === 'sleep');
  const wLogs = healthLogs.filter(l => l.data_type === 'weight');
  const wTrend = wLogs.length >= 2
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

  return (
    <div className="screen care">
      <div style={{ padding: '8px 22px 0' }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#7A5E78', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{L('careForBoth')}</div>
        <div style={{ fontFamily: 'var(--display)', fontSize: 28, color: '#2A1A36', marginTop: 4, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
          {L('careTitle', 'tara')}<br/><span style={{ fontStyle: 'italic' }}>{L('careTitleItalic', 'tara')}</span>
        </div>
      </div>

      {/* data fetch error banner */}
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

      {/* upcoming appointment */}
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
                <button style={{ ...primaryBtn, flex: 1 }}>Get directions</button>
                <button style={{ ...primaryBtn, flex: 1, background: 'rgba(61,40,64,0.1)', color: '#3D2840' }}>Reschedule</button>
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '12px 0' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>📅</div>
              <div style={{ fontFamily: 'var(--display)', fontSize: 16, color: '#3D2840' }}>No upcoming checkup</div>
              <div style={{ fontSize: 12, color: '#7A5E78', marginTop: 4 }}>Ask Tara to schedule your next visit</div>
            </div>
          )}
        </Card>
      </div>

      {/* kick counter */}
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

      {/* health vitals */}
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

      {/* timeline */}
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

      {/* emergency — calm, not panic */}
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
                { i: '🩸', lKey: 'bleeding',     msg: 'I see bleeding',                  c: '#F08A6E' },
                { i: '💧', lKey: 'waterBroke',   msg: 'My water broke',                  c: '#A88DD1' },
                { i: '⚡', lKey: 'sharpPain',    msg: 'I have sharp or constant pain',   c: '#E5A064' },
                { i: '🤱', lKey: 'babyNotMoved', msg: "Baby hasn't moved in hours",       c: '#D17BB0' },
                { i: '☎️', lKey: 'callDoctor',   msg: 'Please call my doctor right now', c: '#3D2840' },
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
