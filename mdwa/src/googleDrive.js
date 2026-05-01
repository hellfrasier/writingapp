// src/googleDrive.js
//
// ─── GOOGLE DRIVE SETUP (one-time, ~5 min) ────────────────────────────────────
//
// 1. Go to https://console.cloud.google.com/
// 2. Create a project (or reuse one)
// 3. APIs & Services → Enable APIs → search "Google Drive API" → Enable
// 4. APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID
//    • Application type: Web application
//    • Authorized JavaScript origins:
//        http://localhost:3000          (for local dev)
//        https://yourusername.github.io (for production)
//    • Authorized redirect URIs: same as above
// 5. Copy the Client ID
// 6. Create a file called .env in the project root (already in .gitignore):
//
//        REACT_APP_GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
//
// That's it. The app requests only the "drive.file" scope — it can only see
// files it creates itself, never the rest of the user's Drive.
// ──────────────────────────────────────────────────────────────────────────────

const CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || '';
const SCOPE = 'https://www.googleapis.com/auth/drive.file';

let tokenClient = null;
let accessToken = null;

function loadGIS() {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.oauth2) return resolve();
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.onload = resolve;
    s.onerror = () => reject(new Error('Could not load Google Identity Services.'));
    document.body.appendChild(s);
  });
}

export async function signInWithGoogle() {
  if (!CLIENT_ID) {
    throw new Error(
      'REACT_APP_GOOGLE_CLIENT_ID is not set.\n\nCreate a .env file in the project root with:\nREACT_APP_GOOGLE_CLIENT_ID=your_client_id\n\nSee src/googleDrive.js for full instructions.'
    );
  }
  await loadGIS();
  return new Promise((resolve, reject) => {
    if (!tokenClient) {
      tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPE,
        callback: (res) => {
          if (res.error) return reject(new Error(res.error));
          accessToken = res.access_token;
          resolve(accessToken);
        },
      });
    }
    tokenClient.requestAccessToken({ prompt: accessToken ? '' : 'consent' });
  });
}

export function signOutGoogle() {
  if (accessToken && window.google?.accounts?.oauth2) {
    window.google.accounts.oauth2.revoke(accessToken, () => {});
  }
  accessToken = null;
  tokenClient = null;
}

export function isSignedIn() {
  return !!accessToken;
}

export async function uploadToDrive(text, fileName, folderName) {
  if (!accessToken) throw new Error('Not signed in to Google Drive.');

  let folderId = null;
  if (folderName) folderId = await findOrCreateFolder(folderName);

  const metadata = {
    name: fileName,
    mimeType: 'text/plain',
    ...(folderId ? { parents: [folderId] } : {}),
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', new Blob([text], { type: 'text/plain' }));

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink',
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: form,
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Drive upload failed (${res.status})`);
  }

  return res.json(); // { id, webViewLink }
}

async function findOrCreateFolder(name) {
  const q = `mimeType='application/vnd.google-apps.folder' and name='${name}' and trashed=false`;
  const search = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id)`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  const data = await search.json();
  if (data.files?.length > 0) return data.files[0].id;

  const create = await fetch('https://www.googleapis.com/drive/v3/files?fields=id', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, mimeType: 'application/vnd.google-apps.folder' }),
  });
  const folder = await create.json();
  return folder.id;
}
