/* ==========================================================
   캡챠(CAPCHA) 로그인과 데이터 처리
   - config.js에 Firebase 설정이 있으면: 구글 로그인 + Cloud Firestore
   - 설정이 비어 있으면: 체험 모드 (이 브라우저의 localStorage만 사용)
   두 방식 모두 같은 함수 이름을 제공하므로 화면 코드는 방식을 몰라도 됩니다.
   ========================================================== */
import { firebaseConfig, emulators } from './config.js';

export const STATUSES = ['접수', '상담 중', '촬영 예정', '제작 중', '전달 완료', '취소'];
export const PRODUCTS = ['인터뷰 영상', '생애 기록 책', '3D 피규어 실사형', '3D 피규어 캐릭터형', '상담 후 결정'];
export const AGES = ['60대', '70대', '80대', '90대 이상', '기타'];
export const REGIONS = ['대전 동구', '대전 중구', '대전 서구', '대전 유성구', '대전 대덕구', '기타'];
export const LIMITS = { name: 40, phone: 20, short: 100, text: 2000, memo: 1000, photos: 10 };

const configured = Boolean(
  firebaseConfig && firebaseConfig.apiKey && firebaseConfig.projectId && !firebaseConfig.apiKey.startsWith('[')
);
export const mode = configured ? 'firebase' : 'demo';

/* ---------- 공통 ---------- */
export class AppError extends Error {
  constructor(message, code) {
    super(message);
    this.code = code || '';
  }
}

const ERROR_TEXT = {
  'auth/popup-blocked': '브라우저가 로그인 창을 막았습니다. 팝업을 허용한 뒤 다시 눌러 주세요.',
  'auth/popup-closed-by-user': '로그인 창이 닫혔습니다.',
  'auth/cancelled-popup-request': '로그인 창이 닫혔습니다.',
  'auth/unauthorized-domain': '이 사이트 주소가 Firebase의 승인된 도메인에 없습니다. 운영자가 Firebase 콘솔에서 주소를 추가해야 합니다.',
  'auth/operation-not-allowed': 'Firebase에서 구글 로그인이 꺼져 있습니다. 운영자가 Firebase 콘솔에서 켜야 합니다.',
  'auth/network-request-failed': '인터넷 연결을 확인한 뒤 다시 시도해 주세요.',
  'auth/too-many-requests': '요청이 너무 많습니다. 잠시 뒤 다시 시도해 주세요.',
  'permission-denied': '권한이 없습니다. 로그인 상태를 확인해 주세요.',
  'unauthenticated': '로그인이 필요합니다.',
  'unavailable': '서버에 연결하지 못했습니다. 인터넷 연결을 확인해 주세요.',
  'not-found': '데이터를 찾을 수 없습니다. Firestore 데이터베이스가 만들어졌는지 확인해 주세요.',
  'failed-precondition': 'Firestore 설정이 끝나지 않았습니다. 운영자에게 알려 주세요.',
  'resource-exhausted': '오늘 쓸 수 있는 무료 사용량을 넘었습니다. 내일 다시 시도해 주세요.',
  'invalid-argument': '입력한 내용 형식이 맞지 않습니다.',
  'quota-exceeded': '이 브라우저의 저장 공간이 부족합니다. 사진 수를 줄이거나 체험 데이터를 지워 주세요.',
};

export function explainError(error) {
  if (error instanceof AppError) return error.message;
  const code = (error && error.code) || '';
  if (ERROR_TEXT[code]) return ERROR_TEXT[code];
  if (error && error.name === 'QuotaExceededError') return ERROR_TEXT['quota-exceeded'];
  return '잠시 뒤 다시 시도해 주세요.' + (code ? ' (오류 코드: ' + code + ')' : '');
}

