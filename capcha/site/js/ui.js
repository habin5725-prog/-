/* ==========================================================
   캡챠(CAPCHA) 화면 도우미
   사용자가 입력한 글은 항상 textContent로 넣습니다. (innerHTML을 쓰지 않습니다)
   ========================================================== */

/* 요소 만들기: h('p', { class: 'x', text: '내용' }, 자식...) */
export function h(tag, attrs, ...children) {
  const el = document.createElement(tag);
  Object.entries(attrs || {}).forEach(function ([key, value]) {
    if (value === false || value === null || value === undefined) return;
    if (key === 'class') el.className = value;
    else if (key === 'text') el.textContent = value;
    else if (key.startsWith('on') && typeof value === 'function') el.addEventListener(key.slice(2), value);
    else if (value === true) el.setAttribute(key, '');
    else el.setAttribute(key, value);
  });
  children.flat(Infinity).forEach(function (child) {
    if (child === null || child === undefined || child === false) return;
    el.append(child instanceof Node ? child : document.createTextNode(String(child)));
  });
  return el;
}

export function formatDate(date) {
  if (!date) return '-';
  return date.toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

/* 화면 아래 알림 (화면 읽기 프로그램도 읽습니다) */
let toastEl = null;
let toastTimer = null;
export function toast(message, kind) {
  if (!toastEl) {
    toastEl = h('div', { class: 'toast', role: 'status', 'aria-live': 'polite' });
    document.body.append(toastEl);
  }
  toastEl.textContent = message;
  toastEl.className = 'toast is-visible' + (kind === 'error' ? ' is-error' : '');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () { toastEl.className = 'toast'; }, 4500);
}

const STATUS_CLASS = { '접수': 's-new', '상담 중': 's-talk', '촬영 예정': 's-shoot', '제작 중': 's-make', '전달 완료': 's-done', '취소': 's-cancel' };
export function statusBadge(status) {
  return h('span', { class: 'status ' + (STATUS_CLASS[status] || 's-new'), text: status || '접수' });
}

/* 로그인 안내 상자 */
export function loginGate(app, options) {
  const opts = options || {};
  return h('div', { class: 'gate' },
    h('h2', { class: 'gate-title', text: opts.title || '로그인이 필요합니다' }),
    h('p', { class: 'gate-text', text: opts.text || '둘러보기는 로그인 없이 할 수 있습니다. 작성하려면 로그인해 주세요.' }),
    h('button', { class: 'btn btn-solid', type: 'button', onclick: function () { app.openLogin(); } },
      app.mode === 'demo' ? '체험 계정 고르기' : '구글 계정으로 로그인'),
    opts.extra || null
  );
}

export function emptyState(text) {
  return h('p', { class: 'empty', text: text });
}

export function loading(text) {
  return h('p', { class: 'loading', role: 'status', text: text || '불러오는 중입니다.' });
}

/* 폼 오류 표시 */
export function setFieldError(field, message) {
  const control = field.querySelector('input, select, textarea');
  let error = field.querySelector('.field-error');
  if (!message) {
    if (error) {
      if (control) {
        const rest = (control.getAttribute('aria-describedby') || '').split(' ').filter(function (id) { return id && id !== error.id; });
        if (rest.length) control.setAttribute('aria-describedby', rest.join(' '));
        else control.removeAttribute('aria-describedby');
      }
      error.remove();
    }
    field.classList.remove('has-error');
    if (control) control.removeAttribute('aria-invalid');
    return;
  }
  if (!error) {
    error = h('p', { class: 'field-error', id: (control && control.id ? control.id : 'f' + Math.random().toString(36).slice(2)) + '-error' });
    field.append(error);
  }
  error.textContent = message;
  field.classList.add('has-error');
  if (control) {
    control.setAttribute('aria-invalid', 'true');
    const described = (control.getAttribute('aria-describedby') || '').split(' ').filter(Boolean);
    if (described.indexOf(error.id) < 0) described.push(error.id);
    control.setAttribute('aria-describedby', described.join(' '));
  }
}

export function clearErrors(form) {
  form.querySelectorAll('.field').forEach(function (field) { setFieldError(field, ''); });
}

/* 사진 줄이기: 긴 변을 maxSide 이하로, 결과 글자 수를 maxChars 이하로 맞춥니다. */
export async function resizeImage(file, maxSide, maxChars) {
  let source;
  try {
    source = await createImageBitmap(file);
  } catch (e) {
    source = await new Promise(function (resolve, reject) {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = function () { URL.revokeObjectURL(url); resolve(img); };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('decode')); };
      img.src = url;
    });
  }
  const sw = source.width;
  const sh = source.height;
  let scale = Math.min(1, maxSide / Math.max(sw, sh));
  let quality = 0.85;
  for (let i = 0; i < 12; i++) {
    const w = Math.max(1, Math.round(sw * scale));
    const hgt = Math.max(1, Math.round(sh * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = hgt;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, hgt);
    ctx.drawImage(source, 0, 0, w, hgt);
    const dataUrl = canvas.toDataURL('image/jpeg', quality);
    if (dataUrl.length <= maxChars) {
      if (source.close) source.close();
      return { dataUrl: dataUrl, width: w, height: hgt, name: file.name || '사진' };
    }
    if (quality > 0.6) quality -= 0.1;
    else scale *= 0.8;
  }
  if (source.close) source.close();
  throw new Error('too-large');
}

/* 탭 목록 (화살표 · Home · End 키 지원) */
export function setupTabs(tablist, onChange) {
  const tabs = Array.from(tablist.querySelectorAll('[role="tab"]'));
  function select(index, focus) {
    tabs.forEach(function (tab, i) {
      const active = i === index;
      tab.setAttribute('aria-selected', active ? 'true' : 'false');
      tab.tabIndex = active ? 0 : -1;
      const panel = document.getElementById(tab.getAttribute('aria-controls'));
      if (panel) panel.hidden = !active;
    });
    if (focus) tabs[index].focus();
    if (onChange) onChange(tabs[index], index);
  }
  tabs.forEach(function (tab, i) {
    tab.addEventListener('click', function () { select(i, false); });
    tab.addEventListener('keydown', function (event) {
      let next = null;
      if (event.key === 'ArrowRight') next = (i + 1) % tabs.length;
      else if (event.key === 'ArrowLeft') next = (i - 1 + tabs.length) % tabs.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = tabs.length - 1;
      if (next === null) return;
      event.preventDefault();
      select(next, true);
    });
  });
  return select;
}
