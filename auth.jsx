// Authentication screens: AuthScreen, OTPScreen, RegisterScreen

// ── helpers ──────────────────────────────────────────────────────────
function genId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

function saveSession(userId, phone) {
  const now = new Date();
  const expires = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  localStorage.setItem('maya_session', JSON.stringify({
    userId,
    token: 'mock.' + btoa(userId + ':' + phone),
    createdAt: now.toISOString(),
    expiresAt: expires.toISOString(),
  }));
}

function saveUser(data) {
  localStorage.setItem('maya_user', JSON.stringify(data));
}

// ── AuthScreen ────────────────────────────────────────────────────────
function AuthScreen({ onOtp, onGuest }) {
  const [phone, setPhone] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const digits = phone.replace(/\D/g, '');
  const valid = digits.length === 10 || digits.length === 11;

  const handleSend = async () => {
    if (!valid) { setError('Please enter a valid phone number'); return; }
    setLoading(true);
    setError('');
    const formattedPhone = '+880' + digits.replace(/^0/, '');
    try {
      const res = await fetch(`${window.BACKEND_URL}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: formattedPhone }),
      });
      if (!res.ok) throw new Error('Failed to send OTP');
      setLoading(false);
      onOtp(formattedPhone);
    } catch (e) {
      setLoading(false);
      setError('Could not send OTP. Is the server running?');
    }
  };

  const handleGuest = () => {
    const now = new Date();
    const expires = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    localStorage.setItem('maya_session', JSON.stringify({
      userId: 'guest',
      token: 'guest',
      isGuest: true,
      createdAt: now.toISOString(),
      expiresAt: expires.toISOString(),
    }));
    onGuest();
  };

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 50,
      background: 'linear-gradient(180deg, #FFEFE2 0%, #F4D7E5 60%, #E0D5F0 100%)',
      display: 'flex', flexDirection: 'column', padding: '0 28px 36px',
      overflow: 'hidden',
    }}>
      <Grain/>

      {/* top illustration */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <Tara size={160} mood="happy"/>
        <div style={{ fontFamily: 'var(--display)', fontSize: 32, color: '#2A1A36', marginTop: 20, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
          আপনাকে স্বাগতম
        </div>
        <div style={{ fontSize: 13, color: '#5A3E5F', marginTop: 6 }}>
          Welcome to Maya
        </div>
        <div style={{ fontSize: 13, color: '#7A5E78', marginTop: 14, lineHeight: 1.5, maxWidth: 260 }}>
          Enter your phone number and Tara will send you a one-time code.
        </div>
      </div>

      {/* phone input */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{
          display: 'flex', alignItems: 'center',
          background: 'rgba(255,255,255,0.85)', borderRadius: 16,
          border: '1.5px solid rgba(61,40,64,0.12)',
          overflow: 'hidden',
          boxShadow: '0 2px 12px rgba(61,40,64,0.06)',
        }}>
          <div style={{
            padding: '15px 14px', background: 'rgba(61,40,64,0.05)',
            borderRight: '1px solid rgba(61,40,64,0.1)',
            fontWeight: 700, fontSize: 15, color: '#3D2840', whiteSpace: 'nowrap',
          }}>
            🇧🇩 +880
          </div>
          <input
            type="tel"
            inputMode="numeric"
            placeholder="01X XXXX XXXX"
            value={phone}
            onChange={e => { setPhone(e.target.value); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            style={{
              flex: 1, padding: '15px 14px', border: 'none', background: 'transparent',
              fontSize: 16, fontFamily: 'var(--ui)', color: '#2A1A36', outline: 'none',
              letterSpacing: '0.04em',
            }}
          />
        </div>

        {error && (
          <div style={{ fontSize: 12, color: '#C0392B', textAlign: 'center', marginTop: -4 }}>{error}</div>
        )}

        <button
          onClick={handleSend}
          disabled={loading}
          style={{
            padding: '16px 24px', borderRadius: 99, border: 'none',
            background: valid ? '#3D2840' : 'rgba(61,40,64,0.25)',
            color: '#FFF1E4', fontSize: 15, fontWeight: 600,
            letterSpacing: '-0.01em', cursor: valid ? 'pointer' : 'not-allowed',
            boxShadow: valid ? '0 14px 30px -10px rgba(61,40,64,0.5)' : 'none',
            transition: 'all 250ms',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          {loading ? (
            <>
              <span style={{ width: 16, height: 16, border: '2px solid rgba(255,241,228,0.4)', borderTopColor: '#FFF1E4', borderRadius: '50%', display: 'inline-block', animation: 'authSpin 0.7s linear infinite' }}/>
              Sending…
            </>
          ) : 'Get OTP →'}
        </button>

        <button onClick={handleGuest} style={{
          padding: '10px', background: 'transparent', border: 'none',
          color: '#7A5E78', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--ui)',
        }}>
          Continue as guest
        </button>
      </div>

      <style>{`
        @keyframes authSpin { to { transform: rotate(360deg) } }
      `}</style>
    </div>
  );
}

// ── OTPScreen ─────────────────────────────────────────────────────────
function OTPScreen({ phone, onVerified, onBack }) {
  const [digits, setDigits] = React.useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = React.useState(30);
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const refs = [
    React.useRef(), React.useRef(), React.useRef(),
    React.useRef(), React.useRef(), React.useRef(),
  ];

  React.useEffect(() => {
    refs[0].current?.focus();
  }, []);

  React.useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleKey = (i, e) => {
    if (e.key === 'Backspace') {
      const next = [...digits];
      if (next[i]) { next[i] = ''; setDigits(next); }
      else if (i > 0) { next[i - 1] = ''; setDigits(next); refs[i - 1].current?.focus(); }
      return;
    }
    if (!/^\d$/.test(e.key)) return;
    const next = [...digits];
    next[i] = e.key;
    setDigits(next);
    setError('');
    if (i < 5) refs[i + 1].current?.focus();
  };

  const handlePaste = (e) => {
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (paste.length === 6) {
      setDigits(paste.split(''));
      refs[5].current?.focus();
    }
  };

  const code = digits.join('');
  const full = code.length === 6;

  const handleVerify = async () => {
    if (!full) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${window.BACKEND_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp: code }),
      });
      const data = await res.json();
      setLoading(false);
      if (!res.ok) { setError(data.detail || 'Invalid OTP'); return; }
      if (data.status === 'existing_user') {
        localStorage.setItem('maya_session', JSON.stringify({ userId: data.patient_id, token: data.token }));
        saveUser(data.user);
        onVerified({ isNew: false, user: data.user });
      } else {
        localStorage.setItem('maya_session', JSON.stringify({ userId: null, token: data.token }));
        onVerified({ isNew: true, id: null, phone });
      }
    } catch (e) {
      setLoading(false);
      setError('Could not verify OTP. Is the server running?');
    }
  };

  const maskedPhone = phone.replace(/(\+880)(\d{3})(\d{4})(\d+)/, '$1 $2 $3 $4');

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 50,
      background: 'linear-gradient(180deg, #FFEFE2 0%, #F4D7E5 60%, #E0D5F0 100%)',
      display: 'flex', flexDirection: 'column', padding: '0 28px 36px',
    }}>
      <Grain/>

      <div style={{ paddingTop: 54, display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={onBack} style={{
          width: 36, height: 36, borderRadius: 99, border: 'none',
          background: 'rgba(255,255,255,0.7)', cursor: 'pointer',
          display: 'grid', placeItems: 'center',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3D2840" strokeWidth="2.2" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <Tara size={130} mood="listening"/>
        <div style={{ fontFamily: 'var(--display)', fontSize: 28, color: '#2A1A36', marginTop: 20, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
          Enter your code
        </div>
        <div style={{ fontSize: 13, color: '#7A5E78', marginTop: 8, lineHeight: 1.5 }}>
          Sent to {maskedPhone}
        </div>

        {/* OTP boxes */}
        <div style={{ display: 'flex', gap: 10, marginTop: 28 }} onPaste={handlePaste}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={refs[i]}
              type="tel"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={() => {}}
              onKeyDown={e => handleKey(i, e)}
              style={{
                width: 44, height: 54, borderRadius: 14, border: 'none',
                background: d ? '#3D2840' : 'rgba(255,255,255,0.85)',
                color: d ? '#FFF1E4' : '#2A1A36',
                fontSize: 22, fontWeight: 700, textAlign: 'center',
                outline: 'none', fontFamily: 'var(--ui)',
                boxShadow: d
                  ? '0 8px 20px -8px rgba(61,40,64,0.45)'
                  : '0 1px 0 rgba(255,255,255,0.9) inset, 0 2px 8px rgba(61,40,64,0.07)',
                transition: 'all 200ms',
                border: error && !d ? '1.5px solid #C0392B' : 'none',
              }}
            />
          ))}
        </div>

        {error && (
          <div style={{ fontSize: 12, color: '#C0392B', marginTop: 10 }}>{error}</div>
        )}

        {/* demo hint */}
        <div style={{
          marginTop: 16, padding: '7px 14px', borderRadius: 99,
          background: 'rgba(61,40,64,0.07)', fontSize: 11, color: '#7A5E78',
        }}>
          Demo: any 6-digit code works
        </div>

        {/* resend */}
        <div style={{ marginTop: 18, fontSize: 13, color: '#7A5E78' }}>
          {countdown > 0
            ? <span>Resend in <strong style={{ color: '#3D2840' }}>{countdown}s</strong></span>
            : <button onClick={() => setCountdown(30)} style={{
                background: 'transparent', border: 'none', color: '#3D2840',
                fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'var(--ui)',
              }}>Resend OTP</button>
          }
        </div>
      </div>

      <button
        onClick={handleVerify}
        disabled={!full || loading}
        style={{
          padding: '16px 24px', borderRadius: 99, border: 'none',
          background: full ? '#3D2840' : 'rgba(61,40,64,0.25)',
          color: '#FFF1E4', fontSize: 15, fontWeight: 600,
          letterSpacing: '-0.01em', cursor: full ? 'pointer' : 'not-allowed',
          boxShadow: full ? '0 14px 30px -10px rgba(61,40,64,0.5)' : 'none',
          transition: 'all 250ms',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}
      >
        {loading ? (
          <>
            <span style={{ width: 16, height: 16, border: '2px solid rgba(255,241,228,0.4)', borderTopColor: '#FFF1E4', borderRadius: '50%', display: 'inline-block', animation: 'authSpin 0.7s linear infinite' }}/>
            Verifying…
          </>
        ) : 'Verify →'}
      </button>
    </div>
  );
}

// ── RegisterScreen ────────────────────────────────────────────────────
function RegisterScreen({ userId, phone, onDone }) {
  const [step, setStep] = React.useState(0);
  const [name, setName] = React.useState('');
  const [week, setWeek] = React.useState(20);
  const [lang, setLang] = React.useState('mixed');

  const trimester = week <= 13 ? '1st trimester' : week <= 26 ? '2nd trimester' : '3rd trimester';

  const handleDone = async () => {
    try {
      const res = await fetch(`${window.BACKEND_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          name: name.trim() || 'আপু',
          pregnancy_week: week,
          lang,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Registration failed');
      localStorage.setItem('maya_session', JSON.stringify({ userId: data.user.id, token: data.token }));
      saveUser(data.user);
      onDone(data.user);
    } catch (e) {
      // Fallback: create local user so app still works without server
      const user = { id: genId(), phone, name: name.trim() || 'আপু', pregnancyWeek: week, lang };
      saveUser(user);
      onDone(user);
    }
  };

  const canNext = step === 0 ? name.trim().length > 0 : true;

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 50,
      background: 'linear-gradient(180deg, #FFEFE2 0%, #F4D7E5 60%, #E0D5F0 100%)',
      display: 'flex', flexDirection: 'column', padding: '60px 28px 32px',
    }}>
      <Grain/>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <Tara size={140} mood={step === 1 ? 'happy' : step === 2 ? 'listening' : 'happy'}/>

        {step === 0 && (
          <>
            <div style={{ fontFamily: 'var(--display)', fontSize: 28, color: '#2A1A36', marginTop: 20, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              What should Tara<br/>call you?
            </div>
            <div style={{ fontSize: 13, color: '#7A5E78', marginTop: 8 }}>Your name, nickname — whatever feels right</div>
            <input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
              style={{
                marginTop: 24, width: '100%', maxWidth: 280,
                padding: '14px 18px', borderRadius: 16, border: 'none',
                background: 'rgba(255,255,255,0.85)',
                fontSize: 16, fontFamily: 'var(--ui)', color: '#2A1A36',
                textAlign: 'center', outline: 'none',
                boxShadow: '0 2px 12px rgba(61,40,64,0.08)',
              }}
            />
          </>
        )}

        {step === 1 && (
          <>
            <div style={{ fontFamily: 'var(--display)', fontSize: 28, color: '#2A1A36', marginTop: 20, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              How far along<br/>are you?
            </div>
            <div style={{ fontSize: 13, color: '#7A5E78', marginTop: 8 }}>We'll personalise your journey</div>
            <div style={{ marginTop: 24, width: '100%', maxWidth: 300 }}>
              <div style={{
                fontFamily: 'var(--display)', fontSize: 52, color: '#3D2840',
                letterSpacing: '-0.03em', lineHeight: 1,
              }}>{week}<span style={{ fontSize: 22, color: '#7A5E78' }}> wks</span></div>
              <div style={{ fontSize: 12, color: '#7A5E78', marginTop: 4 }}>{trimester}</div>
              <input
                type="range" min={4} max={40} step={1} value={week}
                onChange={e => setWeek(Number(e.target.value))}
                style={{ width: '100%', marginTop: 20, accentColor: '#3D2840', height: 4 }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#9A8595', marginTop: 4 }}>
                <span>Week 4</span><span>Week 40</span>
              </div>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div style={{ fontFamily: 'var(--display)', fontSize: 28, color: '#2A1A36', marginTop: 20, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              How would you like<br/>to talk?
            </div>
            <div style={{ fontSize: 13, color: '#7A5E78', marginTop: 8 }}>Switch anytime in settings</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 24, width: '100%', maxWidth: 300 }}>
              {[
                { v: 'bn', label: 'বাংলা', sub: 'Bangla only' },
                { v: 'mixed', label: 'Both', sub: 'বাংলা + English' },
                { v: 'en', label: 'English', sub: 'English only' },
              ].map(opt => (
                <button key={opt.v} onClick={() => setLang(opt.v)} style={{
                  padding: '14px 18px', borderRadius: 16, border: 'none', cursor: 'pointer',
                  background: lang === opt.v ? '#3D2840' : 'rgba(255,255,255,0.85)',
                  color: lang === opt.v ? '#FFF1E4' : '#2A1A36',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  boxShadow: lang === opt.v ? '0 8px 20px -8px rgba(61,40,64,0.5)' : '0 2px 8px rgba(61,40,64,0.06)',
                  transition: 'all 200ms',
                }}>
                  <span style={{ fontWeight: 700, fontSize: 15 }}>{opt.label}</span>
                  <span style={{ fontSize: 12, opacity: 0.6 }}>{opt.sub}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* progress dots */}
      <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 18 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: i === step ? 24 : 8, height: 8, borderRadius: 99,
            background: i === step ? '#3D2840' : 'rgba(61,40,64,0.2)',
            transition: 'all 300ms',
          }}/>
        ))}
      </div>

      <button
        onClick={step < 2 ? () => setStep(step + 1) : handleDone}
        disabled={!canNext}
        style={{
          padding: '16px 24px', borderRadius: 99, border: 'none',
          background: canNext ? '#3D2840' : 'rgba(61,40,64,0.25)',
          color: '#FFF1E4', fontSize: 15, fontWeight: 600,
          letterSpacing: '-0.01em', cursor: canNext ? 'pointer' : 'not-allowed',
          boxShadow: canNext ? '0 14px 30px -10px rgba(61,40,64,0.5)' : 'none',
        }}
      >
        {step < 2 ? 'Continue' : "Let's begin 🌸"}
      </button>
    </div>
  );
}

window.AuthScreen     = AuthScreen;
window.OTPScreen      = OTPScreen;
window.RegisterScreen = RegisterScreen;
window.saveUser       = saveUser;
window.saveSession    = saveSession;
