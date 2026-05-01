# dangerous-writer

A customized fork of [The Most Dangerous Writing App](https://github.com/maebert/themostdangerouswritingapp) by Manu Ebert.

> Stop typing for 5 seconds. Lose everything.

## What's different in this fork

- **Terminal aesthetic** — JetBrains Mono font, scanline overlay, blinking cursor. Three themes: Dark (green-on-black), Light (paper), Amber.
- **Word count goal** — choose a target word count instead of (or alongside) a time goal. The session auto-completes when you hit it.
- **Google Drive integration** — sign in with Google OAuth2 and save completed drafts directly to a named Drive folder as `.txt` files.

---

## Running locally

```bash
git clone https://github.com/yourusername/dangerous-writer
cd dangerous-writer
npm install
cp .env.example .env
# → edit .env and add your Google Client ID (see below)
npm start
```

## Google Drive setup

The Drive integration uses OAuth2 with the `drive.file` scope — the app can only access files it creates itself.

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project → **APIs & Services** → Enable **Google Drive API**
3. **Credentials** → Create OAuth 2.0 Client ID → Web application
   - Authorized JS origins: `http://localhost:3000` and your deployed URL
4. Copy the Client ID into `.env`:
   ```
   REACT_APP_GOOGLE_CLIENT_ID=your_id.apps.googleusercontent.com
   ```

Full instructions are also in `src/googleDrive.js`.

## Deploying to GitHub Pages

```bash
# 1. Set "homepage" in package.json:
#    "homepage": "https://yourusername.github.io/dangerous-writer"

# 2. Deploy:
npm run deploy
```

## License

GPL-3.0 — same as the original. See [LICENSE](https://github.com/maebert/themostdangerouswritingapp/blob/master/LICENSE.md).

Original app by [Manu Ebert](https://github.com/maebert).
