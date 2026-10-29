/* 관리자 페이지: 신청서 · 사전 질문지 · 문의 · 가족 영상 페이지 관리
   화면은 누구나 열 수 있지만 데이터는 보안 규칙(firestore.rules)이 관리자에게만 줍니다. */
import { app } from '../app.js';
import { STATUSES, LIMITS, explainError, parseYouTubeId } from '../backend.js';
import { h, loginGate, emptyState, loading, toast, setupTabs, statusBadge, formatDate } from '../ui.js';
import { dl, applicationRows, storyRows, recordHead, photoLoader } from '../records.js';
import qrcode from '../vendor/qrcode.mjs';

const root = document.getElementById('admin-root');
let api = null;
const state = { applications: [], stories: [], inquiries: [], families: [] };

app.ready.then(function (backend) { api = backend; });
app.onUser(render);

async function render(user) {
  if (!user) {
    root.replaceChildren(loginGate(app, {
      title: '관리자 로그인이 필요합니다',
      text: app.mode === 'demo'
        ? '로그인 창에서 관리자로 체험하기를 고르면 관리자 화면을 볼 수 있습니다.'
        : '관리자 구글 계정으로 로그인하면 신청서와 사전 질문지 · 문의를 관리할 수 있습니다.',
    }));
    return;
  }
  if (!user.isAdmin) {
    root.replaceChildren(h('div', { class: 'gate' },
      h('h2', { class: 'gate-title', text: '관리자 계정이 아닙니다' }),
      h('p', { class: 'gate-text', text: app.mode === 'demo'
        ? '로그아웃한 뒤 로그인 창에서 관리자로 체험하기를 골라 주세요.'
        : '관리자로 정한 구글 계정으로 로그인했는지 확인해 주세요. 관리자 계정은 Firestore 보안 규칙에서 정합니다.' }),
      h('p', null,
        h('a', { class: 'btn btn-sm', href: 'mypage.html', text: '마이페이지' }), ' ',
        h('button', { class: 'btn btn-sm', type: 'button', onclick: function () { app.signOut(); } }, '로그아웃'))));
    return;
  }
  await app.ready;
  buildDashboard();
}

/* ---------- 대시보드 ---------- */
const summary = {};
const panels = {};

function stat(key, label) {
  summary[key] = h('dd', { text: '-' });
  return h('div', { class: 'stat' }, h('dt', { text: label }), summary[key]);
}

function buildDashboard() {
  const tabs = [
    ['applications', '신청서'],
    ['stories', '사전 질문지'],
    ['inquiries', '문의'],
    ['families', '가족 영상 페이지'],
  ];
  const tablist = h('div', { class: 'tabbar', role: 'tablist', 'aria-label': '관리 항목' }, tabs.map(function (t, i) {
    return h('button', {
      role: 'tab', type: 'button', id: 'tab-' + t[0], 'aria-controls': 'panel-' + t[0],
      'aria-selected': i === 0 ? 'true' : 'false', tabindex: i === 0 ? '0' : '-1',
    }, t[1]);
  }));
  const panelEls = tabs.map(function (t, i) {
    panels[t[0]] = h('div', null, loading());
    return h('div', { role: 'tabpanel', id: 'panel-' + t[0], 'aria-labelledby': 'tab-' + t[0], tabindex: '0', hidden: i !== 0 }, panels[t[0]]);
  });

  root.replaceChildren(
    h('div', { class: 'block-head' },
      h('h2', { class: 'block-title', text: '한눈에 보기' }),
      h('button', { class: 'btn btn-sm', type: 'button', onclick: loadAll }, '새로고침')),
    h('dl', { class: 'admin-summary' },
      stat('new', '새 신청 (접수)'), stat('active', '진행 중 신청'), stat('stories', '사전 질문지'), stat('waiting', '답변 대기 문의')),
    tablist,
    ...panelEls
  );
  setupTabs(tablist);
  loadAll();
}

async function loadAll() {
  Object.keys(panels).forEach(function (key) { panels[key].replaceChildren(loading()); });
  const jobs = {
    applications: api.allApplications(),
    stories: api.allStories(),
    inquiries: api.allInquiries(),
    families: api.allFamilies(),
  };
  for (const key of Object.keys(jobs)) {
    try {
      state[key] = await jobs[key];
    } catch (error) {
      state[key] = null;
      panels[key].replaceChildren(emptyState(explainError(error)));
    }
  }
  updateSummary();
  if (state.applications) drawApplications();
  if (state.stories) drawStories();
  if (state.inquiries) drawInquiries();
  if (state.families) drawFamilies();
}

