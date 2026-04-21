import React, { useState, useEffect, useRef } from 'react';
import { slotAPI, SOCKET_URL } from '../services/api';
import io from 'socket.io-client';

const SlotBookingPage = () => {
  const [slots, setSlots] = useState([]);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [view, setView] = useState('available');
  const [successMessage, setSuccessMessage] = useState('');
  const socketRef = useRef(null);

  useEffect(() => {
    fetchSlots();
  }, []);

  useEffect(() => {
    socketRef.current = io(SOCKET_URL, {
      auth: {
        token: sessionStorage.getItem('token') || localStorage.getItem('token'),
      },
    });

    socketRef.current.on('slot_updated', () => {
      fetchSlots();
    });

    return () => {
      socketRef.current.off('slot_updated');
      socketRef.current.disconnect();
    };
  }, []);

  const fetchSlots = async () => {
    setLoading(true);
    setError('');
    try {
      const [availableRes, bookedRes] = await Promise.all([
        slotAPI.getAvailableSlots(),
        slotAPI.getMySlots(),
      ]);
      setSlots(availableRes.data.slots || []);
      setBookedSlots(bookedRes.data.slots || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch slots');
    } finally {
      setLoading(false);
    }
  };

  const handleBookSlot = async (slotId) => {
    try {
      await slotAPI.bookSlot({ slotId });
      setSuccessMessage('Session booked successfully.');
      setTimeout(() => setSuccessMessage(''), 3000);
      fetchSlots();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to book slot');
    }
  };

  const handleCancelBooking = async (slotId) => {
    try {
      await slotAPI.cancelBooking(slotId);
      setSuccessMessage('Booking cancelled successfully.');
      setTimeout(() => setSuccessMessage(''), 3000);
      fetchSlots();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to cancel booking');
    }
  };

  const formatDateTime = (date, time) => {
    try {
      return `${new Date(date).toLocaleDateString()} at ${time}`;
    } catch {
      return `${date} at ${time}`;
    }
  };

  const isSlotExpired = (dateStr, timeStr, durationMinutes) => {
    if (!dateStr || !timeStr) return false;
    try {
      const slotStart = new Date(`${dateStr.split('T')[0]}T${timeStr}`);
      if (isNaN(slotStart.getTime())) return false;

      return new Date() > slotStart;
    } catch {
      return false;
    }
  };

  const currentSlots = view === 'available' ? slots : bookedSlots;

  return (
    <>
      <div className="animated-bg">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
      </div>
      <div className="page-content">
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', gap: '1rem' }}>
          <div>
            <h1 className="dashboard-title">Slot Booking</h1>
            <p className="dashboard-subtitle">Reserve sessions and manage your scheduled bookings seamlessly.</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <span style={{ background: 'rgba(34, 197, 94, 0.2)', color: 'var(--status-success)', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.85rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--status-success)' }}></span> {slots.length} Open
            </span>
            <span style={{ background: 'var(--accent-light)', color: 'var(--accent-primary)', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.85rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-primary)' }}></span> {bookedSlots.length} Booked
            </span>
          </div>
        </div>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid var(--status-danger)', padding: '1rem', borderRadius: '12px', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}>
            <span>{error}</span>
            <button onClick={() => setError('')} style={{ color: 'inherit' }}>x</button>
          </div>
        )}

        {successMessage && (
          <div style={{ background: 'rgba(34, 197, 94, 0.2)', border: '1px solid var(--status-success)', padding: '1rem', borderRadius: '12px', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}>
            <span>{successMessage}</span>
            <button onClick={() => setSuccessMessage('')} style={{ color: 'inherit' }}>x</button>
          </div>
        )}

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
          <button
            style={{
              padding: '0.5rem 1.5rem',
              borderRadius: '999px',
              border: 'none',
              fontWeight: 'bold',
              background: view === 'available' ? 'var(--accent-primary)' : 'var(--bg-surface-solid)',
              color: view === 'available' ? 'var(--text-main)' : 'var(--text-muted)',
              cursor: 'pointer'
            }}
            onClick={() => setView('available')}
          >
            Available Slots
          </button>
          <button
            style={{
              padding: '0.5rem 1.5rem',
              borderRadius: '999px',
              border: 'none',
              fontWeight: 'bold',
              background: view === 'booked' ? 'var(--accent-primary)' : 'var(--bg-surface-solid)',
              color: view === 'booked' ? 'var(--text-main)' : 'var(--text-muted)',
              cursor: 'pointer'
            }}
            onClick={() => setView('booked')}
          >
            My Bookings
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <span>Loading...</span>
          </div>
        ) : currentSlots.length === 0 ? (
          <div className="island-card" style={{ padding: '3rem', textAlign: 'center' }}>
            <div style={{ marginBottom: '1rem', opacity: 0.5, color: 'var(--text-muted)' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
            </div>
            <h3 style={{ marginBottom: '0.5rem' }}>No sessions found</h3>
            <p style={{ color: 'var(--text-muted)' }}>
              {view === 'available'
                ? 'Check back later as staff update their schedules.'
                : "You don't have any upcoming bookings right now."}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {currentSlots.map((slot) => (
              <div key={slot._id} className="island-card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '1.5rem' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.2rem' }}>
                  {slot.staffId?.name ? slot.staffId.name.charAt(0).toUpperCase() : 'S'}
                </div>
                
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{slot.staffId?.name || 'Staff Member'}</h3>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{slot.staffId?.subject || 'Subject'}</span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {formatDateTime(slot.date, slot.time)} • {slot.duration}m
                    {slot.topic && ` • ${slot.topic}`}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  {isSlotExpired(slot.date, slot.time, slot.duration) ? (
                    <button style={{ padding: '0.5rem 1.5rem', borderRadius: '999px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', border: 'none', cursor: 'not-allowed' }} disabled>
                      Expired
                    </button>
                  ) : view === 'available' ? (
                    <button className="btn btn-primary" style={{ padding: '0.5rem 1.5rem', borderRadius: '999px' }} onClick={() => handleBookSlot(slot._id)}>
                      Book
                    </button>
                  ) : (
                    <button style={{ padding: '0.5rem 1.5rem', borderRadius: '999px', background: 'rgba(239, 68, 68, 0.2)', color: 'var(--status-danger)', border: '1px solid var(--status-danger)', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => handleCancelBooking(slot._id)}>
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default SlotBookingPage;

