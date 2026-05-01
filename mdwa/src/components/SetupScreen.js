// src/components/SetupScreen.js
import React, { useState } from 'react';
import { THEMES } from '../theme';
import { signInWithGoogle, signOutGoogle, isSignedIn } from '../googleDrive';

const TIME_PRESETS  = [5, 10, 20, 30, 60];
const WORD_PRESETS  = [100, 250, 500, 750, 1000];
const DANGER_SECS   = 5; // seconds of inactivity before text is deleted

export default function SetupScreen({ config, setConfig, onStart }) {
  const t = THEMES[config.theme];
  const [driveLoading, setDriveLoading] = useState(false);
  const [driveError, setDriveError]     = useState('');
  const [customInput, setCustomInput]   = useState('');

  /* ── helpers ─────────────────────────────────────────────── */
  const set = (patch) => setConfig(c => ({ ...c, ...patch }));

  const handleGoalType = (type) => {
    set({ goalType: type, goalAmount: type === 'time' ? 5 : 250 });
    setCustomInput('');
  };

  const handlePreset = (amount) => {
    set({ goalAmount: amount });
    setCustomInput('');
  };

  const handleCustom = (val) => {
    setCustomInput(val);
    const n = parseInt(val, 10);
    if (!isNaN(n) && n > 0) set({ goalAmount: n });
  };

  const handleDriveConnect = async () => {
    setDriveError('');
    setDriveLoading(true);
    try {
      await signInWithGoogle();
      set({ driveConnected: true });
    } catch (e) {
      setDriveError(e.message);
    } finally {
      setDriveLoading(false);
    }
  };

  const handleDriveDisconnect = () => {
    signOutGoogle();
    set({ driveConnected: false });
    setDriveError('');
  };

  /* ── styles (inline; themed) ─────────────────────────────── */
  const s = makeStyles(t);

  const presets = config.goalType === 'time' ? TIME_PRESETS : WORD_PRESETS;
  const unit    = config.goalType === 'time' ? 'min' : 'words';

  return (
    <div style={s.root}>
      <Scanlines color={t.scanline} />
      <style>{globalCSS(t)}</style>

      <div style={s.wrap}>
        {/* ── Header ── */}
        <div style={s.header}>
          <div style={s.prompt}>$ ./dangerous-writer --configure</div>
          <h1 style={s.title}>
            dangerous<span style={{ color: t.textDim }}>_</span>writer
            <span style={s.cursor}>▊</span>
          </h1>
          <p style={s.subtitle}>
            stop typing for {DANGER_SECS} seconds → everything is gone
          </p>
        </div>

        {/* ── Panel ── */}
        <div style={s.panel}>

          {/* Goal type */}
          <Field label="// goal type" theme={t}>
            <div style={s.toggle}>
              {['time', 'words'].map(type => (
                <button
                  key={type}
                  style={s.toggleBtn(config.goalType === type)}
                  onClick={() => handleGoalType(type)}
                >
                  {type === 'time' ? '⏱  Time' : '◈  Words'}
                </button>
              ))}
            </div>
          </Field>

          {/* Goal amount */}
          <Field label={`// ${config.goalType === 'time' ? 'duration' : 'word count target'}`} theme={t}>
            <div style={s.row}>
              <input
                type="number"
                min={1}
                value={customInput || config.goalAmount}
                onChange={e => handleCustom(e.target.value)}
                style={s.numberInput}
                placeholder="Enter number"
              />
              <span style={s.unit}>{unit}</span>
            </div>
            <div style={s.presets}>
              {presets.map(p => (
                <button
                  key={p}
                  style={s.presetBtn(config.goalAmount === p && !customInput)}
                  onClick={() => handlePreset(p)}
                >
                  {p}{config.goalType === 'time' ? 'm' : 'w'}
                </button>
              ))}
            </div>
          </Field>

          <Divider color={t.border} />

          {/* Theme */}
          <Field label="// terminal theme" theme={t}>
            <div style={s.themeRow}>
              {Object.entries(THEMES).map(([key, th]) => (
                <button
                  key={key}
                  style={s.themeBtn(config.theme === key, th)}
                  onClick={() => set({ theme: key })}
                >
                  <span style={{ display: 'block', fontSize: 16, marginBottom: 4 }}>
                    {key === 'dark' ? '●' : key === 'light' ? '○' : '◆'}
                  </span>
                  {th.label}
                </button>
              ))}
            </div>
          </Field>

          <Divider color={t.border} />

          {/* Google Drive */}
          <Field label="// google drive — auto-save drafts (optional)" theme={t}>
            {isSignedIn() ? (
              <>
                <div style={s.driveRow}>
                  <span style={{ ...s.driveStatus, color: t.timerSafe }}>
                    ✓ connected
                  </span>
                  <button style={s.btn} onClick={handleDriveDisconnect}>
                    Disconnect
                  </button>
                </div>
                <div style={{ ...s.row, marginTop: 8 }}>
                  <span style={s.unit}>folder:</span>
                  <input
                    type="text"
                    value={config.driveFolder}
                    onChange={e => set({ driveFolder: e.target.value })}
                    placeholder="Dangerous Writer"
                    style={{ ...s.textInput, flex: 1 }}
                  />
                </div>
              </>
            ) : (
              <>
                <div style={s.driveRow}>
                  <span style={s.driveStatus}>not connected</span>
                  <button
                    style={s.btn}
                    onClick={handleDriveConnect}
                    disabled={driveLoading}
                  >
                    {driveLoading ? 'Connecting…' : 'Connect Drive'}
                  </button>
                </div>
                {driveError && (
                  <pre style={s.driveError}>{driveError}</pre>
                )}
              </>
            )}
          </Field>

          <Divider color={t.border} />

          {/* Start */}
          <button style={s.startBtn} onClick={onStart}>
            $ begin_session
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── tiny sub-components ───────────────────────────────────── */
function Scanlines({ color }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
      background: `repeating-linear-gradient(0deg,${color} 0,${color} 1px,transparent 1px,transparent 4px)`,
    }} />
  );
}

