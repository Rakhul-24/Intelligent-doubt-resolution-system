import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const resolvePrivateKey = (value = '') => value.replace(/\\n/g, '\n');
const normalizeServiceAccount = (serviceAccount = {}) => {
  if (!serviceAccount || typeof serviceAccount !== 'object') {
    return serviceAccount;
  }

  const projectId = serviceAccount.projectId || serviceAccount.project_id;
  const clientEmail = serviceAccount.clientEmail || serviceAccount.client_email;
  const privateKey = serviceAccount.privateKey || serviceAccount.private_key;

  return {
    ...serviceAccount,
    ...(projectId ? { projectId } : {}),
    ...(clientEmail ? { clientEmail } : {}),
    ...(privateKey ? { privateKey: resolvePrivateKey(privateKey) } : {}),
  };
};
const parseServiceAccountJson = (value, sourceLabel) => {
  try {
    return normalizeServiceAccount(JSON.parse(value));
  } catch (error) {
    throw new Error(`Invalid Firebase service account JSON in ${sourceLabel}: ${error.message}`);
  }
};

const loadServiceAccountFromPath = (serviceAccountPath) => {
  if (!serviceAccountPath) return null;

  const absolutePath = path.isAbsolute(serviceAccountPath)
    ? serviceAccountPath
    : path.resolve(__dirname, '..', serviceAccountPath);

  try {
    const fileContent = fs.readFileSync(absolutePath, 'utf8');
    return parseServiceAccountJson(fileContent, `FIREBASE_SERVICE_ACCOUNT_PATH (${absolutePath})`);
  } catch (error) {
    if (error?.code === 'ENOENT') {
      throw new Error(
        `Firebase service account file was not found at ${absolutePath}. On Render, set FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY instead of FIREBASE_SERVICE_ACCOUNT_PATH.`
      );
    }

    throw error;
  }
};

const loadServiceAccount = () => {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    return parseServiceAccountJson(
      process.env.FIREBASE_SERVICE_ACCOUNT_JSON,
      'FIREBASE_SERVICE_ACCOUNT_JSON'
    );
  }

  const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } = process.env;
  if (FIREBASE_PROJECT_ID && FIREBASE_CLIENT_EMAIL && FIREBASE_PRIVATE_KEY) {
    return normalizeServiceAccount({
      projectId: FIREBASE_PROJECT_ID,
      clientEmail: FIREBASE_CLIENT_EMAIL,
      privateKey: resolvePrivateKey(FIREBASE_PRIVATE_KEY),
    });
  }

  if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    return loadServiceAccountFromPath(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
  }

  return null;
};

const shouldUseApplicationDefaultCredentials = () =>
  Boolean(process.env.GOOGLE_APPLICATION_CREDENTIALS) ||
  process.env.FIREBASE_USE_APPLICATION_DEFAULT === 'true';

let firestoreDb = null;
let initializationError = null;

try {
  const serviceAccount = loadServiceAccount();
  if (!serviceAccount && !shouldUseApplicationDefaultCredentials()) {
    throw new Error(
      'Firebase is not configured. Set FIREBASE_SERVICE_ACCOUNT_JSON, FIREBASE_SERVICE_ACCOUNT_PATH, FIREBASE_PROJECT_ID/FIREBASE_CLIENT_EMAIL/FIREBASE_PRIVATE_KEY, or GOOGLE_APPLICATION_CREDENTIALS.'
    );
  }

  const app =
    getApps()[0] ||
    initializeApp(
      serviceAccount
        ? { credential: cert(serviceAccount) }
        : { credential: applicationDefault() }
    );

  firestoreDb = getFirestore(app);
} catch (error) {
  initializationError = error;
}

export const db = firestoreDb;

export const getFirebaseStatus = () => ({
  connected: Boolean(firestoreDb),
  provider: 'Cloud Firestore',
  error:
    initializationError?.message ||
    (!firestoreDb
      ? 'Firebase is not configured. Set FIREBASE_SERVICE_ACCOUNT_JSON, FIREBASE_SERVICE_ACCOUNT_PATH, FIREBASE_PROJECT_ID/FIREBASE_CLIENT_EMAIL/FIREBASE_PRIVATE_KEY, or GOOGLE_APPLICATION_CREDENTIALS.'
      : null),
});

export const assertFirebaseReady = () => {
  if (!firestoreDb) {
    const status = getFirebaseStatus();
    throw new Error(status.error || 'Firebase is not configured.');
  }

  return firestoreDb;
};
