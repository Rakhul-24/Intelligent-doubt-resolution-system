import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import GoogleSignInButton from '../components/GoogleSignInButton';

const StudentLogin = () => {
  const { login, loginWithGoogle } = useContext(AuthContext);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login({ ...formData, role: 'student' });
      navigate('/dashboard');
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async (credential) => {
    setError('');
    setLoading(true);

    try {
      await loginWithGoogle({
        credential,
        mode: 'login',
        role: 'student',
      });
      navigate('/dashboard');
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="animated-bg">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
      </div>
      <div
        style={{
          display: 'flex',
          minHeight: '100vh',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
        }}
      >
        <div className="island-card" style={{ width: '100%', maxWidth: '500px', padding: '3rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <span
              className="nav-unread"
              style={{
                background: 'var(--accent-light)',
                color: 'var(--accent-primary)',
                padding: '4px 12px',
                display: 'inline-block',
                marginBottom: '1rem',
              }}
            >
              AskDesk
            </span>
            <h2 className="island-title" style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>
              AskDesk Login
            </h2>
            <p className="island-desc">
              Sign in with your email and password to access your dashboard.
            </p>
          </div>

          {error && (
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid var(--status-danger)',
                padding: '1rem',
                borderRadius: '12px',
                marginBottom: '1.5rem',
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <span>{error}</span>
              <button
                onClick={() => setError('')}
                style={{ color: 'inherit', border: 'none', background: 'transparent', cursor: 'pointer' }}
              >
                x
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1.5rem' }}>
              <label
                htmlFor="email"
                style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontWeight: 'bold' }}
              >
                Email Address
              </label>
              <input
                type="email"
                className="form-input"
                style={{ width: '100%' }}
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="your@email.com"
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label
                htmlFor="password"
                style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontWeight: 'bold' }}
              >
                Password
              </label>
              <input
                type="password"
                className="form-input"
                style={{ width: '100%' }}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.75rem' }}
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Login'}
            </button>
          </form>

          <GoogleSignInButton
            buttonText="signin_with"
            caption="Use the same student account email you registered with."
            disabled={loading}
            onCredential={handleGoogleSignIn}
          />

          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <p style={{ color: 'var(--text-muted)', margin: 0 }}>
              Don&apos;t have an account?{' '}
              <Link to="/register" style={{ color: 'var(--accent-primary)', fontWeight: 'bold', textDecoration: 'none' }}>
                Register here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default StudentLogin;
