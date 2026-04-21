import React, { useContext, useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { chatAPI } from '../services/api';
import { AuthContext } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadTotal, setUnreadTotal] = useState(0);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  useEffect(() => {
    if (!user) return;
    
    const fetchUnread = async () => {
      try {
        const res = await chatAPI.getUnreadCounts();
        setUnreadTotal(res.data.total || 0);
      } catch (e) {
        console.error('Failed to fetch unread counts', e);
      }
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 15000); // Poll every 15s
    return () => clearInterval(interval);
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path ? 'active' : '';

  return (
    <div className="floating-nav-wrapper">
      <nav className="floating-nav">
        <Link to="/dashboard" className="nav-brand">
          <div className="nav-brand-icon">SP</div>
          AskDesk
        </Link>
        <div className="nav-links">
          <Link to="/dashboard" className={`nav-link ${isActive('/dashboard')}`}>Dashboard</Link>
          <Link to="/doubts/staff" className={`nav-link ${isActive('/doubts/staff')}`}>Ask Staff</Link>
          <Link to="/doubts/ai" className={`nav-link ${isActive('/doubts/ai')}`}>Ask AI</Link>
          <Link to="/chat" className={`nav-link ${isActive('/chat')}`} style={{position: 'relative'}}>
            Messages
            {unreadTotal > 0 && <span className="nav-unread">{unreadTotal}</span>}
          </Link>
          <Link to="/materials" className={`nav-link ${isActive('/materials')}`}>Resources</Link>
        </div>
        <div className="nav-user">
          <button onClick={toggleTheme} className="theme-toggle-btn" style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', cursor: 'pointer', fontSize: '1.2rem', marginRight: '0.5rem' }}>
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <span style={{fontWeight: 600, color: 'var(--text-main)'}}>{user?.name || 'User'}</span>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </nav>
    </div>
  );
};

export default Navbar;

