import { v4 as uuidv4 } from 'uuid';

const MEETING_ROOM_PREFIX = 'student-doubt-room';

const sanitizeRoomPart = (value = '') =>
  value
    .toString()
    .trim()
    .replace(/[^a-zA-Z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .toLowerCase();

export const buildMeetingRoomId = (seed = uuidv4()) => {
  const normalizedSeed = sanitizeRoomPart(seed) || uuidv4();
  return `${MEETING_ROOM_PREFIX}-${normalizedSeed}`;
};

export const resolveMeetingRoomId = (slot) =>
  slot?.meetingRoomId || buildMeetingRoomId(slot?.shareableLink || slot?._id || uuidv4());
