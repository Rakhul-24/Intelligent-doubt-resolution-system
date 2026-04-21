import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { chatAPI, slotAPI } from '../services/api';

const SlotIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
    <path d="M14 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h12zM2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2z" />
    <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z" />
  </svg>
);

const MessageIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
    <path d="M2.678 11.894a1 1 0 0 1 .287.801 10.97 10.97 0 0 1-.398 2c1.395-.323 2.247-.697 2.634-.893a1 1 0 0 1 .71-.074A8.06 8.06 0 0 0 8 14c3.996 0 7-2.807 7-6 0-3.192-3.004-6-7-6S1 4.808 1 8c0 1.468.617 2.83 1.678 3.894zm-.493 3.905a21.682 21.682 0 0 1-.713.129c-.2.032-.352-.176-.273-.362a9.68 9.68 0 0 0 .244-.637l.003-.01c.248-.72.45-1.548.524-2.319C.743 11.37 0 9.76 0 8c0-3.866 3.582-7 8-7s8 3.134 8 7-3.582 7-8 7a9.06 9.06 0 0 1-2.347-.306c-.52.263-1.639.742-3.468 1.105z" />
  </svg>
);

const ResourceIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
    <path d="M14 4.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5L14 4.5zm-3 0A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4.5h-2z" />
    <path d="M4.5 12.5A.5.5 0 0 1 5 12h3a.5.5 0 0 1 0 1H5a.5.5 0 0 1-.5-.5zm0-2A.5.5 0 0 1 5 10h6a.5.5 0 0 1 0 1H5a.5.5 0 0 1-.5-.5zm1.639-3.708 1.33.886 1.854-1.855a.25.25 0 0 1 .289-.047l1.888.974V8.5a.5.5 0 0 1-.5.5H5a.5.5 0 0 1-.5-.5V8s1.54-1.274 1.639-1.208zM6.25 6a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5z" />
  </svg>
);

const ViewBookingsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
    <path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5zM1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4H1z" />
    <path d="M11 6.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1z" />
  </svg>
);

const AiIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
    <path d="M6.5.5A2.5 2.5 0 0 0 4 3v.684A2.99 2.99 0 0 0 2.5 9.05V10a2.5 2.5 0 0 0 2.02 2.45A2.5 2.5 0 0 0 7 14.5h2a2.5 2.5 0 0 0 2.48-2.05A2.5 2.5 0 0 0 13.5 10v-.95A2.99 2.99 0 0 0 12 3.684V3A2.5 2.5 0 0 0 9.5.5h-3Zm0 1h3A1.5 1.5 0 0 1 11 3v1h1a2 2 0 0 1 .155 3.994L11.5 8v2a1.5 1.5 0 0 1-1.493 1.5L10 11.5h-.5v-2h-1v4H7v-4H6v2h-.5A1.5 1.5 0 0 1 4 10V8l-.655-.006A2 2 0 0 1 3.5 4H4V3a1.5 1.5 0 0 1 1.5-1.5Z" />
  </svg>
);

const MeetingIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
    <path d="M0 5a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v.5l3.553-2.132A.5.5 0 0 1 15 3.8v8.4a.5.5 0 0 1-.447.432l-.106.01a.5.5 0 0 1-.241-.068L11 10.5V11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V5zm10 4.618 4 2.4V4.982l-4 2.4v2.236z" />
  </svg>
);

const buildMeetingRoute = (shareableLink) => `/meeting/${encodeURIComponent(shareableLink)}`;

const formatDateTime = (date, time) => {
  try {
    return `${new Date(date).toLocaleDateString()} at ${time}`;
  } catch {
    return `${date} at ${time}`;
  }
};

const getSlotDate = (date, time) => {
  if (!date || !time) return null;
  const normalizedTime = time.length === 5 ? `${time}:00` : time;
  const value = new Date(`${date}T${normalizedTime}`);
  return Number.isNaN(value.getTime()) ? null : value;
};

const getSlotEndDate = (date, time, duration = 30) => {
  const slotDate = getSlotDate(date, time);
  if (!slotDate) return null;
  return new Date(slotDate.getTime() + (Number(duration) || 30) * 60 * 1000);
};

const getUpcomingMeeting = (slots) =>
  [...slots]
    .filter((slot) => {
      const slotEndDate = getSlotEndDate(slot.date, slot.time, slot.duration);
      return slotEndDate && slotEndDate > new Date();
    })
    .sort((left, right) => getSlotDate(left.date, left.time) - getSlotDate(right.date, right.time))[0] ||
  null;

