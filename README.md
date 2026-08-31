# My Memory — Cloud Notes, Tasks & Calendar

This is a static PWA that keeps a local cache and can synchronize one JSON database to the signed-in user's OneDrive using Microsoft Graph.

## 1. Microsoft app registration
Create an app registration in Microsoft Entra ID / Microsoft identity platform.
- Supported account types: choose the account types you need (for a personal Microsoft account, use the option that includes personal Microsoft accounts).
- Platform: Single-page application (SPA)
- Redirect URI: your final HTTPS website URL, e.g. `https://YOUR-SITE.example/`
- API permissions: Microsoft Graph delegated `User.Read` and `Files.ReadWrite`.
`Files.ReadWrite` lets the signed-in user app read/create/update/delete the user's files. For a narrower OneDrive personal-account app-folder approach, Microsoft also documents `Files.ReadWrite.AppFolder` (preview).

## 2. Put the client ID in config.js
Replace:
PASTE-YOUR-MICROSOFT-CLIENT-ID-HERE
with your Application (client) ID.

## 3. Host
Upload these files to any HTTPS static host. The redirect URI in the Microsoft app registration must exactly match the deployed URL/path.

## 4. OneDrive
The app stores its cloud data at:
OneDrive / Apps / MyMemory / data.json

The app uses Microsoft Graph. For larger backups, switch to an upload session.

## 5. Security
Do not put a client secret in this browser app. SPA apps use public-client authentication. Only the Application (client) ID belongs in config.js.

## 6. Current sync model
This version uses OneDrive as the cross-device source of truth, with IndexedDB/localStorage-style local caching handled by the browser. It is suitable for a single user's notes/tasks. For simultaneous multi-user editing, conflict resolution, or many users, add a real database/backend.
