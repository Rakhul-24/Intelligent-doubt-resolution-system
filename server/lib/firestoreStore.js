import bcryptjs from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { assertFirebaseReady } from './firebase.js';
import { buildMeetingRoomId } from '../utils/meeting.js';

const COLLECTIONS = Object.freeze({
  chats: 'chats',
  doubts: 'doubts',
  materials: 'materials',
  slots: 'slots',
  users: 'users',
});

const DEFAULT_AVATAR = 'https://via.placeholder.com/150';
const INTERNAL_FIELDS = new Set(['googleId', 'subjectLower']);

const nowIso = () => new Date().toISOString();

const uniqueIds = (values = []) =>
  [...new Set(values.filter((value) => typeof value === 'string' && value.trim()))];

const normalizeEmail = (value = '') => value.toString().trim().toLowerCase();
const normalizeSubject = (value = '') => value.toString().trim().toLowerCase();
const normalizeOfflineSchedule = (value) => {
  if (value === null) return null;
  if (!value || typeof value !== 'object') return undefined;

  return stripUndefined({
    date: value.date?.toString().trim(),
    notes:
      typeof value.notes === 'string'
        ? value.notes.trim()
        : value.notes?.toString().trim(),
    place:
      typeof value.place === 'string'
        ? value.place.trim()
        : value.place?.toString().trim(),
    time: value.time?.toString().trim(),
  });
};

const isTimestampLike = (value) =>
  value && typeof value === 'object' && typeof value.toDate === 'function';

const normalizeValue = (value) => {
  if (Array.isArray(value)) {
    return value.map(normalizeValue);
  }

  if (isTimestampLike(value)) {
    return value.toDate().toISOString();
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [key, normalizeValue(nestedValue)])
    );
  }

  return value;
};

const stripUndefined = (value) =>
  Object.fromEntries(Object.entries(value).filter(([, nestedValue]) => nestedValue !== undefined));

const toRawDocument = (snapshot) =>
  snapshot?.exists ? { _id: snapshot.id, ...normalizeValue(snapshot.data()) } : null;

const toPublicDocument = (document) => {
  if (!document) return null;

  const normalized = normalizeValue(document);
  const sanitized = { ...normalized };

  INTERNAL_FIELDS.forEach((fieldName) => {
    delete sanitized[fieldName];
  });

  return sanitized;
};

const pickFields = (document, fields = null) => {
  if (!document) return null;
  if (!fields?.length) return document;

  const picked = { _id: document._id };
  fields.forEach((fieldName) => {
    if (document[fieldName] !== undefined) {
      picked[fieldName] = document[fieldName];
    }
  });

  return picked;
};

const getCollection = (collectionName) => assertFirebaseReady().collection(collectionName);

const getDocument = async (collectionName, id) => {
  if (!id) return null;
  return toRawDocument(await getCollection(collectionName).doc(id).get());
};

const getDocumentsByIds = async (collectionName, ids) => {
  const db = assertFirebaseReady();
  const resolvedIds = uniqueIds(ids);

  if (!resolvedIds.length) {
    return [];
  }

  const snapshots = await db.getAll(
    ...resolvedIds.map((id) => db.collection(collectionName).doc(id))
  );

  return snapshots.map(toRawDocument).filter(Boolean);
};

const listDocuments = async (collectionName) => {
  const snapshot = await getCollection(collectionName).get();
  return snapshot.docs.map(toRawDocument).filter(Boolean);
};

const setDocument = async (collectionName, id, data) => {
  await getCollection(collectionName).doc(id).set(stripUndefined(data));
  return getDocument(collectionName, id);
};

const updateDocument = async (collectionName, id, updates) => {
  const existingDocument = await getDocument(collectionName, id);
  if (!existingDocument) {
    return null;
  }

  const mergedDocument = {
    ...existingDocument,
    ...stripUndefined(updates),
    updatedAt: nowIso(),
  };

  delete mergedDocument._id;
  return setDocument(collectionName, id, mergedDocument);
};

const deleteDocument = async (collectionName, id) => {
  const existingDocument = await getDocument(collectionName, id);
  if (!existingDocument) {
    return null;
  }

  await getCollection(collectionName).doc(id).delete();
  return existingDocument;
};

export const publicUser = (user, fields = null) => {
  if (!user) return null;

  const sanitizedUser = toPublicDocument(user);
  delete sanitizedUser.password;

  return pickFields(sanitizedUser, fields);
};

