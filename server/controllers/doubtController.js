import {
  createDoubtRecord,
  getDoubtById,
  getDoubtsByStudent,
  getSlotById,
  getUserById,
  getUsersByIds,
  listDoubts,
  publicDoubt,
  publicSlot,
  publicUser,
  updateDoubt,
} from '../lib/firestoreStore.js';
import { getSlotDateTime, withComputedSlotState } from './slotAccessUtils.js';

const sortNewestFirst = (items) =>
  [...items].sort(
    (left, right) =>
      new Date(right.createdAt || 0).getTime() - new Date(left.createdAt || 0).getTime()
  );

const buildUserMap = (users, fields) =>
  new Map(users.map((user) => [user._id, publicUser(user, fields)]));

const buildSlotMap = (slots) =>
  new Map(
    slots.filter(Boolean).map((slot) => [slot._id, withComputedSlotState(publicSlot(slot))])
  );

const VALID_RESOLUTION_TYPES = new Set(['reply', 'offline', 'online']);

const normalizeOfflineScheduleInput = (offlineSchedule) => {
  if (!offlineSchedule || typeof offlineSchedule !== 'object') {
    return null;
  }

  return {
    date: offlineSchedule.date?.toString().trim() || '',
    notes:
      typeof offlineSchedule.notes === 'string'
        ? offlineSchedule.notes.trim()
        : offlineSchedule.notes?.toString().trim() || '',
    place:
      typeof offlineSchedule.place === 'string'
        ? offlineSchedule.place.trim()
        : offlineSchedule.place?.toString().trim() || '',
    time: offlineSchedule.time?.toString().trim() || '',
  };
};

export const createDoubt = async (req, res) => {
  try {
    const { subject, targetStaffId, question, requestSlot } = req.body;
    let resolvedSubject = subject?.trim();

    if (!question?.trim()) {
      return res.status(400).json({ error: 'Subject and question are required' });
    }

    if (!resolvedSubject && targetStaffId) {
      const targetStaff = await getUserById(targetStaffId);
      if (!targetStaff) {
        return res.status(404).json({ error: 'Selected staff member was not found' });
      }
      resolvedSubject = targetStaff.subject;
    }

    if (!resolvedSubject) {
      return res.status(400).json({ error: 'Subject and question are required' });
    }

    const doubt = await createDoubtRecord({
      question: question.trim(),
      requestSlot: !!requestSlot,
      studentId: req.userId,
      subject: resolvedSubject,
      targetStaffId: targetStaffId || null,
    });

    const targetStaff = doubt.targetStaffId
      ? publicUser(await getUserById(doubt.targetStaffId), ['name', 'email'])
      : null;

    if (req.app.get('io')) {
      req.app.get('io').emit('doubt_updated');
    }

    res.status(201).json({
      success: true,
      doubt: {
        ...publicDoubt(doubt),
        targetStaffId: targetStaff,
      },
    });
  } catch (error) {
    console.error('Create doubt error:', error);
    res.status(500).json({ error: 'Failed to create doubt' });
  }
};

export const getStudentDoubts = async (req, res) => {
  try {
    const doubts = sortNewestFirst(await getDoubtsByStudent(req.userId));
    const relatedUserIds = doubts.flatMap((doubt) => [doubt.targetStaffId, doubt.resolvingStaffId]);
    const relatedSlotIds = doubts.map((doubt) => doubt.assignedSlotId);

    const [users, slots] = await Promise.all([
      getUsersByIds(relatedUserIds),
      Promise.all(relatedSlotIds.filter(Boolean).map((slotId) => getSlotById(slotId))),
    ]);

    const userMap = buildUserMap(users, ['name']);
    const slotMap = buildSlotMap(slots);

    res.json({
      success: true,
      doubts: doubts.map((doubt) => ({
        ...publicDoubt(doubt),
        assignedSlotId: doubt.assignedSlotId ? slotMap.get(doubt.assignedSlotId) || null : null,
        resolvingStaffId: doubt.resolvingStaffId
          ? userMap.get(doubt.resolvingStaffId) || null
          : null,
        targetStaffId: doubt.targetStaffId ? userMap.get(doubt.targetStaffId) || null : null,
      })),
    });
  } catch (error) {
    console.error('Get student doubts error:', error);
    res.status(500).json({ error: 'Failed to fetch your doubts' });
  }
};

