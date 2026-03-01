import admin from "firebase-admin";

let firebaseApp = null;

export const getFirebase = () => {
  if (firebaseApp) return admin;

  const base64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (!base64) {
    console.log("⚠️ Firebase not configured (FIREBASE_SERVICE_ACCOUNT_BASE64 missing). Notifications disabled.");
    return null;
  }

  const json = Buffer.from(base64, "base64").toString("utf-8");
  const serviceAccount = JSON.parse(json);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });

  firebaseApp = admin;
  console.log("✅ Firebase Admin initialized");
  return admin;
};