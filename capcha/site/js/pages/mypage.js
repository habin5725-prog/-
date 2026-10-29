/* 마이페이지: 내가 남긴 신청서 · 사전 질문지 · 문의와 진행 상황 */
import { app } from '../app.js';
import { explainError } from '../backend.js';
import { h, loginGate, emptyState, loading, formatDate } from '../ui.js';
import { dl, applicationRows, storyRows, statusTrack, recordHead, photoLoader } from '../records.js';

const root = document.getElementById('mypage-root');
let api = null;

app.ready.then(function (backend) { api = backend; });
app.onUser(render);

async function render(user) {
  if (!user) {
    root.replaceChildren(loginGate(app, {
      title: '로그인 후 볼 수 있습니다',
      text: '마이페이지에서는 내가 남긴 신청서와 사전 질문지 · 문의 답변 · 진행 상황을 볼 수 있습니다.',
    }));
    return;
  }
  await app.ready;
  const apps = h('div', null, loading());
  const stories = h('div', null, loading());
  const inquiries = h('div', null, loading());

  root.replaceChildren(
    h('div', { class: 'profile' },
      h('span', { class: 'auth-avatar', 'aria-hidden': 'true', text: (user.name || '?').charAt(0) }),
      h('div', { class: 'profile-text' },
        h('strong', { text: user.name }),
        h('span', { text: (user.email ? user.email + ' · ' : '') + (user.isAdmin ? '관리자' : '고객') + (app.mode === 'demo' ? ' (체험 계정)' : '') })),
      user.isAdmin ? h('a', { class: 'btn btn-sm', href: 'admin.html', text: '관리자 페이지' }) : null,
      h('button', { class: 'btn btn-sm', type: 'button', onclick: function () { app.signOut(); } }, '로그아웃')),
    app.mode === 'demo' ? h('p', { class: 'demo-note' }, h('strong', { text: '체험판입니다. ' }), '여기 보이는 기록은 이 브라우저에만 저장되어 있고 운영자에게 전송되지 않았습니다. 다른 기기에서는 보이지 않습니다.') : null,
    h('div', { class: 'quick-links' },
      h('a', { class: 'btn btn-sm btn-solid', href: 'apply.html#apply-form', text: '신청서 작성' }),
      h('a', { class: 'btn btn-sm', href: 'story-form.html#story-form', text: '사전 질문지 작성' }),
      h('a', { class: 'btn btn-sm', href: 'contact.html#contact-form', text: '문의하기' })),
    block('내 신청서', apps),
    block('내 사전 질문지', stories),
    block('내 문의', inquiries)
  );

  load(apps, api.myApplications(), '아직 남긴 신청서가 없습니다.', function (item) {
    function link(type) {
      return 'contact.html?type=' + encodeURIComponent(type) + '&ref=' + encodeURIComponent(item.id) + '#contact-form';
    }
    return h('li', { class: 'record' },
      recordHead('신청서', item.createdAt, item.status),
      dl(applicationRows(item, true)),
      statusTrack(item.status),
      h('div', { class: 'record-links', role: 'group', 'aria-label': '이 신청서에 대한 요청' },
        h('a', { class: 'btn btn-sm', href: 'story-form.html?app=' + encodeURIComponent(item.id) + '#story-form', text: '자료 추가 (사전 질문지)' }),
        h('a', { class: 'btn btn-sm', href: link('수정 요청'), text: '수정 요청' }),
        h('a', { class: 'btn btn-sm', href: link('일정 변경 요청'), text: '일정 변경 요청' }),
        h('a', { class: 'btn btn-sm', href: link('취소 요청'), text: '취소 요청' })),
      h('p', { class: 'record-meta', text: '수정 · 일정 변경 · 취소는 요청으로 받으며 처리 기준은 아직 정하지 않았습니다. 요청 결과는 내 문의의 답변으로 알려 드립니다.' }));
  });
  load(stories, api.myStories(), '아직 보낸 사전 질문지가 없습니다.', function (item) {
    return h('li', { class: 'record' },
      recordHead('사전 질문지', item.createdAt),
      dl(storyRows(item, false)),
      photoLoader(api, item));
  });
  load(inquiries, api.myInquiries(), '아직 남긴 문의가 없습니다.', function (item) {
    return h('li', { class: 'record' },
      recordHead(item.title, item.createdAt, null),
      h('p', { class: 'record-body', text: item.body }),
      item.answer
        ? h('div', { class: 'answer' }, h('strong', { text: '답변 · ' + formatDate(item.answeredAt) }), item.answer)
        : h('p', { class: 'record-meta', text: '답변을 기다리고 있습니다.' }));
  });
}

function block(title, content) {
  return h('section', { class: 'block', 'aria-label': title },
    h('div', { class: 'block-head' }, h('h2', { class: 'block-title', text: title })),
    content);
}

async function load(box, promise, emptyText, renderItem) {
  try {
    const items = await promise;
    box.replaceChildren(items.length ? h('ul', { class: 'record-list' }, items.map(renderItem)) : emptyState(emptyText));
  } catch (error) {
    box.replaceChildren(emptyState(explainError(error)));
  }
}