export const publicDoubt = (doubt) => toPublicDocument(doubt);
export const publicSlot = (slot) => toPublicDocument(slot);
export const publicChat = (chat) => toPublicDocument(chat);
export const publicMaterial = (material) => toPublicDocument(material);

export const createUser = async ({
  name,
  email,
  password,
  role,
  subject = '',
  phone = '',
  bio = '',
  avatar = DEFAULT_AVATAR,
  emailVerified = false,
  googleId = null,
}) => {
  const id = getCollection(COLLECTIONS.users).doc().id;
  const timestamp = nowIso();
  const normalizedSubject = role === 'staff' ? subject.trim() : '';
  const hashedPassword = password ? await bcryptjs.hash(password, 10) : null;

  return setDocument(COLLECTIONS.users, id, {
    avatar,
    bio,
    createdAt: timestamp,
    email: normalizeEmail(email),
    emailVerified: Boolean(emailVerified),
    googleId,
    name: name.trim(),
    password: hashedPassword,
    phone,
    role,
    subject: normalizedSubject,
    subjectLower: normalizeSubject(normalizedSubject),
    updatedAt: timestamp,
  });
};

export const findUserByEmail = async (email) => {
  const snapshot = await getCollection(COLLECTIONS.users)
    .where('email', '==', normalizeEmail(email))
    .limit(1)
    .get();

  return snapshot.empty ? null : toRawDocument(snapshot.docs[0]);
};

export const findUserByGoogleId = async (googleId) => {
  if (!googleId) return null;

  const snapshot = await getCollection(COLLECTIONS.users)
    .where('googleId', '==', googleId)
    .limit(1)
    .get();

  return snapshot.empty ? null : toRawDocument(snapshot.docs[0]);
};

export const getUserById = async (userId) => getDocument(COLLECTIONS.users, userId);

export const getUsersByIds = async (userIds) => getDocumentsByIds(COLLECTIONS.users, userIds);

export const listUsers = async (role = null) => {
  const users = role
    ? (
        await getCollection(COLLECTIONS.users)
          .where('role', '==', role)
          .get()
      ).docs.map(toRawDocument).filter(Boolean)
    : await listDocuments(COLLECTIONS.users);

  return users;
};

export const updateUser = async (userId, updates) => {
  const existingUser = await getUserById(userId);
  if (!existingUser) {
    return null;
  }

  const nextSubject =
    updates.subject !== undefined
      ? updates.subject
      : existingUser.subject || '';

  return updateDocument(COLLECTIONS.users, userId, {
    ...updates,
    email: updates.email ? normalizeEmail(updates.email) : undefined,
    subjectLower:
      existingUser.role === 'staff' || updates.role === 'staff'
        ? normalizeSubject(nextSubject)
        : '',
  });
};

export const comparePassword = async (enteredPassword, hashedPassword) =>
  hashedPassword ? bcryptjs.compare(enteredPassword, hashedPassword) : false;

export const createDoubtRecord = async ({
  studentId,
  subject,
  targetStaffId = null,
  question,
  requestSlot = false,
}) => {
  const id = getCollection(COLLECTIONS.doubts).doc().id;
  const timestamp = nowIso();
  const normalizedSubject = subject.trim();

  return setDocument(COLLECTIONS.doubts, id, {
    assignedSlotId: null,
    createdAt: timestamp,
    offlineSchedule: null,
    question: question.trim(),
    reply: '',
    requestSlot: Boolean(requestSlot),
    resolutionType: null,
    resolvingStaffId: null,
    status: 'Open',
    studentId,
    subject: normalizedSubject,
    subjectLower: normalizeSubject(normalizedSubject),
    targetStaffId: targetStaffId || null,
    updatedAt: timestamp,
  });
};

export const getDoubtById = async (doubtId) => getDocument(COLLECTIONS.doubts, doubtId);

export const listDoubts = async () => listDocuments(COLLECTIONS.doubts);

export const getDoubtsByStudent = async (studentId) =>
  (
    await getCollection(COLLECTIONS.doubts)
      .where('studentId', '==', studentId)
      .get()
  ).docs.map(toRawDocument).filter(Boolean);

export const updateDoubt = async (doubtId, updates) => {
  const nextSubject = updates.subject?.trim();

  return updateDocument(COLLECTIONS.doubts, doubtId, {
    ...updates,
    offlineSchedule:
      updates.offlineSchedule !== undefined
        ? normalizeOfflineSchedule(updates.offlineSchedule)
        : undefined,
    question: updates.question?.trim(),
    reply:
      updates.reply !== undefined
        ? typeof updates.reply === 'string'
          ? updates.reply.trim()
          : updates.reply
        : undefined,
    subject: nextSubject,
    subjectLower: nextSubject ? normalizeSubject(nextSubject) : undefined,
  });
};

