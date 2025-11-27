#!/usr/bin/env node
/**
 * Script: addAdmins.js
 * Adds admin documents to Firestore `admins` collection using Firebase Admin SDK.
 *
 * Usage:
 * 1. Place your Firebase service account JSON at the repo root as `service-account.json` (NOT committed to git).
 * 2. Edit the `admins` array below or pass a comma-separated list as first arg.
 *    Example: node scripts/addAdmins.js alice@example.com,bob@example.com
 * 3. Run: node scripts/addAdmins.js
 *
 * The script will create documents with an `email` field (auto-id). If you prefer documents keyed by UID,
 * modify the script to use `db.collection('admins').doc(uid).set({...})`.
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import fs from 'fs';
import path from 'path';
import readline from 'readline/promises';
import { stdin as input, stdout as output } from 'node:process';

const SERVICE_ACCOUNT_FILE = path.resolve(process.cwd(), 'service-account.json');

if (!fs.existsSync(SERVICE_ACCOUNT_FILE)) {
  console.error(`Missing service account JSON at ${SERVICE_ACCOUNT_FILE}`);
  console.error('Generate one from Firebase Console -> Project Settings -> Service accounts');
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_FILE, 'utf8'));

initializeApp({ credential: cert(serviceAccount) });

const db = getFirestore();
const adminAuth = getAuth();

// Parse args: first non-flag arg is comma-separated emails. Flags: --create-users
const argv = process.argv.slice(2);
const createUsers = argv.includes('--create-users') || argv.includes('-c');
const emailsArg = argv.find((a) => a && !a.startsWith('-')) || '';

async function promptForEmails() {
  const rl = readline.createInterface({ input, output });
  const answer = await rl.question('Enter comma-separated admin emails: ');
  rl.close();
  return answer.split(',').map((s) => s.trim()).filter(Boolean);
}

let admins = [];
if (emailsArg) {
  admins = emailsArg.split(',').map((s) => s.trim()).filter(Boolean);
} else {
  // interactive prompt
  // eslint-disable-next-line no-await-in-loop
  admins = await promptForEmails();
}

if (admins.length === 0) {
  console.log('No admin emails provided. Exiting.');
  process.exit(0);
}

async function addAdmins() {
  for (const email of admins) {
    try {
      // Try to resolve user UID by email and create a UID-keyed admin doc (stronger mapping)
      try {
        const userRecord = await adminAuth.getUserByEmail(email);
        const uid = userRecord.uid;
        const docRef = db.collection('admins').doc(uid);
        await docRef.set({ email, role: 'admin', addedAt: new Date().toISOString() });
        console.log(`Added UID-keyed admin document for ${email} (uid: ${uid})`);
      } catch (lookupErr) {
        // If user not found in Auth, fallback to auto-id doc with email only
        if (lookupErr.code === 'auth/user-not-found' || String(lookupErr).toLowerCase().includes('user-not-found')) {
          if (createUsers) {
            // create auth user with temporary password
            const tempPassword = generateTempPassword();
            try {
              const newUser = await adminAuth.createUser({ email, password: tempPassword });
              const uid = newUser.uid;
              const docRef = db.collection('admins').doc(uid);
              await docRef.set({ email, role: 'admin', addedAt: new Date().toISOString(), note: 'created-with-uid-by-script' });
              console.log(`Created Auth user and UID-keyed admin doc for ${email} (uid: ${uid}). Temporary password: ${tempPassword}`);
            } catch (createErr) {
              console.error(`Failed to create Auth user for ${email}:`, createErr);
              const docRef = db.collection('admins').doc();
              await docRef.set({ email, addedAt: new Date().toISOString(), note: 'created-without-uid' });
              console.log(`Created email-only admin doc for ${email} (fallback).`);
            }
          } else {
            const docRef = db.collection('admins').doc();
            await docRef.set({ email, addedAt: new Date().toISOString(), note: 'created-without-uid' });
            console.log(`User not found in Auth for ${email}; created email-only admin doc.`);
          }
        } else {
          throw lookupErr; // rethrow other errors
        }
      }
    } catch (err) {
      console.error(`Failed to add ${email}:`, err);
    }
  }
  console.log('Finished adding admins.');
}

function generateTempPassword(length = 12) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,./<>?';
  let out = '';
  for (let i = 0; i < length; i++) {
    out += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return out;
}

addAdmins().catch(err => {
  console.error('Error running addAdmins:', err);
  process.exit(1);
});
