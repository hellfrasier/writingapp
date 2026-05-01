// src/App.js
import React, { useState } from 'react';
import SetupScreen from './components/SetupScreen';
import WritingScreen from './components/WritingScreen';
import DoneScreen from './components/DoneScreen';
import FailScreen from './components/FailScreen';

const DEFAULT_CONFIG = {
  goalType: 'time',       // 'time' | 'words'
  goalAmount: 5,          // minutes or word count
  theme: 'dark',          // 'dark' | 'light' | 'amber'
  driveConnected: false,
  driveFolder: 'Dangerous Writer',
};

export default function App() {
  const [screen, setScreen] = useState('setup');
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [result, setResult] = useState(null);

  return (
    <>
      {screen === 'setup' && (
        <SetupScreen
          config={config}
          setConfig={setConfig}
          onStart={() => setScreen('writing')}
        />
      )}

      {screen === 'writing' && (
        <WritingScreen
          config={config}
          onFinish={(res) => { setResult(res); setScreen('done'); }}
          onFail={() => setScreen('fail')}
        />
      )}

      {screen === 'done' && (
        <DoneScreen
          config={config}
          result={result}
          onRetry={() => { setResult(null); setScreen('setup'); }}
        />
      )}

      {screen === 'fail' && (
        <FailScreen
          config={config}
          onRetry={() => setScreen('setup')}
        />
      )}
    </>
  );
}
