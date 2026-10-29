/* 방문 인터뷰 상담 신청 (로그인한 사람만)
   처음에는 꼭 필요한 항목(이름 · 연락처 · 지역 · 동의)만 받고 나머지는 '미정'으로 둘 수 있습니다. */
import { app } from '../app.js';
import { AGES, REGIONS, LIMITS, explainError } from '../backend.js';
import { h, loginGate, clearErrors, toast } from '../ui.js';
import { textField, textArea, selectField, checkGroup, radioGroup, consentField, readForm, showErrors, successPanel, demoNotice, PHONE_RE } from '../forms.js';

const root = document.getElementById('form-root');
const demo = app.mode === 'demo';
let api = null;

app.ready.then(function (backend) { api = backend; });
app.onUser(render);

function render(user) {
  if (!user) {
    root.replaceChildren(loginGate(app, {
      title: demo ? '체험 계정을 고르면 신청서를 써 볼 수 있습니다' : '로그인 후 상담 신청서를 작성할 수 있습니다',
      text: demo
        ? '체험판에서는 실제 로그인 대신 체험 계정을 씁니다. 입력한 내용은 운영자에게 전송되지 않습니다.'
        : '구글 계정으로 로그인하면 신청한 내용과 진행 상황을 마이페이지에서 이어서 볼 수 있습니다. 로그인 없이 궁금한 점만 물으려면 문의하기를 이용해 주세요.',
      extra: h('p', { class: 'gate-sub' }, h('a', { href: 'contact.html', text: '로그인 없이 문의하기' })),
    }));
    return;
  }
  root.replaceChildren(buildForm(user));
}

function buildForm(user) {
  const status = h('p', { class: 'form-status', role: 'status', 'aria-live': 'polite' });
  const label = demo ? '체험 저장하기' : '상담 신청 보내기';
  const submit = h('button', { class: 'btn btn-solid btn-lg', type: 'submit' }, label);
  const form = h('form', { class: 'form-card', novalidate: true },
    demo ? demoNotice() : null,
    h('p', { class: 'form-who' }, h('strong', { text: user.name }), ' 님으로 작성합니다. 이 신청은 상담 요청이며 예약이나 결제가 아닙니다.'),
    h('p', { class: 'form-guide', text: '필수 항목은 이름 · 연락처 · 지역 · 동의 네 가지입니다. 나머지는 정하지 않았으면 비워 두셔도 됩니다.' }),
    textField('applicantName', '신청하는 분 이름', { required: true, max: LIMITS.name, autocomplete: 'name', value: demo || user.name === '이름 없음' ? '' : user.name, placeholder: demo ? '예: 홍길동' : null }),
    textField('phone', '연락처', { required: true, max: LIMITS.phone, type: 'tel', inputmode: 'tel', autocomplete: 'tel', placeholder: '010-1234-5678', hint: '상담 연락에만 씁니다.' }),
    selectField('region', '부모님이 사시는 지역', REGIONS, { required: true, hint: '대전에서 먼저 시작합니다. 다른 지역은 가능 여부를 상담에서 확인합니다.' }),
    textField('regionDetail', '기타 지역', { required: true, max: LIMITS.short, placeholder: '예: 세종시 · 청주시', hidden: true }),
    selectField('parentAge', '부모님 연세대', AGES, { hint: '모르거나 정하지 않았으면 비워 두셔도 됩니다.' }),
    radioGroup('plan', '원하는 구성', [
      ['base', '기본 구성: 인터뷰 영상 + 생애 기록 책', '영상과 책을 함께 만듭니다.'],
      ['undecided', '아직 모르겠어요', '상담에서 함께 정합니다.'],
    ], { value: 'undecided', hint: '영상이나 책 한 가지만 원하시면 남기실 말씀에 적어 주세요. 가능 여부는 상담에서 안내합니다.' }),
    checkGroup('figures', '추가 선택: 3D 피규어', ['3D 피규어 실사형', '3D 피규어 캐릭터형'], { hint: '피규어는 기본 구성에 더하는 선택 사항입니다.' }),
    textField('preferredTime', '희망 시기', { max: LIMITS.short, placeholder: '예: 2027년 3월 · 아버지 칠순 전', hint: '정하지 않았으면 비워 두셔도 됩니다.' }),
    textArea('message', '남기실 말씀', { max: LIMITS.text, rows: 4, placeholder: '부모님에 대해 미리 알려 주실 점이나 궁금한 점을 적어 주세요.' }),
    consentField('consent', [
      ['수집 · 이용 목적', '상담 연락과 서비스 안내'],
      ['수집 항목', '신청자 이름 · 연락처 · 지역 · 부모님 연세대 · 원하는 구성 · 희망 시기 · 남기실 말씀 · 로그인 계정 이메일'],
      ['보유 및 이용 기간', '보유 기간은 아직 확정하지 않았습니다. 확정 전에는 삭제를 요청하면 지체 없이 삭제합니다.'],
      ['동의 거부 권리', '동의하지 않을 수 있으며 이 경우 신청서를 받을 수 없습니다. 로그인 없이 문의하기는 이용할 수 있습니다.'],
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
    if (!v.region) errors.push(['region', '지역을 골라 주세요.']);
    if (v.region === '기타' && !v.regionDetail) errors.push(['regionDetail', '지역을 적어 주세요.']);
    if (!v.consent) errors.push(['consent', '개인정보 수집 · 이용에 동의해 주세요.']);
    if (errors.length) {
      showErrors(form, errors, status);
      return;
    }
    if (v.region !== '기타') v.regionDetail = '';
    // 기본 구성과 '상담 후 결정'은 함께 고를 수 없습니다. 피규어는 추가 선택입니다.
    v.products = (v.plan === 'base' ? ['인터뷰 영상', '생애 기록 책'] : ['상담 후 결정']).concat(v.figures || []);

    submit.disabled = true;
    submit.textContent = '저장하는 중입니다';
    try {
      await api.addApplication(v);
      root.replaceChildren(demo
        ? successPanel('이 브라우저에 저장했습니다',
          '체험판이라 운영자에게 전송되지 않았습니다. 저장한 내용은 마이페이지에서 볼 수 있고 관리자 체험 계정으로 바꾸면 관리자 화면도 볼 수 있습니다.',
          [['마이페이지에서 보기', 'mypage.html'], ['사전 질문지 써 보기', 'story-form.html']], true)
        : successPanel('상담 신청을 받았습니다',
          '남겨 주신 연락처로 상담 연락을 드립니다. 진행 상황은 마이페이지에서 볼 수 있습니다.',
          [['마이페이지에서 보기', 'mypage.html'], ['사전 질문지 작성하기', 'story-form.html']]));
    } catch (error) {
      status.textContent = explainError(error) + ' 입력한 내용은 그대로 남아 있습니다.';
      toast(explainError(error), 'error');
      submit.disabled = false;
      submit.textContent = label;
    }
  });
  return form;
}
