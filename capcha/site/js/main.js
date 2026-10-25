/* ==========================================================
   캡챠(CAPCHA) 공통 스크립트
   - 첫 화면 슬라이드(탭 3개 + 진행 막대)
   - 화면에 들어올 때 서서히 나타나기
   이 파일은 어떤 정보도 저장하거나 외부로 보내지 않습니다.
   ========================================================== */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ---------- 첫 화면 슬라이드 ---------- */
  function initCarousel(root) {
    var tabs = Array.prototype.slice.call(root.querySelectorAll('[role="tab"]'));
    var panels = tabs.map(function (tab) {
      return document.getElementById(tab.getAttribute('aria-controls'));
    });
    var slides = root.querySelector('.hero-slides');
    var controls = root.querySelector('.hero-tabs');
    var toggle = root.querySelector('.hero-toggle');
    var current = 0;
    var paused = false;

    if (!tabs.length) return;
    controls.hidden = false;

    function show(index, moveFocus) {
      current = (index + tabs.length) % tabs.length;
      tabs.forEach(function (tab, i) {
        var active = i === current;
        tab.setAttribute('aria-selected', active ? 'true' : 'false');
        tab.tabIndex = active ? 0 : -1;
        tab.classList.toggle('is-active', active);
        panels[i].classList.toggle('is-active', active);
      });
      if (moveFocus) tabs[current].focus();
    }

    function setPaused(value) {
      paused = value;
      root.classList.toggle('is-paused', paused);
      // 자동으로 넘어가는 동안에는 화면 읽기 프로그램이 매번 읽지 않도록 합니다.
      slides.setAttribute('aria-live', paused ? 'polite' : 'off');
      toggle.setAttribute('aria-label', paused ? '슬라이드 자동 넘김 시작' : '슬라이드 자동 넘김 멈춤');
    }

    function applyMotionSetting() {
      // 움직임 줄이기 설정을 켠 경우 자동 넘김을 끄고 버튼도 숨깁니다.
      toggle.hidden = reduceMotion.matches;
      if (reduceMotion.matches) setPaused(true);
    }

    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () {
        show(i, false);
      });
      tab.addEventListener('keydown', function (event) {
        var next = null;
        if (event.key === 'ArrowRight') next = current + 1;
        else if (event.key === 'ArrowLeft') next = current - 1;
        else if (event.key === 'Home') next = 0;
        else if (event.key === 'End') next = tabs.length - 1;
        if (next === null) return;
        event.preventDefault();
        show(next, true);
      });
      // 진행 막대가 끝까지 차면 다음 슬라이드로 넘어갑니다.
      tab.querySelector('.hero-tab-fill').addEventListener('animationend', function () {
        if (!paused && tab.classList.contains('is-active')) show(current + 1, false);
      });
    });

    toggle.addEventListener('click', function () {
      setPaused(!paused);
    });

    // 키보드로 슬라이드 안에 들어오면 자동 넘김을 멈춥니다. (멈춤 버튼 자체는 제외)
    root.addEventListener('focusin', function (event) {
      if (event.target !== toggle && !paused) setPaused(true);
    });

    if (typeof reduceMotion.addEventListener === 'function') {
      reduceMotion.addEventListener('change', applyMotionSetting);
    }

    setPaused(false);
    applyMotionSetting();
    show(0, false);
  }

  /* ---------- 서서히 나타나기 ---------- */
  function initReveal() {
    var items = document.querySelectorAll('.reveal');
    if (!items.length || reduceMotion.matches || !('IntersectionObserver' in window)) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.remove('is-hidden');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -40px 0px', threshold: 0 });

    var limit = window.innerHeight * 0.92;
    Array.prototype.forEach.call(items, function (item) {
      // 이미 화면에 보이는 요소는 그대로 두고, 아래쪽 요소만 숨겼다가 보여 줍니다.
      if (item.getBoundingClientRect().top > limit) {
        item.classList.add('is-hidden');
        observer.observe(item);
      }
    });
  }

  var carousel = document.querySelector('.hero-carousel');
  if (carousel) initCarousel(carousel);
  initReveal();
})();
