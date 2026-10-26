/* ==========================================================
   캡챠(CAPCHA) 공통 기능
   - 머리글 오른쪽 위 로그인 버튼과 내 계정 메뉴
   - 체험 모드 안내 띠와 체험 계정 선택 창
   모든 페이지(404 제외)가 이 파일을 불러옵니다.
   ========================================================== */
import { getBackend, mode, explainError } from './backend.js';
import { h, toast } from './ui.js';

const listeners = new Set();
let backend = null;
let currentUser = null;
let settled = false;

export const app = {
  mode: mode,
  ready: null,
  user: function () { return currentUser; },
  onUser: function (fn) {
    listeners.add(fn);
    if (settled) fn(currentUser);
    return function () { listeners.delete(fn); };
  },
  openLogin: openLogin,
  signOut: signOut,
};

app.ready = (async function () {
  if (mode === 'demo') showDemoBar();
  try {
    backend = await getBackend();
    await backend.ready;
    backend.onUser(function (user) {
      currentUser = user;
      settled = true;
      renderHeader();
      listeners.forEach(function (fn) { fn(user); });
    });
  } catch (error) {
    console.error('[capcha] 로그인 기능을 불러오지 못했습니다.', error);
    settled = true;
    renderHeader();
    listeners.forEach(function (fn) { fn(null); });
    toast('로그인 기능을 불러오지 못했습니다. 새로고침해 주세요.', 'error');
  }
  return backend;
})();

/* ---------- 체험 모드 안내 띠 ---------- */
function showDemoBar() {
  document.documentElement.classList.add('is-demo');
  const bar = h('aside', { class: 'demo-bar', 'aria-label': '체험 모드 안내' },
    h('p', null,
      h('strong', { text: '체험 모드' }),
      h('span', { class: 'demo-long', text: ' 실제 구글 로그인 연결 전입니다. 체험 계정으로 모든 화면을 둘러볼 수 있고 입력한 내용은 이 브라우저에만 저장됩니다.' }),
      h('span', { class: 'demo-short', text: ' 입력한 내용은 이 브라우저에만 저장됩니다.' })
    )
  );
  document.body.prepend(bar);
  // 머리글이 안내 띠 바로 아래에 오도록 띠 높이를 CSS 변수로 알려 줍니다.
  const sync = function () {
    document.documentElement.style.setProperty('--demo-bar-h', bar.offsetHeight + 'px');
  };
  sync();
  if ('ResizeObserver' in window) new ResizeObserver(sync).observe(bar);
}

/* ---------- 로그인 ---------- */
let dialog = null;

function buildDialog() {
  const form = h('form', { method: 'dialog', class: 'login-form' },
    h('button', { class: 'dialog-close', value: 'cancel', 'aria-label': '닫기', type: 'submit' }, h('span', { 'aria-hidden': 'true', text: '×' })),
    h('p', { class: 'eyebrow', lang: 'en', text: 'Sign In' }),
    h('h2', { id: 'login-title', class: 'login-title', text: '체험 계정으로 로그인' }),
    h('p', { class: 'login-desc', text: '지금은 체험 모드입니다. Firebase를 연결하면 이 자리에 구글 로그인이 열립니다. 체험 계정으로 고객 화면과 관리자 화면을 모두 볼 수 있습니다.' }),
    h('div', { class: 'login-choices' },
      h('button', { class: 'login-choice', value: 'customer', type: 'submit' },
        h('strong', { text: '고객으로 체험하기' }),
        h('span', { text: '신청서 · 사전 질문지 · 문의 작성과 마이페이지' })),
      h('button', { class: 'login-choice', value: 'admin', type: 'submit' },
        h('strong', { text: '관리자로 체험하기' }),
        h('span', { text: '신청 관리 · 진행 상태 변경 · 가족 영상 페이지 만들기' }))
    )
  );
  const d = h('dialog', { class: 'login-dialog', 'aria-labelledby': 'login-title' }, form);
  d.addEventListener('close', async function () {
    const role = d.returnValue;
    if (role !== 'customer' && role !== 'admin') return;
    try {
      await backend.signIn(role);
      toast(role === 'admin' ? '체험 관리자로 로그인했습니다.' : '체험 고객으로 로그인했습니다.');
    } catch (error) {
      toast(explainError(error), 'error');
    }
  });
  document.body.append(d);
  return d;
}

