# Firebase Hosting — Anti Journal

## Overview

The Anti Journal frontend is hosted on Firebase Hosting. The build output (`dist/`) is deployed to Firebase.

## Firebase Configuration

- Project: `anti-4036b` (`.firebaserc`)
- Hosting public directory: `dist/`
- Domain: `https://theantijournals.web.app`

## firebase.json

```json
{
  "hosting": {
    "public": "dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

## Deployment

1. Build the frontend: `npm run build`
2. Install Firebase CLI: `npm install -g firebase-tools`
3. Login: `firebase login`
4. Deploy: `firebase deploy`

## SPA Routing

The `rewrites` rule directs all routes to `/index.html`, enabling React Router client-side routing.

## Custom Domain

To use a custom domain instead of `web.app`:
1. Add domain in Firebase Hosting console
2. Configure DNS records as instructed
3. Update `FRONTEND_URL` in Edge Function env vars
4. Update Paystack webhook URL if needed
