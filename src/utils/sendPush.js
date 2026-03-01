import { getFirebase } from "../config/firebase.js";

export const sendPushToTokens = async ({ tokens, title, body, data = {} }) => {
  if (!tokens?.length) return { ok: false, reason: "NO_TOKENS" };

  const admin = getFirebase();
  if (!admin) return { ok: false, reason: "FIREBASE_NOT_CONFIGURED" };

  // Firebase requires all data values as strings
  const safeData = {};
  Object.keys(data || {}).forEach((k) => (safeData[k] = String(data[k])));

  const message = {
    tokens,
    notification: { title, body },
    data: safeData
  };

  const res = await admin.messaging().sendEachForMulticast(message);
  return { ok: true, successCount: res.successCount, failureCount: res.failureCount };
};