export const createSlotRecord = async ({
  staffId,
  studentIds = [],
  doubtId,
  date,
  time,
  duration = 30,
  topic = '',
  notes = '',
}) => {
  const id = getCollection(COLLECTIONS.slots).doc().id;
  const timestamp = nowIso();

  return setDocument(COLLECTIONS.slots, id, {
    createdAt: timestamp,
    date,
    doubtId,
    duration: Number(duration) || 30,
    meetingProvider: 'Jitsi Meet',
    meetingRoomId: buildMeetingRoomId(),
    notes,
    shareableLink: uuidv4(),
    staffId,
    status: 'Pending Student Confirmation',
    studentIds: uniqueIds(studentIds),
    time,
    topic,
    updatedAt: timestamp,
  });
};

export const getSlotById = async (slotId) => getDocument(COLLECTIONS.slots, slotId);

export const findSlotByShareableLink = async (shareableLink) => {
  const snapshot = await getCollection(COLLECTIONS.slots)
    .where('shareableLink', '==', shareableLink)
    .limit(1)
    .get();

  return snapshot.empty ? null : toRawDocument(snapshot.docs[0]);
};

export const getSlotsByStaff = async (staffId) =>
  (
    await getCollection(COLLECTIONS.slots)
      .where('staffId', '==', staffId)
      .get()
  ).docs.map(toRawDocument).filter(Boolean);

export const getSlotsByStudent = async (studentId) =>
  (
    await getCollection(COLLECTIONS.slots)
      .where('studentIds', 'array-contains', studentId)
      .get()
  ).docs.map(toRawDocument).filter(Boolean);

export const updateSlot = async (slotId, updates) =>
  updateDocument(COLLECTIONS.slots, slotId, {
    ...updates,
    studentIds: updates.studentIds ? uniqueIds(updates.studentIds) : undefined,
  });

export const deleteSlot = async (slotId) => deleteDocument(COLLECTIONS.slots, slotId);

export const createChatRecord = async ({
  senderId,
  receiverId,
  message = '',
  attachment = null,
}) => {
  const id = getCollection(COLLECTIONS.chats).doc().id;
  const timestamp = nowIso();

  return setDocument(COLLECTIONS.chats, id, {
    attachment: attachment || null,
    createdAt: timestamp,
    message,
    read: false,
    receiverId,
    senderId,
    timestamp,
    updatedAt: timestamp,
  });
};

export const listChats = async () => listDocuments(COLLECTIONS.chats);

export const updateChat = async (chatId, updates) => updateDocument(COLLECTIONS.chats, chatId, updates);

export const deleteChat = async (chatId) => deleteDocument(COLLECTIONS.chats, chatId);

export const createMaterialRecord = async ({
  staffId,
  title,
  description = '',
  subject,
  topic = '',
  fileUrl,
  fileType = 'pdf',
}) => {
  const id = getCollection(COLLECTIONS.materials).doc().id;
  const timestamp = nowIso();

  return setDocument(COLLECTIONS.materials, id, {
    createdAt: timestamp,
    description,
    fileType,
    fileUrl,
    staffId,
    subject: subject.trim(),
    subjectLower: normalizeSubject(subject),
    title: title.trim(),
    topic,
    updatedAt: timestamp,
    uploadedAt: timestamp,
  });
};

export const getMaterialById = async (materialId) => getDocument(COLLECTIONS.materials, materialId);

export const listMaterials = async () => listDocuments(COLLECTIONS.materials);

export const getMaterialsByStaff = async (staffId) =>
  (
    await getCollection(COLLECTIONS.materials)
      .where('staffId', '==', staffId)
      .get()
  ).docs.map(toRawDocument).filter(Boolean);

export const updateMaterialRecord = async (materialId, updates) =>
  updateDocument(COLLECTIONS.materials, materialId, {
    ...updates,
    subject: updates.subject?.trim(),
    subjectLower: updates.subject ? normalizeSubject(updates.subject) : undefined,
    title: updates.title?.trim(),
    topic: updates.topic?.trim(),
  });

export const deleteMaterialRecord = async (materialId) =>
  deleteDocument(COLLECTIONS.materials, materialId);
