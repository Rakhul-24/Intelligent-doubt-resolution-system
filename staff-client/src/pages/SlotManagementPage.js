import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import { doubtAPI, slotAPI, SOCKET_URL } from '../services/api';

const getStudentPortalBaseUrl = () =>
  (process.env.REACT_APP_STUDENT_PORTAL_URL || 'http://localhost:3000').replace(/\/+$/, '');

const buildStudentJoinLink = (shareableLink) =>
  `${getStudentPortalBaseUrl()}/doubts/staff?tab=join&linkId=${encodeURIComponent(shareableLink)}`;

const formatDateForInput = (value) => value.toISOString().split('T')[0];
const formatTimeForInput = (value) => value.toTimeString().slice(0, 5);

const getNextScheduleDefaults = () => {
  const nextDate = new Date();
  nextDate.setSeconds(0, 0);
  nextDate.setMinutes(nextDate.getMinutes() + 15);

  const remainder = nextDate.getMinutes() % 15;
  if (remainder !== 0) {
    nextDate.setMinutes(nextDate.getMinutes() + (15 - remainder));
  }

  return {
    date: formatDateForInput(nextDate),
    time: formatTimeForInput(nextDate),
  };
};

const getMinTimeForDate = (selectedDate) => {
  const nextSchedule = getNextScheduleDefaults();
  return selectedDate === nextSchedule.date ? nextSchedule.time : undefined;
};

const createOnlineForm = (doubt) => ({
  ...getNextScheduleDefaults(),
  duration: 30,
  notes: '',
  topic: doubt?.subject || '',
});

const createOfflineForm = () => ({
  ...getNextScheduleDefaults(),
  notes: '',
  place: '',
});

const formatDateTime = (date, time) => {
  try {
    return `${new Date(date).toLocaleDateString()} at ${time}`;
  } catch {
    return `${date} at ${time}`;
  }
};

const getSlotEndDateTime = (date, time, duration = 30) => {
  if (!date || !time) return null;
  const normalizedTime = time.length === 5 ? `${time}:00` : time;
  const slotDateTime = new Date(`${date}T${normalizedTime}`);
  if (Number.isNaN(slotDateTime.getTime())) return null;
  return new Date(slotDateTime.getTime() + (Number(duration) || 30) * 60 * 1000);
};

const isSlotCompleted = (date, time, duration = 30) => {
  const slotEndDateTime = getSlotEndDateTime(date, time, duration);
  return Boolean(slotEndDateTime) && slotEndDateTime <= new Date();
};

const getDisplayedSlotStatus = (slot) => {
  if (!slot) return 'Scheduled';
  return isSlotCompleted(slot.date, slot.time, slot.duration)
    ? 'Completed'
    : slot.status || 'Scheduled';
};

const getDisplayedDoubtStatus = (doubt) => {
  if (doubt?.assignedSlotId && getDisplayedSlotStatus(doubt.assignedSlotId) === 'Completed') {
    return 'Completed';
  }

  return doubt?.status || 'Open';
};

const getStatusStyle = (status) => {
  if (status === 'Completed') {
    return {
      background: 'rgba(15, 23, 42, 0.12)',
      color: 'var(--text-main)',
    };
  }

  if (status === 'Resolved') {
    return {
      background: 'rgba(16, 185, 129, 0.2)',
      color: 'var(--status-success)',
    };
  }

  if (status === 'Offline Scheduled') {
    return {
      background: 'rgba(245, 158, 11, 0.2)',
      color: 'var(--status-warning)',
    };
  }

  if (status === 'Online Scheduled') {
    return {
      background: 'rgba(5, 150, 105, 0.16)',
      color: 'var(--accent-primary)',
    };
  }

  return {
    background: 'rgba(0, 0, 0, 0.05)',
    color: 'var(--text-main)',
  };
};

const modalOverlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: 'rgba(0, 0, 0, 0.8)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1000,
  padding: '1rem',
};

const modalInputStyle = {
  width: '100%',
  padding: '0.75rem',
  borderRadius: '8px',
  background: 'var(--bg-primary)',
  border: '1px solid rgba(255,255,255,0.1)',
  color: 'inherit',
};

