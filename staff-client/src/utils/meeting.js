const DEFAULT_MEETING_BASE_URL =
  process.env.REACT_APP_MEETING_BASE_URL || 'https://meet.jit.si';

const sanitizeRoomPart = (value = '') =>
  value
    .toString()
    .trim()
    .replace(/[^a-zA-Z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .toLowerCase();

export const resolveMeetingRoomId = (slot) => {
  if (slot?.meetingRoomId) return slot.meetingRoomId;

  const seed = slot?.shareableLink || slot?._id || 'instant-room';
  const normalizedSeed = sanitizeRoomPart(seed) || 'instant-room';
  return `student-doubt-room-${normalizedSeed}`;
};

export const buildMeetingUrl = (slot) =>
  `${DEFAULT_MEETING_BASE_URL}/${resolveMeetingRoomId(slot)}`;

export const buildMeetingEmbedUrl = (slot) =>
  `${buildMeetingUrl(slot)}#config.prejoinPageEnabled=false&config.startWithAudioMuted=true`;

export const getMeetingProviderLabel = (slot) => slot?.meetingProvider || 'Jitsi Meet';