const StudentDashboard = () => {
  const { user } = useContext(AuthContext);
  const [unreadTotal, setUnreadTotal] = useState(0);
  const [slots, setSlots] = useState([]);
  const [meetingNotice, setMeetingNotice] = useState('');
  const [meetingError, setMeetingError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [chatResponse, slotResponse] = await Promise.all([
          chatAPI.getUnreadCounts(),
          slotAPI.getMySlots(),
        ]);
        setUnreadTotal(chatResponse.data.total || 0);
        setSlots(slotResponse.data.slots || []);
      } catch (error) {
        console.error('Failed to load dashboard data', error);
        setMeetingError('Could not load your online meeting summary.');
      }
    };

    fetchDashboardData();
  }, []);

  const nextMeeting = useMemo(() => getUpcomingMeeting(slots), [slots]);

  const handleConfirmMeeting = async (slotId) => {
    setMeetingNotice('');
    setMeetingError('');

    try {
      await slotAPI.confirmSlot(slotId);
      setMeetingNotice('Online meeting confirmed. You can join it from the dashboard now.');
      const response = await slotAPI.getMySlots();
      setSlots(response.data.slots || []);
    } catch (error) {
      setMeetingError(error.response?.data?.error || 'Could not confirm the online meeting.');
    }
  };

  const actionCards = [
    {
      title: 'Ask Staff',
      description: 'Send a doubt and request an online meeting when you need live help.',
      icon: <SlotIcon />,
      to: '/doubts/staff?tab=ask&requestSlot=1',
    },
    {
      title: 'Ask AI',
      description: 'Open the AI tutor for instant explanations before your online class.',
      icon: <AiIcon />,
      to: '/doubts/ai',
    },
    {
      title: 'Messages',
      description: 'Continue discussions with staff before or after a meeting.',
      icon: <MessageIcon />,
      to: '/chat',
    },
    {
      title: 'Resources',
      description: 'Review materials your teacher uploaded ahead of the meeting.',
      icon: <ResourceIcon />,
      to: '/materials',
    },
    {
      title: 'Online Meetings',
      description: 'Track booked meetings, confirmations, and join links in one place.',
      icon: <ViewBookingsIcon />,
      to: '/doubts/staff?tab=slots',
    },
  ];

  return (
    <>
      <div className="animated-bg">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
      </div>
      <div className="page-content">
        <div className="dashboard-header">
          <h1 className="dashboard-title">Welcome back, {user?.name}</h1>
          <p className="dashboard-subtitle">
            Ask questions, confirm your online meetings, and join your teacher from one place.
          </p>
        </div>

        {meetingError && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid var(--status-danger)',
              padding: '1rem',
              borderRadius: '12px',
              marginBottom: '1rem',
            }}
          >
            {meetingError}
          </div>
        )}

        {meetingNotice && (
          <div
            style={{
              background: 'rgba(34, 197, 94, 0.18)',
              border: '1px solid var(--status-success)',
              padding: '1rem',
              borderRadius: '12px',
              marginBottom: '1rem',
            }}
          >
            {meetingNotice}
          </div>
        )}

        <div className="floating-grid">
          {actionCards.map((card) => (
            <Link to={card.to} key={card.title}>
              <div className="island-card" style={{ position: 'relative', height: '100%' }}>
                {card.title === 'Messages' && unreadTotal > 0 && (
                  <span
                    className="nav-unread"
                    style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', transform: 'scale(1.2)' }}
                  >
                    {unreadTotal} new
                  </span>
                )}
                <div className="island-icon">{card.icon}</div>
                <h3 className="island-title">{card.title}</h3>
                <p className="island-desc">{card.description}</p>
              </div>
            </Link>
          ))}

          <div className="island-card" style={{ justifyContent: 'space-between' }}>
            <div>
              <div className="island-icon">
                <MeetingIcon />
              </div>
              <h3 className="island-title">Next Online Meeting</h3>
              {nextMeeting ? (
                <>
                  <p className="island-desc">
                    {nextMeeting.topic || nextMeeting.doubtId?.subject || 'Teacher support meeting'}
                  </p>
                  <p className="island-desc">
                    {formatDateTime(nextMeeting.date, nextMeeting.time)} • {nextMeeting.duration} mins
                  </p>
                  <p className="island-desc">
                    Teacher: {nextMeeting.staffId?.name || 'Staff member'}
                    {nextMeeting.staffId?.subject ? ` • ${nextMeeting.staffId.subject}` : ''}
                  </p>
                  <p className="island-desc">
                    Status: {nextMeeting.status || 'Scheduled'} • Provider:{' '}
                    {nextMeeting.meetingProvider || 'Jitsi Meet'}
                  </p>
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1rem' }}>
                    <Link className="btn btn-primary" to={buildMeetingRoute(nextMeeting.shareableLink)}>
                      Join Meeting
                    </Link>
                    {nextMeeting.status === 'Pending Student Confirmation' && (
                      <button
                        type="button"
                        className="support-secondary-btn"
                        onClick={() => handleConfirmMeeting(nextMeeting._id)}
                      >
                        Confirm Attendance
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <p className="island-desc">
                    You do not have an upcoming online meeting yet. Ask staff for help and request a live meeting when you need one.
                  </p>
                  <div style={{ marginTop: '1rem' }}>
                    <Link className="btn btn-primary" to="/doubts/staff?tab=ask&requestSlot=1">
                      Request a Meeting
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default StudentDashboard;
