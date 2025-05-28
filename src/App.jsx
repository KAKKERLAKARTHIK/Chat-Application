// src/App.jsx
import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch }     from 'react-redux';
import { skipToken }                     from '@reduxjs/toolkit/query';
import { useGetContactsQuery }           from './pages/components/api/Contact';
import { setCredentials }                from './pages/components/slice/Auth';
import { Routes, Route, Navigate }       from 'react-router-dom';

import NavBar        from './pages/components/navBar/TheHeader';
import ContactsList  from './pages/components/chatWindow/ContactList';
import ChatWindow    from './pages/components/chatWindow/ChatWindow';
import SignupForm    from './pages/components/signUp/userSignUp';
import LoginForm     from './pages/components/signUp/UserLogin';
import ProfileSettings from './pages/components/ProfileSettings.jsx/ProfileSetings.jsx';

export const STORAGE_KEY = 'chat_app_session';

export default function App() {
  const dispatch = useDispatch();
  const user     = useSelector(state => state.auth.user);
  const [activeChatId, setActiveChatId] = useState(null);

  // ← New flag: false until we've loaded localStorage
  const [isInitialized, setIsInitialized] = useState(false);

  // ─── Restore synchronously on first mount ───────────────────────
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const stored = JSON.parse(raw);
        if (stored.user) {
          // 1️⃣ populate Redux immediately
          dispatch(setCredentials(stored.user));
          // 2️⃣ restore active chat
          setActiveChatId(stored.activeChatId ?? null);
        }
      } catch (err) {
        console.error('Invalid session JSON:', err);
      }
    }
    // 3️⃣ now we can render our routes safely
    setIsInitialized(true);
  }, [dispatch]);

  // ─── Fetch contacts via RTK Query ───────────────────────────────
  const { data: contacts = [], isLoading, isError } =
    useGetContactsQuery(user?.id ?? skipToken, { skip: !user });

  // ─── Persist whenever anything changes ───────────────────────────
  useEffect(() => {
    if (user) {
      const payload = { user, contacts, activeChatId };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    }
  }, [user, contacts, activeChatId]);

  // ─── Handlers to pass into Login / Signup ───────────────────────
  const handleLoginSuccess = session => {
    if (!session) return;
    dispatch(setCredentials(session.user));
    setActiveChatId(session.activeChatId ?? null);
  };

  const handleSignupSuccess = session => {
    if (!session) return;
    dispatch(setCredentials(session.user));
    setActiveChatId(session.activeChatId ?? null);
  };

  // ─── Don’t render routes until we’ve initialized from storage ───
  if (!isInitialized) {
    return null; // Or a spinner if you prefer
  }

  // ─── Now render public vs. protected routes ─────────────────────
  return (
    <Routes>
      {/* PUBLIC */}
      <Route
        path="/login"
        element={
          <LoginForm
            onSuccess={handleLoginSuccess}
            setActiveChatId={setActiveChatId}
          />
        }
      />
      <Route
        path="/signup"
        element={<SignupForm onSuccess={handleSignupSuccess} />}
      />
 <Route
      path="/settings"
       element={user?.id ? <ProfileSettings /> : <Navigate to="/login" replace />}
     />
      {/* PROTECTED */}
      <Route
        path="/*"
        element={
          user?.id ? (
            <div className="d-flex flex-column vh-100">
              <NavBar user={user} />

              <div className="d-flex flex-grow-1 overflow-hidden">
                {/* CONTACTS */}
                <aside
                  className="border-end"
                  style={{ width: 300, overflowY: 'auto' }}
                >
                  {isLoading ? (
                    'Loading…'
                  ) : isError ? (
                    'Failed to load contacts'
                  ) : (
                    <ContactsList
                      contacts={contacts}
                      selectedId={activeChatId}
                      onSelect={setActiveChatId}
                    />
                  )}
                </aside>

                {/* CHAT */}
                <main className="d-flex flex-column flex-grow-1 overflow-hidden">
                  {activeChatId != null && (
                    <ChatWindow chatId={activeChatId} />
                  )}
                </main>
              </div>
            </div>
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  );
}
