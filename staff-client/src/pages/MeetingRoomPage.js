import React, { useContext, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { slotAPI } from '../services/api';
import {
  buildMeetingEmbedUrl,
  buildMeetingUrl,
  getMeetingProviderLabel,
} from '../utils/meeting';

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

const MeetingRoomPage = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const { linkId } = useParams();
  const [slot, setSlot] = useState(null);
  const [access, setAccess] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSlot = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await slotAPI.getSlotByLink(linkId);
        setSlot(response.data.slot || null);
        setAccess(response.data.access || null);
      } catch (requestError) {
        setError(requestError.response?.data?.error || 'Failed to load the meeting room.');
      } finally {
        setLoading(false);
      }
    };

    fetchSlot();
  }, [linkId]);

  const meetingUrl = slot ? buildMeetingUrl(slot) : '';
  const meetingEmbedUrl = slot ? buildMeetingEmbedUrl(slot) : '';
  const completed =
    access?.isCompleted ?? access?.isExpired ?? (slot ? isSlotCompleted(slot.date, slot.time, slot.duration) : false);
  const attendeeNames = slot?.studentIds?.map((student) => student.name).filter(Boolean) || [];

  return (
    <>
      <div className="animated-bg">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
      </div>

      <div className="page-content" style={{ paddingBottom: '2rem' }}>
        <div className="support-header support-header-row" style={{ marginBottom: '1.5rem' }}>
          <div>
            <span className="support-pill">Online meeting</span>
            <h1 className="dashboard-title">Online Meeting Room</h1>
            <p className="dashboard-subtitle">
              Join the scheduled online doubt-resolution meeting directly from the portal.
            </p>
          </div>
          <button
            type="button"
            className="support-secondary-btn"
            onClick={() => navigate('/slots')}
          >
            Back to Online Meetings
          </button>
        </div>

        {error && (
          <div
            style={{
              padding: '0.9rem 1rem',
              borderRadius: '12px',
              marginBottom: '1rem',
              background: 'rgba(239, 68, 68, 0.16)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
            }}
          >
            {error}
          </div>
        )}

        {loading ? (
          <div className="island-card support-empty-card">Loading meeting room...</div>
        ) : slot ? (
          <div className="support-stack">
            <div className="island-card support-panel-card" style={{ gap: '1rem' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: '1rem',
                  flexWrap: 'wrap',
                }}
              >
                <div>
                  <h3 style={{ marginBottom: '0.35rem' }}>
                    {slot.topic || slot.doubtId?.subject || 'Online meeting'}
                  </h3>
                  <p className="support-muted" style={{ margin: 0 }}>
                    Powered by {getMeetingProviderLabel(slot)} for {user?.name || 'staff'}
                  </p>
                </div>
                <span className="support-status">{getDisplayedSlotStatus(slot)}</span>
              </div>

              <div className="support-metric-grid" style={{ marginTop: 0 }}>
                <div className="support-metric-card">
                  <span>Schedule</span>
                  <strong>{formatDateTime(slot.date, slot.time)}</strong>
                </div>
                <div className="support-metric-card">
                  <span>Duration</span>
                  <strong>{slot.duration} mins</strong>
                </div>
                <div className="support-metric-card">
                  <span>Invite Code</span>
                  <strong>{slot.shareableLink}</strong>
                </div>
              </div>

              {slot.notes && <div className="support-note-box">{slot.notes}</div>}

              <div className="support-list-footer" style={{ alignItems: 'flex-start', gap: '1rem' }}>
                <div style={{ display: 'grid', gap: '0.35rem' }}>
                  <span className="support-muted">
                    Students: {attendeeNames.length ? attendeeNames.join(', ') : 'No students joined yet'}
                  </span>
                  {completed && (
                    <span style={{ color: 'var(--status-warning)', fontSize: '0.92rem' }}>
                      This meeting slot is completed.
                    </span>
                  )}
                </div>

                <div className="support-action-row">
                  {!completed && (
                    <button
                      type="button"
                      className="support-secondary-btn"
                      onClick={() =>
                        window.open(meetingUrl, '_blank', 'noopener,noreferrer')
                      }
                    >
                      Open Full Screen
                    </button>
                  )}
                </div>
              </div>
            </div>

            {completed ? (
              <div className="island-card support-empty-card">
                This online meeting is completed.
              </div>
            ) : access?.canJoinMeeting ? (
              <div className="island-card" style={{ padding: '1rem' }}>
                <p className="support-muted" style={{ margin: '0 0 0.9rem 0' }}>
                  If your browser blocks camera or microphone access inside the portal, use
                  "Open Full Screen" above.
                </p>
                <iframe
                  title={slot.topic || 'Meeting room'}
                  src={meetingEmbedUrl}
                  allow="camera; microphone; display-capture; fullscreen; autoplay"
                  style={{
                    width: '100%',
                    minHeight: '72vh',
                    border: 'none',
                    borderRadius: '18px',
                    background: '#111827',
                  }}
                />
              </div>
            ) : (
              <div className="island-card support-empty-card">
                This meeting room is only available to the assigned staff member and joined
                students.
              </div>
            )}
          </div>
        ) : null}
      </div>
    </>
  );
};

export default MeetingRoomPage;
