export const getSlotDateTime = (date, time) => {
  if (!date || !time) return null;
  const normalizedTime = time.length === 5 ? `${time}:00` : time;
  const slotDateTime = new Date(`${date}T${normalizedTime}`);
  return Number.isNaN(slotDateTime.getTime()) ? null : slotDateTime;
};

const normalizeDuration = (duration = 30) => {
  const parsedDuration = Number(duration);
  return Number.isFinite(parsedDuration) && parsedDuration > 0 ? parsedDuration : 30;
};

export const getSlotEndDateTime = (date, time, duration = 30) => {
  const slotDateTime = getSlotDateTime(date, time);
  if (!slotDateTime) return null;
  return new Date(slotDateTime.getTime() + normalizeDuration(duration) * 60 * 1000);
};

export const isSlotStartTimeInPast = (date, time) => {
  const slotDateTime = getSlotDateTime(date, time);
  if (!slotDateTime) return true;
  return slotDateTime <= new Date();
};

export const isSlotCompleted = (date, time, duration = 30) => {
  const slotEndDateTime = getSlotEndDateTime(date, time, duration);
  if (!slotEndDateTime) return true;
  return slotEndDateTime <= new Date();
};

export const withComputedSlotState = (slot) => {
  if (!slot) return null;

  const completed = isSlotCompleted(slot.date, slot.time, slot.duration);

  return {
    ...slot,
    isCompleted: completed,
    status: completed ? 'Completed' : slot.status,
  };
};

export const slotHasStudent = (slot, userId) =>
  slot.studentIds.some((student) => {
    if (!student) return false;
    const studentId = student._id || student;
    return studentId.toString() === userId;
  });
