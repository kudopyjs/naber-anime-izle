# 🚨 URGENT FIX: "The given origin is not allowed"

## Your Error
```
[GSI_LOGGER]: The given origin is not allowed for the given client ID.
```

## What This Means
Your Google OAuth Client ID exists and is configured correctly, BUT `http://localhost:5173` is not authorized to use it.

## The Fix (Step-by-Step)

### 1. Go to Google Cloud Console
👉 **[Click here to open Google Cloud Console](https://console.cloud.google.com/apis/credentials)**

### 2. Find Your OAuth Client ID
- Look for: `510141895643-6hns1t1q0md88f3andvi61sfrubebqh3.apps.googleusercontent.com`
- Click on the **name** (not the Client ID itself)

### 3. Add Authorized JavaScript Origin
In the "Authorized JavaScript origins" section:

1. **Click the "ADD URI" button**
2. **Type exactly:** `http://localhost:5173`
   - ⚠️ Must be `http://` (not `https://`)
   - ⚠️ No trailing slash
   - ⚠️ Port number must be `5173`
3. **Press Enter** or click outside the text field
4. **Click the "SAVE" button at the bottom of the page**

### 4. Wait for Propagation
- Google needs **5-10 minutes** to update their servers
- During this time, you'll still see the error
- ☕ Take a coffee break!

### 5. Test Again
After 10 minutes:
1. **Refresh your browser** (or clear cache: Ctrl+Shift+R)
2. Go to `http://localhost:5173/login`
3. Click the Google button
4. It should work now! 🎉

## Visual Guide

Your "Authorized JavaScript origins" should look like this:

```
Authorized JavaScript origins
┌─────────────────────────────────────┐
│ http://localhost:5173               │  ← Add this
└─────────────────────────────────────┘
     [ADD URI]

Authorized redirect URIs
┌─────────────────────────────────────┐
│ (empty - not needed)                │
└─────────────────────────────────────┘
```

## Common Mistakes

❌ **WRONG:**
- `https://localhost:5173` (https instead of http)
- `http://localhost:5173/` (trailing slash)
- `http://localhost` (missing port)
- `localhost:5173` (missing http://)

✅ **CORRECT:**
- `http://localhost:5173`

## Still Not Working After 10 Minutes?

### Double-check these:

1. **Did you click SAVE?**
   - There's a SAVE button at the bottom of the page
   - The URI won't be saved without clicking it

2. **Is the URI exactly right?**
   - Copy this: `http://localhost:5173`
   - Paste it exactly as-is

3. **Are you editing the correct Client ID?**
   - Make sure it's: `510141895643-6hns1t1q0md88f3andvi61sfrubebqh3.apps.googleusercontent.com`

4. **Clear browser cache:**
   - Press `Ctrl + Shift + R` (Windows/Linux)
   - Or `Cmd + Shift + R` (Mac)

## Quick Test

After waiting 10 minutes, run this in browser console:

```javascript
// This should NOT show the origin error anymore
google.accounts.id.initialize({
  client_id: '510141895643-6hns1t1q0md88f3andvi61sfrubebqh3.apps.googleusercontent.com'
})
```

If you still see errors, wait another 5 minutes. Google's propagation can sometimes take up to 15 minutes.

## Screenshot Reference

When you click on your OAuth Client ID, you should see a page like this:

```
OAuth 2.0 Client ID
─────────────────────────────────────────────────
Name: Anime Streaming Web Client

Client ID: 510141895643-6hns1t1q0md88f3andvi61sfrubebqh3.apps.googleusercontent.com

Client Secret: [hidden]

Authorized JavaScript origins
  http://localhost:5173                    [×]
  [ADD URI]

Authorized redirect URIs
  [ADD URI]

                                    [SAVE] [CANCEL]
```

Make sure to click **[SAVE]** at the bottom!

## Need Help?

If it's still not working after following all steps:
1. Take a screenshot of your OAuth Client ID configuration page
2. Check if there are any typos in the origin URL
3. Try creating a new OAuth Client ID and repeat the process
