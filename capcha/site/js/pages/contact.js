/* 문의하기 (로그인한 사람만) · 답변은 마이페이지에서 봅니다. */
import { app } from '../app.js';
import { LIMITS, explainError } from '../backend.js';
import { h, loginGate, clearErrors, toast } from '../ui.js';
import { textField, textArea, consentField, readForm, showErrors, successPanel } from '../forms.js';

const root = document.getElementById('form-root');
let api = null;

app.ready.then(function (backend) { api = backend; });
app.onUser(render);

function render(user) {
  if (!user) {
    root.replaceChildren(loginGate(app, {
      title: '로그인 후 문의를 남길 수 있습니다',
      text: '구글 계정으로 로그인하면 문의를 남기고 답변을 마이페이지에서 볼 수 있습니다.',
    }));
    return;
  }
  root.replaceChildren(buildForm(user));
}

function buildForm(user) {
  const status = h('p', { class: 'form-status', role: 'status', 'aria-live': 'polite' });
  const submit = h('button', { class: 'btn btn-solid btn-lg', type: 'submit' }, '문의 보내기');
  const form = h('form', { class: 'form-card', novalidate: true },
    h('p', { class: 'form-who' }, h('strong', { text: user.name }), ' 님으로 작성합니다.'),
    textField('title', '제목', { required: true, max: LIMITS.short, placeholder: '예: 세종에서도 신청할 수 있나요?' }),
    textArea('body', '문의 내용', { required: true, max: LIMITS.text, rows: 7 }),
    consentField('consent', [
      ['수집 · 이용 목적', '문의 확인과 답변'],
      ['수집 항목', '이름 · 구글 계정 이메일 · 문의 내용'],
      ['보유 및 이용 기간', '시범 운영 기간 동안 보관하며 요청하면 지체 없이 삭제합니다.'],
      ['동의 거부 권리', '동의하지 않을 수 있으며 이 경우 문의를 받을 수 없습니다.'],
    ]),
    h('div', { class: 'form-actions' }, submit),
    status
  );

  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    clearErrors(form);
    status.textContent = '';
    const v = readForm(form);
    const errors = [];
    if (!v.title) errors.push(['title', '제목을 적어 주세요.']);
    if (!v.body) errors.push(['body', '문의 내용을 적어 주세요.']);
    if (!v.consent) errors.push(['consent', '개인정보 수집 · 이용에 동의해 주세요.']);
    if (errors.length) {
      showErrors(form, errors, status);
      return;
    }
    submit.disabled = true;
    submit.textContent = '보내는 중입니다';
    try {
      await api.addInquiry({ name: user.name, title: v.title, body: v.body });
      root.replaceChildren(successPanel('문의를 받았습니다',
        '답변은 마이페이지의 내 문의에서 볼 수 있습니다.',
        [['마이페이지에서 보기', 'mypage.html'], ['처음 화면으로', 'index.html']]));
    } catch (error) {
      status.textContent = explainError(error);
      toast(explainError(error), 'error');
      submit.disabled = false;
      submit.textContent = '문의 보내기';
    }
  });
  return form;
}
