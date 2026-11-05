import { useCallback, useEffect, useRef, useState } from 'react';

let googleScriptPromise;

function loadGoogleScript() {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (googleScriptPromise) return googleScriptPromise;

  googleScriptPromise = new Promise((resolve, reject) => {
    let script = document.querySelector('script[data-google-identity]');
    if (!script) {
      script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.dataset.googleIdentity = 'true';
      document.head.appendChild(script);
    }

    const onLoad = () => {
      if (window.google?.accounts?.id) resolve();
      else reject(new Error('Google sign-in could not be initialized. Please reload and try again.'));
    };
    const onError = () => reject(new Error('Google sign-in could not be loaded. Check your connection and try again.'));
    script.addEventListener('load', onLoad, { once: true });
    script.addEventListener('error', onError, { once: true });
    // The script may have finished loading before listeners were attached.
    if (window.google?.accounts?.id) resolve();
  }).catch((error) => {
    googleScriptPromise = undefined;
    throw error;
  });

  return googleScriptPromise;
}

export function useGoogleIdentity(onCredential, onError) {
  const credentialHandler = useRef(onCredential);
  const errorHandler = useRef(onError);
  const [ready, setReady] = useState(false);

  useEffect(() => { credentialHandler.current = onCredential; }, [onCredential]);
  useEffect(() => { errorHandler.current = onError; }, [onError]);

  useEffect(() => {
    let active = true;
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim();
    if (!clientId) {
      errorHandler.current?.(new Error('Google sign-in is not configured. Add VITE_GOOGLE_CLIENT_ID to client/.env and restart the client.'));
      return () => { active = false; };
    }

    loadGoogleScript().then(() => {
      if (!active) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => {
          if (!response?.credential) {
            errorHandler.current?.(new Error('Google did not return a sign-in credential. Please try again.'));
            return;
          }
          credentialHandler.current?.(response.credential);
        },
        auto_select: false,
        cancel_on_tap_outside: true,
      });
      setReady(true);
    }).catch((error) => {
      if (active) errorHandler.current?.(error);
    });

    return () => { active = false; };
  }, []);

  const promptGoogle = useCallback(() => {
    if (!ready || !window.google?.accounts?.id) {
      errorHandler.current?.(new Error('Google sign-in is still loading. Please try again in a moment.'));
      return;
    }
    window.google.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed?.() || notification.isSkippedMoment?.()) {
        errorHandler.current?.(new Error('Google sign-in could not open. Check your browser privacy settings or try another sign-in method.'));
      }
    });
  }, [ready]);

  return promptGoogle;
}
