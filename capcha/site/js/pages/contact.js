/* 문의하기: 로그인 없이도 연락처를 남겨 문의할 수 있습니다.
   로그인하면 답변을 마이페이지에서 볼 수 있습니다.
   주소에 ?type=수정 요청&ref=신청서번호 가 있으면 제목을 미리 채웁니다. (마이페이지의 요청 버튼) */
import { app } from '../app.js';
import { LIMITS, explainError } from '../backend.js';
import { h, clearErrors, toast } from '../ui.js';
import { textField, textArea, consentField, readForm, showErrors, successPanel, demoNotice } from '../forms.js';

const root = document.getElementById('form-root');
const demo = app.mode === 'demo';
const params = new URLSearchParams(window.location.search);
const TYPES = ['수정 요청', '취소 요청', '자료 추가', '일정 변경 요청'];
let api = null;

app.ready.then(function (backend) { api = backend; });
app.onUser(render);

function render(user) {
  root.replaceChildren(buildForm(user));
}

function buildForm(user) {
  const label = demo ? '체험 저장하기' : '문의 보내기';
  const status = h('p', { class: 'form-status', role: 'status', 'aria-live': 'polite' });
  const submit = h('button', { class: 'btn btn-solid btn-lg', type: 'submit' }, label);
  const type = TYPES.indexOf(params.get('type')) >= 0 ? params.get('type') : '';
  const ref = (params.get('ref') || '').replace(/[^A-Za-z0-9]/g, '').slice(0, 40);
  const presetTitle = type ? type + (ref ? ' (신청서 ' + ref.slice(0, 6) + ')' : '') : '';

  const who = user
    ? h('p', { class: 'form-who' }, h('strong', { text: user.name }), ' 님으로 작성합니다. 답변은 마이페이지에서 볼 수 있습니다.')
    : h('p', { class: 'form-who' }, '로그인하지 않고 문의합니다. 답변은 남겨 주신 연락처로 드립니다. ',
      h('button', { class: 'link-btn', type: 'button', onclick: function () { app.openLogin(); } }, demo ? '체험 계정 고르기' : '로그인하고 문의하기'));

  const form = h('form', { class: 'form-card', novalidate: true },
    demo ? demoNotice() : null,
    who,
    user ? null : textField('name', '이름', { required: true, max: LIMITS.name, autocomplete: 'name', placeholder: demo ? '예: 홍길동' : null }),
    textField('contact', '답변 받을 연락처', {
      required: !user, max: LIMITS.short, autocomplete: 'email',
      placeholder: '이메일 또는 휴대폰 번호',
      hint: user ? '마이페이지 말고 다른 곳으로도 답변을 받고 싶으면 적어 주세요.' : '이메일이나 휴대폰 번호 중 편한 것을 적어 주세요.',
    }),
    textField('title', '제목', { required: true, max: LIMITS.short, placeholder: '예: 세종에서도 신청할 수 있나요?' }),
    textArea('body', '문의 내용', { required: true, max: LIMITS.text, rows: 7 }),
    consentField('consent', [
      ['수집 · 이용 목적', '문의 확인과 답변'],
      ['수집 항목', '이름 · 연락처 · 문의 내용 · (로그인한 경우) 로그인 계정 이메일'],
      ['보유 및 이용 기간', '보유 기간은 아직 확정하지 않았습니다. 확정 전에는 삭제를 요청하면 지체 없이 삭제합니다.'],
      ['동의 거부 권리', '동의하지 않을 수 있으며 이 경우 문의를 받을 수 없습니다.'],
    ]),
    h('div', { class: 'form-actions' }, submit),
    status
  );
  if (presetTitle) form.querySelector('#f-title').value = presetTitle;

  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    clearErrors(form);
    status.textContent = '';
    const v = readForm(form);
    const errors = [];
    if (!user && !v.name) errors.push(['name', '이름을 적어 주세요.']);
    if (!user && !v.contact) errors.push(['contact', '답변 받을 연락처를 적어 주세요.']);
    if (!v.title) errors.push(['title', '제목을 적어 주세요.']);
    if (!v.body) errors.push(['body', '문의 내용을 적어 주세요.']);
    if (!v.consent) errors.push(['consent', '개인정보 수집 · 이용에 동의해 주세요.']);
    if (errors.length) {
      showErrors(form, errors, status);
      return;
    }
    submit.disabled = true;
    submit.textContent = '저장하는 중입니다';
    try {
      await api.addInquiry({ name: user ? user.name : v.name, contact: v.contact, title: v.title, body: v.body, consent: v.consent });
      root.replaceChildren(demo
        ? successPanel('이 브라우저에 저장했습니다',
          '체험판이라 운영자에게 전송되지 않았습니다.' + (user ? ' 저장한 문의는 마이페이지에서 볼 수 있습니다.' : ''),
          user ? [['마이페이지에서 보기', 'mypage.html'], ['처음 화면으로', 'index.html']] : [['처음 화면으로', 'index.html']], true)
        : successPanel('문의를 받았습니다',
          user ? '답변은 마이페이지의 내 문의에서 볼 수 있습니다. 답변 시간과 알림 방식은 아직 정하지 않았습니다.' : '남겨 주신 연락처로 답변을 드립니다. 답변 시간은 아직 정하지 않았습니다.',
          user ? [['마이페이지에서 보기', 'mypage.html'], ['처음 화면으로', 'index.html']] : [['처음 화면으로', 'index.html']]));
    } catch (error) {
      status.textContent = explainError(error) + ' 입력한 내용은 그대로 남아 있습니다.';
      toast(explainError(error), 'error');
      submit.disabled = false;
      submit.textContent = label;
    }
  });
  return form;
}
