# ⚡ Quick Fix: Google Button Not Working

## The Problem
You added your Google Client ID to `.env` but the button still doesn't work.

## The Solution (99% of cases)

### **RESTART THE DEV SERVER!**

Vite (the build tool) only reads `.env` files when it starts. If you added or changed the `.env` file while the server was running, it won't see the changes.

### Steps:

1. **Stop the dev server:**
   - Go to the terminal where `npm run dev` is running
   - Press `Ctrl + C` (or `Cmd + C` on Mac)
   - Wait for it to fully stop

2. **Start it again:**
   ```bash
   npm run dev
   ```

3. **Test:**
   - Go to `http://localhost:5173/login`
   - Open browser console (F12)
   - Click the Google button
   - You should see the Google Sign-In popup!

## How to Verify It's Working

After restarting, open the browser console (F12) and you should see:

```
Google OAuth initialized
Google Identity Services loaded successfully
```

When you click the Google button, you should see:

```
handleGoogleSignIn called
Client ID: 510141895643-6hns1t1q0md88f3andvi61sfrubebqh3.apps.googleusercontent.com
Google object: loaded
```

## Still Not Working?

### Check these in order:

1. **Is the `.env` file in the right place?**
   ```
   anime-streaming-ui/
   ├── .env          ← Should be here!
   ├── src/
   ├── package.json
   └── ...
   ```

2. **Is the format correct?**
   ```env
   VITE_GOOGLE_CLIENT_ID=510141895643-6hns1t1q0md88f3andvi61sfrubebqh3.apps.googleusercontent.com
   ```
   - No quotes
   - No spaces around `=`
   - Must start with `VITE_`

3. **Did you add localhost to Google Cloud Console?**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - APIs & Services → Credentials
   - Click your OAuth Client ID
   - Under "Authorized JavaScript origins", add: `http://localhost:5173`
   - Save and wait 5 minutes

4. **Check browser console for errors**
   - Press F12
   - Go to Console tab
   - Look for red error messages

## Test Command

Run this in your browser console to check if the Client ID is loaded:

```javascript
console.log('Client ID:', import.meta.env.VITE_GOOGLE_CLIENT_ID)
```

If it shows `undefined` or `your_google_client_id_here...`, the `.env` file isn't being read.

**Solution:** Restart the dev server!

## Need More Help?

See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for detailed debugging steps.