export const getStaffDoubts = async (req, res) => {
  try {
    const staff = await getUserById(req.userId);
    if (!staff) {
      return res.status(404).json({ error: 'Staff not found' });
    }

    const normalizedStaffSubject = (staff.subject || '').trim().toLowerCase();
    const doubts = sortNewestFirst(
      (await listDoubts()).filter(
        (doubt) =>
          doubt.targetStaffId === req.userId ||
          (!doubt.targetStaffId &&
            doubt.subject?.trim().toLowerCase() === normalizedStaffSubject)
      )
    );

    const relatedUserIds = doubts.flatMap((doubt) => [
      doubt.studentId,
      doubt.targetStaffId,
      doubt.resolvingStaffId,
    ]);
    const relatedSlotIds = doubts.map((doubt) => doubt.assignedSlotId);

    const [users, slots] = await Promise.all([
      getUsersByIds(relatedUserIds),
      Promise.all(relatedSlotIds.filter(Boolean).map((slotId) => getSlotById(slotId))),
    ]);

    const userMap = buildUserMap(users, ['name', 'email']);
    const slotMap = buildSlotMap(slots);

    res.json({
      success: true,
      doubts: doubts.map((doubt) => ({
        ...publicDoubt(doubt),
        assignedSlotId: doubt.assignedSlotId ? slotMap.get(doubt.assignedSlotId) || null : null,
        resolvingStaffId: doubt.resolvingStaffId
          ? userMap.get(doubt.resolvingStaffId) || null
          : null,
        studentId: doubt.studentId ? userMap.get(doubt.studentId) || null : null,
        targetStaffId: doubt.targetStaffId ? userMap.get(doubt.targetStaffId) || null : null,
      })),
    });
  } catch (error) {
    console.error('Get staff doubts error:', error);
    res.status(500).json({ error: 'Failed to fetch assigned doubts' });
  }
};

export const updateDoubtStatus = async (req, res) => {
  try {
    const { doubtId } = req.params;
    const { status, assignedSlotId, reply, resolutionType, offlineSchedule } = req.body;

    const doubt = await getDoubtById(doubtId);
    if (!doubt) {
      return res.status(404).json({ error: 'Doubt not found' });
    }

    if (resolutionType && !VALID_RESOLUTION_TYPES.has(resolutionType)) {
      return res.status(400).json({ error: 'Invalid resolution type' });
    }

    const normalizedReply =
      typeof reply === 'string'
        ? reply.trim()
        : reply;

    let nextStatus = status || doubt.status;
    let nextAssignedSlotId =
      assignedSlotId !== undefined ? assignedSlotId : doubt.assignedSlotId;
    let nextOfflineSchedule =
      offlineSchedule !== undefined ? offlineSchedule : doubt.offlineSchedule;
    let nextResolutionType =
      resolutionType !== undefined ? resolutionType : doubt.resolutionType || null;

    if (resolutionType === 'reply') {
      if (!normalizedReply) {
        return res.status(400).json({ error: 'Reply is required to resolve the doubt' });
      }

      nextStatus = status || 'Resolved';
      nextAssignedSlotId = null;
      nextOfflineSchedule = null;
    }

    if (resolutionType === 'offline') {
      const normalizedOfflineSchedule = normalizeOfflineScheduleInput(offlineSchedule);
      const offlineDateTime = getSlotDateTime(
        normalizedOfflineSchedule?.date,
        normalizedOfflineSchedule?.time
      );

      if (
        !normalizedOfflineSchedule?.place ||
        !normalizedOfflineSchedule?.date ||
        !normalizedOfflineSchedule?.time
      ) {
        return res.status(400).json({ error: 'Offline place, date, and time are required' });
      }

      if (!offlineDateTime || offlineDateTime <= new Date()) {
        return res
          .status(400)
          .json({ error: 'Offline schedule must be a future date and time' });
      }

      nextStatus = status || 'Offline Scheduled';
      nextAssignedSlotId = null;
      nextOfflineSchedule = normalizedOfflineSchedule;
    }

    const updatedDoubt = await updateDoubt(doubtId, {
      assignedSlotId: nextAssignedSlotId,
      offlineSchedule: nextOfflineSchedule,
      reply: normalizedReply !== undefined ? normalizedReply : doubt.reply,
      resolutionType: nextResolutionType,
      resolvingStaffId: req.userId,
      status: nextStatus,
    });

    if (req.app.get('io')) {
      req.app.get('io').emit('doubt_updated');
    }

    res.json({ success: true, doubt: publicDoubt(updatedDoubt) });
  } catch (error) {
    console.error('Update doubt error:', error);
    res.status(500).json({ error: 'Failed to update doubt' });
  }
};