function updateSummary() {
  const apps = state.applications || [];
  summary.new.textContent = String(apps.filter(function (a) { return a.status === '접수'; }).length);
  summary.active.textContent = String(apps.filter(function (a) { return ['상담 중', '촬영 예정', '제작 중'].indexOf(a.status) >= 0; }).length);
  summary.stories.textContent = String((state.stories || []).length);
  summary.waiting.textContent = String((state.inquiries || []).filter(function (q) { return !q.answer; }).length);
}

function removeFrom(key, id) {
  state[key] = state[key].filter(function (x) { return x.id !== id; });
  updateSummary();
}

/* ---------- 신청서 ---------- */
let appFilter = '';

function drawApplications() {
  const filter = h('select', { class: 'select', id: 'app-filter' },
    h('option', { value: '', text: '전체 보기' }),
    STATUSES.map(function (s) { return h('option', { value: s, text: s }); }));
  filter.value = appFilter;
  filter.addEventListener('change', function () { appFilter = filter.value; drawApplications(); });
  const items = state.applications.filter(function (a) { return !appFilter || a.status === appFilter; });

  panels.applications.replaceChildren(
    h('div', { class: 'toolbar' },
      h('div', { class: 'field' }, h('label', { for: 'app-filter', text: '진행 상태로 거르기' }), filter),
      h('button', { class: 'btn btn-sm', type: 'button', onclick: downloadCsv }, 'CSV로 내려받기')),
    items.length ? h('ul', { class: 'record-list' }, items.map(applicationCard)) : emptyState(appFilter ? '이 상태의 신청서가 없습니다.' : '아직 들어온 신청서가 없습니다.')
  );
}

function applicationCard(item) {
  const statusSel = h('select', { class: 'select', id: 'st-' + item.id }, STATUSES.map(function (s) { return h('option', { value: s, text: s }); }));
  statusSel.value = item.status;
  const memo = h('textarea', { class: 'textarea', id: 'memo-' + item.id, rows: 2, maxlength: LIMITS.memo, style: 'min-height:0' });
  memo.value = item.adminMemo || '';
  const badgeBox = h('span', null, statusBadge(item.status));
  const save = h('button', { class: 'btn btn-sm btn-solid', type: 'button' }, '저장');
  save.addEventListener('click', async function () {
    save.disabled = true;
    try {
      await api.updateApplication(item.id, { status: statusSel.value, adminMemo: memo.value });
      item.status = statusSel.value;
      item.adminMemo = memo.value;
      badgeBox.replaceChildren(statusBadge(item.status));
      updateSummary();
      toast(item.applicantName + ' 님 신청서를 저장했습니다.');
    } catch (error) {
      toast(explainError(error), 'error');
    }
    save.disabled = false;
  });
  const del = h('button', { class: 'btn-danger', type: 'button' }, '삭제');
  const card = h('li', { class: 'record' });
  del.addEventListener('click', async function () {
    if (!window.confirm(item.applicantName + ' 님 신청서를 삭제할까요? 되돌릴 수 없습니다.')) return;
    try {
      await api.removeApplication(item.id);
      removeFrom('applications', item.id);
      card.remove();
      toast('삭제했습니다.');
    } catch (error) {
      toast(explainError(error), 'error');
    }
  });
  const head = recordHead(item.applicantName + ' 님 신청서', item.createdAt, null);
  head.append(badgeBox);
  card.append(head, dl(applicationRows(item, true)),
    h('div', { class: 'record-actions' },
      h('div', { class: 'field' }, h('label', { for: 'st-' + item.id, text: '진행 상태' }), statusSel),
      h('div', { class: 'field' }, h('label', { for: 'memo-' + item.id, text: '관리자 메모 (고객에게 보이지 않음)' }), memo),
      save, del));
  return card;
}

