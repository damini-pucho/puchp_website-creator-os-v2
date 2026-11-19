import React, { createContext, useContext, useState } from 'react';
import mascot1 from '../assets/mascot_1.png';

// Sign-in for the channel-partner workspace.
// NOTE (QA C-02): this is still a browser-only check against one account. Real protection needs a server-side login
// (per-user accounts, argon2id hashes, HttpOnly session cookie) and an authenticated database API — see
// docs/qa-fixes.md. What this file guarantees today:
//   - there is no default signed-in user: protected pages need a session created by login() (QA C-04);
//   - only the account email + password sign in, with one generic error message (QA C-02 partly, C-03);
//   - a session expires after 12 hours, and 5 wrong attempts lock the form for 60 seconds;
//   - sign-out ends the session; the profile (name, agency, avatar) is kept for the next sign-in.

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

const PROFILE_KEY = 'pucho_user_profile';
const PASSWORD_STORAGE_KEY = 'pucho_user_password';
const SESSION_KEY = 'pucho_session';
const LOCK_KEY = 'pucho_login_lock';
export const DEFAULT_EMAIL = 'demo@pucho.ai';
const DEFAULT_PASS = 'demo@2026';
const SESSION_MS = 12 * 60 * 60 * 1000;
const MAX_FAILS = 5;
const LOCK_MS = 60 * 1000;
export const LOGIN_ERROR = 'Email or password is incorrect.';

const DEFAULT_PROFILE = {
  email: DEFAULT_EMAIL,
  name: 'Arjun Khanna',
  agency: 'Pucho Code Suite',
  role: 'Owner',
  avatar: mascot1
};

const read = (key, store = localStorage) => {
  try { const v = store.getItem(key); return v ? JSON.parse(v) : null; } catch { return null; }
};
const write = (key, value) => {
  try { if (value == null) localStorage.removeItem(key); else localStorage.setItem(key, JSON.stringify(value)); } catch { /* private mode */ }
};

function readSession() {
  const s = read(SESSION_KEY);
  if (!s || !s.expiresAt || Date.now() > s.expiresAt) { write(SESSION_KEY, null); return null; }
  return s;
}

export function AuthProvider({ children }) {
  const [storedPassword, setStoredPassword] = useState(() => {
    try {
      const saved = localStorage.getItem(PASSWORD_STORAGE_KEY);
      if (saved) return saved;
    } catch (e) {}
    return DEFAULT_PASS;
  });

  // The profile survives sign-out; the session does not.
  const [profile, setProfile] = useState(() => ({ ...DEFAULT_PROFILE, ...(read(PROFILE_KEY) || {}) }));
  const [session, setSession] = useState(readSession);

  // Signed in only with a live session — never a default user (QA C-04).
  const user = session && Date.now() < session.expiresAt ? profile : null;
  const accountEmail = (profile.email || DEFAULT_EMAIL).trim().toLowerCase();

  const login = async (email, password) => {
    await new Promise((resolve) => setTimeout(resolve, 400));

    const lock = read(LOCK_KEY) || { fails: 0, until: 0 };
    if (lock.until && Date.now() < lock.until) {
      const secs = Math.ceil((lock.until - Date.now()) / 1000);
      return { success: false, message: `Too many attempts. Try again in ${secs} seconds.` };
    }

    const inputEmail = (email || '').trim().toLowerCase();
    const inputPass = (password || '').trim();

    // The demo email always works (the old app saved whatever email was typed into the profile, so a browser may
    // hold another account email); the password must still match.
    const emailOk = inputEmail === accountEmail || inputEmail === DEFAULT_EMAIL;
    if (!emailOk || inputPass !== storedPassword) {
      const fails = (lock.fails || 0) + 1;
      write(LOCK_KEY, fails >= MAX_FAILS ? { fails: 0, until: Date.now() + LOCK_MS } : { fails, until: 0 });
      return { success: false, message: LOGIN_ERROR };   // generic: never echo a secret (QA C-03)
    }

    write(LOCK_KEY, null);
    const next = { email: inputEmail, startedAt: Date.now(), expiresAt: Date.now() + SESSION_MS };
    write(SESSION_KEY, next);
    setSession(next);
    return { success: true };
  };

  const changePassword = (currentPass, newPass) => {
    if ((currentPass || '').trim() !== storedPassword) {
      return { success: false, message: 'Current password does not match.' };
    }
    if (!newPass || newPass.trim().length < 4) {
      return { success: false, message: 'New password must be at least 4 characters long.' };
    }

    const updatedPass = newPass.trim();
    setStoredPassword(updatedPass);
    try {
      localStorage.setItem(PASSWORD_STORAGE_KEY, updatedPass);
    } catch (e) {}

    return { success: true };
  };

  const updateProfile = (profileData) => {
    setProfile((prev) => {
      const updated = { ...(prev || {}), ...profileData };
      write(PROFILE_KEY, updated);
      return updated;
    });
  };

  const logout = () => {
    write(SESSION_KEY, null);
    setSession(null);
    try { sessionStorage.clear(); } catch { /* ignore */ }
  };

  return (
    <AuthContext.Provider value={{ user, accountEmail, storedPassword, login, logout, updateProfile, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
}
