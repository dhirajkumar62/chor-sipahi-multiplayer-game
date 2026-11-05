import React, { useState } from 'react';

export function InputField({ label, ...props }) { return <label className="field"><span>{label}</span><input {...props}/></label>; }
export function PasswordInput({ label, ...props }) { const [show,setShow]=useState(false); return <label className="field"><span>{label}</span><div className="password-wrap"><input type={show?'text':'password'} {...props}/><button type="button" aria-label={show?'Hide password':'Show password'} aria-pressed={show} onClick={()=>setShow(!show)}>{show?'Hide':'Show'}</button></div></label>; }

export function GoogleAuthButton({ onClick, loading, label = 'Continue with Google' }) {
  return (
    <button type="button" className="google-auth-button" onClick={onClick} disabled={loading}>
      <span className="google-auth-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.09-1.92 3.27-4.75 3.27-8.1z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.65l-3.57-2.77c-.99.66-2.25 1.05-3.71 1.05-2.86 0-5.29-1.93-6.16-4.53H2.15v2.84A11 11 0 0 0 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.1a6.62 6.62 0 0 1 0-4.2V7.06H2.15a11 11 0 0 0 0 9.88l3.69-2.84z"/>
          <path fill="#EA4335" d="M12 5.37c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1a11 11 0 0 0-9.85 6.06l3.69 2.84C6.71 7.3 9.14 5.37 12 5.37z"/>
        </svg>
      </span>
      <span>{loading ? 'Connecting…' : label}</span>
    </button>
  );
}

export default function AuthForm({ title, subtitle, children, error, submitting, submitLabel, onSubmit, footer, googleButton }) {
  return <form className="auth-form" onSubmit={onSubmit}><p className="eyebrow">CHOR-SIPAHI</p><h1>{title}</h1><p className="muted">{subtitle}</p>{error && <p className="error" role="alert">{error}</p>}{googleButton}{googleButton && <div className="auth-divider"><span>OR</span></div>}{children}<button disabled={submitting} className="auth-submit">{submitting ? `${submitLabel}…` : submitLabel}</button>{footer}</form>;
}
