// Tara — Maya's AI companion — video-based with backward-compatible props + ref API

const _EMOTION_VIDEOS = {
  idle:         "assets/tara/idle.webm",
  thinking:     "assets/tara/thinking.webm",
  talking:      "assets/tara/talking.webm",
  listening:    "assets/tara/listening.webm",
  happy:        "assets/tara/happy.webm",
  caring:       "assets/tara/careing.mp4",
  alert:        "assets/tara/angry.webm",
  worried:      "assets/tara/angry.webm",
  celebration:  "assets/tara/celebrating.webm",
  celebration2: "assets/tara/celebration2.webm",
  celebrate:    "assets/tara/celebrating.webm",
  singing:      "assets/tara/singing.webm",
  sleepy:       "assets/tara/sleeping.webm",
};

const _FUNNY_VIDEOS = {
  clip1: "assets/tara/funny.webm",
  clip2: "assets/tara/funny clips/funny video clip 01.webm",
  clip3: "assets/tara/funny clips/funny clip 2.webm",
  clip4: "assets/tara/funny clips/funny clip 3.webm",
  clip5: "assets/tara/funny clips/funny clip 4.webm",
  thief: "assets/tara/funny clips/thief.webm",
};

const _FUNNY_KEYS = Object.keys(_FUNNY_VIDEOS);
const _CELEBRATION_STATES = new Set(['celebrate', 'celebration', 'celebration2']);
const _FADE_MS = 120;
const _EMOTION_HOLD = 4000;

