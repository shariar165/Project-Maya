// Tara — Maya's companion (uses the actual penguin plush image).
// Animation states are conveyed via transform + overlays since the image is fixed.
// Moods: idle, happy, sleepy, worried, celebrate, listening

function Tara({ size = 180, mood = 'idle', talking = false, halo = false }) {
  const s = size;
  const moodKey = mood;

  // mood -> CSS animation
  const anim = (() => {
    if (moodKey === 'celebrate') return 'taraBounce 0.7s ease-in-out infinite';
    if (moodKey === 'listening') return 'taraTilt 2.4s ease-in-out infinite';
    if (moodKey === 'sleepy')    return 'taraSleep 4.5s ease-in-out infinite';
    if (moodKey === 'worried')   return 'taraShake 2.8s ease-in-out infinite';
    if (moodKey === 'happy')     return 'taraHappy 3.4s ease-in-out infinite';
    return 'taraBreathe 3.6s ease-in-out infinite';
  })();

  // gentle filter shift per mood
  const filter = (() => {
    if (moodKey === 'sleepy') return 'brightness(0.92) saturate(0.85)';
    if (moodKey === 'worried') return 'brightness(0.95) saturate(0.95)';
    return 'none';
  })();

  return (
    <div className={`tara tara-${moodKey} ${talking ? 'tara-talking' : ''}`} style={{
      width: s, height: s * 1.05, position: 'relative', display: 'inline-block',
      pointerEvents: 'none',
    }}>
      {halo && <div style={{
        position: 'absolute', inset: -s*0.2, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(244,180,200,0.55), rgba(244,180,200,0) 65%)',
        animation: 'taraHalo 3.2s ease-in-out infinite', pointerEvents: 'none',
      }} />}

      {/* shadow under feet */}
      <div style={{
        position: 'absolute', left: '50%', bottom: -s*0.02, transform: 'translateX(-50%)',
        width: s*0.55, height: s*0.06, borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(40,20,40,0.18), transparent 70%)',
        animation: 'taraShadow 3.6s ease-in-out infinite',
      }}/>

      <div style={{
        position: 'relative', width: '100%', height: '100%',
        animation: anim,
        transformOrigin: '50% 85%',
      }}>
        <img
          src="assets/tara.png"
          alt="Tara, your penguin companion"
          draggable="false"
          style={{
            width: '100%', height: '100%', objectFit: 'contain',
            filter,
            transition: 'filter 600ms ease',
            userSelect: 'none',
          }}
        />

        {/* talking ring */}
        {talking && (
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            background: 'radial-gradient(circle at 50% 42%, rgba(255,255,255,0) 28%, rgba(244,180,200,0.45) 30%, transparent 34%)',
            animation: 'taraTalkRing 0.6s ease-in-out infinite',
            pointerEvents: 'none',
          }}/>
        )}
      </div>

      {/* mood overlays — small floating glyphs */}
      {moodKey === 'sleepy' && (
        <div style={{
          position: 'absolute', top: s*0.05, right: s*0.05,
          fontFamily: 'var(--display)', fontSize: s*0.16, color: '#FFF1E4',
          textShadow: '0 2px 8px rgba(0,0,0,0.3)',
          animation: 'taraZ 2.5s ease-in-out infinite',
          opacity: 0.85,
        }}>z<span style={{ fontSize: s*0.1, marginLeft: 2, verticalAlign: 'super' }}>z</span></div>
      )}

      {moodKey === 'celebrate' && (
        <>
          <div className="spark" style={{ position: 'absolute', top: s*0.1, left: s*0.05, fontSize: s*0.12, animation: 'taraSpark 1.4s ease-in-out infinite' }}>✨</div>
          <div className="spark" style={{ position: 'absolute', top: s*0.18, right: s*0.04, fontSize: s*0.1, animation: 'taraSpark 1.4s ease-in-out 0.3s infinite' }}>🌸</div>
          <div className="spark" style={{ position: 'absolute', bottom: s*0.2, left: s*0.02, fontSize: s*0.09, animation: 'taraSpark 1.4s ease-in-out 0.6s infinite' }}>💗</div>
        </>
      )}

      {moodKey === 'worried' && (
        <div style={{
          position: 'absolute', top: s*0.04, left: '50%', transform: 'translateX(-50%)',
          fontSize: s*0.1, animation: 'taraSweat 2s ease-in-out infinite',
          textShadow: '0 1px 2px rgba(0,0,0,0.2)',
        }}>💧</div>
      )}

      {moodKey === 'listening' && (
        <div style={{
          position: 'absolute', top: s*0.08, right: s*0.0,
          display: 'flex', gap: 2, alignItems: 'flex-end', height: s*0.12,
        }}>
          {[0,1,2].map(i => (
            <div key={i} style={{
              width: 3, background: '#F4B4C8', borderRadius: 2,
              animation: `taraBar 0.8s ease-in-out ${i*0.15}s infinite alternate`,
              boxShadow: '0 0 6px rgba(244,180,200,0.6)',
            }}/>
          ))}
        </div>
      )}

      <style>{`
        @keyframes taraBreathe { 0%,100% { transform: scale(1) } 50% { transform: scale(1.025) translateY(-2px) } }
        @keyframes taraHappy { 0%,100% { transform: scale(1) rotate(-1deg) } 50% { transform: scale(1.03) rotate(1deg) translateY(-2px) } }
        @keyframes taraBounce { 0%,100% { transform: translateY(0) scale(1) rotate(-2deg) } 50% { transform: translateY(-10px) scale(1.06) rotate(2deg) } }
        @keyframes taraTilt { 0%,100% { transform: rotate(-5deg) translateY(-1px) } 50% { transform: rotate(5deg) translateY(1px) } }
        @keyframes taraSleep { 0%,100% { transform: scale(0.99) rotate(-2deg) translateY(2px) } 50% { transform: scale(1.01) rotate(2deg) translateY(0) } }
        @keyframes taraShake { 0%,100% { transform: translateX(0) } 25% { transform: translateX(-2px) rotate(-1deg) } 75% { transform: translateX(2px) rotate(1deg) } }
        @keyframes taraShadow { 0%,100% { opacity: 0.6; transform: translateX(-50%) scale(1) } 50% { opacity: 0.4; transform: translateX(-50%) scale(0.85) } }
        @keyframes taraHalo { 0%,100% { transform: scale(1); opacity: 0.6 } 50% { transform: scale(1.1); opacity: 1 } }
        @keyframes taraTalkRing { 0%, 100% { opacity: 0.4; transform: scale(1) } 50% { opacity: 0.9; transform: scale(1.08) } }
        @keyframes taraZ { 0% { opacity: 0; transform: translateY(0) translateX(0) scale(0.6) } 50% { opacity: 1; transform: translateY(-8px) translateX(-4px) scale(1) } 100% { opacity: 0; transform: translateY(-16px) translateX(-8px) scale(0.8) } }
        @keyframes taraSpark { 0%, 100% { opacity: 0.3; transform: scale(0.7) rotate(-10deg) } 50% { opacity: 1; transform: scale(1.2) rotate(10deg) } }
        @keyframes taraSweat { 0%, 100% { opacity: 0; transform: translateX(-50%) translateY(0) } 30%, 70% { opacity: 1 } 100% { opacity: 0; transform: translateX(-50%) translateY(8px) } }
        @keyframes taraBar { from { height: 20% } to { height: 100% } }
      `}</style>
    </div>
  );
}

window.Tara = Tara;
