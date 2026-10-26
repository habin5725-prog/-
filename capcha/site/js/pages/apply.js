/* 신청서 작성 (로그인한 사람만) */
import { app } from '../app.js';
import { AGES, REGIONS, PRODUCTS, LIMITS, explainError } from '../backend.js';
import { h, loginGate, clearErrors, toast } from '../ui.js';
import { textField, textArea, selectField, checkGroup, consentField, readForm, showErrors, successPanel, PHONE_RE } from '../forms.js';

const root = document.getElementById('form-root');
let api = null;

app.ready.then(function (backend) { api = backend; });
app.onUser(render);

function render(user) {
  if (!user) {
    root.replaceChildren(loginGate(app, {
      title: '로그인 후 신청서를 작성할 수 있습니다',
      text: '구글 계정으로 로그인하면 신청서를 남기고 진행 상황을 마이페이지에서 볼 수 있습니다. 둘러보기는 로그인 없이 할 수 있습니다.',
    }));
    return;
  }
  root.replaceChildren(buildForm(user));
}

function buildForm(user) {
  const status = h('p', { class: 'form-status', role: 'status', 'aria-live': 'polite' });
  const submit = h('button', { class: 'btn btn-solid btn-lg', type: 'submit' }, '신청서 보내기');
  const form = h('form', { class: 'form-card', novalidate: true },
    h('p', { class: 'form-who' }, h('strong', { text: user.name }), ' 님으로 작성합니다.'),
    textField('applicantName', '신청하는 분 이름', { required: true, max: LIMITS.name, autocomplete: 'name', value: user.name === '이름 없음' ? '' : user.name }),
    textField('phone', '연락처', { required: true, max: LIMITS.phone, type: 'tel', inputmode: 'tel', autocomplete: 'tel', placeholder: '010-1234-5678', hint: '상담 연락에만 씁니다.' }),
    selectField('parentAge', '부모님 연세대', AGES, { required: true }),
    selectField('region', '지역', REGIONS, { required: true, hint: '지금은 대전에서 먼저 시작합니다.' }),
    textField('regionDetail', '기타 지역', { required: true, max: LIMITS.short, placeholder: '예: 세종시 · 청주시', hidden: true }),
    checkGroup('products', '원하는 결과물', PRODUCTS, { required: true, hint: '여러 개를 고를 수 있습니다. 3D 피규어는 선택 사항입니다.' }),
    textField('preferredTime', '희망 시기', { required: true, max: LIMITS.short, placeholder: '예: 2027년 3월 · 아버지 칠순 전' }),
    textArea('message', '남기실 말씀', { max: LIMITS.text, rows: 4, placeholder: '부모님에 대해 미리 알려 주실 점이나 궁금한 점을 적어 주세요.' }),
    consentField('consent', [
      ['수집 · 이용 목적', '상담 연락과 서비스 안내'],
      ['수집 항목', '신청자 이름 · 연락처 · 부모님 연세대 · 지역 · 원하는 결과물 · 희망 시기 · 남기실 말씀 · 구글 계정 이메일'],
      ['보유 및 이용 기간', '시범 운영 기간 동안 보관하며 요청하면 지체 없이 삭제합니다.'],
      ['동의 거부 권리', '동의하지 않을 수 있으며 이 경우 신청서를 받을 수 없습니다.'],
    ]),
    h('div', { class: 'form-actions' }, submit),
    status
  );

  const region = form.querySelector('#f-region');
  const regionDetail = form.querySelector('[data-field="regionDetail"]');
  region.addEventListener('change', function () {
    regionDetail.hidden = region.value !== '기타';
  });

  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    clearErrors(form);
    status.textContent = '';
    const v = readForm(form);
    const errors = [];
    if (!v.applicantName) errors.push(['applicantName', '이름을 적어 주세요.']);
    if (!PHONE_RE.test((v.phone || '').replace(/\s/g, ''))) errors.push(['phone', '연락처를 010-1234-5678 형식으로 적어 주세요.']);
    if (!v.parentAge) errors.push(['parentAge', '부모님 연세대를 골라 주세요.']);
    if (!v.region) errors.push(['region', '지역을 골라 주세요.']);
    if (v.region === '기타' && !v.regionDetail) errors.push(['regionDetail', '지역을 적어 주세요.']);
    if (!v.products || !v.products.length) errors.push(['products', '원하는 결과물을 하나 이상 골라 주세요.']);
    if (!v.preferredTime) errors.push(['preferredTime', '희망 시기를 적어 주세요.']);
    if (!v.consent) errors.push(['consent', '개인정보 수집 · 이용에 동의해 주세요.']);
    if (errors.length) {
      showErrors(form, errors, status);
      return;
    }
    if (v.region !== '기타') v.regionDetail = '';

    submit.disabled = true;
    submit.textContent = '보내는 중입니다';
    try {
      await api.addApplication(v);
      root.replaceChildren(successPanel('신청이 접수되었습니다',
        '남겨 주신 연락처로 상담 연락을 드립니다. 진행 상황은 마이페이지에서 볼 수 있습니다.',
        [['마이페이지에서 보기', 'mypage.html'], ['사전 질문지 작성하기', 'story-form.html']]));
    } catch (error) {
      status.textContent = explainError(error);
      toast(explainError(error), 'error');
      submit.disabled = false;
      submit.textContent = '신청서 보내기';
    }
  });
  return form;
}
