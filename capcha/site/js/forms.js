/* ==========================================================
   캡챠(CAPCHA) 입력 폼 부품
   신청서 · 사전 질문지 · 문의하기가 함께 씁니다.
   ========================================================== */
import { h, setFieldError } from './ui.js';

function labelText(text, required) {
  return [text, required ? h('span', { class: 'req', text: '필수' }) : h('span', { class: 'opt', text: '선택' })];
}

function hintEl(id, text) {
  return text ? h('p', { class: 'field-hint', id: id + '-hint', text: text }) : null;
}

export function textField(name, label, o) {
  const opts = o || {};
  const id = 'f-' + name;
  const input = h('input', {
    class: 'input', id: id, name: name, type: opts.type || 'text', maxlength: opts.max || null,
    autocomplete: opts.autocomplete || 'off', inputmode: opts.inputmode || null, placeholder: opts.placeholder || null,
    'aria-required': opts.required ? 'true' : null, 'aria-describedby': opts.hint ? id + '-hint' : null,
  });
  if (opts.value) input.value = opts.value;
  return h('div', { class: 'field', 'data-field': name, hidden: opts.hidden || false },
    h('label', { for: id }, labelText(label, opts.required)), hintEl(id, opts.hint), input);
}

export function textArea(name, label, o) {
  const opts = o || {};
  const id = 'f-' + name;
  return h('div', { class: 'field', 'data-field': name },
    h('label', { for: id }, labelText(label, opts.required)), hintEl(id, opts.hint),
    h('textarea', {
      class: 'textarea', id: id, name: name, maxlength: opts.max || null, rows: opts.rows || 5,
      placeholder: opts.placeholder || null, 'aria-required': opts.required ? 'true' : null,
      'aria-describedby': opts.hint ? id + '-hint' : null,
    }));
}

export function selectField(name, label, options, o) {
  const opts = o || {};
  const id = 'f-' + name;
  return h('div', { class: 'field', 'data-field': name },
    h('label', { for: id }, labelText(label, opts.required)), hintEl(id, opts.hint),
    h('select', { class: 'select', id: id, name: name, 'aria-required': opts.required ? 'true' : null, 'aria-describedby': opts.hint ? id + '-hint' : null },
      h('option', { value: '', text: '골라 주세요' }),
      options.map(function (value) { return h('option', { value: value, text: value }); })));
}

export function checkGroup(name, label, options, o) {
  const opts = o || {};
  const id = 'f-' + name;
  return h('fieldset', { class: 'field', 'data-field': name, 'aria-describedby': opts.hint ? id + '-hint' : null },
    h('legend', null, labelText(label, opts.required)), hintEl(id, opts.hint),
    h('div', { class: 'choice-list cols-2' },
      options.map(function (value, i) {
        return h('label', { class: 'choice' },
          h('input', { type: 'checkbox', name: name, value: value, id: id + '-' + i }),
          h('span', { text: value }));
      })));
}

/* 개인정보 수집 · 이용 동의 (개인정보 보호법 제15조 제2항의 네 가지 안내) */
export function consentField(name, items) {
  const id = 'f-' + name;
  return h('fieldset', { class: 'field consent', 'data-field': name },
    h('legend', null, labelText('개인정보 수집 · 이용 동의', true)),
    h('ul', null, items.map(function (item) { return h('li', null, h('strong', { text: item[0] + ': ' }), item[1]); })),
    h('p', null, '자세한 내용은 ', h('a', { href: 'privacy.html', text: '개인정보 처리방침' }), '에서 볼 수 있습니다.'),
    h('label', { class: 'choice' },
      h('input', { type: 'checkbox', name: name, value: 'yes', id: id, 'aria-required': 'true' }),
      h('span', { text: '위 내용을 읽었고 동의합니다.' })));
}

export function readForm(form) {
  const data = {};
  Array.from(form.elements).forEach(function (el) {
    if (!el.name || el.disabled) return;
    if (el.type === 'checkbox') {
      if (el.value === 'yes') data[el.name] = el.checked;
      else {
        data[el.name] = data[el.name] || [];
        if (el.checked) data[el.name].push(el.value);
      }
    } else if (el.type === 'radio') {
      if (el.checked) data[el.name] = el.value;
      else if (!(el.name in data)) data[el.name] = '';
    } else if (el.type !== 'file' && !el.hasAttribute('data-skip')) {
      data[el.name] = el.value.trim();
    }
  });
  return data;
}

/* 오류 목록을 화면에 표시하고 첫 칸으로 이동합니다. errors: [[name, message], ...] */
export function showErrors(form, errors, statusEl) {
  errors.forEach(function (pair) {
    const field = form.querySelector('[data-field="' + pair[0] + '"]');
    if (field) setFieldError(field, pair[1]);
  });
  if (!errors.length) return;
  const first = form.querySelector('[data-field="' + errors[0][0] + '"]');
  const control = first && first.querySelector('input, select, textarea');
  if (control) control.focus();
  if (statusEl) statusEl.textContent = '확인이 필요한 항목이 ' + errors.length + '개 있습니다.';
}

/* 하나만 고르는 선택지. options: [[값, 보이는 글, 설명], ...] */
export function radioGroup(name, label, options, o) {
  const opts = o || {};
  const id = 'f-' + name;
  return h('fieldset', { class: 'field', 'data-field': name, 'aria-describedby': opts.hint ? id + '-hint' : null },
    h('legend', null, labelText(label, opts.required)), hintEl(id, opts.hint),
    h('div', { class: 'choice-list' },
      options.map(function (opt, i) {
        return h('label', { class: 'choice choice-rich' },
          h('input', { type: 'radio', name: name, value: opt[0], id: id + '-' + i, checked: opts.value === opt[0] }),
          h('span', null, h('strong', { text: opt[1] }), opt[2] ? h('small', { text: opt[2] }) : null));
      })));
}

/* 체험판에서 폼 위에 보이는 안내 */
export function demoNotice() {
  return h('p', { class: 'demo-note' },
    h('strong', { text: '체험판입니다. ' }),
    '보내기를 눌러도 운영자에게 전송되지 않고 이 브라우저에만 저장됩니다. 실제 이름 · 연락처 대신 예시 내용을 넣어 주세요.');
}

export function successPanel(title, text, actions, demo) {
  const heading = h('h2', { tabindex: '-1', text: title });
  const panel = h('div', { class: 'form-card success' },
    h('p', { class: 'eyebrow', lang: 'en', text: demo ? 'Saved in This Browser' : 'Thank You' }),
    heading,
    h('p', { text: text }),
    h('div', null, actions.map(function (a, i) {
      return h('a', { class: 'btn ' + (i === 0 ? 'btn-solid' : ''), href: a[1], text: a[0] });
    })));
  window.setTimeout(function () { heading.focus(); }, 50);
  return panel;
}

export const PHONE_RE = /^0\d{1,2}-?\d{3,4}-?\d{4}$/;