async function openLogin() {
  await app.ready;
  if (!backend) return;
  if (backend.mode === 'demo') {
    if (!dialog) dialog = buildDialog();
    dialog.returnValue = '';
    dialog.showModal();
    return;
  }
  try {
    await backend.signIn();
  } catch (error) {
    if (error && (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request')) return;
    toast(explainError(error), 'error');
  }
}

async function signOut() {
  await app.ready;
  if (!backend) return;
  await backend.signOut();
  toast('로그아웃했습니다.');
}

/* ---------- 머리글 오른쪽 위 ---------- */
function renderHeader() {
  const header = document.querySelector('.site-header');
  if (!header) return;
  // 다시 그릴 때마다 새 상자를 만들어 이벤트가 겹치지 않게 합니다.
  const old = header.querySelector('.header-auth');
  if (old) old.remove();
  closeMenu = null;
  const box = h('div', { class: 'header-auth' });
  header.append(box);
  if (!backend) return;

  if (!currentUser) {
    box.append(h('button', { class: 'auth-btn', type: 'button', onclick: openLogin }, '로그인'));
    return;
  }

  const user = currentUser;
  const menuId = 'user-menu';
  const toggle = h('button', { class: 'auth-user', type: 'button', 'aria-expanded': 'false', 'aria-controls': menuId },
    h('span', { class: 'auth-avatar', 'aria-hidden': 'true', text: (user.name || '?').trim().charAt(0) }),
    h('span', { class: 'sr-only', text: '내 계정 메뉴: ' }),
    h('span', { class: 'auth-name', text: user.name })
  );
  const items = [h('li', null, h('a', { href: 'mypage.html', text: '마이페이지' }))];
  if (user.isAdmin) items.push(h('li', null, h('a', { href: 'admin.html', text: '관리자 페이지' })));
  if (backend.mode === 'demo') {
    items.push(h('li', null, h('button', {
      type: 'button',
      onclick: function () {
        if (!window.confirm('이 브라우저에 저장된 체험 데이터(신청서 · 질문지 · 문의 · 가족 영상 페이지)를 모두 지울까요?')) return;
        backend.clearDemoData();
        toast('체험 데이터를 지웠습니다.');
        window.setTimeout(function () { window.location.reload(); }, 600);
      },
    }, '체험 데이터 지우기')));
  }
  items.push(h('li', null, h('button', { type: 'button', onclick: function () { close(); signOut(); } }, '로그아웃')));

  const menu = h('div', { class: 'user-menu', id: menuId, hidden: true },
    h('p', { class: 'user-menu-who' },
      h('strong', { text: user.name }),
      user.email ? h('span', { text: user.email }) : null,
      h('span', { class: 'user-role', text: user.isAdmin ? '관리자' : '고객' })
    ),
    h('ul', null, items)
  );

  function open() {
    menu.hidden = false;
    toggle.setAttribute('aria-expanded', 'true');
  }
  function close() {
    menu.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');
  }
  toggle.addEventListener('click', function () {
    if (menu.hidden) open();
    else close();
  });
  box.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && !menu.hidden) {
      close();
      toggle.focus();
    }
  });
  box.addEventListener('focusout', function (event) {
    if (event.relatedTarget && !box.contains(event.relatedTarget)) close();
  });
  closeMenu = close;

  box.append(toggle, menu);
}

// 메뉴 바깥을 누르면 닫습니다.
let closeMenu = null;
document.addEventListener('click', function (event) {
  const box = document.querySelector('.header-auth');
  if (closeMenu && box && !box.contains(event.target)) closeMenu();
});
