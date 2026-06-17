import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const projectId = process.env.FIREBASE_PROJECT_ID || "automated-objective-1v8b6";

if (!getApps().length) {
  initializeApp({
    projectId: projectId,
  });
}

export const adminAuth = getAuth();

