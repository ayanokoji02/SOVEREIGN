# Sovereign Cloud Sync — Setup

This adds Google Sign-In + cross-device sync via Firebase. None of this
part could be tested from my side — I have no network access to Google's
servers from this environment. Everything below needs to be done and
verified by you before you trust it with real data.

## 1. Create a Firebase project
1. Go to https://console.firebase.google.com → **Add project**
2. Name it whatever you want (e.g. "sovereign-app"), finish the wizard
   (Google Analytics is optional, skip it — not needed here)

## 2. Enable Google Sign-In
1. In the Firebase console: **Build → Authentication → Get started**
2. Under **Sign-in method**, enable **Google**
3. Set a support email (required), save

## 3. Create Firestore
1. **Build → Firestore Database → Create database**
2. Start in **production mode** (not test mode — the rules below handle
   security properly, you don't need test mode's "open for 30 days" default)
3. Pick a region close to you

## 4. Deploy the security rules
1. In Firestore, go to the **Rules** tab
2. Replace the default rules with everything in `firestore.rules`
   (the file next to this one)
3. Click **Publish**

This step is not optional. Without it, your data isn't actually
isolated per-user — anyone signed in could theoretically read or write
anyone else's document. `firestore.rules` restricts each user to only
their own data, keyed by their Google account's UID.

## 5. Register your web app
1. In Project Overview, click the **</>** (web) icon → register an app
   (nickname doesn't matter)
2. You'll get a config object like:
   ```js
   const firebaseConfig = {
     apiKey: "AIza...",
     authDomain: "sovereign-app-xxxxx.firebaseapp.com",
     projectId: "sovereign-app-xxxxx",
     storageBucket: "sovereign-app-xxxxx.appspot.com",
     messagingSenderId: "...",
     appId: "..."
   };
   ```
3. Open `index.html`, find the `firebaseConfig` object near the bottom
   (search for `YOUR_API_KEY`), and replace the whole placeholder object
   with your real one.

## 6. Add your deployed domain
1. **Authentication → Settings → Authorized domains**
2. Add your actual Vercel domain (e.g. `sovereign.vercel.app`) —
   `localhost` is usually already there by default for local testing

## 7. Deploy and test yourself — checklist
This is the part I genuinely could not verify. Go through all of these
on the real deployed app before trusting it:

- [ ] Sign-in screen appears on first load, "Sign in with Google" works
      and actually redirects to a real Google account picker
- [ ] After signing in fresh (no prior data anywhere), you land in a
      normal empty Prepare screen, no errors in the browser console
- [ ] Log a full session (Prepare → Context → Permission → Trade →
      Reflect → Complete). Check Firebase Console → Firestore → your
      `users/{your-uid}` document — the session should appear there
      within a few seconds of completing
- [ ] Close the tab, reopen the URL — you should stay signed in and see
      your data (Firebase persists the session automatically)
- [ ] Sign in with the *same* Google account on a second device/browser
      — your history should appear there too
- [ ] On a device that already has local test data, sign in with a
      *different* Google account than before — you should see the
      "Import existing data?" prompt. Test both Import and Start Fresh
- [ ] Turn on airplane mode mid-session, complete a session — it should
      still save locally and show "will sync when back online" in
      Self → Account. Reconnect and confirm it syncs
- [ ] Try opening the site in a browser where you're NOT signed into
      any Google account at all, confirm the sign-in flow still works

If anything in that checklist doesn't hold up, that's a real bug in
this integration — tell me what broke and I'll fix the specific piece,
now that there's an actual live environment to reason about instead of
a mock.

## What was tested vs. not, honestly
I built and verified the sign-in gating, hydration, migration prompt,
debounced writes, and offline-queue/recovery logic against a mock
Firebase SDK that mimics the real one's behavior — including surviving
a real page reload, the way Firebase Auth's session persistence does.
That gives real confidence the *app's own logic* is correct. What I
could not test at all: actual Google OAuth, actual Firestore reads/
writes, actual security rule enforcement, or anything specific to your
real Firebase project. That part is genuinely on you, per the checklist
above.
