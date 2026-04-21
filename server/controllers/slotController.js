import { resolveMeetingRoomId } from '../utils/meeting.js';
import {
  getSlotDateTime,
  isSlotCompleted,
  isSlotStartTimeInPast,
  slotHasStudent,
  withComputedSlotState,
} from './slotAccessUtils.js';
import {
  createSlotRecord,
  deleteSlot as deleteSlotRecord,
  findSlotByShareableLink,
  getDoubtById,
  getSlotById,
  getSlotsByStaff,
  getSlotsByStudent,
  getUserById,
  getUsersByIds,
  publicDoubt,
  publicSlot,
  publicUser,
  updateDoubt,
  updateSlot,
} from '../lib/firestoreStore.js';

const sortSlotsAscending = (slots) =>
  [...slots].sort((left, right) => {
    const leftValue = getSlotDateTime(left.date, left.time)?.getTime() || 0;
    const rightValue = getSlotDateTime(right.date, right.time)?.getTime() || 0;
    return leftValue - rightValue;
  });

const buildUserMap = (users, fields) =>
  new Map(users.map((user) => [user._id, publicUser(user, fields)]));

const buildDoubtMap = (doubts) =>
  new Map(doubts.filter(Boolean).map((doubt) => [doubt._id, publicDoubt(doubt)]));

export const createSlotForDoubt = async (req, res) => {
  try {
    const { doubtId, date, time, duration, topic, notes } = req.body;

    if (!date || !time || !doubtId) {
      return res.status(400).json({ error: 'Doubt ID, date, and time are required' });
    }

    if (isSlotStartTimeInPast(date, time)) {
      return res.status(400).json({ error: 'Slot schedule must be a future date and time' });
    }

    const doubt = await getDoubtById(doubtId);
    if (!doubt) {
      return res.status(404).json({ error: 'Doubt not found' });
    }

    const slot = await createSlotRecord({
      date,
      doubtId,
      duration: duration || 30,
      notes: notes || '',
      staffId: req.userId,
      studentIds: [doubt.studentId],
      time,
      topic: topic || doubt.subject,
    });

    await updateDoubt(doubtId, {
      assignedSlotId: slot._id,
      offlineSchedule: null,
      resolutionType: 'online',
      resolvingStaffId: req.userId,
      status: 'Online Scheduled',
    });

    const [staff, students] = await Promise.all([
      getUserById(req.userId),
      getUsersByIds(slot.studentIds),
    ]);

    if (req.app.get('io')) req.app.get('io').emit('slot_updated');

    res.status(201).json({
      success: true,
      slot: {
        ...withComputedSlotState(publicSlot(slot)),
        staffId: staff ? publicUser(staff, ['name', 'email', 'subject']) : null,
        studentIds: students.map((student) => publicUser(student, ['name', 'email', 'subject'])),
      },
    });
  } catch (error) {
    console.error('Create slot error:', error);
    res.status(500).json({ error: 'Failed to create slot' });
  }
};

export const getStaffSlots = async (req, res) => {
  try {
    const slots = sortSlotsAscending(await getSlotsByStaff(req.userId));
    const studentIds = slots.flatMap((slot) => slot.studentIds || []);
    const doubtIds = slots.map((slot) => slot.doubtId);

    const [students, doubts] = await Promise.all([
      getUsersByIds(studentIds),
      Promise.all(doubtIds.filter(Boolean).map((doubtId) => getDoubtById(doubtId))),
    ]);

    const studentMap = buildUserMap(students, ['name', 'email']);
    const doubtMap = buildDoubtMap(doubts);

    res.json({
      success: true,
      slots: slots.map((slot) => ({
        ...withComputedSlotState(publicSlot(slot)),
        doubtId: slot.doubtId ? doubtMap.get(slot.doubtId) || null : null,
        studentIds: (slot.studentIds || [])
          .map((studentId) => studentMap.get(studentId))
          .filter(Boolean),
      })),
    });
  } catch (error) {
    console.error('Get staff slots error:', error);
    res.status(500).json({ error: 'Failed to fetch slots' });
  }
};

export const getStudentSlots = async (req, res) => {
  try {
    const slots = sortSlotsAscending(await getSlotsByStudent(req.userId));
    const staffIds = slots.map((slot) => slot.staffId);
    const doubtIds = slots.map((slot) => slot.doubtId);

    const [staffUsers, doubts] = await Promise.all([
      getUsersByIds(staffIds),
      Promise.all(doubtIds.filter(Boolean).map((doubtId) => getDoubtById(doubtId))),
    ]);

    const staffMap = buildUserMap(staffUsers, ['name', 'email', 'subject']);
    const doubtMap = buildDoubtMap(doubts);

    res.json({
      success: true,
      slots: slots.map((slot) => ({
        ...withComputedSlotState(publicSlot(slot)),
        doubtId: slot.doubtId ? doubtMap.get(slot.doubtId) || null : null,
        staffId: slot.staffId ? staffMap.get(slot.staffId) || null : null,
      })),
    });
  } catch (error) {
    console.error('Get student slots error:', error);
    res.status(500).json({ error: 'Failed to fetch your slots' });
  }
};