function downloadCsv() {
  const header = ['접수일', '신청자', '연락처', '로그인 계정', '부모님 연세대', '지역', '기타 지역', '원하는 결과물', '희망 시기', '남기실 말씀', '진행 상태', '관리자 메모'];
  const rows = (state.applications || []).map(function (a) {
    return [formatDate(a.createdAt), a.applicantName, a.phone, a.userEmail, a.parentAge, a.region, a.regionDetail, (a.products || []).join(' / '), a.preferredTime, a.message, a.status, a.adminMemo];
  });
  const csv = [header].concat(rows).map(function (row) {
    return row.map(function (cell) {
      let text = String(cell == null ? '' : cell);
      if (/^[=+\-@]/.test(text)) text = "'" + text; // 엑셀 수식으로 실행되지 않게 합니다.
      return '"' + text.replace(/"/g, '""') + '"';
    }).join(',');
  }).join('\r\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = h('a', { href: url, download: 'capcha-applications-' + new Date().toISOString().slice(0, 10) + '.csv' });
  document.body.append(a);
  a.click();
  a.remove();
  window.setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
}

/* ---------- 사전 질문지 ---------- */
function drawStories() {
  panels.stories.replaceChildren(state.stories.length
    ? h('ul', { class: 'record-list' }, state.stories.map(function (item) {
      const card = h('li', { class: 'record' });
      const del = h('button', { class: 'btn-danger', type: 'button' }, '삭제');
      del.addEventListener('click', async function () {
        if (!window.confirm(item.applicantName + ' 님 사전 질문지와 사진을 삭제할까요? 되돌릴 수 없습니다.')) return;
        try {
          await api.removeStory(item);
          removeFrom('stories', item.id);
          card.remove();
          toast('삭제했습니다.');
        } catch (error) {
          toast(explainError(error), 'error');
        }
      });
      card.append(...[recordHead(item.applicantName + ' 님 사전 질문지', item.createdAt, null),
        dl(storyRows(item, true).concat([['사진', item.photoCount ? item.photoCount + '장' : '없음']])),
        photoLoader(api, item),
        h('div', { class: 'record-actions' }, del)].filter(Boolean));
      return card;
    }))
    : emptyState('아직 들어온 사전 질문지가 없습니다.'));
}

/* ---------- 문의 ---------- */
let onlyWaiting = false;

function drawInquiries() {
  const toggle = h('label', { class: 'choice' },
    h('input', { type: 'checkbox', checked: onlyWaiting, onchange: function (e) { onlyWaiting = e.target.checked; drawInquiries(); } }),
    h('span', { text: '답변 대기만 보기' }));
  const items = state.inquiries.filter(function (q) { return !onlyWaiting || !q.answer; });
  panels.inquiries.replaceChildren(
    h('div', { class: 'toolbar' }, toggle),
    items.length ? h('ul', { class: 'record-list' }, items.map(inquiryCard)) : emptyState('보여 줄 문의가 없습니다.')
  );
}

function inquiryCard(item) {
  const card = h('li', { class: 'record' });
  const badge = h('span', null, h('span', { class: 'status ' + (item.answer ? 's-done' : 's-make'), text: item.answer ? '답변 완료' : '답변 대기' }));
  const answer = h('textarea', { class: 'textarea', id: 'ans-' + item.id, rows: 3, maxlength: LIMITS.text });
  answer.value = item.answer || '';
  const save = h('button', { class: 'btn btn-sm btn-solid', type: 'button' }, '답변 저장');
  save.addEventListener('click', async function () {
    if (!answer.value.trim()) {
      toast('답변을 적어 주세요.', 'error');
      answer.focus();
      return;
    }
    save.disabled = true;
    try {
      await api.answerInquiry(item.id, answer.value);
      item.answer = answer.value.trim();
      badge.replaceChildren(h('span', { class: 'status s-done', text: '답변 완료' }));
      updateSummary();
      toast('답변을 저장했습니다. 고객 마이페이지에 보입니다.');
    } catch (error) {
      toast(explainError(error), 'error');
    }
    save.disabled = false;
  });
  const del = h('button', { class: 'btn-danger', type: 'button' }, '삭제');
  del.addEventListener('click', async function () {
    if (!window.confirm('이 문의를 삭제할까요? 되돌릴 수 없습니다.')) return;
    try {
      await api.removeInquiry(item.id);
      removeFrom('inquiries', item.id);
      card.remove();
      toast('삭제했습니다.');
    } catch (error) {
      toast(explainError(error), 'error');
    }
  });
  const head = recordHead(item.title, item.createdAt, null);
  head.append(badge);
  card.append(head,
    dl([
      ['보낸 사람', item.name + (item.userEmail ? ' (' + item.userEmail + ')' : ' (로그인 안 함)')],
      ['답변 받을 연락처', item.contact],
      ['내용', item.body],
    ]),
    h('div', { class: 'record-actions' },
      h('div', { class: 'field' }, h('label', { for: 'ans-' + item.id, text: '답변' }), answer),
      save, del));
  return card;
}

/* ---------- 가족 영상 페이지 ---------- */
function familyUrl(id) {
  return new URL('family.html?id=' + encodeURIComponent(id), window.location.href).href;
}

function qrCanvas(text) {
  const qr = qrcode(0, 'M');
  qr.addData(text);
  qr.make();
  const count = qr.getModuleCount();
  const scale = 8;
  const margin = 4;
  const size = (count + margin * 2) * scale;
  const canvas = h('canvas', { width: size, height: size, role: 'img', 'aria-label': 'QR 코드: ' + text });
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = '#000000';
  for (let r = 0; r < count; r++) {
    for (let c = 0; c < count; c++) {
      if (qr.isDark(r, c)) ctx.fillRect((c + margin) * scale, (r + margin) * scale, scale, scale);
    }
  }
  return canvas;
}

function drawFamilies() {
  const status = h('p', { class: 'form-status', role: 'status', 'aria-live': 'polite' });
  const title = h('input', { class: 'input', id: 'fam-title', maxlength: LIMITS.short, placeholder: '예: 어머니의 칠십 년 이야기' });
  const video = h('input', { class: 'input', id: 'fam-video', placeholder: 'https://youtu.be/... 또는 영상 ID 11자리', 'aria-describedby': 'fam-video-hint' });
  const message = h('textarea', { class: 'textarea', id: 'fam-msg', rows: 3, maxlength: LIMITS.memo, placeholder: '예: 2026년 가을 대전 댁에서 촬영했습니다.' });
  const submit = h('button', { class: 'btn btn-solid btn-sm', type: 'submit' }, '페이지 만들기');
  const form = h('form', { class: 'form-card', novalidate: true, style: 'max-width:none;margin-bottom:28px' },
    h('h3', { class: 'block-title', text: '새 가족 영상 페이지 만들기' }),
    h('p', { class: 'field-hint', style: 'margin:8px 0 22px', text: '주소는 추측하기 어려운 12자리로 자동으로 만들어집니다. 다만 일부 공개 영상이라 링크를 아는 사람은 누구나 볼 수 있습니다. 유튜브 영상은 일부 공개로 올린 뒤 주소를 붙여 넣으세요.' }),
    h('div', { class: 'field' }, h('label', { for: 'fam-title' }, '영상 제목', h('span', { class: 'req', text: '필수' })), title),
    h('div', { class: 'field' }, h('label', { for: 'fam-video' }, '유튜브 주소', h('span', { class: 'opt', text: '선택' })),
      h('p', { class: 'field-hint', id: 'fam-video-hint', text: '비워 두면 영상 준비 중으로 보입니다.' }), video),
    h('div', { class: 'field' }, h('label', { for: 'fam-msg' }, '가족에게 남길 글', h('span', { class: 'opt', text: '선택' })), message),
    submit, status);
  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    status.textContent = '';
    if (!title.value.trim()) {
      status.textContent = '영상 제목을 적어 주세요.';
      title.focus();
      return;
    }
    if (video.value.trim() && !parseYouTubeId(video.value)) {
      status.textContent = '유튜브 주소를 확인해 주세요. 예: https://youtu.be/AbCdEfGhIjK';
      video.focus();
      return;
    }
    submit.disabled = true;
    try {
      const id = await api.addFamily({ title: title.value, youtubeId: video.value, message: message.value });
      state.families.unshift({ id: id, title: title.value.trim(), youtubeId: parseYouTubeId(video.value), message: message.value.trim(), createdAt: new Date() });
      drawFamilies();
      toast('가족 영상 페이지를 만들었습니다. 아래 QR 코드를 책에 넣으세요.');
    } catch (error) {
      status.textContent = explainError(error);
      submit.disabled = false;
    }
  });

  panels.families.replaceChildren(form,
    state.families.length
      ? h('ul', { class: 'record-list' }, state.families.map(familyCard))
      : emptyState('아직 만든 가족 영상 페이지가 없습니다.'));
}

