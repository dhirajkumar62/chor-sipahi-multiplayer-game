import React, { useState } from 'react';
import '../styles/landing.css';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthForm, { InputField, PasswordInput, GoogleAuthButton } from '../components/AuthForm';
import { useGoogleIdentity } from '../hooks/useGoogleIdentity';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { login, loginWithGoogle } = useAuth();
  const go = useNavigate();
  const loc = useLocation();

  const handleGoogleCredential = async (credential) => {
    try {
      setGoogleLoading(true);
      setError('');
      await loginWithGoogle(credential);
      go(loc.state?.from || '/dashboard');
    } catch (e) {
      setError(e.response?.data?.message || 'Google sign-in failed. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };
  const promptGoogle = useGoogleIdentity(handleGoogleCredential, (e) => setError(e.message));

  const submit = async e => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await login({ email, password });
      go(loc.state?.from || '/dashboard');
    } catch (e) {
      setError(e.response?.data?.message || 'Invalid email or password');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-page">
      <aside>
        <p className="eyebrow">THE CLASSIC GAME, REIMAGINED</p>
        <h1>
          Trust no one.
          <br />
          <em>Play together.</em>
        </h1>
        <div className="auth-art">
          ♛ <span>⚔</span> ◈
        </div>
      </aside>
      <AuthForm
        title="Welcome back"
        subtitle="Sign in to return to the table."
        error={error}
        submitting={busy}
        submitLabel="Logging in"
        onSubmit={submit}
        googleButton={<GoogleAuthButton onClick={promptGoogle} loading={googleLoading} />}
      >
        <InputField label="Email" type="email" required value={email} onChange={e => setEmail(e.target.value)} />
        <PasswordInput label="Password" required value={password} onChange={e => setPassword(e.target.value)} />
        <p className="muted">
          Don’t have an account? <Link to="/register">Create one</Link>
        </p>
      </AuthForm>
    </div>
  );
}
