// src/components/FailScreen.js
import React, { useEffect, useState } from 'react';

export default function FailScreen({ onRetry }) {
  const [glitch, setGlitch] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setGlitch(g => (g + 1) % 3), 150);
    return () => clearInterval(id);
  }, []);

  const glitchShift = [
    'none',
    '3px 0 0 rgba(0,255,80,0.4), -3px 0 0 rgba(0,80,255,0.4)',
    '-2px 0 0 rgba(255,0,80,0.4), 2px 0 0 rgba(0,255,200,0.4)',
  ][glitch];

  return (
    <div style={{
      height: '100vh', background: '#110000', color: '#ff3333',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', gap: 28, textAlign: 'center', padding: 40,
      fontFamily: "'JetBrains Mono','Courier New',monospace",
      position: 'relative', overflow: 'hidden',
    }}>

      {/* scanlines */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        background: 'repeating-linear-gradient(0deg,rgba(0,0,0,0.18) 0,rgba(0,0,0,0.18) 1px,transparent 1px,transparent 4px)',
      }} />

      <div style={{ position:'relative', zIndex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:20 }}>
        <div style={{ fontSize:11, letterSpacing:'0.2em', color:'rgba(255,50,50,0.4)' }}>
          $ error: inactivity_timeout — session_terminated
        </div>

        <div style={{
          fontSize: 'clamp(44px, 9vw, 88px)', fontWeight: 700,
          letterSpacing: '0.06em', lineHeight: 1.05,
          textShadow: glitchShift, transition: 'text-shadow 0.08s',
        }}>
          YOU<br />STOPPED.
        </div>

        <div style={{ fontSize: 13, color: 'rgba(255,80,80,0.55)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
          all progress has been deleted.
        </div>

        <button
          onClick={onRetry}
          onMouseEnter={e => { e.currentTarget.style.background='#ff3333'; e.currentTarget.style.color='#000'; }}
          onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='#ff3333'; }}
          style={{
            marginTop: 12, padding: '14px 32px', background: 'transparent', color: '#ff3333',
            border: '1px solid #ff3333', cursor: 'pointer',
            fontFamily: "'JetBrains Mono',monospace", fontSize: 12,
            letterSpacing: '0.18em', textTransform: 'uppercase', transition: 'all 0.15s',
          }}
        >
          $ try_again
        </button>
      </div>
    </div>
  );
}
