import { initializeApp } from 'firebase/app';
import { getAnalytics } from "firebase/analytics";
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, query, where, getDocs, getCountFromServer, orderBy, Timestamp } from 'firebase/firestore';
import Constants from 'expo-constants';

const firebaseConfig = {
  apiKey: "AIzaSyA4o2bhIDA5W4xiy_e8vIQ1bJY-Ed6r9GI",
  authDomain: "paynothingapp.firebaseapp.com",
  projectId: "paynothingapp",
  storageBucket: "paynothingapp.firebasestorage.app",
  messagingSenderId: "115198796724",
  appId: "1:115198796724:web:6959329825d78b13f788e1",
  measurementId: "G-GX0CM29V3M"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

// Collection references
export const usersCollection = collection(db, 'users');
export const videosCollection = collection(db, 'videos');
export const messagesCollection = collection(db, 'messages');
export const matchesCollection = collection(db, 'matches');

interface DailyUploadCount {
  [date: string]: number;
}

interface UploadStats {
  date: string;
  count: number;
}

// Helper functions for dashboard
export const getTotalUsers = async () => {
  const snapshot = await getCountFromServer(usersCollection);
  return snapshot.data().count;
};

export const getTotalVideos = async () => {
  const snapshot = await getCountFromServer(videosCollection);
  return snapshot.data().count;
};

export const getTotalMessages = async () => {
  const snapshot = await getCountFromServer(messagesCollection);
  return snapshot.data().count;
};

export const getTotalMatches = async () => {
  const snapshot = await getCountFromServer(matchesCollection);
  return snapshot.data().count;
};

export const getVideoUploadStats = async (days = 30): Promise<UploadStats[]> => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const q = query(
    videosCollection,
    where('upload_time', '>=', startDate.getTime()),
    orderBy('upload_time', 'asc')
  );

  const snapshot = await getDocs(q);
  const uploads = snapshot.docs.map(doc => ({
    timestamp: doc.data().upload_time,
    date: new Date(doc.data().upload_time)
  }));

  // Group by day
  const dailyUploads: DailyUploadCount = uploads.reduce((acc, upload) => {
    const dateKey = new Date(upload.timestamp).toISOString().split('T')[0];
    acc[dateKey] = (acc[dateKey] || 0) + 1;
    return acc;
  }, {} as DailyUploadCount);

  // Fill in missing days and sort in descending order
  const result: UploadStats[] = [];
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateKey = date.toISOString().split('T')[0];
    result.unshift({
      date: dateKey,
      count: dailyUploads[dateKey] || 0
    });
  }

  return result;
};


export const getRecentUsers = async (limit = 5) => {
  const q = query(usersCollection, where('createdAt', '>=', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const getRecentVideos = async (limit = 5) => {
  const q = query(videosCollection, where('createdAt', '>=', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const getRecentMessages = async (limit = 5) => {
  const q = query(messagesCollection, where('timestamp', '>=', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const getRecentMatches = async (limit = 5) => {
  const q = query(matchesCollection, where('createdAt', '>=', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Utility to build an array of ISO dates (YYYY‑MM‑DD) for the past N days
function makeDateSeries(days: number) {
  const today = new Date();
  return Array.from({ length: days }).map((_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (days - 1 - i));
    return d.toISOString().split('T')[0];
  });
}

/**
 * Returns message counts per day over the past `days` days.
 */
export const getMessageVolumeStats = async (
  days = 30
): Promise<UploadStats[]> => {
  const start = new Date();
  start.setDate(start.getDate() - (days - 1));

  const q = query(
    messagesCollection,
    where('timestamp', '>=', start.getTime()),
    orderBy('timestamp', 'asc')
  );
  const snap = await getDocs(q);

  // tally per-day counts
  const counts: Record<string, number> = {};
  snap.forEach(doc => {
    const ts = doc.data().timestamp as number;
    const key = new Date(ts).toISOString().split('T')[0];
    counts[key] = (counts[key] || 0) + 1;
  });

  const result = makeDateSeries(days).map(date => ({
    date,
    count: counts[date] || 0,
  }));

  return result;
};

/**
 * Returns match counts per day over the past `days` days.
 */
export const getMatchVolumeStats = async (
  days = 30
): Promise<UploadStats[]> => {
  const start = new Date();
  start.setDate(start.getDate() - (days - 1));

  const q = query(
    matchesCollection,
    where('timestamp', '>=', start.getTime()),
    orderBy('timestamp', 'asc')
  );
  const snap = await getDocs(q);

  const counts: Record<string, number> = {};
  snap.forEach(doc => {
    const ts = doc.data().timestamp as number;
    const key = new Date(ts).toISOString().split('T')[0];
    counts[key] = (counts[key] || 0) + 1;
  });

  const result = makeDateSeries(days)
    .map(date => ({
      date,
      count: counts[date] || 0,
    }));

  // console.log('matches data:', result);
  return result;
};

/**
 * Returns Daily Active Users (unique users who sent a message or uploaded a video)
 * per day over the past `days` days.
 * Assumes your message docs have `senderId` and your video docs have `uploaderId`.
 */
export const getDailyActiveUsersStats = async (
  days = 30
): Promise<UploadStats[]> => {
  const start = new Date();
  start.setDate(start.getDate() - (days - 1));

  const msgQ = query(
    messagesCollection,
    where('timestamp', '>=', start.getTime())
  );
  const vidQ = query(
    videosCollection,
    where('upload_time', '>=', start.getTime())
  );

  const [msgSnap, vidSnap] = await Promise.all([getDocs(msgQ), getDocs(vidQ)]);

  // map date → set of user IDs
  const activeMap: Record<string, Set<string>> = {};
  const record = (dayKey: string, uid: string) => {
    if (!activeMap[dayKey]) activeMap[dayKey] = new Set();
    activeMap[dayKey].add(uid);
  };

  msgSnap.forEach(doc => {
    const { timestamp, senderId } = doc.data() as any;
    const day = new Date(timestamp).toISOString().split('T')[0];
    if (senderId) record(day, senderId);
  });

  vidSnap.forEach(doc => {
    const { upload_time, uploaderId } = doc.data() as any;
    const day = new Date(upload_time).toISOString().split('T')[0];
    if (uploaderId) record(day, uploaderId);
  });

  const result = makeDateSeries(days).map(date => ({
    date,
    count: activeMap[date]?.size || 0,
  }));

  return result;
};

/**
 * Returns user signup counts per day over the past `days` days.
 */
export const getUserSignupStats = async (
  days = 30
): Promise<UploadStats[]> => {
  const start = new Date();
  start.setDate(start.getDate() - (days - 1));

  const q = query(
    usersCollection,
    where('createdAt', '>=', start.getTime()),
    orderBy('createdAt', 'asc')
  );
  const snap = await getDocs(q);

  // tally per-day counts
  const counts: Record<string, number> = {};
  snap.forEach(doc => {
    const ts = doc.data().createdAt as number;
    const key = new Date(ts).toISOString().split('T')[0];
    counts[key] = (counts[key] || 0) + 1;
  });

  // fill series and return
  return makeDateSeries(days).map(date => ({
    date,
    count: counts[date] || 0,
  }));
};

export { app, auth, db };