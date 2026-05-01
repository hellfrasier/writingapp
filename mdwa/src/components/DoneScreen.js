// src/components/DoneScreen.js
import React, { useState } from 'react';
import { saveAs } from 'file-saver';
import { THEMES } from '../theme';
import { uploadToDrive, isSignedIn } from '../googleDrive';

export default function DoneScreen({ config, result, onRetry }) {
  const t = THEMES[config.theme];
  const { text, words, chars, elapsed } = result;

  const [driveState, setDriveState] = useState('idle'); // idle|saving|saved|error
  const [driveError, setDriveError] = useState('');
  const [driveLink,  setDriveLink]  = useState('');
  const [copied, setCopied]         = useState(false);

  const ts = () => new Date().toISOString().slice(0,19).replace(/[:.]/g,'-');
  const fmtTime = (s) => { const m = Math.floor(s/60); return m ? `${m}m ${s%60}s` : `${s}s`; };

  const handleDownload = () => {
    saveAs(new Blob([text], { type:'text/plain;charset=utf-8' }), `dangerous-writer-${ts()}.txt`);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const handleDriveSave = async () => {
    setDriveState('saving');
    setDriveError('');
    try {
      const res = await uploadToDrive(
        text,
        `dangerous-writer-${ts()}.txt`,
        config.driveFolder || 'Dangerous Writer'
      );
      setDriveLink(res.webViewLink || '');
      setDriveState('saved');
    } catch (e) {
      setDriveError(e.message);
      setDriveState('error');
    }
  };

  const s = {
    root: {
      height:'100vh', background:t.bg, color:t.text,
      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
      fontFamily:"'JetBrains Mono','Courier New',monospace",
      padding:'40px 20px', position:'relative', overflow:'hidden',
    },
    scanlines: {
      position:'fixed', inset:0, pointerEvents:'none',
      background:`repeating-linear-gradient(0deg,${t.scanline} 0,${t.scanline} 1px,transparent 1px,transparent 4px)`,
    },
    inner: {
      position:'relative', zIndex:1, display:'flex', flexDirection:'column',
      alignItems:'center', gap:28, maxWidth:480, width:'100%', textAlign:'center',
    },
    prompt: { fontSize:10, letterSpacing:'0.2em', color:t.textDim },
    title: {
      fontSize:'clamp(32px,6vw,60px)', fontWeight:700, lineHeight:1.1,
      color: t.timerSafe, letterSpacing:'0.06em',
      textShadow: t.glow !== 'none' ? `0 0 20px ${t.timerSafe}55` : 'none',
    },
    stats: { display:'flex', gap:36, justifyContent:'center' },
    statLabel: { fontSize:9, letterSpacing:'0.2em', textTransform:'uppercase', color:t.textDim, display:'block', marginBottom:4 },
    statValue: { fontSize:30, fontWeight:700, letterSpacing:'0.04em' },
    actions: { display:'flex', gap:10, flexWrap:'wrap', justifyContent:'center' },
    btn: (primary) => ({
      padding:'10px 18px',
      background: primary ? t.accent : 'transparent',
      color: primary ? t.accentBg : t.text,
      border: `1px solid ${primary ? t.accent : t.border}`,
      cursor:'pointer', fontFamily:"'JetBrains Mono',monospace",
      fontSize:11, letterSpacing:'0.12em', textTransform:'uppercase', transition:'all 0.15s',
    }),
    note: { fontSize:11, color:t.timerSafe, letterSpacing:'0.06em', minHeight:18 },
    err:  { fontSize:10, color:t.textDanger, maxWidth:380, lineHeight:1.6, whiteSpace:'pre-wrap' },
  };

  return (
    <div style={s.root}>
      <div style={s.scanlines} />
      <style>{`button:hover{opacity:0.75}`}</style>

      <div style={s.inner}>
        <div style={s.prompt}>$ session_complete — exit_code 0</div>

        <div style={s.title}>GOAL<br />REACHED.</div>

        <div style={s.stats}>
          {[['words', words.toLocaleString()], ['chars', chars.toLocaleString()], ['time', fmtTime(elapsed)]].map(([label, val]) => (
            <div key={label}>
              <span style={s.statLabel}>{label}</span>
              <span style={s.statValue}>{val}</span>
            </div>
          ))}
        </div>

        <div style={s.actions}>
          <button style={s.btn(false)} onClick={handleCopy}>
            {copied ? '✓ Copied!' : 'Copy Text'}
          </button>

          <button style={s.btn(false)} onClick={handleDownload}>
            Download .txt
          </button>

          {isSignedIn() && config.driveConnected && (
            <button
              style={s.btn(false)}
              onClick={handleDriveSave}
              disabled={driveState === 'saving' || driveState === 'saved'}
            >
              {driveState === 'saving' ? 'Saving…'
               : driveState === 'saved' ? '✓ Saved'
               : 'Save to Drive'}
            </button>
          )}

          <button style={s.btn(true)} onClick={onRetry}>
            New Session
          </button>
        </div>

        {driveState === 'saved' && (
          <div style={s.note}>
            ✓ saved to "{config.driveFolder || 'Dangerous Writer'}" in Google Drive
            {driveLink && <> — <a href={driveLink} target="_blank" rel="noopener noreferrer" style={{ color:t.timerSafe }}>open</a></>}
          </div>
        )}
        {driveState === 'error' && <div style={s.err}>{driveError}</div>}
      </div>
    </div>
  );
}
