import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import GoogleSignInButton from '../components/GoogleSignInButton';

const StaffRegister = () => {
  const { register, loginWithGoogle } = useContext(AuthContext);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    subject: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register({ ...formData, role: 'staff' });
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
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
        mode: 'register',
        name: formData.name,
        role: 'staff',
        subject: formData.subject,
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
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div className="island-card" style={{ width: '100%', maxWidth: '500px', padding: '3rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <span className="nav-unread" style={{ background: 'var(--accent-light)', color: 'var(--accent-primary)', padding: '4px 12px', display: 'inline-block', marginBottom: '1rem' }}>Create Account</span>
            <h2 className="island-title" style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>GuideDesk Registration</h2>
            <p className="island-desc">Create your staff profile to manage sessions, materials, and student support.</p>
          </div>

          {error && (
            <div style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid var(--status-danger)', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between' }}>
              <span>{error}</span>
              <button onClick={() => setError('')} style={{ color: 'inherit', border: 'none', background: 'transparent', cursor: 'pointer' }}>x</button>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1.5rem' }}>
              <label htmlFor="name" style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>
                Full Name
              </label>
              <input
                type="text"
                className="form-input"
                style={{ width: '100%' }}
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Your full name"
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label htmlFor="email" style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>
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
              <label htmlFor="subject" style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>
                Subject Specialty
              </label>
              <input
                type="text"
                className="form-input"
                style={{ width: '100%' }}
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                required
                placeholder="e.g., Mathematics, Physics"
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label htmlFor="password" style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>
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
                placeholder="At least 6 characters"
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label htmlFor="confirmPassword" style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>
                Confirm Password
              </label>
              <input
                type="password"
                className="form-input"
                style={{ width: '100%' }}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                placeholder="Confirm your password"
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.75rem' }}
              disabled={loading}
            >
              {loading ? 'Registering...' : 'Register'}
            </button>
          </form>

          <GoogleSignInButton
            buttonText="signup_with"
            caption="Google registration will use the subject specialty entered above."
            disabled={loading}
            onCredential={handleGoogleSignIn}
          />

          <div style={{ textAlign: 'center', marginTop: '2rem' }}>
            <p style={{ color: 'var(--text-muted)', margin: 0 }}>
              Already have an account?{' '}
              <a href="/login" style={{ color: 'var(--accent-primary)', fontWeight: 'bold', textDecoration: 'none' }}>
                Login here
              </a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default StaffRegister;
