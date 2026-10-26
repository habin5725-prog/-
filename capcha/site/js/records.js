/* ==========================================================
   캡챠(CAPCHA) 기록 보여 주기
   마이페이지와 관리자 페이지가 함께 씁니다.
   ========================================================== */
import { STATUSES } from './backend.js';
import { h, formatDate, statusBadge, toast } from './ui.js';
import { explainError } from './backend.js';

export function dl(rows) {
  return h('dl', null, rows.filter(function (row) { return row && row[1] !== undefined && row[1] !== null && row[1] !== ''; })
    .map(function (row) { return [h('dt', { text: row[0] }), h('dd', null, row[1])]; }));
}

export function applicationRows(item, withContact) {
  return [
    ['신청자', item.applicantName],
    withContact ? ['연락처', h('a', { href: 'tel:' + String(item.phone || '').replace(/[^0-9]/g, ''), text: item.phone })] : null,
    withContact && item.userEmail ? ['구글 계정', item.userEmail] : null,
    ['부모님 연세대', item.parentAge],
    ['지역', item.region + (item.regionDetail ? ' (' + item.regionDetail + ')' : '')],
    ['원하는 결과물', (item.products || []).join(' · ')],
    ['희망 시기', item.preferredTime],
    ['남기실 말씀', item.message],
  ];
}

export function storyRows(item, withContact) {
  return [
    ['신청자', item.applicantName],
    withContact && item.userEmail ? ['구글 계정', item.userEmail] : null,
    ['사소한 일상', item.daily],
    ['간직하고 싶은 이야기', item.keepStory],
    ['묻고 싶은 질문', item.questions],
    ['사진 설명', item.photoNote],
  ];
}

/* 진행 단계 표시: 접수 → 상담 중 → 촬영 예정 → 제작 중 → 전달 완료 */
export function statusTrack(status) {
  if (status === '취소') return h('p', { class: 'record-meta', text: '이 신청은 취소되었습니다.' });
  const steps = STATUSES.filter(function (s) { return s !== '취소'; });
  const current = steps.indexOf(status);
  return h('ol', { class: 'track', 'aria-label': '진행 단계' }, steps.map(function (s, i) {
    return h('li', {
      class: (i <= current ? 'is-done' : '') + (i === current ? ' is-current' : ''),
      'aria-current': i === current ? 'step' : null,
      text: s,
    });
  }));
}

export function recordHead(title, date, status) {
  return h('div', { class: 'record-head' },
    h('div', null,
      h('h3', { class: 'record-title', text: title }),
      h('p', { class: 'record-meta', text: formatDate(date) })),
    status ? statusBadge(status) : null);
}

/* 사진 크게 보기 */
let photoDialog = null;
export function openPhoto(photo) {
  if (!photoDialog) {
    photoDialog = h('dialog', { class: 'photo-dialog', 'aria-label': '사진 크게 보기' });
    document.body.append(photoDialog);
    photoDialog.addEventListener('click', function (event) {
      if (event.target === photoDialog) photoDialog.close();
    });
  }
  const close = h('button', { class: 'dialog-close', type: 'button', 'aria-label': '닫기', onclick: function () { photoDialog.close(); } },
    h('span', { 'aria-hidden': 'true', text: '×' }));
  photoDialog.replaceChildren(
    close,
    h('img', { src: photo.dataUrl, alt: photo.name || '사진' }),
    h('p', { class: 'dialog-actions' },
      h('a', { class: 'btn btn-sm', href: photo.dataUrl, download: (photo.name || 'photo').replace(/\.[^.]+$/, '') + '.jpg', text: '사진 내려받기' })));
  photoDialog.showModal();
  close.focus();
}

/* "사진 n장 보기" 버튼을 누르면 사진을 불러와 작은 그림으로 보여 줍니다. */
export function photoLoader(api, story) {
  if (!story.photoCount) return null;
  const box = h('div');
  const button = h('button', { class: 'btn btn-sm', type: 'button' }, '사진 ' + story.photoCount + '장 보기');
  button.addEventListener('click', async function () {
    button.disabled = true;
    button.textContent = '사진을 불러오는 중입니다';
    try {
      // 사진 데이터가 이미지 형식일 때만 보여 줍니다.
      const photos = (await api.storyPhotos(story)).filter(function (p) { return /^data:image\/(jpeg|png|webp);base64,/.test(p.dataUrl || ''); });
      box.replaceChildren(h('ul', { class: 'photo-thumbs', 'aria-label': '올린 사진' }, photos.map(function (photo, i) {
        return h('li', null, h('button', { class: 'photo-thumb', type: 'button', 'aria-label': (i + 1) + '번째 사진 크게 보기', onclick: function () { openPhoto(photo); } },
          h('img', { src: photo.dataUrl, alt: '' })));
      })));
    } catch (error) {
      button.disabled = false;
      button.textContent = '사진 ' + story.photoCount + '장 보기';
      toast(explainError(error), 'error');
    }
  });
  box.append(button);
  return box;
}
