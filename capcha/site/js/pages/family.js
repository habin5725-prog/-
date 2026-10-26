/* 가족 영상 페이지: family.html?id=12자리 이름 (로그인 없이 열립니다) */
import { app } from '../app.js';
import { explainError } from '../backend.js';
import { h } from '../ui.js';

const root = document.getElementById('family-root');
const titleEl = document.querySelector('#page-title .ko');
const descEl = document.getElementById('page-desc');

(async function () {
  const id = new URLSearchParams(window.location.search).get('id') || '';
  let item = null;
  try {
    const api = await app.ready;
    item = id && api ? await api.getFamily(id) : null;
  } catch (error) {
    showMessage('영상을 불러오지 못했습니다', explainError(error));
    return;
  }
  if (!item) {
    showMessage('페이지를 찾을 수 없습니다', app.mode === 'demo'
      ? '체험 모드에서 만든 가족 영상 페이지는 만든 브라우저에서만 열립니다. 관리자 페이지에서 새로 만들어 보세요.'
      : '주소를 다시 확인해 주세요. 책 속 QR로 들어오셨다면 문의하기로 알려 주세요.');
    return;
  }

  // 저장된 값이 영상 ID 형식일 때만 유튜브 주소를 만듭니다.
  if (!/^[A-Za-z0-9_-]{11}$/.test(item.youtubeId || '')) item.youtubeId = '';
  titleEl.textContent = item.title;
  descEl.textContent = '책 속 QR로 여는 가족 영상 페이지입니다.';
  document.title = item.title + ' | 캡챠(CAPCHA)';

  const video = item.youtubeId
    ? h('div', { class: 'video-wrap' },
      h('iframe', {
        src: 'https://www.youtube-nocookie.com/embed/' + item.youtubeId + '?rel=0',
        title: item.title + ' 인터뷰 영상',
        allow: 'accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
        referrerpolicy: 'strict-origin-when-cross-origin',
        allowfullscreen: true,
        loading: 'lazy',
      }))
    : h('div', { class: 'video-wrap video-empty' }, h('p', { text: '영상을 준비하고 있습니다.' }));

  root.replaceChildren(...[
    video,
    item.youtubeId
      ? h('p', { class: 'video-links' }, '영상이 보이지 않으면 ',
        h('a', { href: 'https://www.youtube.com/watch?v=' + item.youtubeId, text: '유튜브에서 바로 보기' }))
      : null,
    item.message ? h('div', { class: 'answer family-message' }, item.message) : null,
    h('div', { class: 'notice' },
      h('p', { text: '이 페이지 주소를 아는 사람은 누구나 영상을 볼 수 있습니다. 주소와 QR은 가족끼리만 나눠 주세요.' }),
      h('p', null, '영상을 내리거나 바꾸고 싶으시면 ', h('a', { href: 'contact.html', text: '문의하기' }), '로 알려 주세요.')),
  ].filter(Boolean));
})();

function showMessage(title, text) {
  titleEl.textContent = title;
  descEl.textContent = '';
  document.title = title + ' | 캡챠(CAPCHA)';
  root.replaceChildren(h('div', { class: 'gate' },
    h('h2', { class: 'gate-title', text: title }),
    h('p', { class: 'gate-text', text: text }),
    h('a', { class: 'btn', href: 'index.html', text: '처음 화면으로' })));
}
