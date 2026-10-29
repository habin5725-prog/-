/* 사전 질문지 작성 (로그인한 사람만)
   - 내 신청서와 자동으로 연결합니다.
   - 사진은 브라우저에서 줄인 사본을 올리고 사진마다 설명을 붙입니다.
   - 쓰는 중인 글은 이 브라우저에 임시저장합니다. (사진은 임시저장하지 않습니다) */
import { app } from '../app.js';
import { LIMITS, explainError } from '../backend.js';
import { h, loginGate, clearErrors, toast, resizeImage, setFieldError, formatDate } from '../ui.js';
import { textArea, consentField, readForm, showErrors, successPanel, demoNotice } from '../forms.js';

const root = document.getElementById('form-root');
const demo = app.mode === 'demo';
// 체험판은 브라우저 저장 공간이 작아서 사진을 더 작게 줄입니다.
const PHOTO_SIDE = demo ? 640 : 1600;
const PHOTO_CHARS = demo ? 120000 : 900000;
const DRAFT_FIELDS = ['daily', 'keepStory', 'questions', 'photoNote'];
let api = null;

app.ready.then(function (backend) { api = backend; });
app.onUser(render);

async function render(user) {
  if (!user) {
    root.replaceChildren(loginGate(app, {
      title: demo ? '체험 계정을 고르면 사전 질문지를 써 볼 수 있습니다' : '로그인 후 사전 질문지를 작성할 수 있습니다',
      text: demo
        ? '체험판에서는 실제 로그인 대신 체험 계정을 씁니다. 입력한 내용과 사진은 운영자에게 전송되지 않습니다.'
        : '로그인하면 질문지가 내 신청서와 연결되고 보낸 내용을 마이페이지에서 다시 볼 수 있습니다.',
    }));
    return;
  }
  const backend = await app.ready;
  let applications = [];
  try {
    applications = await backend.myApplications();
  } catch (e) {
    applications = [];
  }
  root.replaceChildren(buildForm(user, applications));
}

function draftKey(user) {
  return 'capcha-story-draft-' + user.uid;
}
function readDraft(user) {
  try { return JSON.parse(window.localStorage.getItem(draftKey(user)) || 'null'); } catch (e) { return null; }
}
function writeDraft(user, data) {
  try { window.localStorage.setItem(draftKey(user), JSON.stringify(data)); } catch (e) { /* 저장 공간이 없으면 임시저장만 건너뜁니다. */ }
}
function clearDraft(user) {
  try { window.localStorage.removeItem(draftKey(user)); } catch (e) { /* 무시 */ }
}