function toDate(value) {
  if (!value) return null;
  if (typeof value.toDate === 'function') return value.toDate();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function normalize(id, data) {
  return Object.assign({}, data, {
    id: id,
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
    answeredAt: toDate(data.answeredAt),
  });
}

const byNewest = function (a, b) {
  return ((b.createdAt && b.createdAt.getTime()) || 0) - ((a.createdAt && a.createdAt.getTime()) || 0);
};

function clip(value, max) {
  return String(value == null ? '' : value).trim().slice(0, max);
}

// 가족 영상 페이지 주소용 이름: 헷갈리는 글자(0 o 1 l i)를 뺀 31가지 글자로 12자리
const ID_CHARS = 'abcdefghjkmnpqrstuvwxyz23456789';
export function randomId(length) {
  const out = [];
  const buf = new Uint32Array(1);
  const limit = Math.floor(4294967296 / ID_CHARS.length) * ID_CHARS.length;
  while (out.length < (length || 12)) {
    crypto.getRandomValues(buf);
    if (buf[0] >= limit) continue;
    out.push(ID_CHARS[buf[0] % ID_CHARS.length]);
  }
  return out.join('');
}

export function parseYouTubeId(input) {
  const text = String(input || '').trim();
  if (/^[A-Za-z0-9_-]{11}$/.test(text)) return text;
  try {
    const url = new URL(text);
    const host = url.hostname.replace(/^www\.|^m\./, '');
    if (host === 'youtu.be') return valid(url.pathname.slice(1, 12));
    if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
      if (url.searchParams.get('v')) return valid(url.searchParams.get('v'));
      const match = url.pathname.match(/^\/(embed|shorts|live)\/([A-Za-z0-9_-]{11})/);
      if (match) return match[2];
    }
  } catch (e) {
    return '';
  }
  return '';
  function valid(id) {
    return /^[A-Za-z0-9_-]{11}$/.test(id || '') ? id : '';
  }
}

/* 입력값을 정해진 항목과 길이로만 정리합니다. (보안 규칙과 같은 기준) */
function cleanApplication(data) {
  return {
    applicantName: clip(data.applicantName, LIMITS.name),
    phone: clip(data.phone, LIMITS.phone),
    parentAge: AGES.indexOf(data.parentAge) >= 0 ? data.parentAge : '기타',
    region: REGIONS.indexOf(data.region) >= 0 ? data.region : '기타',
    regionDetail: clip(data.regionDetail, LIMITS.short),
    products: (data.products || []).filter(function (p) { return PRODUCTS.indexOf(p) >= 0; }).slice(0, PRODUCTS.length),
    preferredTime: clip(data.preferredTime, LIMITS.short),
    message: clip(data.message, LIMITS.text),
    consent: data.consent === true,
  };
}

function cleanStory(data, photoCount) {
  return {
    applicantName: clip(data.applicantName, LIMITS.name),
    daily: clip(data.daily, LIMITS.text),
    keepStory: clip(data.keepStory, LIMITS.text),
    questions: clip(data.questions, LIMITS.text),
    photoNote: clip(data.photoNote, LIMITS.memo),
    photoCount: photoCount,
    consent: data.consent === true,
  };
}

function cleanInquiry(data) {
  return {
    name: clip(data.name, LIMITS.name),
    title: clip(data.title, LIMITS.short),
    body: clip(data.body, LIMITS.text),
  };
}

function cleanFamily(data) {
  return {
    title: clip(data.title, LIMITS.short),
    youtubeId: parseYouTubeId(data.youtubeId),
    message: clip(data.message, LIMITS.memo),
  };
}

/* ==========================================================
   Firebase 방식
   ========================================================== */