const Tara = React.forwardRef(({
  size    = 180,
  mood    = "idle",
  halo    = false,
  style:  styleProp = {},
  onReady = null,
}, ref) => {

  const videoRef    = React.useRef(null);
  const [opacity,   setOpacity]     = React.useState(1);
  const [error,     setError]       = React.useState(null);
  const [vidFilter, setVidFilter]   = React.useState("url(#tara-white-remove)");

  const stateRef      = React.useRef(mood);
  const modeRef       = React.useRef("emotion");
  const transRef      = React.useRef(false);
  const funnyRef      = React.useRef(false);
  const emotionTimer  = React.useRef(null);
  const funnyCallback = React.useRef(null);
  const lastFunnyIdx  = React.useRef(-1);

  const _filterFor = (src) =>
    src.includes("talking.webm") ? "url(#tara-black-remove)" : "url(#tara-white-remove)";

  // ── switch video directly on the DOM element ──────────────────
  // Bypasses React state to avoid the commit-phase delay that caused
  // v.load() to fire before the new src was written to the DOM.
  const switchVideo = React.useCallback((src, loop) => {
    const v = videoRef.current;
    if (!v) return;
    v.pause();
    v.src  = src;
    v.loop = loop;
    v.load();
    v.play().catch(() => {});
    setVidFilter(_filterFor(src));
  }, []);

  // ── crossfade: fade out → switch → fade in ────────────────────
  const crossfade = React.useCallback((src, loop, onDone) => {
    if (transRef.current) return;
    transRef.current = true;
    setOpacity(0);
    setTimeout(() => {
      switchVideo(src, loop);
      setOpacity(1);
      setTimeout(() => {
        transRef.current = false;
        if (onDone) onDone();
      }, _FADE_MS);
    }, _FADE_MS);
  }, [switchVideo]);

  // ── play an emotion state ─────────────────────────────────────
  const playEmotion = React.useCallback((state, loop = true, onDone) => {
    const resolved = _CELEBRATION_STATES.has(state)
      ? (Math.random() < 0.5 ? 'celebration' : 'celebration2')
      : state;
    const file = _EMOTION_VIDEOS[resolved];
    if (!file) { console.warn("[TARA] Unknown state:", resolved); return; }
    if (emotionTimer.current) { clearTimeout(emotionTimer.current); emotionTimer.current = null; }
    modeRef.current  = "emotion";
    stateRef.current = resolved;
    crossfade(file, loop, onDone);
  }, [crossfade]);

  // ── sync mood prop → video ────────────────────────────────────
  const prevMoodRef = React.useRef(mood);
  React.useEffect(() => {
    if (mood === prevMoodRef.current) return;
    prevMoodRef.current = mood;
    if (funnyRef.current) return;
    playEmotion(mood || "idle");
  }, [mood, playEmotion]);

  // ── mount: set initial src + autoplay ────────────────────────
  React.useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const initialSrc = _EMOTION_VIDEOS[mood] || _EMOTION_VIDEOS.idle;
    v.src  = initialSrc;
    v.loop = true;
    v.load();
    v.play().catch(() => {
      const resume = () => { v.play().catch(() => {}); document.removeEventListener("click", resume); };
      document.addEventListener("click", resume);
    });
    if (onReady) v.addEventListener("loadeddata", onReady, { once: true });
    setVidFilter(_filterFor(initialSrc));
  }, []); // intentionally empty — fires once on mount

  // ── preload funny clips after 3 s ─────────────────────────────
  React.useEffect(() => {
    const timer = setTimeout(() => {
      Object.values(_FUNNY_VIDEOS).forEach(src => {
        const link = document.createElement("link");
        link.rel  = "preload";
        link.as   = "video";
        link.href = src;
        document.head.appendChild(link);
      });
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  // ── funny clip ended → return to idle ────────────────────────
  const handleEnded = React.useCallback(() => {
    if (modeRef.current !== "funny") return;
    funnyRef.current = false;
    const cb = funnyCallback.current;
    funnyCallback.current = null;
    if (cb) { cb(); return; }
    setTimeout(() => { modeRef.current = "emotion"; playEmotion("idle"); }, 400);
  }, [playEmotion]);

  // ── video error → fallback to idle ───────────────────────────
  const handleError = React.useCallback(() => {
    const v = videoRef.current;
    const src  = v?.currentSrc || v?.src || "";
    const name = src.split("/").pop() || "video";
    console.error("[TARA] Not found:", src);
    setError(`Missing: ${name}`);
    funnyRef.current = false;
    modeRef.current  = "emotion";
    stateRef.current = "idle";
    if (v) { v.src = _EMOTION_VIDEOS.idle; v.loop = true; v.load(); v.play().catch(() => {}); setVidFilter("url(#tara-white-remove)"); }
  }, []);

  // ── ref API ───────────────────────────────────────────────────
  React.useImperativeHandle(ref, () => {
    const handle = {
      play(state) {
        if (funnyRef.current) { funnyCallback.current = () => handle.play(state); return; }
        playEmotion(state);
      },
      playEmotion(state, holdMs = _EMOTION_HOLD) {
        playEmotion(state, true, () => {
          emotionTimer.current = setTimeout(() => { playEmotion("idle"); emotionTimer.current = null; }, holdMs);
        });
      },
      speak(emotionState = "happy", durationMs = 3000) {
        playEmotion("thinking", true, () => {
          setTimeout(() => {
            playEmotion("talking", true, () => {
              setTimeout(() => handle.playEmotion(emotionState), durationMs);
            });
          }, 1200);
        });
      },
      playFunny(key, onEnd = null) {
        const src = _FUNNY_VIDEOS[key];
        if (!src) { console.warn("[TARA] Unknown funny clip:", key); return; }
        if (emotionTimer.current) { clearTimeout(emotionTimer.current); emotionTimer.current = null; }
        funnyRef.current      = true;
        modeRef.current       = "funny";
        funnyCallback.current = onEnd;
        crossfade(src, false, null);
      },
      playRandomFunny(onEnd = null) {
        let idx;
        if (_FUNNY_KEYS.length === 1) { idx = 0; }
        else { do { idx = Math.floor(Math.random() * _FUNNY_KEYS.length); } while (idx === lastFunnyIdx.current); }
        lastFunnyIdx.current = idx;
        handle.playFunny(_FUNNY_KEYS[idx], onEnd);
      },
      getState:   () => stateRef.current,
      getMode:    () => modeRef.current,
      isFunny:    () => funnyRef.current,
      clearError: () => setError(null),

      startListening() {
        if (emotionTimer.current) { clearTimeout(emotionTimer.current); emotionTimer.current = null; }
        modeRef.current  = "emotion";
        stateRef.current = "listening";
        crossfade(_EMOTION_VIDEOS.listening, true, null);
      },
      stopListening() {
        modeRef.current  = "emotion";
        stateRef.current = "thinking";
        crossfade(_EMOTION_VIDEOS.thinking, true, null);
      },
      playCaring(holdMs = 6000) {
        playEmotion("caring", true, () => {
          emotionTimer.current = setTimeout(() => {
            playEmotion("idle"); emotionTimer.current = null;
          }, holdMs);
        });
      },
      playSinging(holdMs = _EMOTION_HOLD) {
        playEmotion("singing", true, () => {
          emotionTimer.current = setTimeout(() => {
            playEmotion("idle"); emotionTimer.current = null;
          }, holdMs);
        });
      },
      playCelebration(holdMs = _EMOTION_HOLD) {
        playEmotion("celebration", true, () => {
          emotionTimer.current = setTimeout(() => {
            playEmotion("idle"); emotionTimer.current = null;
          }, holdMs);
        });
      },
      playCelebration2(holdMs = _EMOTION_HOLD) {
        playEmotion("celebration2", true, () => {
          emotionTimer.current = setTimeout(() => {
            playEmotion("idle"); emotionTimer.current = null;
          }, holdMs);
        });
      },
    };
    return handle;
  }, [playEmotion, crossfade]);

  const s = size;

  return (
    <div style={{
      width: s, height: s * 1.05,
      position: "relative", display: "inline-block",
      pointerEvents: "none",
      ...styleProp,
    }}>
      <video
        ref={videoRef}
        muted
        playsInline
        onEnded={handleEnded}
        onError={handleError}
        style={{
          width: "100%", height: "100%",
          objectFit: "contain",
          background: "transparent",
          opacity,
          transition: `opacity ${_FADE_MS}ms ease`,
          display: "block",
          filter: vidFilter,
        }}
      />

      {error && (
        <div onClick={() => setError(null)} style={{
          position: "absolute", bottom: 4, left: 4, right: 4,
          background: "rgba(200,40,40,0.85)", color: "#fff",
          borderRadius: 6, padding: "3px 8px",
          fontSize: 10, fontFamily: "monospace", textAlign: "center",
          pointerEvents: "auto", cursor: "pointer",
        }}>
          ⚠️ {error} (tap to dismiss)
        </div>
      )}

      <style>{``}</style>
    </div>
  );
});

window.Tara = Tara;
