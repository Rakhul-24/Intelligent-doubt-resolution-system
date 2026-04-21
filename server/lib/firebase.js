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

const loadServiceAccountFromPath = (serviceAccountPath) => {
  if (!serviceAccountPath) return null;

  const absolutePath = path.isAbsolute(serviceAccountPath)
    ? serviceAccountPath
    : path.resolve(__dirname, '..', serviceAccountPath);

  const fileContent = fs.readFileSync(absolutePath, 'utf8');
  return JSON.parse(fileContent);
};

const loadServiceAccount = () => {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  }

  if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    return loadServiceAccountFromPath(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
  }

  const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } = process.env;
  if (FIREBASE_PROJECT_ID && FIREBASE_CLIENT_EMAIL && FIREBASE_PRIVATE_KEY) {
    return {
      projectId: FIREBASE_PROJECT_ID,
      clientEmail: FIREBASE_CLIENT_EMAIL,
      privateKey: resolvePrivateKey(FIREBASE_PRIVATE_KEY),
    };
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
