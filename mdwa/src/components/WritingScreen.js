// src/components/WritingScreen.js
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { THEMES } from '../theme';

const DANGER_WINDOW = 5; // seconds without typing before deletion

export default function WritingScreen({ config, onFinish, onFail }) {
  const t = THEMES[config.theme];
  const editorRef   = useRef(null);
  const intervalRef = useRef(null);
  const textRef     = useRef('');          // mirror of text for use inside closure

  const [text, setText]           = useState('');
  const [countdown, setCountdown] = useState(DANGER_WINDOW);
  const [sessionStart]            = useState(Date.now());
  const [elapsed, setElapsed]     = useState(0);
  const [danger, setDanger]       = useState(false);

  /* ── Derived ─────────────────────────────────────────────── */
  const words   = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
  const chars   = text.length;
  const elapsedMin = elapsed / 60;

  const progress = config.goalType === 'time'
    ? Math.min(1, elapsedMin / config.goalAmount)
    : Math.min(1, words / config.goalAmount);

  const goalMet = config.goalType === 'time'
    ? elapsedMin >= config.goalAmount
    : words >= config.goalAmount;

  /* ── Countdown tick ──────────────────────────────────────── */
  const startInterval = useCallback(() => {
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setCountdown(prev => {
        const next = parseFloat((prev - 0.1).toFixed(2));
        if (next <= DANGER_WINDOW * 0.5) setDanger(true);
        if (next <= 0) {
          clearInterval(intervalRef.current);
          onFail(textRef.current);
          return 0;
        }
        return next;
      });
    }, 100);
  }, [onFail]);

  /* ── Mount ───────────────────────────────────────────────── */
  useEffect(() => {
    editorRef.current?.focus();
    startInterval();
    return () => clearInterval(intervalRef.current);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Elapsed clock ───────────────────────────────────────── */
  useEffect(() => {
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - sessionStart) / 1000)), 1000);
    return () => clearInterval(id);
  }, [sessionStart]);

  /* ── Auto-finish ─────────────────────────────────────────── */
  useEffect(() => {
    if (goalMet) {
      clearInterval(intervalRef.current);
      onFinish({ text, words, chars, elapsed });
    }
  }); // runs every render — goalMet check is cheap

  /* ── Typing handler ──────────────────────────────────────── */
  const handleChange = (e) => {
    const val = e.target.value;
    textRef.current = val;
    setText(val);
    setCountdown(DANGER_WINDOW);
    setDanger(false);
    startInterval();
  };

  const handleFinish = () => {
    clearInterval(intervalRef.current);
    onFinish({ text, words, chars, elapsed });
  };

  /* ── Timer visuals ───────────────────────────────────────── */
  const ratio      = countdown / DANGER_WINDOW;
  const timerColor = ratio > 0.5 ? t.timerSafe : ratio > 0.25 ? t.timerWarn : t.timerDanger;
  const fmtElapsed = (s) => { const m = Math.floor(s/60); return m ? `${m}m ${s%60}s` : `${s}s`; };

  const goalLeft = config.goalType === 'time'
    ? `${Math.max(0, config.goalAmount - Math.floor(elapsedMin))}m left`
    : `${Math.max(0, config.goalAmount - words)} words left`;

  /* ── Styles ──────────────────────────────────────────────── */
  const bgColor = danger
    ? `color-mix(in srgb, ${t.bg} 88%, ${t.textDanger} 12%)`
    : t.bg;

  return (
    <div style={{ height:'100vh', background: bgColor, color: t.text,
                  display:'flex', flexDirection:'column',
                  fontFamily:"'JetBrains Mono','Courier New',monospace",
                  transition:'background 0.2s', position:'relative', overflow:'hidden' }}>

      <style>{`
        textarea::placeholder { color:${t.textDim}; font-style:italic; }
        textarea:focus { outline:none; }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-thumb { background:${t.border}; }
        button:hover { opacity:0.75; }
      `}</style>

      {/* Scanlines */}
      <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0,
                    background:`repeating-linear-gradient(0deg,${t.scanline} 0,${t.scanline} 1px,transparent 1px,transparent 4px)` }} />

      {/* ── Top bar ── */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
                    padding:'10px 24px', borderBottom:`1px solid ${t.border}`,
                    background: t.surface, flexShrink:0, position:'relative', zIndex:10 }}>

        {/* Stats */}
        <div style={{ display:'flex', gap:24 }}>
          {[['words', words.toLocaleString()], ['chars', chars.toLocaleString()], ['time', fmtElapsed(elapsed)]].map(([label, val]) => (
            <div key={label} style={{ display:'flex', flexDirection:'column', gap:2 }}>
              <span style={{ fontSize:9, letterSpacing:'0.2em', textTransform:'uppercase', color:t.textDim }}>{label}</span>
              <span style={{ fontSize:16, fontWeight:700, letterSpacing:'0.04em' }}>{val}</span>
            </div>
          ))}
        </div>

        {/* Danger timer */}
        <div style={{ display:'flex', flexDirection:'column', gap:6, flex:1, maxWidth:280, margin:'0 24px' }}>
          <div style={{ display:'flex', justifyContent:'space-between' }}>
            <span style={{ fontSize:9, letterSpacing:'0.2em', textTransform:'uppercase',
                           color: danger ? t.textDanger : t.textDim, transition:'color 0.2s' }}>
              {danger ? '⚠ danger' : 'danger timer'}
            </span>
            <span style={{ fontSize:9, letterSpacing:'0.1em', color: timerColor }}>
              {countdown.toFixed(1)}s
            </span>
          </div>
          <div style={{ height:3, background:t.border, overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${ratio*100}%`, background:timerColor,
                          transition:'background 0.3s, width 0.1s linear' }} />
          </div>
        </div>

        {/* Finish button */}
        <button
          onClick={handleFinish}
          style={{ padding:'8px 18px', background:t.accent, color:t.accentBg,
                   border:`1px solid ${t.accent}`, cursor:'pointer',
                   fontFamily:"'JetBrains Mono',monospace", fontSize:10,
                   letterSpacing:'0.14em', textTransform:'uppercase', fontWeight:700 }}
        >
          Finish
        </button>
      </div>

      {/* ── Editor ── */}
      <div style={{ flex:1, overflow:'auto', padding:'clamp(24px,5vw,72px) clamp(24px,10vw,148px)',
                    position:'relative', zIndex:1 }}>
        <textarea
          ref={editorRef}
          value={text}
          onChange={handleChange}
          style={{ width:'100%', minHeight:'100%', background:'transparent', border:'none',
                   outline:'none', resize:'none', fontFamily:"'JetBrains Mono','Courier New',monospace",
                   fontSize:18, lineHeight:1.9, color: danger ? t.textDanger : t.text,
                   caretColor: t.accent, transition:'color 0.2s' }}
          placeholder={"start typing. don't stop.\n\n5 seconds of silence and everything disappears."}
          spellCheck
          autoCorrect="on"
        />
      </div>

      {/* ── Progress bar (bottom) ── */}
      <div style={{ padding:'8px 24px', borderTop:`1px solid ${t.border}`, background:t.surface,
                    flexShrink:0, display:'flex', alignItems:'center', gap:10, zIndex:10 }}>
        <span style={{ fontSize:9, color:t.textDim, letterSpacing:'0.14em', textTransform:'uppercase', whiteSpace:'nowrap' }}>
          goal: {config.goalType === 'time' ? `${config.goalAmount}min` : `${config.goalAmount} words`}
        </span>
        <div style={{ flex:1, height:2, background:t.border, overflow:'hidden' }}>
          <div style={{ height:'100%', width:`${progress*100}%`, background:t.accent, transition:'width 0.4s ease' }} />
        </div>
        <span style={{ fontSize:9, color:t.accent, letterSpacing:'0.1em', whiteSpace:'nowrap' }}>
          {Math.round(progress*100)}% — {goalLeft}
        </span>
      </div>
    </div>
  );
}
