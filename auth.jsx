// Authentication screens: AuthScreen (login), RegisterScreen, OTPScreen,
// ForgotPasswordScreen — email + password flow

// ── helpers ──────────────────────────────────────────────────────────────────

async function authFetch(url, options) {
  const res = await fetch(url, options);
  const text = await res.text();
  let data = {};
  try { data = JSON.parse(text); } catch {}
  return { res, data };
}

// Picks the best human-readable message from an API error response.
// Handles FastAPI's {detail} and slowapi's {error} keys.
function apiErr(data, fallback) {
  return data.detail || data.error || data.message || fallback;
}

function saveTokens(accessToken, refreshToken, userId) {
  localStorage.setItem('maya_access_token', accessToken);
  localStorage.setItem('maya_refresh_token', refreshToken);
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  localStorage.setItem('maya_session', JSON.stringify({
    userId,
    token: accessToken,
    createdAt: new Date().toISOString(),
    expiresAt: expires,
  }));
}

async function refreshTokens() {
  const refresh = localStorage.getItem('maya_refresh_token');
  if (!refresh) return false;
  try {
    const res = await fetch(`${window.BACKEND_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refresh }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    saveTokens(data.access_token, data.refresh_token, data.patient_id);
    if (data.user) localStorage.setItem('maya_user', JSON.stringify(data.user));
    return true;
  } catch {
    return false;
  }
}

function maskEmail(email) {
  const [local, domain] = email.split('@');
  if (!domain) return email;
  const visible = local.length > 2 ? local.slice(0, 2) : local[0] || '';
  return `${visible}${'*'.repeat(Math.max(2, local.length - 2))}@${domain}`;
}

// ── AuthScreen ────────────────────────────────────────────────────────────────
// mode: 'login' | 'register' — toggled internally
function AuthScreen({ onOtp, onLoggedIn, onGuest }) {
  const [mode, setMode]       = React.useState('login');
  const [email, setEmail]     = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPw, setShowPw]   = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError]     = React.useState('');

  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validForm  = validEmail && password.length >= 8;

  const handleLogin = async () => {
    if (!validForm) return;
    setLoading(true); setError('');
    try {
      const { res, data } = await authFetch(`${window.BACKEND_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) { setError(apiErr(data, `Login failed (${res.status})`)); return; }
      saveTokens(data.access_token, data.refresh_token, data.patient_id);
      localStorage.setItem('maya_user', JSON.stringify(data.user));
      onLoggedIn(data.user);
    } catch {
      setError('Could not connect. Check your internet connection.');
    } finally { setLoading(false); }
  };

  const handleRegisterStart = () => {
    if (!validForm) return;
    onOtp({ email, password, flow: 'register' });
  };

  const handleGuest = () => {
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    localStorage.setItem('maya_session', JSON.stringify({
      userId: 'guest', token: 'guest', isGuest: true,
      createdAt: new Date().toISOString(), expiresAt: expires,
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

      {/* header */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <Tara size={140} mood="happy"/>
        <div style={{ fontFamily: 'var(--display)', fontSize: 30, color: '#2A1A36', marginTop: 20, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
          {mode === 'login' ? 'আপনাকে স্বাগতম' : 'যোগ দিন'}
        </div>
        <div style={{ fontSize: 13, color: '#5A3E5F', marginTop: 6 }}>
          {mode === 'login' ? 'Sign in to Maya' : 'Create your account'}
        </div>

        {/* mode toggle */}
        <div style={{
          display: 'flex', marginTop: 18,
          background: 'rgba(61,40,64,0.08)', borderRadius: 99, padding: 4,
        }}>
          {['login', 'register'].map(m => (
            <button key={m} onClick={() => { setMode(m); setError(''); }} style={{
              padding: '7px 20px', borderRadius: 99, border: 'none', cursor: 'pointer',
              background: mode === m ? '#3D2840' : 'transparent',
              color: mode === m ? '#FFF1E4' : '#7A5E78',
              fontSize: 13, fontWeight: 600, fontFamily: 'var(--ui)',
              transition: 'all 200ms',
            }}>
              {m === 'login' ? 'Sign In' : 'Register'}
            </button>
          ))}
        </div>
      </div>

      {/* form */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* email */}
        <div style={{
          display: 'flex', alignItems: 'center',
          background: 'rgba(255,255,255,0.85)', borderRadius: 16,
          border: '1.5px solid rgba(61,40,64,0.12)',
          boxShadow: '0 2px 12px rgba(61,40,64,0.06)',
          overflow: 'hidden',
        }}>
          <div style={{ padding: '14px 14px', color: '#7A5E78', fontSize: 16 }}>✉️</div>
          <input
            type="email" inputMode="email" placeholder="Email address"
            value={email}
            onChange={e => { setEmail(e.target.value); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && (mode === 'login' ? handleLogin() : handleRegisterStart())}
            style={{
              flex: 1, padding: '14px 12px 14px 0', border: 'none', background: 'transparent',
              fontSize: 15, fontFamily: 'var(--ui)', color: '#2A1A36', outline: 'none',
            }}
          />
        </div>

        {/* password */}
        <div style={{
          display: 'flex', alignItems: 'center',
          background: 'rgba(255,255,255,0.85)', borderRadius: 16,
          border: '1.5px solid rgba(61,40,64,0.12)',
          boxShadow: '0 2px 12px rgba(61,40,64,0.06)',
          overflow: 'hidden',
        }}>
          <div style={{ padding: '14px 14px', color: '#7A5E78', fontSize: 16 }}>🔒</div>
          <input
            type={showPw ? 'text' : 'password'} placeholder="Password (min. 8 chars)"
            value={password}
            onChange={e => { setPassword(e.target.value); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && (mode === 'login' ? handleLogin() : handleRegisterStart())}
            style={{
              flex: 1, padding: '14px 0', border: 'none', background: 'transparent',
              fontSize: 15, fontFamily: 'var(--ui)', color: '#2A1A36', outline: 'none',
            }}
          />
          <button onClick={() => setShowPw(p => !p)} style={{
            padding: '14px 14px', border: 'none', background: 'transparent',
            cursor: 'pointer', fontSize: 14, color: '#7A5E78',
          }}>
            {showPw ? '🙈' : '👁'}
          </button>
        </div>

        {error && (
          <div style={{ fontSize: 12, color: '#C0392B', textAlign: 'center', marginTop: -4 }}>{error}</div>
        )}

        <button
          onClick={mode === 'login' ? handleLogin : handleRegisterStart}
          disabled={(mode === 'login' ? loading : false) || !validForm}
          style={{
            padding: '16px 24px', borderRadius: 99, border: 'none',
            background: validForm ? '#3D2840' : 'rgba(61,40,64,0.25)',
            color: '#FFF1E4', fontSize: 15, fontWeight: 600,
            cursor: validForm ? 'pointer' : 'not-allowed',
            boxShadow: validForm ? '0 14px 30px -10px rgba(61,40,64,0.5)' : 'none',
            transition: 'all 250ms',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          {loading
            ? <><span style={{ width: 16, height: 16, border: '2px solid rgba(255,241,228,0.4)', borderTopColor: '#FFF1E4', borderRadius: '50%', display: 'inline-block', animation: 'authSpin 0.7s linear infinite' }}/> {mode === 'login' ? 'Signing in…' : 'Continuing…'}</>
            : mode === 'login' ? 'Sign In →' : 'Continue →'
          }
        </button>

        {mode === 'login' && (
          <button onClick={() => onOtp({ email: '', flow: 'forgot' })} style={{
            padding: '6px', background: 'transparent', border: 'none',
            color: '#7A5E78', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--ui)',
            textAlign: 'center',
          }}>
            Forgot password?
          </button>
        )}

        <button onClick={handleGuest} style={{
          padding: '8px', background: 'transparent', border: 'none',
          color: '#9A8595', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--ui)',
        }}>
          Continue as guest
        </button>
      </div>

      <style>{`@keyframes authSpin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}

// ── OTPScreen ─────────────────────────────────────────────────────────────────
// Used for: email verification after register, and password reset OTP entry
// emailSent=false means the server couldn't deliver the email — skip countdown, show warning
function OTPScreen({ email, flow, emailSent = true, onVerified, onBack, newPassword }) {
  const [digits, setDigits]   = React.useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = React.useState(emailSent ? 30 : 0);
  const [error, setError]     = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const refs = Array.from({ length: 6 }, () => React.useRef());

  React.useEffect(() => { refs[0].current?.focus(); }, []);
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
    const next = [...digits]; next[i] = e.key; setDigits(next); setError('');
    if (i < 5) refs[i + 1].current?.focus();
  };

  const handlePaste = e => {
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (paste.length === 6) { setDigits(paste.split('')); refs[5].current?.focus(); }
  };

  const code = digits.join('');
  const full  = code.length === 6;

  const handleVerify = async () => {
    if (!full) return;
    setLoading(true); setError('');
    try {
      if (flow === 'reset') {
        // Part 1 of reset: just pass OTP back to ForgotPasswordScreen
        onVerified({ otp: code });
        return;
      }

      const { res, data } = await authFetch(`${window.BACKEND_URL}/auth/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: code }),
      });
      if (!res.ok) { setError(apiErr(data, `Verification failed (${res.status})`)); return; }
      saveTokens(data.access_token, data.refresh_token, data.patient_id);
      localStorage.setItem('maya_user', JSON.stringify(data.user));
      onVerified({ isNew: true, user: data.user });
    } catch { setError('Could not verify. Check your internet connection.'); }
    finally { setLoading(false); }
  };

  const handleResend = async () => {
    setCountdown(30);
    try {
      await fetch(`${window.BACKEND_URL}/auth/resend-verification`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
    } catch {}
  };

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 50,
      background: 'linear-gradient(180deg, #FFEFE2 0%, #F4D7E5 60%, #E0D5F0 100%)',
      display: 'flex', flexDirection: 'column', padding: '0 28px 36px',
    }}>
      <Grain/>
      <div style={{ paddingTop: 54, display: 'flex' }}>
        <button onClick={onBack} style={{
          width: 36, height: 36, borderRadius: 99, border: 'none',
          background: 'rgba(255,255,255,0.7)', cursor: 'pointer',
          display: 'grid', placeItems: 'center',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3D2840" strokeWidth="2.2" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <Tara size={120} mood="listening"/>
        <div style={{ fontFamily: 'var(--display)', fontSize: 26, color: '#2A1A36', marginTop: 20, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
          Check your email
        </div>
        <div style={{ fontSize: 13, color: '#7A5E78', marginTop: 8, lineHeight: 1.5 }}>
          {emailSent ? <>Code sent to <strong>{maskEmail(email)}</strong></> : <>Enter the code sent to <strong>{maskEmail(email)}</strong></>}
        </div>

        {!emailSent && (
          <div style={{
            marginTop: 12, padding: '10px 14px', borderRadius: 12,
            background: 'rgba(192,57,43,0.08)', border: '1px solid rgba(192,57,43,0.2)',
            fontSize: 12, color: '#C0392B', lineHeight: 1.5, maxWidth: 280, textAlign: 'center',
          }}>
            Email delivery failed. Tap "Resend code" below or check your spam folder.
          </div>
        )}

        {emailSent && (
          <div style={{ fontSize: 11, color: '#9A8595', marginTop: 6 }}>
            Check spam if you don't see it
          </div>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 28 }} onPaste={handlePaste}>
          {digits.map((d, i) => (
            <input key={i} ref={refs[i]} type="tel" inputMode="numeric" maxLength={1}
              value={d} onChange={() => {}} onKeyDown={e => handleKey(i, e)}
              style={{
                width: 44, height: 54, borderRadius: 14, border: 'none',
                background: d ? '#3D2840' : 'rgba(255,255,255,0.85)',
                color: d ? '#FFF1E4' : '#2A1A36',
                fontSize: 22, fontWeight: 700, textAlign: 'center',
                outline: 'none', fontFamily: 'var(--ui)',
                boxShadow: d ? '0 8px 20px -8px rgba(61,40,64,0.45)' : '0 2px 8px rgba(61,40,64,0.07)',
                transition: 'all 200ms',
                border: error ? '1.5px solid #C0392B' : 'none',
              }}
            />
          ))}
        </div>

        {error && <div style={{ fontSize: 12, color: '#C0392B', marginTop: 10 }}>{error}</div>}

        <div style={{ marginTop: 18, fontSize: 13, color: '#7A5E78' }}>
          {countdown > 0
            ? <span>Resend in <strong style={{ color: '#3D2840' }}>{countdown}s</strong></span>
            : <button onClick={handleResend} style={{
                background: 'transparent', border: 'none', color: '#3D2840',
                fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'var(--ui)',
              }}>Resend code</button>
          }
        </div>
      </div>

      <button onClick={handleVerify} disabled={!full || loading} style={{
        padding: '16px 24px', borderRadius: 99, border: 'none',
        background: full ? '#3D2840' : 'rgba(61,40,64,0.25)',
        color: '#FFF1E4', fontSize: 15, fontWeight: 600,
        cursor: full ? 'pointer' : 'not-allowed',
        boxShadow: full ? '0 14px 30px -10px rgba(61,40,64,0.5)' : 'none',
        transition: 'all 250ms',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      }}>
        {loading
          ? <><span style={{ width: 16, height: 16, border: '2px solid rgba(255,241,228,0.4)', borderTopColor: '#FFF1E4', borderRadius: '50%', display: 'inline-block', animation: 'authSpin 0.7s linear infinite' }}/> Verifying…</>
          : 'Verify →'
        }
      </button>
    </div>
  );
}

// ── RegisterScreen ─────────────────────────────────────────────────────────────
// Called after email+password are submitted in AuthScreen.
// Collects: name, pregnancyWeek, lang → then calls POST /auth/register properly
// → then shows OTPScreen for email verification
function RegisterScreen({ email, password, onDone, onVerifyEmail }) {
  const [step, setStep] = React.useState(0);
  const [name, setName] = React.useState('');
  const [week, setWeek] = React.useState(20);
  const [lang, setLang] = React.useState('mixed');
  const [loading, setLoading] = React.useState(false);
  const [error, setError]   = React.useState('');

  const trimester = week <= 13 ? '1st trimester' : week <= 26 ? '2nd trimester' : '3rd trimester';
  const canNext = step === 0 ? name.trim().length > 0 : true;

  const handleSubmit = async () => {
    setLoading(true); setError('');
    try {
      const { res, data } = await authFetch(`${window.BACKEND_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          name: name.trim() || 'আপু',
          pregnancy_week: week,
          lang,
        }),
      });
      // 409 = already registered but unverified (OTP resent) — still proceed to verify
      if (!res.ok && res.status !== 409) {
        setError(apiErr(data, `Registration failed (${res.status})`));
        return;
      }
      // Go to OTP screen; pass email_sent flag so OTP screen can show resend immediately
      onVerifyEmail(email, data.email_sent !== false);
    } catch { setError('Could not connect. Check your internet connection.'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 50,
      background: 'linear-gradient(180deg, #FFEFE2 0%, #F4D7E5 60%, #E0D5F0 100%)',
      display: 'flex', flexDirection: 'column', padding: '60px 28px 32px',
    }}>
      <Grain/>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <Tara size={130} mood={step === 0 ? 'happy' : step === 1 ? 'happy' : 'listening'}/>

        {step === 0 && (
          <>
            <div style={{ fontFamily: 'var(--display)', fontSize: 26, color: '#2A1A36', marginTop: 20, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              What should Tara<br/>call you?
            </div>
            <div style={{ fontSize: 13, color: '#7A5E78', marginTop: 8 }}>Your name or nickname</div>
            <input type="text" placeholder="Your name" value={name}
              onChange={e => setName(e.target.value)} autoFocus
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
            <div style={{ fontFamily: 'var(--display)', fontSize: 26, color: '#2A1A36', marginTop: 20, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              How far along<br/>are you?
            </div>
            <div style={{ fontSize: 13, color: '#7A5E78', marginTop: 8 }}>We'll personalise your journey</div>
            <div style={{ marginTop: 24, width: '100%', maxWidth: 300 }}>
              <div style={{ fontFamily: 'var(--display)', fontSize: 50, color: '#3D2840', letterSpacing: '-0.03em', lineHeight: 1 }}>
                {week}<span style={{ fontSize: 20, color: '#7A5E78' }}> wks</span>
              </div>
              <div style={{ fontSize: 12, color: '#7A5E78', marginTop: 4 }}>{trimester}</div>
              <input type="range" min={4} max={40} step={1} value={week}
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
            <div style={{ fontFamily: 'var(--display)', fontSize: 26, color: '#2A1A36', marginTop: 20, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
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

        {error && <div style={{ fontSize: 12, color: '#C0392B', marginTop: 12 }}>{error}</div>}
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
        onClick={step < 2 ? () => setStep(s => s + 1) : handleSubmit}
        disabled={!canNext || loading}
        style={{
          padding: '16px 24px', borderRadius: 99, border: 'none',
          background: canNext ? '#3D2840' : 'rgba(61,40,64,0.25)',
          color: '#FFF1E4', fontSize: 15, fontWeight: 600,
          cursor: canNext ? 'pointer' : 'not-allowed',
          boxShadow: canNext ? '0 14px 30px -10px rgba(61,40,64,0.5)' : 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}
      >
        {loading
          ? <><span style={{ width: 16, height: 16, border: '2px solid rgba(255,241,228,0.4)', borderTopColor: '#FFF1E4', borderRadius: '50%', display: 'inline-block', animation: 'authSpin 0.7s linear infinite' }}/> Sending…</>
          : step < 2 ? 'Continue' : "Let's begin 🌸"
        }
      </button>
    </div>
  );
}

// ── ForgotPasswordScreen ──────────────────────────────────────────────────────
function ForgotPasswordScreen({ initialEmail, onBack, onDone }) {
  const [step, setStep]         = React.useState(0); // 0=email, 1=otp, 2=new password
  const [email, setEmail]       = React.useState(initialEmail || '');
  const [otp, setOtp]           = React.useState('');
  const [newPw, setNewPw]       = React.useState('');
  const [showPw, setShowPw]     = React.useState(false);
  const [loading, setLoading]   = React.useState(false);
  const [error, setError]       = React.useState('');
  const [countdown, setCountdown] = React.useState(0);

  React.useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const sendCode = async () => {
    setLoading(true); setError('');
    try {
      const { res, data } = await authFetch(`${window.BACKEND_URL}/auth/forgot-password`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) { setError(apiErr(data, `Could not send code (${res.status})`)); return; }
      setStep(1); setCountdown(30);
    } catch { setError('Could not connect. Check your internet connection.'); }
    finally { setLoading(false); }
  };

  const resetPassword = async () => {
    if (newPw.length < 8) { setError('Password must be at least 8 characters'); return; }
    setLoading(true); setError('');
    try {
      const { res, data } = await authFetch(`${window.BACKEND_URL}/auth/reset-password`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, new_password: newPw }),
      });
      if (!res.ok) { setError(apiErr(data, 'Reset failed. The code may have expired — request a new one.')); return; }
      onDone();
    } catch { setError('Could not connect. Check your internet connection.'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 50,
      background: 'linear-gradient(180deg, #FFEFE2 0%, #F4D7E5 60%, #E0D5F0 100%)',
      display: 'flex', flexDirection: 'column', padding: '0 28px 36px',
    }}>
      <Grain/>
      <div style={{ paddingTop: 54, display: 'flex' }}>
        <button onClick={onBack} style={{
          width: 36, height: 36, borderRadius: 99, border: 'none',
          background: 'rgba(255,255,255,0.7)', cursor: 'pointer',
          display: 'grid', placeItems: 'center',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3D2840" strokeWidth="2.2" strokeLinecap="round"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <Tara size={110} mood="listening"/>
        <div style={{ fontFamily: 'var(--display)', fontSize: 26, color: '#2A1A36', marginTop: 20, letterSpacing: '-0.02em' }}>
          {step === 0 ? 'Reset Password' : step === 1 ? 'Enter the code' : 'New Password'}
        </div>
        <div style={{ fontSize: 13, color: '#7A5E78', marginTop: 6 }}>
          {step === 0 ? 'Enter your email to receive a reset code' : step === 1 ? `Code sent to ${maskEmail(email)}` : 'Choose a new password'}
        </div>

        {step === 0 && (
          <input type="email" inputMode="email" placeholder="Email address" value={email}
            onChange={e => { setEmail(e.target.value); setError(''); }} autoFocus
            style={{
              marginTop: 24, width: '100%', maxWidth: 300,
              padding: '14px 18px', borderRadius: 16, border: 'none',
              background: 'rgba(255,255,255,0.85)',
              fontSize: 15, fontFamily: 'var(--ui)', color: '#2A1A36',
              outline: 'none', boxShadow: '0 2px 12px rgba(61,40,64,0.08)',
            }}
          />
        )}

        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, marginTop: 24 }}>
            <input type="tel" inputMode="numeric" maxLength={6} placeholder="6-digit code"
              value={otp} onChange={e => { setOtp(e.target.value.replace(/\D/g, '')); setError(''); }}
              style={{
                width: 180, padding: '14px 18px', borderRadius: 16, border: 'none',
                background: 'rgba(255,255,255,0.85)',
                fontSize: 22, fontWeight: 700, fontFamily: 'var(--ui)', color: '#2A1A36',
                textAlign: 'center', outline: 'none', letterSpacing: 8,
                boxShadow: '0 2px 12px rgba(61,40,64,0.08)',
              }}
            />
            <div style={{ fontSize: 13, color: '#7A5E78' }}>
              {countdown > 0
                ? <span>Resend in <strong style={{ color: '#3D2840' }}>{countdown}s</strong></span>
                : <button onClick={() => { sendCode(); setCountdown(30); }} style={{
                    background: 'transparent', border: 'none', color: '#3D2840',
                    fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'var(--ui)',
                  }}>Resend code</button>
              }
            </div>
          </div>
        )}

        {step === 2 && (
          <div style={{ display: 'flex', alignItems: 'center', marginTop: 24, width: '100%', maxWidth: 300,
            background: 'rgba(255,255,255,0.85)', borderRadius: 16, border: '1.5px solid rgba(61,40,64,0.12)',
            boxShadow: '0 2px 12px rgba(61,40,64,0.06)', overflow: 'hidden',
          }}>
            <input type={showPw ? 'text' : 'password'} placeholder="New password (min. 8 chars)"
              value={newPw} onChange={e => { setNewPw(e.target.value); setError(''); }} autoFocus
              style={{
                flex: 1, padding: '14px 14px', border: 'none', background: 'transparent',
                fontSize: 15, fontFamily: 'var(--ui)', color: '#2A1A36', outline: 'none',
              }}
            />
            <button onClick={() => setShowPw(p => !p)} style={{
              padding: '14px', border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 14, color: '#7A5E78',
            }}>{showPw ? '🙈' : '👁'}</button>
          </div>
        )}

        {error && <div style={{ fontSize: 12, color: '#C0392B', marginTop: 12 }}>{error}</div>}
      </div>

      <button
        disabled={loading || (step === 0 && !email) || (step === 1 && otp.length < 6) || (step === 2 && newPw.length < 8)}
        onClick={
          step === 0 ? sendCode :
          step === 1 ? () => setStep(2) :
          resetPassword
        }
        style={{
          padding: '16px 24px', borderRadius: 99, border: 'none',
          background: '#3D2840', color: '#FFF1E4', fontSize: 15, fontWeight: 600,
          cursor: 'pointer', boxShadow: '0 14px 30px -10px rgba(61,40,64,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}
      >
        {loading
          ? <><span style={{ width: 16, height: 16, border: '2px solid rgba(255,241,228,0.4)', borderTopColor: '#FFF1E4', borderRadius: '50%', display: 'inline-block', animation: 'authSpin 0.7s linear infinite' }}/> Working…</>
          : step === 0 ? 'Send Reset Code →' : step === 1 ? 'Continue →' : 'Reset Password →'
        }
      </button>
    </div>
  );
}

function saveUser(data) {
  localStorage.setItem('maya_user', JSON.stringify(data));
}

window.AuthScreen           = AuthScreen;
window.OTPScreen            = OTPScreen;
window.RegisterScreen       = RegisterScreen;
window.ForgotPasswordScreen = ForgotPasswordScreen;
window.saveTokens           = saveTokens;
window.refreshTokens        = refreshTokens;
window.saveUser             = saveUser;