const ModalShell = ({ children, title, subtitle }) => (
  <div style={modalOverlayStyle}>
    <div className="island-card" style={{ width: '100%', maxWidth: '560px', padding: '2rem' }}>
      <h2 style={{ marginBottom: '1rem', fontSize: '1.5rem' }}>{title}</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>{subtitle}</p>
      {children}
    </div>
  </div>
);

const SlotManagementPage = () => {
  const navigate = useNavigate();
  const socketRef = useRef(null);

  const [doubts, setDoubts] = useState([]);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [view, setView] = useState('doubts');
  const [modalType, setModalType] = useState('');
  const [activeDoubt, setActiveDoubt] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [onlineForm, setOnlineForm] = useState(createOnlineForm());
  const [offlineForm, setOfflineForm] = useState(createOfflineForm());

  const fetchData = async () => {
    setLoading(true);
    setError('');

    try {
      const [doubtsRes, slotsRes] = await Promise.all([
        doubtAPI.getStaffDoubts(),
        slotAPI.getMySlots(),
      ]);

      setDoubts(doubtsRes.data.doubts || []);
      setSlots(slotsRes.data.slots || []);
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    socketRef.current = io(SOCKET_URL, {
      auth: { token: sessionStorage.getItem('token') || localStorage.getItem('token') },
    });

    socketRef.current.on('doubt_updated', fetchData);
    socketRef.current.on('slot_updated', fetchData);

    return () => {
      socketRef.current?.off('doubt_updated', fetchData);
      socketRef.current?.off('slot_updated', fetchData);
      socketRef.current?.disconnect();
    };
  }, []);

  const showSuccess = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const closeModal = () => {
    setModalType('');
    setActiveDoubt(null);
    setReplyText('');
    setOnlineForm(createOnlineForm());
    setOfflineForm(createOfflineForm());
  };

  const openReplyModal = (doubt) => {
    setActiveDoubt(doubt);
    setReplyText(doubt.reply || '');
    setModalType('reply');
  };

  const openOnlineModal = (doubt) => {
    setActiveDoubt(doubt);
    setOnlineForm(createOnlineForm(doubt));
    setModalType('online');
  };

  const openOfflineModal = (doubt) => {
    setActiveDoubt(doubt);
    setOfflineForm(createOfflineForm());
    setModalType('offline');
  };

  const handleCreateSlot = async (event) => {
    event.preventDefault();

    try {
      await slotAPI.createSlotForDoubt({
        doubtId: activeDoubt._id,
        ...onlineForm,
        topic: onlineForm.topic.trim(),
        notes: onlineForm.notes.trim(),
      });

      closeModal();
      showSuccess('Online meeting created and shared successfully.');
      fetchData();
    } catch (requestError) {
      setError(
        requestError.response?.data?.error || 'Failed to schedule the online meeting'
      );
    }
  };

  const handleResolveDoubt = async (event) => {
    event.preventDefault();

    try {
      await doubtAPI.updateDoubtStatus(activeDoubt._id, {
        reply: replyText.trim(),
        resolutionType: 'reply',
        status: 'Resolved',
      });

      closeModal();
      showSuccess('Reply sent and doubt marked as resolved.');
      fetchData();
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Failed to resolve doubt');
    }
  };

  const handleScheduleOffline = async (event) => {
    event.preventDefault();

    try {
      await doubtAPI.updateDoubtStatus(activeDoubt._id, {
        resolutionType: 'offline',
        status: 'Offline Scheduled',
        offlineSchedule: {
          date: offlineForm.date,
          notes: offlineForm.notes.trim(),
          place: offlineForm.place.trim(),
          time: offlineForm.time,
        },
      });

      closeModal();
      showSuccess('Offline session scheduled successfully.');
      fetchData();
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Failed to schedule the offline session');
    }
  };

  const handleDeleteSlot = async (slotId) => {
    try {
      await slotAPI.deleteSlot(slotId);
      showSuccess('Online meeting deleted successfully.');
      fetchData();
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Failed to delete the online meeting');
    }
  };

  const handleCopyInviteLink = async (shareableLink) => {
    const inviteLink = buildStudentJoinLink(shareableLink);

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(inviteLink);
        showSuccess('Student invite link copied successfully.');
        return;
      }
    } catch (requestError) {
      console.error('Copy invite link failed', requestError);
    }

    setError('Could not copy the invite link automatically.');
  };

  const activeDoubts = doubts.filter((doubt) => doubt.status === 'Open');
  const handledDoubts = doubts.filter((doubt) => doubt.status !== 'Open');
  const nextSchedule = getNextScheduleDefaults();

  return (
    <>
      <div className="animated-bg">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
      </div>

      <div className="page-content">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '2rem',
            gap: '1rem',
          }}
        >
          <div>
            <h1 className="dashboard-title">Doubts, Offline & Online Support</h1>
            <p className="dashboard-subtitle">
              Reply to student doubts directly, schedule an offline visit with place and time, or
              create an online meeting room.
            </p>
          </div>
        </div>

        {error && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid var(--status-danger)',
              padding: '1rem',
              borderRadius: '12px',
              marginBottom: '1rem',
              display: 'flex',
              justifyContent: 'space-between',
              gap: '1rem',
            }}
          >
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setError('')}
              style={{ color: 'inherit', background: 'transparent', border: 'none' }}
            >
              x
            </button>
          </div>
        )}

        {successMessage && (
          <div
            style={{
              background: 'rgba(34, 197, 94, 0.2)',
              border: '1px solid var(--status-success)',
              padding: '1rem',
              borderRadius: '12px',
              marginBottom: '1rem',
              display: 'flex',
              justifyContent: 'space-between',
              gap: '1rem',
            }}
          >
            <span>{successMessage}</span>
            <button
              type="button"
              onClick={() => setSuccessMessage('')}
              style={{ color: 'inherit', background: 'transparent', border: 'none' }}
            >
              x
            </button>
          </div>
        )}

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            style={{
              padding: '0.5rem 1.5rem',
              borderRadius: '999px',
              border: 'none',
              fontWeight: 'bold',
              background: view === 'doubts' ? 'var(--accent-primary)' : 'var(--bg-surface-solid)',
              color: view === 'doubts' ? '#fff' : 'var(--text-muted)',
            }}
            onClick={() => setView('doubts')}
          >
            Student Doubts ({activeDoubts.length})
          </button>
          <button
            type="button"
            style={{
              padding: '0.5rem 1.5rem',
              borderRadius: '999px',
              border: 'none',
              fontWeight: 'bold',
              background: view === 'slots' ? 'var(--accent-primary)' : 'var(--bg-surface-solid)',
              color: view === 'slots' ? '#fff' : 'var(--text-muted)',
            }}
            onClick={() => setView('slots')}
          >
            Online Meetings ({slots.length})
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            Loading...
          </div>
        ) : (
          <>
            {view === 'doubts' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <h2 style={{ fontSize: '1.25rem' }}>Active Doubts</h2>

                {activeDoubts.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)' }}>No pending doubts right now.</p>
                ) : (
                  activeDoubts.map((doubt) => (
                    <div key={doubt._id} className="island-card" style={{ padding: '1.5rem' }}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          marginBottom: '1rem',
                          gap: '1rem',
                          flexWrap: 'wrap',
                        }}
                      >
                        <div>
                          <strong>{doubt.studentId?.name || 'Student'}</strong> asked about{' '}
                          <strong>{doubt.subject}</strong>
                          {doubt.studentId?.email ? (
                            <div
                              style={{
                                color: 'var(--text-muted)',
                                fontSize: '0.85rem',
                                marginTop: '0.35rem',
                              }}
                            >
                              {doubt.studentId.email}
                            </div>
                          ) : null}
                        </div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                          {new Date(doubt.createdAt).toLocaleDateString()}
                        </div>
                      </div>

                      <p
                        style={{
                          background: 'var(--bg-primary)',
                          padding: '1rem',
                          borderRadius: '8px',
                        }}
                      >
                        {doubt.question}
                      </p>

                      <div
                        style={{
                          marginTop: '1rem',
                          display: 'flex',
                          gap: '0.75rem',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                        }}
                      >
                        <span
                          style={{
                            color: doubt.requestSlot
                              ? 'var(--accent-primary)'
                              : 'var(--text-muted)',
                            fontSize: '0.85rem',
                            fontWeight: 'bold',
                          }}
                        >
                          {doubt.requestSlot
                            ? 'Student requested an online meeting'
                            : 'Waiting for staff action'}
                        </span>

                        <div style={{ flex: 1 }}></div>

                        <button
                          type="button"
                          className="support-secondary-btn"
                          onClick={() => openReplyModal(doubt)}
                        >
                          Reply & Resolve
                        </button>

                        <button
                          type="button"
                          className="support-secondary-btn"
                          onClick={() => openOfflineModal(doubt)}
                        >
                          Schedule Offline
                        </button>

                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={() => openOnlineModal(doubt)}
                        >
                          Schedule Online
                        </button>
                      </div>
                    </div>
                  ))
                )}

                {handledDoubts.length > 0 && (
                  <>
                    <h2 style={{ fontSize: '1.25rem', marginTop: '2rem' }}>Handled Doubts</h2>

                    {handledDoubts.map((doubt) => (
                      <div key={doubt._id} className="island-card" style={{ padding: '1.5rem' }}>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            gap: '1rem',
                            flexWrap: 'wrap',
                          }}
                        >
                          <div>
                            <strong>{doubt.studentId?.name || 'Student'}</strong> - {doubt.subject}
                          </div>
                          <span
                            style={{
                              ...getStatusStyle(getDisplayedDoubtStatus(doubt)),
                              padding: '0.35rem 0.8rem',
                              borderRadius: '999px',
                              fontWeight: 'bold',
                              fontSize: '0.85rem',
                            }}
                          >
                            {getDisplayedDoubtStatus(doubt)}
                          </span>
                        </div>

                        <p style={{ margin: '0.5rem 0', color: 'var(--text-muted)' }}>
                          {doubt.question}
                        </p>

                        {doubt.reply && (
                          <div
                            style={{
                              padding: '0.85rem 1rem',
                              background: 'rgba(5, 150, 105, 0.1)',
                              borderRadius: '12px',
                              borderLeft: '3px solid var(--accent-primary)',
                            }}
                          >
                            <strong style={{ fontSize: '0.85rem' }}>Reply</strong>
                            <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.95rem' }}>
                              {doubt.reply}
                            </p>
                          </div>
                        )}

                        {doubt.offlineSchedule?.place && (
                          <div className="support-note-box">
                            <strong>Scheduled Offline Visit</strong>
                            <p style={{ margin: '0.35rem 0 0 0' }}>
                              {formatDateTime(
                                doubt.offlineSchedule.date,
                                doubt.offlineSchedule.time
                              )}
                            </p>
                            <p style={{ margin: '0.35rem 0 0 0' }}>
                              Place: {doubt.offlineSchedule.place}
                            </p>
                            {doubt.offlineSchedule.notes ? (
                              <p style={{ margin: '0.35rem 0 0 0' }}>
                                Notes: {doubt.offlineSchedule.notes}
                              </p>
                            ) : null}
                          </div>
                        )}

                        {doubt.assignedSlotId?.shareableLink && (
                          <div className="support-note-box">
                            <strong>Scheduled Online Meeting</strong>
                            <p style={{ margin: '0.35rem 0 0 0' }}>
                              {formatDateTime(doubt.assignedSlotId.date, doubt.assignedSlotId.time)}
                              {doubt.assignedSlotId.duration
                                ? ` - ${doubt.assignedSlotId.duration} mins`
                                : ''}
                            </p>
                            {doubt.assignedSlotId.notes ? (
                              <p style={{ margin: '0.35rem 0 0 0' }}>
                                Notes: {doubt.assignedSlotId.notes}
                              </p>
                            ) : null}
                            <div
                              style={{
                                display: 'flex',
                                gap: '0.75rem',
                                marginTop: '0.85rem',
                                flexWrap: 'wrap',
                              }}
                            >
                              <span className="support-status">
                                {getDisplayedSlotStatus(doubt.assignedSlotId)}
                              </span>
                              {getDisplayedSlotStatus(doubt.assignedSlotId) !== 'Completed' && (
                                <>
                                  <button
                                    type="button"
                                    className="support-secondary-btn"
                                    onClick={() =>
                                      handleCopyInviteLink(doubt.assignedSlotId.shareableLink)
                                    }
                                  >
                                    Copy Join Link
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={() =>
                                      navigate(
                                        `/meeting/${encodeURIComponent(
                                          doubt.assignedSlotId.shareableLink
                                        )}`
                                      )
                                    }
                                  >
                                    Open Online Meeting
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}

            {view === 'slots' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {slots.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)' }}>
                    You have not scheduled any online meetings yet.
                  </p>
                ) : (
                  slots.map((slot) => {
                    const displayStatus = getDisplayedSlotStatus(slot);
                    return (
                    <div
                      key={slot._id}
                      className="island-card"
                      style={{
                        padding: '1.5rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1rem',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          gap: '1rem',
                          flexWrap: 'wrap',
                        }}
                      >
                        <div>
                          <h3 style={{ margin: '0 0 0.5rem 0' }}>{slot.topic}</h3>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            <strong>Participants:</strong>{' '}
                            {slot.studentIds?.length
                              ? slot.studentIds.map((student) => student.name).join(', ')
                              : 'Waiting for students'}
                          </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                            {formatDateTime(slot.date, slot.time)}
                          </div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            {slot.duration} mins
                          </div>
                        </div>
                      </div>

                      {slot.notes && (
                        <div
                          style={{
                            padding: '0.75rem',
                            background: 'rgba(5, 150, 105, 0.1)',
                            borderRadius: '6px',
                            borderLeft: '3px solid var(--accent-primary)',
                          }}
                        >
                          <strong style={{ fontSize: '0.85rem' }}>Preparation Notes:</strong>
                          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem' }}>
                            {slot.notes}
                          </p>
                        </div>
                      )}

                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginTop: '1rem',
                          gap: '1rem',
                          flexWrap: 'wrap',
                        }}
                      >
                          <span
                          style={{
                            padding: '0.25rem 0.75rem',
                            borderRadius: '999px',
                            fontSize: '0.85rem',
                            fontWeight: 'bold',
                            background:
                              displayStatus === 'Completed'
                                ? 'rgba(15, 23, 42, 0.12)'
                                : slot.status === 'Confirmed'
                                ? 'rgba(34, 197, 94, 0.2)'
                                : 'rgba(245, 158, 11, 0.2)',
                            color:
                              displayStatus === 'Completed'
                                ? 'var(--text-main)'
                                : slot.status === 'Confirmed'
                                ? 'var(--status-success)'
                                : 'var(--status-warning)',
                          }}
                        >
                          {displayStatus}
                        </span>

                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          {displayStatus !== 'Completed' && (
                            <>
                              <button
                                type="button"
                                className="support-secondary-btn"
                                onClick={() => handleCopyInviteLink(slot.shareableLink)}
                              >
                                Copy Join Link
                              </button>
                              <button
                                type="button"
                                className="btn btn-primary"
                                onClick={() =>
                                  navigate(`/meeting/${encodeURIComponent(slot.shareableLink)}`)
                                }
                              >
                                Open Online Meeting
                              </button>
                            </>
                          )}
                          <button
                            type="button"
                            style={{
                              padding: '0.5rem 1rem',
                              borderRadius: '8px',
                              background: 'rgba(239, 68, 68, 0.2)',
                              color: 'var(--status-danger)',
                              border: '1px solid var(--status-danger)',
                            }}
                            onClick={() => handleDeleteSlot(slot._id)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                    );
                  })
                )}
              </div>
            )}
          </>
        )}
      </div>

      {modalType === 'online' && activeDoubt && (
        <ModalShell
          title="Schedule Online Meeting"
          subtitle={
            <>
              Creating a meeting room for <strong>{activeDoubt.studentId?.name || 'this student'}</strong>{' '}
              regarding <strong>{activeDoubt.subject}</strong>.
            </>
          }
        >
          <form
            onSubmit={handleCreateSlot}
            style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
          >
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 180px' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Date</label>
                <input
                  type="date"
                  required
                  min={nextSchedule.date}
                  value={onlineForm.date}
                  onChange={(event) =>
                    setOnlineForm((previous) => ({ ...previous, date: event.target.value }))
                  }
                  style={modalInputStyle}
                />
              </div>

              <div style={{ flex: '1 1 180px' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Time</label>
                <input
                  type="time"
                  required
                  min={getMinTimeForDate(onlineForm.date)}
                  value={onlineForm.time}
                  onChange={(event) =>
                    setOnlineForm((previous) => ({ ...previous, time: event.target.value }))
                  }
                  style={modalInputStyle}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 140px' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Duration (mins)</label>
                <input
                  type="number"
                  min="15"
                  step="15"
                  required
                  value={onlineForm.duration}
                  onChange={(event) =>
                    setOnlineForm((previous) => ({
                      ...previous,
                      duration: event.target.value,
                    }))
                  }
                  style={modalInputStyle}
                />
              </div>

              <div style={{ flex: '2 1 220px' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Topic</label>
                <input
                  type="text"
                  required
                  value={onlineForm.topic}
                  onChange={(event) =>
                    setOnlineForm((previous) => ({ ...previous, topic: event.target.value }))
                  }
                  style={modalInputStyle}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                Notes for Student (Optional)
              </label>
              <textarea
                rows="3"
                value={onlineForm.notes}
                onChange={(event) =>
                  setOnlineForm((previous) => ({ ...previous, notes: event.target.value }))
                }
                style={{ ...modalInputStyle, resize: 'vertical' }}
              ></textarea>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button
                type="button"
                className="support-secondary-btn"
                style={{ flex: 1 }}
                onClick={closeModal}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                Create Meeting Link
              </button>
            </div>
          </form>
        </ModalShell>
      )}

      {modalType === 'offline' && activeDoubt && (
        <ModalShell
          title="Schedule Offline Session"
          subtitle={
            <>
              Add the place and time for <strong>{activeDoubt.studentId?.name || 'this student'}</strong>{' '}
              so the student can see the offline visit details immediately.
            </>
          }
        >
          <form
            onSubmit={handleScheduleOffline}
            style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
          >
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>Place</label>
              <input
                type="text"
                required
                value={offlineForm.place}
                onChange={(event) =>
                  setOfflineForm((previous) => ({ ...previous, place: event.target.value }))
                }
                placeholder="Example: Room 204, Science Block"
                style={modalInputStyle}
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 180px' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Date</label>
                <input
                  type="date"
                  required
                  min={nextSchedule.date}
                  value={offlineForm.date}
                  onChange={(event) =>
                    setOfflineForm((previous) => ({ ...previous, date: event.target.value }))
                  }
                  style={modalInputStyle}
                />
              </div>

              <div style={{ flex: '1 1 180px' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Time</label>
                <input
                  type="time"
                  required
                  min={getMinTimeForDate(offlineForm.date)}
                  value={offlineForm.time}
                  onChange={(event) =>
                    setOfflineForm((previous) => ({ ...previous, time: event.target.value }))
                  }
                  style={modalInputStyle}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                Notes for Student (Optional)
              </label>
              <textarea
                rows="3"
                value={offlineForm.notes}
                onChange={(event) =>
                  setOfflineForm((previous) => ({ ...previous, notes: event.target.value }))
                }
                placeholder="Bring notebook, meet near the lab, or any other instructions."
                style={{ ...modalInputStyle, resize: 'vertical' }}
              ></textarea>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button
                type="button"
                className="support-secondary-btn"
                style={{ flex: 1 }}
                onClick={closeModal}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                Save Offline Schedule
              </button>
            </div>
          </form>
        </ModalShell>
      )}

      {modalType === 'reply' && activeDoubt && (
        <ModalShell
          title="Reply & Resolve"
          subtitle={
            <>
              Provide an answer for <strong>{activeDoubt.studentId?.name || 'this student'}</strong>.
            </>
          }
        >
          <form
            onSubmit={handleResolveDoubt}
            style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
          >
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem' }}>Reply</label>
              <textarea
                rows="5"
                required
                value={replyText}
                onChange={(event) => setReplyText(event.target.value)}
                placeholder="Write your explanation here..."
                style={{ ...modalInputStyle, resize: 'vertical' }}
              ></textarea>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button
                type="button"
                className="support-secondary-btn"
                style={{ flex: 1 }}
                onClick={closeModal}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                Send Reply & Resolve
              </button>
            </div>
          </form>
        </ModalShell>
      )}
    </>
  );
};

export default SlotManagementPage;
