# iSpace Web
Static site for GitHub Pages. Each person signs in with their own Telegram account in their own browser.
Files: index.html, styles.css, app.js, config.js (your API ID and Hash), tg-bridge.js, sw.js, manifest.webmanifest, privacy.html, icons/, src/entry.js, package.json, .github/workflows/build.yml, dist/tg-lib.js (built by GitHub Actions).
Order: 1) upload everything 2) edit config.js 3) Settings > Pages 4) run the Build action 5) open the site and test sign-in.

## What's new (iSpace v2)
- Delete moves a file to **Deleted** (still in Telegram). Deleting from Deleted asks "Cannot recover" and only then removes it from the channel. Deleted/cancelled files are remembered, so Auto-Sync never re-uploads them. Picking a file by hand brings it back.
- Dashboard: Photos, Videos, Audio, Drive, Transfers, Auto-Sync, Deleted (+ your own folders). Settings now lives in More.
- "+" = New folder (name + type: Photos / Videos / Audio / Documents, optional password with show/hide eye) or Upload. Folders only accept their own type.
- Transfers: pause / resume / cancel per file. Files over 10 MB upload in 512 KB parts and continue from the last saved part after an internet drop. Max 1.9 GB per file.
- More > Stored Folder Passwords: protected by a Google Authenticator (any TOTP app) code.
- Greeting follows the device clock (morning / afternoon / evening / night) with a wish and a quote.
- Service worker cache is now ispace-v13. Re-upload all files; no rebuild of dist/tg-lib.js is needed.
