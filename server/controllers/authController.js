import jwt from 'jwt-simple';
import dotenv from 'dotenv';
import { OAuth2Client } from 'google-auth-library';
import {
  comparePassword,
  createUser,
  findUserByEmail,
  findUserByGoogleId,
  getUserById,
  listUsers,
  publicUser,
  updateUser,
} from '../lib/firestoreStore.js';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_change_in_production_12345';
const GOOGLE_CLIENT_IDS = (process.env.GOOGLE_CLIENT_IDS || process.env.GOOGLE_CLIENT_ID || '')
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);
const googleAuthClient = GOOGLE_CLIENT_IDS.length ? new OAuth2Client() : null;
const VALID_ROLES = new Set(['student', 'staff']);
const VALID_GOOGLE_MODES = new Set(['login', 'register']);

const issueAuthToken = (user) => jwt.encode({ userId: user._id, role: user.role }, JWT_SECRET);

const buildAuthResponse = (res, user, message, status = 200) =>
  res.status(status).json({
    success: true,
    message,
    token: issueAuthToken(user),
    user: publicUser(user),
  });

const getPortalName = (role) => (role === 'staff' ? 'staff' : 'student');
const getPublicAuthErrorMessage = (error, fallbackMessage) => {
  const details = [error?.message, error?.details].filter(Boolean).join(' ');

  if (/Firebase is not configured|Invalid PEM formatted message|private key/i.test(details)) {
    return 'Firebase is not configured correctly. Add a valid Firebase service account private key in server/.env and restart the server.';
  }

  if (error?.code === 5 || /5 NOT_FOUND|NOT_FOUND|Requested entity was not found/i.test(details)) {
    return 'Cloud Firestore was not found for the configured Firebase project. Create a Firestore database for that project, or replace server/firebase-service-account.json with credentials from the correct project, then restart the server.';
  }

  if (error?.code === 7 || /7 PERMISSION_DENIED|permission denied/i.test(details)) {
    return 'The configured Firebase service account does not have permission to access Cloud Firestore. Grant Firestore access to the service account or use credentials from a project owner/editor account, then restart the server.';
  }

  return fallbackMessage;
};

export const register = async (req, res) => {
  try {
    const { name, email, password, confirmPassword, role, subject } = req.body;

    if (!name || !email || !password || !confirmPassword || !role) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const user = await createUser({
      email,
      name,
      password,
      role,
      subject: role === 'staff' ? (subject || '').trim() : '',
    });

    buildAuthResponse(res, user, 'User registered successfully', 201);
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: getPublicAuthErrorMessage(error, 'Registration failed') });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ error: 'Email, password, and role are required' });
    }

    const user = await findUserByEmail(email);
    if (!user || user.role !== role) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (!user.password) {
      return res.status(400).json({
        error: 'This account uses Google sign-in. Continue with Google to access it.',
      });
    }

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    buildAuthResponse(res, user, 'Login successful');
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: getPublicAuthErrorMessage(error, 'Login failed') });
  }
};

export const googleAuth = async (req, res) => {
  try {
    const { credential, mode = 'login', name = '', role, subject = '' } = req.body;

    if (!credential) {
      return res.status(400).json({ error: 'Google credential is required' });
    }

    if (!VALID_ROLES.has(role)) {
      return res.status(400).json({ error: 'A valid role is required' });
    }

    if (!VALID_GOOGLE_MODES.has(mode)) {
      return res.status(400).json({ error: 'Invalid Google authentication mode' });
    }

    if (!googleAuthClient || !GOOGLE_CLIENT_IDS.length) {
      throw new Error(
        'Google sign-in is not configured. Set GOOGLE_CLIENT_ID or GOOGLE_CLIENT_IDS on the server.'
      );
    }

    const ticket = await googleAuthClient.verifyIdToken({
      audience: GOOGLE_CLIENT_IDS,
      idToken: credential,
    });
    const payload = ticket.getPayload();

    if (!payload?.sub || !payload.email) {
      return res.status(401).json({ error: 'Unable to verify the selected Google account' });
    }

    if (payload.email_verified === false) {
      return res
        .status(401)
        .json({ error: 'Your Google account email must be verified before signing in.' });
    }

    const normalizedSubject = subject.trim();
    const existingByGoogleId = await findUserByGoogleId(payload.sub);
    const existingByEmail = await findUserByEmail(payload.email);
    const existingUser = existingByGoogleId || existingByEmail;

    if (existingUser && existingUser.role !== role) {
      return res.status(403).json({
        error: `This Google account is already linked to a ${existingUser.role} profile. Please use the ${getPortalName(existingUser.role)} portal.`,
      });
    }

    if (!existingUser && mode === 'login') {
      return res.status(404).json({
        error: `No ${getPortalName(role)} account was found for this Google profile. Please register first.`,
      });
    }

    if (!existingUser && role === 'staff' && !normalizedSubject) {
      return res.status(400).json({
        error: 'Subject specialty is required the first time a staff member signs in with Google.',
      });
    }

    if (!existingUser) {
      const user = await createUser({
        avatar: payload.picture || undefined,
        email: payload.email,
        emailVerified: payload.email_verified !== false,
        googleId: payload.sub,
        name: name.trim() || payload.name || payload.email,
        password: null,
        role,
        subject: role === 'staff' ? normalizedSubject : '',
      });

      return buildAuthResponse(res, user, 'Google account registered successfully', 201);
    }

    const updates = {};
    if (!existingUser.googleId) {
      updates.googleId = payload.sub;
    }
    if (existingUser.emailVerified !== true && payload.email_verified !== false) {
      updates.emailVerified = true;
    }
    if (!existingUser.avatar && payload.picture) {
      updates.avatar = payload.picture;
    }

    const nextUser =
      Object.keys(updates).length > 0
        ? await updateUser(existingUser._id, updates)
        : existingUser;

    const message =
      mode === 'register' && Object.keys(updates).length > 0
        ? 'Google sign-in connected to your existing account'
        : 'Google sign-in successful';

    return buildAuthResponse(res, nextUser || existingUser, message);
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({
      error: getPublicAuthErrorMessage(error, error.message || 'Google sign-in failed'),
    });
  }
};

export const getProfile = async (req, res) => {
  try {
    const user = await getUserById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ success: true, user: publicUser(user) });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: getPublicAuthErrorMessage(error, 'Failed to fetch profile') });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { name, phone, bio, subject } = req.body;

    const user = await updateUser(req.userId, {
      bio,
      name,
      phone,
      subject: subject ? subject.trim() : '',
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ success: true, user: publicUser(user) });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: getPublicAuthErrorMessage(error, 'Failed to update profile') });
  }
};

export const getAllStaff = async (req, res) => {
  try {
    const staff = (await listUsers('staff')).map((user) => publicUser(user));
    res.json({ success: true, staff });
  } catch (error) {
    console.error('Get staff error:', error);
    res.status(500).json({ error: getPublicAuthErrorMessage(error, 'Failed to fetch staff') });
  }
};

export const getAllStudents = async (req, res) => {
  try {
    const students = (await listUsers('student')).map((user) => publicUser(user));
    res.json({ success: true, students });
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ error: getPublicAuthErrorMessage(error, 'Failed to fetch students') });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = (await listUsers()).map((user) => publicUser(user));
    res.json({ success: true, users });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ error: getPublicAuthErrorMessage(error, 'Failed to fetch all users') });
  }
};