export const getSlotByLink = async (req, res) => {
  try {
    const { linkId } = req.params;
    const slot = await findSlotByShareableLink(linkId);

    if (!slot) {
      return res.status(404).json({ error: 'Invalid or expired slot link' });
    }

    const [staff, students, doubt] = await Promise.all([
      getUserById(slot.staffId),
      getUsersByIds(slot.studentIds || []),
      slot.doubtId ? getDoubtById(slot.doubtId) : null,
    ]);

    const hydratedSlot = {
      ...publicSlot(slot),
      doubtId: doubt ? publicDoubt(doubt) : null,
      staffId: staff ? publicUser(staff, ['name', 'email', 'subject', 'avatar']) : null,
      studentIds: students.map((student) => publicUser(student, ['name', 'email', 'avatar'])),
    };

    const isStaffOwner = hydratedSlot.staffId?._id?.toString() === req.userId;
    const isStudentParticipant = slotHasStudent(hydratedSlot, req.userId);
    const completed = isSlotCompleted(slot.date, slot.time, slot.duration);
    const slotResponse = {
      ...withComputedSlotState(hydratedSlot),
      meetingRoomId: resolveMeetingRoomId(hydratedSlot),
    };

    res.json({
      success: true,
      slot: slotResponse,
      access: {
        isStaffOwner,
        isStudentParticipant,
        canJoinSlot: req.userRole === 'student' && !isStudentParticipant && !completed,
        canJoinMeeting: (isStaffOwner || isStudentParticipant) && !completed,
        isCompleted: completed,
        isExpired: completed,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch slot details' });
  }
};

export const joinSlotViaLink = async (req, res) => {
  try {
    const { linkId } = req.params;
    const slot = await findSlotByShareableLink(linkId);

    if (!slot) return res.status(404).json({ error: 'Invalid or expired slot link' });

    if (isSlotCompleted(slot.date, slot.time, slot.duration)) {
      return res.status(400).json({ error: 'Slot time has already finished' });
    }

    if (slotHasStudent(slot, req.userId)) {
      return res.status(400).json({ error: 'You have already joined this session.' });
    }

    const updatedSlot = await updateSlot(slot._id, {
      studentIds: [...(slot.studentIds || []), req.userId],
    });

    if (req.app.get('io')) req.app.get('io').emit('slot_updated');

    const staff = updatedSlot?.staffId ? await getUserById(updatedSlot.staffId) : null;
    res.json({
      success: true,
      message: 'Successfully joined session',
      slot: {
        ...withComputedSlotState(publicSlot(updatedSlot)),
        staffId: staff ? publicUser(staff, ['name', 'email', 'subject']) : null,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to join slot' });
  }
};

export const confirmSlot = async (req, res) => {
  try {
    const { slotId } = req.params;
    const slot = await getSlotById(slotId);

    if (!slot) return res.status(404).json({ error: 'Slot not found' });

    if (isSlotCompleted(slot.date, slot.time, slot.duration)) {
      return res.status(400).json({ error: 'This slot has already been completed.' });
    }

    if (!slotHasStudent(slot, req.userId)) {
      return res.status(403).json({ error: 'You are not authorized to confirm this slot.' });
    }

    const updatedSlot = await updateSlot(slotId, { status: 'Confirmed' });
    if (req.app.get('io')) req.app.get('io').emit('slot_updated');

    res.json({ success: true, slot: withComputedSlotState(publicSlot(updatedSlot)) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to confirm slot' });
  }
};

export const deleteSlot = async (req, res) => {
  try {
    const { slotId } = req.params;
    const slot = await deleteSlotRecord(slotId);
    if (!slot) return res.status(404).json({ error: 'Slot not found' });

    if (slot.doubtId) {
      const doubt = await getDoubtById(slot.doubtId);
      if (doubt) {
        await updateDoubt(doubt._id, {
          assignedSlotId: null,
          offlineSchedule: null,
          resolutionType: null,
          status: 'Open',
        });
      }
    }
    if (req.app.get('io')) req.app.get('io').emit('slot_updated');

    res.json({ success: true, message: 'Slot deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete slot' });
  }
};
