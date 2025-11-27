# Admin onboarding - add admin users to Firestore

This document explains how to add admin users so they can access the admin dashboard.

Recommended: add admins by email in Firestore (quick) or use the included script (bulk).

## Option A — Manual (Firebase Console)
1. Open Firebase Console → Authentication → Users.
2. Ensure each admin has an Authentication account (email/password). If not, click **Add user** and create one.
3. Open Firebase Console → Firestore Database.
4. Create a collection `admins` (if not present).
5. For each admin, click **Add document**:
   - Option 1 (by email): leave Document ID auto-generated and add a field `email` (string) = `admin@example.com`.
   - Option 2 (by UID): set Document ID to the user's UID (from Authentication → Users) and add `email` and optional fields like `role`.
6. Save. The admin should now be allowed through `ProtectedRoute`.

## Option B — Bulk add using script (recommended for 4–10 admins)
1. Generate a Firebase service account JSON:
   - Go to Firebase Console → Project Settings → Service accounts → Generate new private key.
   - Save the file as `service-account.json` in the repo root (DO NOT commit this file).
2. Install `firebase-admin` (only needed locally where you run the script):

```powershell
npm install firebase-admin
```

3. Run the script with a comma-separated list of emails:

```powershell
# From repo root
node scripts/addAdmins.js alice@example.com,bob@example.com,carol@example.com
```

The script will create documents in `admins` with an `email` field and `addedAt` timestamp.

### New behavior: UID-keyed admin docs (preferred)
The script now attempts to resolve each email to its Auth UID and will create a document keyed by UID in `admins`:
- If the user exists in Firebase Authentication, the script writes `admins/{uid}` with fields `{ email, role: 'admin', addedAt }`.
- If the user does not exist in Auth, the script falls back to creating an auto-ID document containing `{ email, addedAt, note: 'created-without-uid' }`.

This UID-keyed approach is safer and avoids email-spoofing; `ProtectedRoute` checks for a UID-keyed doc first and falls back to email matching.

## Quick allowlist (no Firestore write)
For fast access (for example while you are adding 3–4 admins), you can allowlist emails via environment variable. Add this to your `.env`:

```
VITE_ADMIN_EMAILS=alice@example.com,bob@example.com,carol@example.com
```

Any authenticated user whose email matches this list will be treated as admin without a Firestore document. Still add the matching docs in `admins` for long-term security and remove the allowlist when done. You can also enable debugging output with `VITE_SHOW_ADMIN_ERRORS=true` or bypass the admin check entirely in local development with `VITE_BYPASS_ADMIN=true`.

### Interactive mode and automatic Auth user creation
- If you run the script without passing emails, it will prompt you to enter comma-separated emails interactively:

```powershell
node scripts/addAdmins.js
```

- To instruct the script to create Firebase Authentication users for emails that don't exist yet, pass `--create-users` (or `-c`). The script will create an Auth user with a generated temporary password and then create a UID-keyed admin document. Example:

```powershell
node scripts/addAdmins.js alice@example.com,bob@example.com --create-users
```

The script will print temporary passwords for any newly created users — store these securely and share with the new admins so they can login and reset their passwords.

Security note: creating users via the script is powerful and should be done carefully. Do not commit your `service-account.json` and ensure you run the script from a secure machine.

## Troubleshooting
- If admins still cannot access dashboard after adding docs:
  - Confirm the user can authenticate (Authentication → Users). Use the password reset flow if needed.
  - Open browser DevTools Console to view `ProtectedRoute` logs. Look for `Admin status confirmed by email.` or error messages.
  - If Firestore requests fail (network errors), verify your network/VPN/firewall allows `firestore.googleapis.com` on port 443.
  
### Firestore rules (permission-denied)
If you see a `permission-denied` error when the app checks `admins`, your Firestore rules may be blocking reads. For debugging you can allow authenticated reads to the `admins` collection with the following rule (edit in Firebase Console → Firestore → Rules):

```rules
rules_version = '2';
service cloud.firestore {
   match /databases/{database}/documents {
      match /admins/{adminId} {
         // Allow reads for authenticated users (temporary debugging only)
         allow read: if request.auth != null;
      }
   }
}
```

Warning: avoid overly permissive rules in production. Use this only to confirm the problem; then tighten rules and secure admin writes (for example by using UID-keyed docs and server-side creation).

If you prefer, use the included script to create admin documents (auto-id docs with `email` field) which the frontend will match by email.

If you want, I can also:
- Add an option to create docs keyed by UID (if you prefer that stronger mapping).
- Add an interactive prompt to the script to fetch UID from Auth using the Admin SDK and write docs by UID.