async function createFirebaseBackend() {
  const fb = await import('./vendor/firebase.js');
  const fbApp = fb.initializeApp(firebaseConfig);
  const auth = fb.getAuth(fbApp);
  const db = fb.getFirestore(fbApp);
  if (emulators && emulators.auth) fb.connectAuthEmulator(auth, emulators.auth, { disableWarnings: true });
  if (emulators && emulators.firestore) fb.connectFirestoreEmulator(db, emulators.firestore.host, emulators.firestore.port);

  let user = null;
  let settled = false;
  const listeners = new Set();
  let resolveReady;
  const ready = new Promise(function (resolve) { resolveReady = resolve; });

  // 관리자만 읽을 수 있는 문서를 읽어 보고 관리자인지 확인합니다. (관리자 이메일은 보안 규칙에만 있습니다)
  async function checkAdmin() {
    try {
      await fb.getDoc(fb.doc(db, 'meta', 'adminCheck'));
      return true;
    } catch (error) {
      if (error && error.code !== 'permission-denied') console.warn('[capcha] 관리자 확인 실패:', error.code || error);
      return false;
    }
  }

  fb.onAuthStateChanged(auth, async function (firebaseUser) {
    if (firebaseUser) {
      const isAdmin = await checkAdmin();
      user = {
        uid: firebaseUser.uid,
        name: firebaseUser.displayName || '이름 없음',
        email: firebaseUser.email || '',
        isAdmin: isAdmin,
      };
    } else {
      user = null;
    }
    settled = true;
    listeners.forEach(function (fn) { fn(user); });
    resolveReady();
  });

  function requireUser() {
    if (!user) throw new AppError('로그인이 필요합니다.', 'unauthenticated');
    return user;
  }

  async function listWhereMine(name) {
    const me = requireUser();
    const snap = await fb.getDocs(fb.query(fb.collection(db, name), fb.where('uid', '==', me.uid)));
    return snap.docs.map(function (d) { return normalize(d.id, d.data()); }).sort(byNewest);
  }

  async function listAll(name) {
    const snap = await fb.getDocs(fb.query(fb.collection(db, name), fb.orderBy('createdAt', 'desc')));
    return snap.docs.map(function (d) { return normalize(d.id, d.data()); });
  }

  return {
    mode: 'firebase',
    ready: ready,
    getUser: function () { return user; },
    onUser: function (fn) {
      listeners.add(fn);
      if (settled) fn(user);
      return function () { listeners.delete(fn); };
    },
    signIn: async function () {
      const provider = new fb.GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await fb.signInWithPopup(auth, provider);
    },
    signOut: function () { return fb.signOut(auth); },

    addApplication: async function (data) {
      const me = requireUser();
      const ref = await fb.addDoc(fb.collection(db, 'applications'), Object.assign(cleanApplication(data), {
        uid: me.uid,
        userEmail: me.email,
        status: '접수',
        adminMemo: '',
        createdAt: fb.serverTimestamp(),
        updatedAt: fb.serverTimestamp(),
      }));
      return ref.id;
    },
    myApplications: function () { return listWhereMine('applications'); },
    allApplications: function () { return listAll('applications'); },
    updateApplication: function (id, patch) {
      return fb.updateDoc(fb.doc(db, 'applications', id), {
        status: STATUSES.indexOf(patch.status) >= 0 ? patch.status : '접수',
        adminMemo: clip(patch.adminMemo, LIMITS.memo),
        updatedAt: fb.serverTimestamp(),
      });
    },
    removeApplication: function (id) { return fb.deleteDoc(fb.doc(db, 'applications', id)); },

    addStory: async function (data, photos, onProgress) {
      const me = requireUser();
      const list = (photos || []).slice(0, LIMITS.photos);
      const ref = await fb.addDoc(fb.collection(db, 'stories'), Object.assign(cleanStory(data, list.length), {
        uid: me.uid,
        userEmail: me.email,
        createdAt: fb.serverTimestamp(),
      }));
      // 사진은 한 장씩 따로 저장합니다. (문서 하나는 1MiB를 넘을 수 없습니다)
      // 문서 이름을 p0 ~ p9로 정해 두어 정해진 장수보다 더 올릴 수 없게 합니다. (보안 규칙과 같은 기준)
      for (let i = 0; i < list.length; i++) {
        await fb.setDoc(fb.doc(db, 'stories', ref.id, 'photos', 'p' + i), {
          uid: me.uid,
          dataUrl: list[i].dataUrl,
          name: clip(list[i].name, LIMITS.short),
          width: list[i].width,
          height: list[i].height,
          order: i,
          createdAt: fb.serverTimestamp(),
        });
        if (onProgress) onProgress(i + 1, list.length);
      }
      return ref.id;
    },
    myStories: function () { return listWhereMine('stories'); },
    allStories: function () { return listAll('stories'); },
    storyPhotos: async function (story) {
      const snap = await fb.getDocs(fb.query(fb.collection(db, 'stories', story.id, 'photos'), fb.where('uid', '==', story.uid)));
      return snap.docs.map(function (d) { return normalize(d.id, d.data()); }).sort(function (a, b) { return a.order - b.order; });
    },
    removeStory: async function (story) {
      const snap = await fb.getDocs(fb.query(fb.collection(db, 'stories', story.id, 'photos'), fb.where('uid', '==', story.uid)));
      for (const d of snap.docs) await fb.deleteDoc(d.ref);
      await fb.deleteDoc(fb.doc(db, 'stories', story.id));
    },

    addInquiry: async function (data) {
      const me = requireUser();
      const ref = await fb.addDoc(fb.collection(db, 'inquiries'), Object.assign(cleanInquiry(data), {
        uid: me.uid,
        userEmail: me.email,
        answer: '',
        createdAt: fb.serverTimestamp(),
      }));
      return ref.id;
    },
    myInquiries: function () { return listWhereMine('inquiries'); },
    allInquiries: function () { return listAll('inquiries'); },
    answerInquiry: function (id, answer) {
      return fb.updateDoc(fb.doc(db, 'inquiries', id), { answer: clip(answer, LIMITS.text), answeredAt: fb.serverTimestamp() });
    },
    removeInquiry: function (id) { return fb.deleteDoc(fb.doc(db, 'inquiries', id)); },

    addFamily: async function (data) {
      const id = randomId(12);
      await fb.setDoc(fb.doc(db, 'families', id), Object.assign(cleanFamily(data), { createdAt: fb.serverTimestamp() }));
      return id;
    },
    allFamilies: function () { return listAll('families'); },
    getFamily: async function (id) {
      if (!/^[a-z0-9]{6,40}$/.test(id || '')) return null;
      const snap = await fb.getDoc(fb.doc(db, 'families', id));
      return snap.exists() ? normalize(snap.id, snap.data()) : null;
    },
    removeFamily: function (id) { return fb.deleteDoc(fb.doc(db, 'families', id)); },
  };
}

