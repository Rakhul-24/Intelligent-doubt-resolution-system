import React, { useEffect, useRef, useState } from 'react';

const GOOGLE_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';
const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;

let googleScriptPromise = null;

const loadGoogleScript = () => {
  if (googleScriptPromise) {
    return googleScriptPromise;
  }

  googleScriptPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector(`script[src="${GOOGLE_SCRIPT_SRC}"]`);
    if (existingScript) {
      if (window.google?.accounts?.id) {
        resolve(window.google);
        return;
      }

      existingScript.addEventListener('load', () => resolve(window.google), { once: true });
      existingScript.addEventListener(
        'error',
        () => reject(new Error('Failed to load the Google sign-in script.')),
        { once: true }
      );
      return;
    }

    const script = document.createElement('script');
    script.src = GOOGLE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google);
    script.onerror = () => reject(new Error('Failed to load the Google sign-in script.'));
    document.head.appendChild(script);
  });

  return googleScriptPromise;
};

const GoogleSignInButton = ({
  buttonText = 'signin_with',
  caption = 'Use your Google account for a faster sign-in.',
  disabled = false,
  onCredential,
}) => {
  const buttonRef = useRef(null);
  const onCredentialRef = useRef(onCredential);
  const [error, setError] = useState('');
  const [isWorking, setIsWorking] = useState(false);

  useEffect(() => {
    onCredentialRef.current = onCredential;
  }, [onCredential]);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) {
      setError('Google sign-in is unavailable until REACT_APP_GOOGLE_CLIENT_ID is configured.');
      return undefined;
    }

    let isCancelled = false;

    loadGoogleScript()
      .then(() => {
        if (isCancelled || !buttonRef.current || !window.google?.accounts?.id) {
          return;
        }

        setError('');
        buttonRef.current.innerHTML = '';

        window.google.accounts.id.initialize({
          callback: async (response) => {
            if (!response?.credential || !onCredentialRef.current) {
              return;
            }

            setIsWorking(true);
            try {
              await onCredentialRef.current(response.credential);
            } finally {
              if (!isCancelled) {
                setIsWorking(false);
              }
            }
          },
          client_id: GOOGLE_CLIENT_ID,
        });

        window.google.accounts.id.renderButton(buttonRef.current, {
          logo_alignment: 'left',
          shape: 'pill',
          size: 'large',
          text: buttonText,
          theme: 'outline',
          width: 360,
        });
      })
      .catch((loadError) => {
        if (!isCancelled) {
          setError(loadError.message || 'Google sign-in could not be loaded.');
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [buttonText]);

  return (
    <div style={{ marginTop: '1.5rem' }}>
      <div
        style={{
          alignItems: 'center',
          display: 'flex',
          gap: '0.75rem',
          marginBottom: '1rem',
        }}
      >
        <div style={{ background: 'rgba(255,255,255,0.12)', flex: 1, height: '1px' }} />
        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', letterSpacing: '0.08em' }}>
          OR
        </span>
        <div style={{ background: 'rgba(255,255,255,0.12)', flex: 1, height: '1px' }} />
      </div>

      <div
        style={{
          opacity: disabled || isWorking ? 0.65 : 1,
          pointerEvents: disabled || isWorking ? 'none' : 'auto',
        }}
      >
        <div ref={buttonRef} style={{ display: 'flex', justifyContent: 'center', minHeight: '44px' }} />
      </div>

      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '0.85rem 0 0 0', textAlign: 'center' }}>
        {isWorking ? 'Finishing Google sign-in...' : caption}
      </p>

      {error && (
        <p style={{ color: 'var(--status-danger)', fontSize: '0.85rem', margin: '0.75rem 0 0 0', textAlign: 'center' }}>
          {error}
        </p>
      )}
    </div>
  );
};

export default GoogleSignInButton;