function buildForm(user, applications) {
  const photos = [];
  let preparing = 0;
  const label = demo ? '체험 저장하기' : '사전 질문지 보내기';
  const status = h('p', { class: 'form-status', role: 'status', 'aria-live': 'polite' });
  const submit = h('button', { class: 'btn btn-solid btn-lg', type: 'submit' }, label);
  const grid = h('ul', { class: 'photo-list', 'aria-label': '고른 사진과 설명' });
  const fileInput = h('input', { class: 'file-input', id: 'f-photos', type: 'file', accept: 'image/jpeg,image/png,image/webp,image/*', multiple: true, 'aria-describedby': 'f-photos-hint' });
  const countText = h('span', { text: '0' });

  // 어느 신청서에 붙는 질문지인지 고릅니다. 주소에 ?app=신청서번호가 있으면 그 신청서를 고릅니다.
  const wanted = new URLSearchParams(window.location.search).get('app') || '';
  const appSelect = h('select', { class: 'select', id: 'f-applicationId', name: 'applicationId', 'aria-describedby': 'f-applicationId-hint' },
    applications.map(function (a) {
      return h('option', { value: a.id, text: a.applicantName + ' 님 신청서 · ' + formatDate(a.createdAt) + ' · ' + a.status });
    }),
    h('option', { value: '', text: '아직 신청서가 없습니다 (신청서 없이 작성)' }));
  appSelect.value = applications.some(function (a) { return a.id === wanted; }) ? wanted : (applications[0] ? applications[0].id : '');
  const appField = h('div', { class: 'field', 'data-field': 'applicationId' },
    h('label', { for: 'f-applicationId' }, '연결할 신청서', h('span', { class: 'opt', text: '자동 선택' })),
    h('p', { class: 'field-hint', id: 'f-applicationId-hint', text: applications.length ? '내 신청서와 자동으로 연결합니다. 신청서가 여러 개면 골라 주세요.' : '신청서를 먼저 보내면 자동으로 연결됩니다. 지금 작성해도 됩니다.' }),
    appSelect);

  function setBusy() {
    submit.disabled = preparing > 0;
    submit.textContent = preparing > 0 ? '사진을 준비하는 중입니다' : label;
  }

  function redraw() {
    grid.replaceChildren(...photos.map(function (photo, index) {
      const caption = h('textarea', {
        class: 'textarea', rows: 2, maxlength: LIMITS.caption, id: 'cap-' + index, 'data-skip': true,
        placeholder: '언제 · 어디서 · 누구와 찍은 사진인가요?',
      });
      caption.value = photo.caption || '';
      caption.addEventListener('input', function () { photo.caption = caption.value; });
      function move(step) {
        const to = index + step;
        if (to < 0 || to >= photos.length) return;
        photos.splice(to, 0, photos.splice(index, 1)[0]);
        redraw();
        const again = grid.querySelectorAll('.photo-row')[to];
        const target = again && again.querySelector('.photo-move:not([disabled])');
        if (target) target.focus();
      }
      return h('li', { class: 'photo-row' },
        h('div', { class: 'photo-item' },
          h('img', { src: photo.dataUrl, alt: (index + 1) + '번째 사진: ' + photo.name })),
        h('div', { class: 'photo-meta' },
          h('label', { for: 'cap-' + index, text: (index + 1) + '번째 사진 설명' }),
          caption,
          h('div', { class: 'photo-tools' },
            h('button', { class: 'photo-move btn-mini', type: 'button', disabled: index === 0, onclick: function () { move(-1); } }, '앞으로', h('span', { class: 'sr-only', text: ' (' + (index + 1) + '번째 사진)' })),
            h('button', { class: 'photo-move btn-mini', type: 'button', disabled: index === photos.length - 1, onclick: function () { move(1); } }, '뒤로', h('span', { class: 'sr-only', text: ' (' + (index + 1) + '번째 사진)' })),
            h('button', { class: 'btn-mini btn-mini-danger', type: 'button', onclick: function () { photos.splice(index, 1); redraw(); fileInput.focus(); } }, '빼기', h('span', { class: 'sr-only', text: ' (' + (index + 1) + '번째 사진)' })))));
    }));
    countText.textContent = String(photos.length);
  }

  fileInput.addEventListener('change', async function () {
    const files = Array.from(fileInput.files || []);
    fileInput.value = '';
    if (!files.length) return;
    setFieldError(photoField, '');
    let skipped = 0;
    const room = LIMITS.photos - photos.length - preparing;
    const take = files.slice(0, Math.max(0, room));
    skipped = files.length - take.length;
    preparing += take.length;
    setBusy();
    status.textContent = '사진 ' + take.length + '장을 준비하는 중입니다. 끝날 때까지 보내기 버튼이 잠깁니다.';
    for (const file of take) {
      try {
        photos.push(Object.assign(await resizeImage(file, PHOTO_SIDE, PHOTO_CHARS), { caption: '' }));
        redraw();
      } catch (e) {
        toast((file.name || '사진') + ' 파일은 열 수 없어서 뺐습니다. JPG나 PNG로 바꿔 다시 골라 주세요.', 'error');
      }
      preparing--;
      setBusy();
    }
    status.textContent = '';
    if (skipped) toast('사진은 최대 ' + LIMITS.photos + '장까지 올릴 수 있어서 ' + skipped + '장을 뺐습니다.', 'error');
  });

  const photoField = h('div', { class: 'field', 'data-field': 'photos' },
    h('p', { class: 'label' }, '옛 사진', h('span', { class: 'opt', text: '선택' })),
    h('div', { class: 'photo-picker' },
      fileInput,
      h('label', { class: 'btn btn-sm', for: 'f-photos' }, '사진 고르기'),
      h('div', { id: 'f-photos-hint', class: 'photo-guide' },
        h('p', null, '최대 ' + LIMITS.photos + '장 · 지금 ', countText, '장'),
        h('ul', null,
          h('li', { text: 'JPG · PNG · WEBP 사진을 올릴 수 있습니다. 아이폰의 HEIC 사진은 브라우저에 따라 열리지 않을 수 있습니다.' }),
          h('li', { text: '사진은 화면 확인용으로 긴 변 ' + PHOTO_SIDE + 'px 이하로 줄여 저장합니다. 책 인쇄에 쓸 원본 사진을 받는 방법은 아직 정하지 않았습니다.' }),
          h('li', { text: '올라가지 않는 사진이 있으면 문의하기로 알려 주세요.' }))),
      grid));

  const draft = readDraft(user);
  const draftBox = h('div', { class: 'draft-note', role: 'status' });
  const form = h('form', { class: 'form-card', novalidate: true },
    demo ? demoNotice() : null,
    h('p', { class: 'form-who' }, h('strong', { text: user.name }), ' 님으로 작성합니다.'),
    h('p', { class: 'form-guide', text: '이야기 세 칸과 사진 중 하나 이상만 채우면 보낼 수 있습니다. 사진 설명만으로는 보낼 수 없습니다. 떠오르는 만큼 편하게 적어 주세요.' }),
    draftBox,
    appField,
    textArea('daily', '부모님의 사소한 일상', { max: LIMITS.text, hint: '예: 즐겨 드시는 음식 · 자주 하시는 말씀 · 하루를 보내는 모습' }),
    textArea('keepStory', '간직하고 싶은 이야기', { max: LIMITS.text, hint: '예: 처음 만난 날 · 고향 이야기 · 가족에게 들려주시던 이야기' }),
    textArea('questions', '자녀가 부모님께 묻고 싶은 질문', { max: LIMITS.text, hint: '직접 여쭙기 어려웠던 질문도 괜찮습니다. 부모님이 원하지 않는 질문은 적지 않으셔도 됩니다.' }),
    photoField,
    textArea('photoNote', '사진 전체에 대한 메모', { max: LIMITS.memo, rows: 3, hint: '사진마다 설명은 위의 사진 옆 칸에 적어 주세요.' }),
    consentField('consent', [
      ['수집 · 이용 목적', '인터뷰 준비와 인터뷰 영상 · 생애 기록 책 제작'],
      ['수집 항목', '신청자 이름 · 부모님의 일상과 이야기 · 질문 · 옛 사진과 설명 · 로그인 계정 이메일'],
      ['보유 및 이용 기간', '보유 기간은 아직 확정하지 않았습니다. 확정 전에는 삭제를 요청하면 지체 없이 삭제합니다.'],
      ['동의 거부 권리', '동의하지 않을 수 있으며 이 경우 사전 질문지를 받을 수 없습니다.'],
    ]),
    h('p', { class: 'field-hint' }, '부모님의 이야기와 사진은 부모님께서 동의하신 내용만 올려 주세요.'),
    h('div', { class: 'form-actions' }, submit),
    status
  );

  // 임시저장: 글을 쓰면 이 브라우저에 저장하고 다음에 열 때 불러옵니다.
  function showDraftBox(restored) {
    draftBox.replaceChildren(
      h('span', { text: restored ? '이전에 쓰던 글을 불러왔습니다. ' : '쓰는 글은 이 브라우저에 자동으로 임시저장됩니다. ' }),
      h('span', { text: '사진은 임시저장되지 않습니다. 보내면 임시저장은 지워집니다. ' }),
      h('button', { class: 'btn-mini', type: 'button', onclick: function () {
        clearDraft(user);
        DRAFT_FIELDS.forEach(function (name) { form.querySelector('#f-' + name).value = ''; });
        toast('임시저장한 글을 지웠습니다.');
        showDraftBox(false);
      } }, '임시저장 지우기'));
  }
  if (draft) {
    DRAFT_FIELDS.forEach(function (name) {
      if (draft[name]) form.querySelector('#f-' + name).value = draft[name];
    });
  }
  showDraftBox(Boolean(draft && DRAFT_FIELDS.some(function (n) { return draft[n]; })));
  form.addEventListener('input', function (event) {
    if (DRAFT_FIELDS.indexOf(event.target.name) < 0) return;
    const data = {};
    DRAFT_FIELDS.forEach(function (name) { data[name] = form.querySelector('#f-' + name).value; });
    writeDraft(user, data);
  });

  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    if (preparing > 0) {
      status.textContent = '사진 준비가 끝난 뒤 보내 주세요.';
      return;
    }
    clearErrors(form);
    status.textContent = '';
    const v = readForm(form);
    const errors = [];
    if (!v.daily && !v.keepStory && !v.questions && !photos.length) {
      errors.push(['daily', '이야기 세 칸 중 하나를 적거나 사진을 한 장 이상 올려 주세요.']);
    }
    if (!v.consent) errors.push(['consent', '개인정보 수집 · 이용에 동의해 주세요.']);
    if (errors.length) {
      showErrors(form, errors, status);
      return;
    }
    const linked = applications.find(function (a) { return a.id === v.applicationId; });
    v.applicantName = linked ? linked.applicantName : user.name;
    submit.disabled = true;
    submit.textContent = '저장하는 중입니다';
    try {
      await api.addStory(v, photos, function (done, total) {
        status.textContent = '사진을 저장하는 중입니다. (' + done + ' / ' + total + ')';
      });
      clearDraft(user);
      root.replaceChildren(demo
        ? successPanel('이 브라우저에 저장했습니다',
          '체험판이라 운영자에게 전송되지 않았습니다. 저장한 내용은 마이페이지에서 볼 수 있습니다.',
          [['마이페이지에서 보기', 'mypage.html'], ['처음 화면으로', 'index.html']], true)
        : successPanel('사전 질문지를 받았습니다',
          '보내 주신 이야기와 사진으로 인터뷰를 준비합니다. 보낸 내용은 마이페이지에서 볼 수 있습니다.',
          [['마이페이지에서 보기', 'mypage.html'], ['처음 화면으로', 'index.html']]));
    } catch (error) {
      if (error && error.code === 'partial-upload') {
        clearDraft(user);
        root.replaceChildren(successPanel('질문지는 저장했지만 사진 일부가 빠졌습니다', explainError(error),
          [['마이페이지에서 보기', 'mypage.html'], ['사진 다시 보내기', 'story-form.html' + (v.applicationId ? '?app=' + encodeURIComponent(v.applicationId) : '')]]));
        return;
      }
      status.textContent = explainError(error) + ' 입력한 내용은 그대로 남아 있습니다.';
      toast(explainError(error), 'error');
      submit.disabled = false;
      submit.textContent = label;
    }
  });
  return form;
}