/* ==========================================================
   체험 모드 (이 브라우저의 localStorage만 사용)
   ========================================================== */
function createDemoBackend() {
  const DATA_KEY = 'capcha-demo-data-v1';
  const USER_KEY = 'capcha-demo-user-v1';
  const USERS = {
    customer: { uid: 'demo-customer', name: '체험 고객', email: '', isAdmin: false },
    admin: { uid: 'demo-admin', name: '체험 관리자', email: '', isAdmin: true },
  };
  const listeners = new Set();

  function read(key, fallback) {
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }
  function write(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      throw new AppError(explainError(e.name === 'QuotaExceededError' ? e : { code: 'quota-exceeded' }), 'quota-exceeded');
    }
  }
  function empty() {
    return { applications: [], stories: [], photos: {}, inquiries: [], families: [] };
  }
  function load() {
    const data = read(DATA_KEY, null);
    return data && data.applications ? data : empty();
  }
  function now() { return new Date().toISOString(); }
  function newId() { return randomId(16); }

  let user = USERS[read(USER_KEY, '')] || null;

  function notify() { listeners.forEach(function (fn) { fn(user); }); }
  function requireUser() {
    if (!user) throw new AppError('로그인이 필요합니다.', 'unauthenticated');
    return user;
  }
  function requireAdmin() {
    if (!user || !user.isAdmin) throw new AppError('관리자만 할 수 있습니다.', 'permission-denied');
  }
  function mine(list) {
    const me = requireUser();
    return list.filter(function (item) { return item.uid === me.uid; }).map(function (item) { return normalize(item.id, item); }).sort(byNewest);
  }
  function all(list) {
    requireAdmin();
    return list.map(function (item) { return normalize(item.id, item); }).sort(byNewest);
  }
  function update(collectionName, id, patch) {
    const data = load();
    const item = data[collectionName].find(function (x) { return x.id === id; });
    if (!item) throw new AppError('데이터를 찾을 수 없습니다.', 'not-found');
    Object.assign(item, patch);
    write(DATA_KEY, data);
  }
  function remove(collectionName, id) {
    const data = load();
    data[collectionName] = data[collectionName].filter(function (x) { return x.id !== id; });
    if (collectionName === 'stories') delete data.photos[id];
    write(DATA_KEY, data);
  }

  return {
    mode: 'demo',
    ready: Promise.resolve(),
    getUser: function () { return user; },
    onUser: function (fn) {
      listeners.add(fn);
      fn(user);
      return function () { listeners.delete(fn); };
    },
    signIn: async function (role) {
      user = USERS[role === 'admin' ? 'admin' : 'customer'];
      write(USER_KEY, role === 'admin' ? 'admin' : 'customer');
      notify();
    },
    signOut: async function () {
      user = null;
      try { window.localStorage.removeItem(USER_KEY); } catch (e) { /* 무시 */ }
      notify();
    },
    clearDemoData: function () {
      try { window.localStorage.removeItem(DATA_KEY); } catch (e) { /* 무시 */ }
    },

    addApplication: async function (input) {
      const me = requireUser();
      const data = load();
      const item = Object.assign(cleanApplication(input), {
        id: newId(), uid: me.uid, userEmail: me.email, status: '접수', adminMemo: '', createdAt: now(), updatedAt: now(),
      });
      data.applications.push(item);
      write(DATA_KEY, data);
      return item.id;
    },
    myApplications: async function () { return mine(load().applications); },
    allApplications: async function () { return all(load().applications); },
    updateApplication: async function (id, patch) {
      requireAdmin();
      update('applications', id, {
        status: STATUSES.indexOf(patch.status) >= 0 ? patch.status : '접수',
        adminMemo: clip(patch.adminMemo, LIMITS.memo),
        updatedAt: now(),
      });
    },
    removeApplication: async function (id) { requireAdmin(); remove('applications', id); },

    addStory: async function (input, photos, onProgress) {
      const me = requireUser();
      const data = load();
      const list = (photos || []).slice(0, LIMITS.photos);
      const item = Object.assign(cleanStory(input, list.length), { id: newId(), uid: me.uid, userEmail: me.email, createdAt: now() });
      data.stories.push(item);
      data.photos[item.id] = list.map(function (p, i) {
        return { id: newId(), uid: me.uid, dataUrl: p.dataUrl, name: clip(p.name, LIMITS.short), width: p.width, height: p.height, order: i, createdAt: now() };
      });
      write(DATA_KEY, data);
      if (onProgress) onProgress(list.length, list.length);
      return item.id;
    },
    myStories: async function () { return mine(load().stories); },
    allStories: async function () { return all(load().stories); },
    storyPhotos: async function (story) {
      const me = requireUser();
      if (!me.isAdmin && story.uid !== me.uid) throw new AppError('권한이 없습니다.', 'permission-denied');
      return (load().photos[story.id] || []).map(function (p) { return normalize(p.id, p); });
    },
    removeStory: async function (story) { requireAdmin(); remove('stories', story.id); },

    addInquiry: async function (input) {
      const me = requireUser();
      const data = load();
      const item = Object.assign(cleanInquiry(input), { id: newId(), uid: me.uid, userEmail: me.email, answer: '', createdAt: now() });
      data.inquiries.push(item);
      write(DATA_KEY, data);
      return item.id;
    },
    myInquiries: async function () { return mine(load().inquiries); },
    allInquiries: async function () { return all(load().inquiries); },
    answerInquiry: async function (id, answer) {
      requireAdmin();
      update('inquiries', id, { answer: clip(answer, LIMITS.text), answeredAt: now() });
    },
    removeInquiry: async function (id) { requireAdmin(); remove('inquiries', id); },

    addFamily: async function (input) {
      requireAdmin();
      const data = load();
      const id = randomId(12);
      data.families.push(Object.assign(cleanFamily(input), { id: id, createdAt: now() }));
      write(DATA_KEY, data);
      return id;
    },
    allFamilies: async function () { return all(load().families); },
    getFamily: async function (id) {
      const item = load().families.find(function (x) { return x.id === id; });
      return item ? normalize(item.id, item) : null;
    },
    removeFamily: async function (id) { requireAdmin(); remove('families', id); },
  };
}

let backendPromise = null;
export function getBackend() {
  if (!backendPromise) backendPromise = mode === 'firebase' ? createFirebaseBackend() : Promise.resolve(createDemoBackend());
  return backendPromise;
}