function familyCard(item) {
  const url = familyUrl(item.id);
  const card = h('li', { class: 'record' });
  const canvas = qrCanvas(url);
  const copy = h('button', { class: 'btn btn-sm', type: 'button' }, '주소 복사');
  copy.addEventListener('click', async function () {
    try {
      await navigator.clipboard.writeText(url);
      toast('주소를 복사했습니다.');
    } catch (error) {
      window.prompt('아래 주소를 복사해 주세요.', url);
    }
  });
  const download = h('a', { class: 'btn btn-sm', href: canvas.toDataURL('image/png'), download: 'capcha-family-' + item.id + '-qr.png', text: 'QR 이미지 내려받기' });
  const del = h('button', { class: 'btn-danger', type: 'button' }, '삭제');
  del.addEventListener('click', async function () {
    if (!window.confirm('"' + item.title + '" 페이지를 삭제할까요? 책 속 QR로 더 이상 열리지 않습니다.')) return;
    try {
      await api.removeFamily(item.id);
      removeFrom('families', item.id);
      card.remove();
      toast('삭제했습니다.');
    } catch (error) {
      toast(explainError(error), 'error');
    }
  });
  card.append(recordHead(item.title, item.createdAt, null),
    dl([
      ['주소', h('a', { class: 'family-url', href: url, target: '_blank', rel: 'noopener', text: url + ' (새 창)' })],
      ['유튜브 영상', item.youtubeId ? item.youtubeId : '아직 없음 (영상 준비 중으로 보입니다)'],
      ['남길 글', item.message],
    ]),
    h('div', { class: 'qr-wrap' }, canvas, h('div', null, copy, ' ', download)),
    h('div', { class: 'record-actions' }, del));
  return card;
}
