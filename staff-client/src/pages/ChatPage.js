import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { chatAPI, authAPI, SOCKET_URL, buildServerUrl } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import io from 'socket.io-client';

// SVG Icons
const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="search-icon" viewBox="0 0 16 16">
    <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z" />
  </svg>
);

const SendIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
    <path d="M15.854.146a.5.5 0 0 1 .11.54l-5.819 14.547a.75.75 0 0 1-1.329.124l-3.178-4.995L.643 7.184a.75.75 0 0 1 .124-1.33L15.314.037a.5.5 0 0 1 .54.11ZM6.636 10.07l2.761 4.338L14.13 2.576 6.636 10.07Zm6.787-8.201L1.591 6.602l4.339 2.76 7.494-7.493Z" />
  </svg>
);

const AttachmentIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
    <path d="M6.354 7.5H5.5a3.5 3.5 0 1 0 0 7h5a4.5 4.5 0 0 0 0-9H6.707a2.5 2.5 0 0 0 0 5H11V9H6.707a1 1 0 0 1 0-2H10.5a3 3 0 0 1 0 6h-5a2 2 0 1 1 0-4h.854v-1.5Z"/>
  </svg>
);

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
    <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z"/>
    <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z"/>
  </svg>
);


const ChatPage = () => {
  const { user } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [unreadCounts, setUnreadCounts] = useState({});
  const [notification, setNotification] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAttachment, setSelectedAttachment] = useState(null);
  const socket = useRef(null);
  const messagesEndRef = useRef(null);
  const selectedUserRef = useRef(null);
  const usersRef = useRef([]);
  const attachmentInputRef = useRef(null);

  const normalizeMessage = useCallback((msg) => ({
    ...msg,
    senderId:
      typeof msg.senderId === 'object' && msg.senderId !== null
        ? msg.senderId._id
        : msg.senderId,
    receiverId:
      typeof msg.receiverId === 'object' && msg.receiverId !== null
        ? msg.receiverId._id
        : msg.receiverId,
  }), []);

  const dedupeClientMessages = useCallback((messageList) => {
    const seen = new Map();

    return messageList
      .map(normalizeMessage)
      .filter((msg) => {
        const senderKey = msg.senderId?.toString?.() || '';
        const receiverKey = msg.receiverId?.toString?.() || '';
        const timestampKey = new Date(msg.timestamp).getTime();
        const signature = `${senderKey}|${receiverKey}|${msg.message}`;
        const previousTimestamp = seen.get(signature);
        const isDuplicate =
          typeof previousTimestamp === 'number' &&
          Math.abs(timestampKey - previousTimestamp) < 5000;

        if (isDuplicate) {
          return false;
        }

        seen.set(signature, timestampKey);
        return true;
      });
  }, [normalizeMessage]);

  const getAttachmentUrl = useCallback((attachment) => {
    if (!attachment?.fileUrl) return '';
    return buildServerUrl(attachment.fileUrl);
  }, []);

  const isImageAttachment = (attachment) =>
    attachment?.mimeType?.startsWith('image/') ||
    ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(attachment?.fileType);

  const clearPendingAttachment = () => {
    setSelectedAttachment(null);
    if (attachmentInputRef.current) {
      attachmentInputRef.current.value = '';
    }
  };

  const handleReceiveMessage = useCallback((data) => {
    const incomingMessage = normalizeMessage(data);
    const activeUserId = selectedUserRef.current?._id;

    if (incomingMessage.senderId === activeUserId) {
      setMessages((prev) => dedupeClientMessages([...prev, incomingMessage]));
      return;
    }

    setUnreadCounts((prev) => ({
      ...prev,
      [incomingMessage.senderId]: (prev[incomingMessage.senderId] || 0) + 1,
    }));

    const sender = usersRef.current.find((item) => item._id === incomingMessage.senderId);
    setNotification({
      senderId: incomingMessage.senderId,
      senderName: sender?.name || 'Student',
      senderMeta: sender?.email || 'Student account',
      preview: incomingMessage.message,
      tone: 'message',
    });
  }, [dedupeClientMessages, normalizeMessage]);

  useEffect(() => {
    socket.current = io(SOCKET_URL, {
      auth: {
        token: sessionStorage.getItem('token') || localStorage.getItem('token'),
      },
    });

    socket.current.emit('user_join', user?._id);
    socket.current.on('receive_message', handleReceiveMessage);

    return () => {
      socket.current.off('receive_message', handleReceiveMessage);
      socket.current.disconnect();
    };
  }, [user, handleReceiveMessage]);

  useEffect(() => {
    selectedUserRef.current = selectedUser;
  }, [selectedUser]);

  useEffect(() => {
    usersRef.current = users;
  }, [users]);

  useEffect(() => {
    if (!notification) return undefined;
    const timer = setTimeout(() => setNotification(null), 4000);
    return () => clearTimeout(timer);
  }, [notification]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    fetchUsers();
    fetchUnreadCounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchUnreadCounts = async () => {
    try {
      const res = await chatAPI.getUnreadCounts();
      if (res.data.success) {
        setUnreadCounts(res.data.countsByUser || {});
      }
    } catch (err) {
      console.error('Failed to fetch unread counts', err);
    }
  };

  const filteredUsers = users.filter((student) => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return true;
    return (
      student.name?.toLowerCase().includes(query) ||
      (student.subject || student.email)?.toLowerCase().includes(query)
    );
  });

  const fetchUsers = async () => {
    try {
      const res = await authAPI.getAllUsers();
      setUsers((res.data.users || []).filter(u => u._id !== user?._id));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch users');
    }
  };

  const getContactsEmptyMessage = () => {
    if (searchTerm.trim()) {
      return 'No students matched your search.';
    }

    return 'No Messages yet.';
  };

  const handleSelectUser = async (student) => {
    setSelectedUser(student);
    setNotification(null);
    
    // Clear unread counts for this user
    setUnreadCounts((prev) => ({ ...prev, [student._id]: 0 }));
    try {
      await chatAPI.markAsRead(student._id);
    } catch (e) {
      console.error('Failed to mark as read', e);
    }

    setLoading(true);
    try {
      const res = await chatAPI.getChatHistory(student._id);
      setMessages(dedupeClientMessages(res.data.messages || []));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch chat history');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && !selectedAttachment) || !selectedUser) return;

    try {
      const outgoingText = newMessage.trim() || (selectedAttachment ? `Shared an attachment: ${selectedAttachment.name}` : '');
      const payload = new FormData();
      payload.append('receiverId', selectedUser._id);
      payload.append('message', outgoingText);
      if (selectedAttachment) {
        payload.append('attachment', selectedAttachment);
      }

      const response = await chatAPI.sendMessage(payload);
      const savedMessage = normalizeMessage(response.data.chat);

      socket.current.emit('send_message', savedMessage);

      setMessages((prev) => dedupeClientMessages([
        ...prev,
        savedMessage,
      ]));
      setNewMessage('');
      clearPendingAttachment();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send message');
    }
  };

  const handleClearChat = async () => {
    if (!selectedUser) return;
    
    if (window.confirm(`Are you sure you want to clear the chat with ${selectedUser.name}? This cannot be undone.`)) {
      try {
        await chatAPI.clearChatHistory(selectedUser._id);
        setMessages([]);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to clear chat history');
      }
    }
  };

  const formatTime = (timestamp) =>
    new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const getInitials = (name) => {
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
  };

  const truncateNotificationPreview = (text) => {
    if (!text) return '';
    return text.length > 88 ? `${text.slice(0, 88)}...` : text;
  };

  const handleAttachmentChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setSelectedAttachment(file);
  };

  const handleOpenNotification = () => {
    if (!notification?.senderId) return;
    const matchedUser = users.find((item) => item._id === notification.senderId);
    if (matchedUser) {
      handleSelectUser(matchedUser);
    }
    setNotification(null);
  };

  return (
    <>
      <div className="animated-bg">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
      </div>
      <div className="page-content" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div className="dashboard-header" style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
          <h1 className="dashboard-title" style={{ fontSize: '2rem' }}>Messages</h1>
          <p className="dashboard-subtitle">Keep communication organized with our premium messaging interface.</p>
        </div>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid var(--status-danger)', padding: '1rem', borderRadius: '12px', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}>
            <span>{error}</span>
            <button onClick={() => setError('')} style={{ color: 'inherit' }}>x</button>
          </div>
        )}

        {notification && (
          <div style={{ position: 'fixed', top: '1rem', right: '1rem', zIndex: 1080, width: 'min(24rem, calc(100vw - 1.5rem))' }}>
            <div style={{ display: 'flex', gap: '0.9rem', padding: '1rem', borderRadius: '20px', background: 'var(--bg-surface-solid)', boxShadow: 'var(--shadow-lg)' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <strong>New message</strong>
                  <button onClick={() => setNotification(null)} style={{ color: 'var(--text-muted)' }}>x</button>
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{notification.senderName}</div>
                <div style={{ marginTop: '0.5rem' }}>{truncateNotificationPreview(notification.preview)}</div>
                <button 
                  onClick={handleOpenNotification}
                  style={{ marginTop: '0.8rem', background: 'var(--accent-light)', color: 'var(--accent-primary)', padding: '0.5rem 1rem', borderRadius: '999px', fontSize: '0.85rem', fontWeight: 'bold' }}
                >
                  Open chat
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="split-island" style={{ flex: 1 }}>
          <aside className="sidebar-island" style={{ display: selectedUser ? 'none' : 'flex' }}>
            <div className="island-header">
              <h4 style={{ margin: '0 0 1rem 0', fontWeight: 'bold' }}>Inbox</h4>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}><SearchIcon /></div>
                <input
                  type="text"
                  className="form-input"
                  style={{ width: '100%', paddingLeft: '2.5rem', borderRadius: '999px' }}
                  placeholder="Search contacts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="island-body" style={{ padding: 0 }}>
              {filteredUsers.length === 0 ? (
                <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>{getContactsEmptyMessage()}</div>
              ) : (
                filteredUsers.map((member) => (
                  <div
                    key={member._id}
                    className={`chat-contact ${selectedUser?._id === member._id ? 'active' : ''}`}
                    onClick={() => handleSelectUser(member)}
                  >
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', width: '100%' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-surface-solid)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-main)', fontWeight: 'bold' }}>
                        {getInitials(member.name)}
                      </div>
                      <div style={{ flex: 1, overflow: 'hidden' }}>
                        <div style={{ fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {member.name}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {member.subject || (member.role === 'staff' ? 'Staff' : 'Student')}
                        </div>
                      </div>
                      {unreadCounts[member._id] > 0 && (
                        <div className="nav-unread">{unreadCounts[member._id]}</div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </aside>

          <section className="main-island" style={{ display: !selectedUser ? 'none' : 'flex' }}>
            {selectedUser ? (
              <>
                <div className="island-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button style={{ color: 'var(--text-muted)' }} onClick={() => setSelectedUser(null)}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                        <path fillRule="evenodd" d="M11.354 1.646a.5.5 0 0 1 0 .708L5.707 8l5.647 5.646a.5.5 0 0 1-.708.708l-6-6a.5.5 0 0 1 0-.708l6-6a.5.5 0 0 1 .708 0z"/>
                      </svg>
                    </button>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bg-surface-solid)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-main)', fontWeight: 'bold' }}>
                      {getInitials(selectedUser.name)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{selectedUser.name}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {selectedUser.subject || (selectedUser.role === 'staff' ? 'Staff' : 'Student')}
                      </div>
                    </div>
                  </div>
                  <button onClick={handleClearChat} style={{ color: 'var(--status-danger)', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(239,68,68,0.1)', padding: '0.5rem 1rem', borderRadius: '999px' }}>
                    <TrashIcon /> <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Clear</span>
                  </button>
                </div>

                <div className="island-body" style={{ display: 'flex', flexDirection: 'column' }}>
                  {loading ? (
                    <div style={{ margin: 'auto' }}>Loading...</div>
                  ) : messages.length === 0 ? (
                    <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-muted)' }}>
                      <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--bg-surface-solid)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto', fontSize: '1.5rem' }}>
                        {getInitials(selectedUser.name)}
                      </div>
                      <h3 style={{ color: 'var(--text-main)' }}>Start the conversation with {selectedUser.name.split(' ')[0]}</h3>
                      <p>Send a message below to begin.</p>
                    </div>
                  ) : (
                    messages.map((msg, index) => {
                      const isOutgoing = msg.senderId === user._id;
                      return (
                        <div key={index} style={{ marginBottom: '1rem', display: 'flex', flexDirection: 'column' }}>
                          <div className={isOutgoing ? 'message-outgoing message-bubble' : 'message-incoming message-bubble'}>
                            {msg.message && <div>{msg.message}</div>}
                            {msg.attachment && (
                              <div style={{ marginTop: '0.5rem', background: 'var(--bg-surface-solid)', color: 'var(--text-main)', padding: '0.5rem', borderRadius: '8px' }}>
                                {isImageAttachment(msg.attachment) ? (
                                  <a href={getAttachmentUrl(msg.attachment)} target="_blank" rel="noreferrer">
                                    <img src={getAttachmentUrl(msg.attachment)} alt="Attachment" style={{ maxWidth: '100%', borderRadius: '4px' }} />
                                  </a>
                                ) : (
                                  <a href={getAttachmentUrl(msg.attachment)} target="_blank" rel="noreferrer" style={{ color: 'inherit', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <AttachmentIcon /> {msg.attachment.fileName || 'Open attachment'}
                                  </a>
                                )}
                              </div>
                            )}
                          </div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', alignSelf: isOutgoing ? 'flex-end' : 'flex-start', margin: isOutgoing ? '0 0.5rem 0 0' : '0 0 0 0.5rem' }}>
                            {formatTime(msg.timestamp)}
                          </span>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <div className="island-footer">
                  {selectedAttachment && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-surface-solid)', padding: '0.5rem 1rem', borderRadius: '8px', marginBottom: '0.5rem', width: 'fit-content' }}>
                      <span style={{ fontSize: '0.85rem' }}>{selectedAttachment.name}</span>
                      <button onClick={clearPendingAttachment} style={{ color: 'var(--status-danger)' }}>x</button>
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <button onClick={() => attachmentInputRef.current?.click()} style={{ color: 'var(--text-muted)', padding: '0.5rem' }}>
                      <AttachmentIcon />
                    </button>
                    <input
                      type="text"
                      className="form-input"
                      style={{ flex: 1, borderRadius: '999px', background: 'var(--bg-surface)' }}
                      placeholder="Type your message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    />
                    <input
                      ref={attachmentInputRef}
                      type="file"
                      style={{ display: 'none' }}
                      accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.gif,.webp"
                      onChange={handleAttachmentChange}
                    />
                    <button
                      className="btn btn-primary"
                      style={{ borderRadius: '50%', width: '45px', height: '45px', padding: 0 }}
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() && !selectedAttachment}
                    >
                      <SendIcon />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-muted)' }}>
                <h3 style={{ color: 'var(--text-main)' }}>Your Messages</h3>
                <p>Select a contact to open the conversation.</p>
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
};

export default ChatPage;


