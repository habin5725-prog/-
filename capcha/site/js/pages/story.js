/* 사전 질문지 작성 (로그인한 사람만) · 사진은 브라우저에서 줄인 뒤 올립니다. */
import { app } from '../app.js';
import { LIMITS, explainError, mode } from '../backend.js';
import { h, loginGate, clearErrors, toast, resizeImage, setFieldError } from '../ui.js';
import { textField, textArea, consentField, readForm, showErrors, successPanel } from '../forms.js';

const root = document.getElementById('form-root');
// 체험 모드는 브라우저 저장 공간이 작아서 사진을 더 작게 줄입니다.
const PHOTO_SIDE = mode === 'demo' ? 640 : 1600;
const PHOTO_CHARS = mode === 'demo' ? 120000 : 900000;
let api = null;

app.ready.then(function (backend) { api = backend; });
app.onUser(render);

function render(user) {
  if (!user) {
    root.replaceChildren(loginGate(app, {
      title: '로그인 후 사전 질문지를 작성할 수 있습니다',
      text: '구글 계정으로 로그인하면 부모님 이야기와 옛 사진을 올릴 수 있습니다. 둘러보기는 로그인 없이 할 수 있습니다.',
    }));
    return;
  }
  root.replaceChildren(buildForm(user));
}

function buildForm(user) {
  const photos = [];
  const status = h('p', { class: 'form-status', role: 'status', 'aria-live': 'polite' });
  const submit = h('button', { class: 'btn btn-solid btn-lg', type: 'submit' }, '사전 질문지 보내기');
  const grid = h('ul', { class: 'photo-grid', 'aria-label': '고른 사진' });
  const fileInput = h('input', { class: 'file-input', id: 'f-photos', type: 'file', accept: 'image/*', multiple: true, 'aria-describedby': 'f-photos-hint' });
  const countText = h('span', { text: '0' });

  const photoField = h('div', { class: 'field', 'data-field': 'photos' },
    h('p', { class: 'label', id: 'photos-label' }, h('strong', { class: 'photo-label', text: '옛 사진' }), h('span', { class: 'opt', text: '선택' })),
    h('div', { class: 'photo-picker' },
      fileInput,
      h('label', { class: 'btn btn-sm', for: 'f-photos' }, '사진 고르기'),
      h('p', { id: 'f-photos-hint' }, '최대 ' + LIMITS.photos + '장 · 지금 ', countText, '장 · 사진은 자동으로 줄여서 올립니다.'),
      grid));

  function redraw() {
    grid.replaceChildren(...photos.map(function (photo, index) {
      return h('li', { class: 'photo-item' },
        h('img', { src: photo.dataUrl, alt: (index + 1) + '번째 사진: ' + photo.name }),
        h('button', {
          class: 'photo-remove', type: 'button', 'aria-label': (index + 1) + '번째 사진 빼기',
          onclick: function () { photos.splice(index, 1); redraw(); fileInput.focus(); },
        }, h('span', { 'aria-hidden': 'true', text: '×' })));
    }));
    countText.textContent = String(photos.length);
  }

  fileInput.addEventListener('change', async function () {
    const files = Array.from(fileInput.files || []);
    fileInput.value = '';
    if (!files.length) return;
    setFieldError(photoField, '');
    let skipped = 0;
    for (const file of files) {
      if (photos.length >= LIMITS.photos) {
        skipped++;
        continue;
      }
      status.textContent = '사진을 준비하는 중입니다.';
      try {
        photos.push(await resizeImage(file, PHOTO_SIDE, PHOTO_CHARS));
        redraw();
      } catch (e) {
        toast((file.name || '사진') + ' 파일은 열 수 없어서 뺐습니다. JPG나 PNG 사진을 골라 주세요.', 'error');
      }
    }
    status.textContent = '';
    if (skipped) toast('사진은 최대 ' + LIMITS.photos + '장까지 올릴 수 있어서 ' + skipped + '장을 뺐습니다.', 'error');
  });

  const form = h('form', { class: 'form-card', novalidate: true },
    h('p', { class: 'form-who' }, h('strong', { text: user.name }), ' 님으로 작성합니다. 떠오르는 만큼 편하게 적어 주세요.'),
    textField('applicantName', '신청하신 분 이름', { required: true, max: LIMITS.name, autocomplete: 'name', value: user.name === '이름 없음' ? '' : user.name, hint: '신청서와 같은 이름을 적어 주세요.' }),
    textArea('daily', '부모님의 사소한 일상', { max: LIMITS.text, hint: '예: 즐겨 드시는 음식 · 자주 하시는 말씀 · 하루를 보내는 모습' }),
    textArea('keepStory', '간직하고 싶은 이야기', { max: LIMITS.text, hint: '예: 처음 만난 날 · 고향 이야기 · 가족에게 들려주시던 이야기' }),
    textArea('questions', '자녀가 부모님께 묻고 싶은 질문', { max: LIMITS.text, hint: '직접 여쭙기 어려웠던 질문도 괜찮습니다. 인터뷰 때 여쭙니다.' }),
    photoField,
    textArea('photoNote', '사진 설명', { max: LIMITS.memo, rows: 3, hint: '언제 · 어디서 · 누구와 찍은 사진인지 적어 주세요.' }),
    consentField('consent', [
      ['수집 · 이용 목적', '인터뷰 준비와 인터뷰 영상 · 생애 기록 책 제작'],
      ['수집 항목', '신청자 이름 · 부모님의 일상과 이야기 · 질문 · 옛 사진과 설명 · 구글 계정 이메일'],
      ['보유 및 이용 기간', '시범 운영 기간 동안 보관하며 요청하면 지체 없이 삭제합니다.'],
      ['동의 거부 권리', '동의하지 않을 수 있으며 이 경우 사전 질문지를 받을 수 없습니다.'],
    ]),
    h('p', { class: 'field-hint' }, '부모님의 이야기와 사진은 부모님께서 동의하신 내용만 올려 주세요.'),
    h('div', { class: 'form-actions' }, submit),
    status
  );

  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    clearErrors(form);
    status.textContent = '';
    const v = readForm(form);
    const errors = [];
    if (!v.applicantName) errors.push(['applicantName', '이름을 적어 주세요.']);
    if (!v.daily && !v.keepStory && !v.questions && !photos.length) {
      errors.push(['daily', '이야기 칸 중 하나를 적거나 사진을 한 장 이상 올려 주세요.']);
    }
    if (!v.consent) errors.push(['consent', '개인정보 수집 · 이용에 동의해 주세요.']);
    if (errors.length) {
      showErrors(form, errors, status);
      return;
    }
    submit.disabled = true;
    submit.textContent = '보내는 중입니다';
    try {
      await api.addStory(v, photos, function (done, total) {
        status.textContent = '사진을 올리는 중입니다. (' + done + ' / ' + total + ')';
      });
      root.replaceChildren(successPanel('사전 질문지를 받았습니다',
        '보내 주신 이야기와 사진으로 인터뷰를 준비합니다. 보낸 내용은 마이페이지에서 볼 수 있습니다.',
        [['마이페이지에서 보기', 'mypage.html'], ['처음 화면으로', 'index.html']]));
    } catch (error) {
      status.textContent = explainError(error);
      toast(explainError(error), 'error');
      submit.disabled = false;
      submit.textContent = '사전 질문지 보내기';
    }
  });
  return form;
}
