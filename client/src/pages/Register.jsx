import React, { useState } from 'react';
import '../styles/landing.css';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthForm, { InputField, PasswordInput, GoogleAuthButton } from '../components/AuthForm';
import { useGoogleIdentity } from '../hooks/useGoogleIdentity';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { register, loginWithGoogle } = useAuth();
  const go = useNavigate();

  const handleGoogleCredential = async (credential) => {
    try {
      setGoogleLoading(true);
      setError('');
      await loginWithGoogle(credential);
      go('/dashboard');
    } catch (e) {
      setError(e.response?.data?.message || 'Google sign-up failed. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };
  const promptGoogle = useGoogleIdentity(handleGoogleCredential, (e) => setError(e.message));

  const submit = async e => {
    e.preventDefault();
    if (password.length < 8) return setError('Password must contain at least 8 characters');
    if (password !== confirm) return setError('Passwords do not match');
    setBusy(true);
    setError('');
    try {
      await register({ name, email, password });
      go('/dashboard');
    } catch (e) {
      setError(e.response?.data?.message || 'Unable to create account');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-page">
      <aside>
        <p className="eyebrow">YOUR SEAT AT THE TABLE</p>
        <h1>
          Begin your
          <br />
          <em>legend.</em>
        </h1>
        <div className="auth-art">
          ◈ <span>♛</span> ⚔
        </div>
      </aside>
      <AuthForm
        title="Create account"
        subtitle="Join friends for a round of strategy and suspense."
        error={error}
        submitting={busy}
        submitLabel="Creating account"
        onSubmit={submit}
        googleButton={<GoogleAuthButton onClick={promptGoogle} loading={googleLoading} />}
      >
        <InputField label="Full name" required value={name} onChange={e => setName(e.target.value)} />
        <InputField label="Email" type="email" required value={email} onChange={e => setEmail(e.target.value)} />
        <PasswordInput
          label="Password (minimum 8 characters)"
          minLength="8"
          required
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        <PasswordInput
          label="Confirm password"
          required
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
        />
        <p className="muted">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </AuthForm>
    </div>
  );
}