function Field({ label, children, theme: t }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: t.textDim }}>
        {label}
      </div>
      {children}
    </div>
  );
}

function Divider({ color }) {
  return <div style={{ borderTop: `1px solid ${color}` }} />;
}

/* ── styles factory ────────────────────────────────────────── */
function makeStyles(t) {
  return {
    root: {
      minHeight: '100vh', background: t.bg, color: t.text,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '40px 20px',
      fontFamily: "'JetBrains Mono', 'Courier New', monospace",
      position: 'relative', overflow: 'hidden',
    },
    wrap: {
      position: 'relative', zIndex: 1,
      width: '100%', maxWidth: 560,
      display: 'flex', flexDirection: 'column', gap: 0,
    },
    header: { marginBottom: 44, textAlign: 'left' },
    prompt: { fontSize: 11, letterSpacing: '0.14em', color: t.textDim, marginBottom: 8 },
    title: {
      fontSize: 'clamp(26px, 5vw, 48px)', fontWeight: 700,
      letterSpacing: '0.04em', lineHeight: 1.1, color: t.text,
      textShadow: t.glow !== 'none' ? t.glow : 'none',
    },
    cursor: { color: t.accent, animation: 'blink 1s step-end infinite' },
    subtitle: { fontSize: 12, color: t.textDim, marginTop: 10, letterSpacing: '0.06em' },

    panel: {
      background: t.surface, border: `1px solid ${t.border}`,
      padding: '32px 36px', display: 'flex', flexDirection: 'column', gap: 26,
    },

    // goal type toggle
    toggle: { display: 'flex', background: t.bg, border: `1px solid ${t.border}`, overflow: 'hidden' },
    toggleBtn: (active) => ({
      flex: 1, padding: '9px 0',
      background: active ? t.accent : 'transparent',
      color: active ? t.accentBg : t.textDim,
      border: 'none', cursor: 'pointer',
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase',
      fontWeight: active ? 700 : 400, transition: 'all 0.15s',
    }),

    // inputs
    row: { display: 'flex', alignItems: 'center', gap: 10 },
    numberInput: {
      background: t.bg, border: `1px solid ${t.border}`, color: t.text,
      fontFamily: "'JetBrains Mono', monospace", fontSize: 18,
      padding: '7px 12px', outline: 'none', width: 100,
      textAlign: 'center', transition: 'border-color 0.2s',
    },
    textInput: {
      background: t.bg, border: `1px solid ${t.border}`, color: t.text,
      fontFamily: "'JetBrains Mono', monospace", fontSize: 13,
      padding: '7px 12px', outline: 'none', transition: 'border-color 0.2s',
    },
    unit: { fontSize: 11, color: t.textDim, letterSpacing: '0.1em' },

    // presets
    presets: { display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 2 },
    presetBtn: (active) => ({
      padding: '5px 12px',
      background: active ? t.accentBg : 'transparent',
      color: active ? t.accent : t.textDim,
      border: `1px solid ${active ? t.accent : t.border}`,
      cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace",
      fontSize: 11, letterSpacing: '0.08em', transition: 'all 0.15s',
    }),

    // theme
    themeRow: { display: 'flex', gap: 10 },
    themeBtn: (active, th) => ({
      flex: 1, padding: '12px 8px',
      background: th.bg, color: th.text,
      border: `2px solid ${active ? th.text : th.border}`,
      cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase',
      textAlign: 'center', transition: 'border-color 0.15s',
    }),

    // drive
    driveRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
    driveStatus: { fontSize: 12, color: t.textDim, letterSpacing: '0.06em' },
    driveError: {
      fontSize: 10, color: t.textDanger, marginTop: 6,
      lineHeight: 1.6, whiteSpace: 'pre-wrap', fontFamily: 'inherit',
      background: 'transparent', border: 'none', padding: 0,
    },

    // buttons
    btn: {
      padding: '8px 16px', background: 'transparent', color: t.text,
      border: `1px solid ${t.border}`, cursor: 'pointer',
      fontFamily: "'JetBrains Mono', monospace", fontSize: 11,
      letterSpacing: '0.12em', textTransform: 'uppercase',
      transition: 'all 0.15s', whiteSpace: 'nowrap',
    },
    startBtn: {
      padding: '16px', background: t.accent, color: t.accentBg,
      border: `1px solid ${t.accent}`, cursor: 'pointer', width: '100%',
      fontFamily: "'JetBrains Mono', monospace", fontSize: 13,
      letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 700,
      transition: 'opacity 0.15s',
    },
  };
}

function globalCSS(t) {
  return `
    @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
    button:hover { opacity: 0.75 !important; }
    input:focus { border-color: ${t.accent} !important; }
    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-thumb { background: ${t.border}; }
    input[type=number]::-webkit-inner-spin-button { opacity: 0.4; }
  `;
}
