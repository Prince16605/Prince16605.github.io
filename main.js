/* ==========================================================================
   PRINCE VAGHASIYA — PORTFOLIO
   main.js — no dependencies, no build step
   01 utils · 02 audio · 03 gate · 04 nav · 05 menu · 06 cursor
   07 signature · 08 reveal · 09 counters · 10 manifesto · 11 parallax
   12 rail · 13 copy · 14 terminal · 15 boot
   ========================================================================== */
(function () {
  'use strict';

  /* ---------- 01 UTILS ---------- */
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var reduced = function () { return mqReduce.matches; };
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };
  var sess = {
    get: function (k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} }
  };
  var isTouch = window.matchMedia('(hover: none)').matches;

  /* ---------- 02 AUDIO ---------- */
  var Sound = (function () {
    var ctx = null, master = null, sfxBus = null, musicBus = null;
    var sfxOn = store.get('pv_sfx', '1') === '1';
    var musicOn = store.get('pv_bgm', '0') === '1';
    var started = false;

    function ensure() {
      if (ctx) return ctx;
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.9;
      master.connect(ctx.destination);
      sfxBus = ctx.createGain();
      sfxBus.gain.value = 0.5;
      sfxBus.connect(master);
      musicBus = ctx.createGain();
      musicBus.gain.value = 0.0;
      musicBus.connect(master);
      return ctx;
    }
    function now() { return ctx ? ctx.currentTime : 0; }

    function tone(opt) {
      if (!ctx || !sfxOn) return;
      var t = now();
      var o = ctx.createOscillator();
      var g = ctx.createGain();
      o.type = opt.type || 'sine';
      o.frequency.setValueAtTime(opt.f, t);
      if (opt.f2) o.frequency.exponentialRampToValueAtTime(Math.max(1, opt.f2), t + (opt.dur || 0.15));
      var peak = (opt.gain == null ? 0.18 : opt.gain);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(peak, t + (opt.attack || 0.008));
      g.gain.exponentialRampToValueAtTime(0.0001, t + (opt.dur || 0.15));
      var node = o;
      if (opt.filter) {
        var bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.value = opt.filter;
        bp.Q.value = 1.2;
        o.connect(bp); node = bp;
      }
      node.connect(g); g.connect(sfxBus);
      o.start(t); o.stop(t + (opt.dur || 0.15) + 0.02);
    }

    function noise(opt) {
      if (!ctx || !sfxOn) return;
      var dur = opt.dur || 0.25;
      var buf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * dur), ctx.sampleRate);
      var d = buf.getChannelData(0);
      for (var i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
      var src = ctx.createBufferSource(); src.buffer = buf;
      var f = ctx.createBiquadFilter();
      f.type = opt.type || 'bandpass';
      f.frequency.setValueAtTime(opt.f || 1200, now());
      if (opt.f2) f.frequency.exponentialRampToValueAtTime(Math.max(60, opt.f2), now() + dur);
      f.Q.value = opt.q == null ? 1.1 : opt.q;
      var g = ctx.createGain();
      g.gain.setValueAtTime(opt.gain == null ? 0.14 : opt.gain, now());
      g.gain.exponentialRampToValueAtTime(0.0001, now() + dur);
      src.connect(f); f.connect(g); g.connect(sfxBus);
      src.start(); src.stop(now() + dur);
    }

    /* ---- music: detuned saw pad + triangle arp + soft kick/hat ---- */
    var musicTimer = null, step = 0, nextTime = 0;
    var SCALE = [0, 3, 5, 7, 10, 12, 15, 19];
    var ROOT = 55; // A1

    function midiHz(semi) { return ROOT * Math.pow(2, semi / 12); }

    function pad(freq) {
      [0, 1].forEach(function (k) {
        var o = ctx.createOscillator();
        o.type = 'sawtooth';
        o.frequency.value = freq * (k ? 1.005 : 0.995);
        var f = ctx.createBiquadFilter();
        f.type = 'lowpass'; f.frequency.value = 420; f.Q.value = 3;
        var g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, nextTime);
        g.gain.linearRampToValueAtTime(0.05, nextTime + 0.9);
        g.gain.linearRampToValueAtTime(0.0001, nextTime + 3.6);
        o.connect(f); f.connect(g); g.connect(musicBus);
        o.start(nextTime); o.stop(nextTime + 3.7);
      });
    }

    function arp(freq) {
      var o = ctx.createOscillator();
      o.type = 'triangle';
      o.frequency.value = freq;
      var g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, nextTime);
      g.gain.exponentialRampToValueAtTime(0.035, nextTime + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, nextTime + 0.32);
      o.connect(g); g.connect(musicBus);
      o.start(nextTime); o.stop(nextTime + 0.34);
    }

    function kick() {
      var o = ctx.createOscillator();
      var g = ctx.createGain();
      o.frequency.setValueAtTime(120, nextTime);
      o.frequency.exponentialRampToValueAtTime(42, nextTime + 0.14);
      g.gain.setValueAtTime(0.14, nextTime);
      g.gain.exponentialRampToValueAtTime(0.0001, nextTime + 0.22);
      o.connect(g); g.connect(musicBus);
      o.start(nextTime); o.stop(nextTime + 0.24);
    }

    function hat() {
      var dur = 0.04;
      var buf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * dur), ctx.sampleRate);
      var d = buf.getChannelData(0);
      for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      var src = ctx.createBufferSource(); src.buffer = buf;
      var f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 7000;
      var g = ctx.createGain();
      g.gain.setValueAtTime(0.05, nextTime);
      g.gain.exponentialRampToValueAtTime(0.0001, nextTime + dur);
      src.connect(f); f.connect(g); g.connect(musicBus);
      src.start(nextTime); src.stop(nextTime + dur);
    }

    function schedule() {
      if (!ctx || !musicOn) return;
      var spb = 0.5; // 120bpm eighth notes
      while (nextTime < ctx.currentTime + 0.4) {
        if (step % 8 === 0) pad(midiHz(SCALE[0]) * 2);
        if (step % 2 === 0) arp(midiHz(SCALE[(step / 2) % SCALE.length]) * 4);
        if (step % 8 === 0 || step % 8 === 6) kick();
        if (step % 2 === 1) hat();
        nextTime += spb / 2;
        step++;
      }
    }

    function startMusic() {
      if (!ctx || started) return;
      started = true;
      nextTime = ctx.currentTime + 0.1;
      musicBus.gain.cancelScheduledValues(ctx.currentTime);
      musicBus.gain.setValueAtTime(0.0001, ctx.currentTime);
      musicBus.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 1.6);
      musicTimer = setInterval(schedule, 120);
      schedule();
    }
    function stopMusic() {
      if (!ctx) return;
      started = false;
      if (musicTimer) { clearInterval(musicTimer); musicTimer = null; }
      musicBus.gain.cancelScheduledValues(ctx.currentTime);
      musicBus.gain.setValueAtTime(musicBus.gain.value, ctx.currentTime);
      musicBus.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
    }

    var api = {
      unlock: function () {
        ensure();
        if (ctx && ctx.state === 'suspended') ctx.resume();
        if (musicOn) startMusic();
      },
      blip: function () { tone({ type: 'square', f: 880, f2: 1320, dur: 0.05, gain: 0.05 }); },
      click: function () { tone({ type: 'square', f: 420, f2: 180, dur: 0.07, gain: 0.09 }); },
      key: function () { tone({ type: 'square', f: 1400 + Math.random() * 400, dur: 0.025, gain: 0.022 }); },
      glitch: function () {
        noise({ type: 'bandpass', f: 900, f2: 180, dur: 0.16, gain: 0.1, q: 6 });
        tone({ type: 'sawtooth', f: 160, f2: 60, dur: 0.16, gain: 0.06 });
      },
      whoosh: function () { noise({ type: 'lowpass', f: 220, f2: 2600, dur: 0.34, gain: 0.07, q: 0.8 }); },
      slash: function () {
        noise({ type: 'highpass', f: 2400, f2: 320, dur: 0.3, gain: 0.16, q: 0.9 });
        tone({ type: 'sawtooth', f: 2200, f2: 180, dur: 0.28, gain: 0.06 });
      },
      dock: function () {
        tone({ type: 'sine', f: 220, f2: 70, dur: 0.22, gain: 0.2 });
        tone({ type: 'square', f: 90, f2: 45, dur: 0.16, gain: 0.07 });
      },
      chime: function () {
        [0, 0.09, 0.18].forEach(function (d, i) {
          setTimeout(function () {
            tone({ type: 'sine', f: [523, 659, 784][i], dur: 0.42, gain: 0.1 });
          }, d * 1000);
        });
      },
      error: function () {
        tone({ type: 'square', f: 160, f2: 90, dur: 0.18, gain: 0.1 });
        setTimeout(function () { tone({ type: 'square', f: 120, f2: 70, dur: 0.2, gain: 0.09 }); }, 130);
      },
      menuOpen: function () { tone({ type: 'sine', f: 300, f2: 900, dur: 0.26, gain: 0.08 }); },
      menuClose: function () { tone({ type: 'sine', f: 900, f2: 260, dur: 0.26, gain: 0.08 }); },
      toggleSfx: function (on) {
        sfxOn = on; store.set('pv_sfx', on ? '1' : '0');
        if (on) { ensure(); if (ctx.state === 'suspended') ctx.resume(); api.click(); }
      },
      toggleMusic: function (on) {
        musicOn = on; store.set('pv_bgm', on ? '1' : '0');
        ensure();
        if (ctx.state === 'suspended') ctx.resume();
        if (on) startMusic(); else stopMusic();
      },
      isSfxOn: function () { return sfxOn; },
      isMusicOn: function () { return musicOn; },
      suspend: function () { if (ctx && ctx.state === 'running') ctx.suspend(); },
      resume: function () { if (ctx && ctx.state === 'suspended') ctx.resume(); }
    };
    return api;
  })();

  /* ---------- 03 GATE ---------- */
  var gate = $('#gate');
  var gateBtn = $('#gateBtn');
  var bootLog = $('#bootLog');
  var BOOT_LINES = [
    'PV-OS 1.0.0  (c) 2026 P.VAGHASIYA',
    '> initialising kernel ........... ok',
    '> mounting volumes .............. ok',
    '> vpc 10.0.0.0/16 ............... reachable',
    '> auto scaling group ............ healthy',
    '> jenkins agent ................. connected',
    '> cloudwatch alarms ............. armed',
    '> operator: PRINCE VAGHASIYA .... verified',
    '> ACCESS GRANTED'
  ];

  function typeBoot(done) {
    if (reduced()) { bootLog.textContent = BOOT_LINES.join('\n'); if (done) done(); return; }
    var li = 0, ci = 0, text = '';
    (function tick() {
      if (li >= BOOT_LINES.length) { if (done) done(); return; }
      var line = BOOT_LINES[li];
      if (ci < line.length) {
        text += line.charAt(ci);
        bootLog.textContent = text;
        ci++;
        if (line.charAt(ci - 1) !== ' ') Sound.key();
        setTimeout(tick, line.charAt(ci - 1) === '.' ? 9 : 5);
      } else {
        text += '\n'; bootLog.textContent = text;
        li++; ci = 0;
        setTimeout(tick, 95);
      }
    })();
  }

  var gateOpen = false;
  function closeGate() {
    if (!gateOpen) return;
    gateOpen = false;
    gate.classList.add('is-gone');
    document.body.classList.remove('is-locked');
    gate.setAttribute('inert', '');
    sess.set('pv_entered', '1');
    setTimeout(function () { gate.style.display = 'none'; }, 800);
    Sound.chime();
    setTimeout(function () { $('#main').focus && $('#main').focus(); }, 400);
  }

  function enterSite() {
    if (!gateOpen) return;
    gateBtn.disabled = true;
    var lbl = gateBtn.querySelector('.gate-btn-lbl');
    if (lbl) lbl.textContent = 'AUTHENTICATING…'; else gateBtn.textContent = 'AUTHENTICATING…';
    Sound.unlock();
    Sound.whoosh();
    typeBoot(function () {
      setTimeout(closeGate, 650);
    });
  }

  function openGate() {
    gateOpen = true;
    document.body.classList.add('is-locked');
    gate.removeAttribute('inert');
    if (sess.get('pv_entered') === '1') {
      gate.style.display = 'none';
      document.body.classList.remove('is-locked');
      gateOpen = false;
      gate.setAttribute('inert', '');
      return;
    }
    gateBtn.focus();
  }

  if (gate) {
    openGate();
    gateBtn.addEventListener('click', enterSite);
    gate.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); enterSite(); return; }
      if (e.key === 'Tab') { e.preventDefault(); gateBtn.focus(); }
    });
  }

  /* ---------- 04 NAV ---------- */
  var nav = $('#nav');
  var clockEl = $('#navClock');
  var lastY = window.scrollY;

  function pad2(n) { return n < 10 ? '0' + n : '' + n; }

  function tickClock() {
    if (!clockEl) return;
    var d = new Date();
    var local = pad2(d.getHours()) + ':' + pad2(d.getMinutes()) + ':' + pad2(d.getSeconds());
    // IST = UTC+5:30
    var utc = d.getTime() + d.getTimezoneOffset() * 60000;
    var ist = new Date(utc + 5.5 * 3600000);
    clockEl.textContent = local + ' / ' + pad2(ist.getHours()) + ':' + pad2(ist.getMinutes()) + ':' + pad2(ist.getSeconds());
    clockEl.setAttribute('title', 'Local ' + local + ' · IST ' + pad2(ist.getHours()) + ':' + pad2(ist.getMinutes()));
  }
  tickClock();
  setInterval(tickClock, 1000);

  /* lime zone detection for nav inversion */
  var limeZones = $$('.lime-zone');
  function navInvert() {
    var probe = nav.getBoundingClientRect().height / 2;
    var inv = limeZones.some(function (z) {
      var r = z.getBoundingClientRect();
      return r.top <= probe && r.bottom >= probe;
    });
    nav.classList.toggle('nav--invert', inv);
    var railEl = document.getElementById('rail');
    if (railEl) railEl.classList.toggle('rail--invert', inv);
  }

  /* toggles */
  var sfxBtn = $('#sfxBtn'), bgmBtn = $('#bgmBtn');
  function paintToggles() {
    if (sfxBtn) {
      var s = Sound.isSfxOn();
      sfxBtn.setAttribute('aria-pressed', String(s));
      $('.state', sfxBtn).textContent = s ? 'ON' : 'OFF';
    }
    if (bgmBtn) {
      var m = Sound.isMusicOn();
      bgmBtn.setAttribute('aria-pressed', String(m));
      $('.state', bgmBtn).textContent = m ? 'ON' : 'OFF';
    }
  }
  paintToggles();
  if (sfxBtn) sfxBtn.addEventListener('click', function () { Sound.toggleSfx(!Sound.isSfxOn()); paintToggles(); });
  if (bgmBtn) bgmBtn.addEventListener('click', function () {
    Sound.unlock();
    Sound.toggleMusic(!Sound.isMusicOn());
    paintToggles();
  });

  /* ---------- 05 MENU ---------- */
  var menu = $('#menuOverlay');
  var menuBtn = $('#menuBtn');
  var menuClose = $('#menuClose');
  var menuOpen = false;
  var lastFocus = null;

  function openMenu() {
    if (menuOpen) return;
    menuOpen = true;
    lastFocus = document.activeElement;
    menu.classList.add('is-open');
    menu.removeAttribute('inert');
    menuBtn.setAttribute('aria-expanded', 'true');
    $('#main').setAttribute('inert', '');
    document.body.classList.add('is-locked');
    Sound.menuOpen();
    setTimeout(function () { menuClose.focus(); }, 60);
  }
  function closeMenu() {
    if (!menuOpen) return;
    menuOpen = false;
    menu.classList.remove('is-open');
    menu.setAttribute('inert', '');
    menuBtn.setAttribute('aria-expanded', 'false');
    $('#main').removeAttribute('inert');
    document.body.classList.remove('is-locked');
    Sound.menuClose();
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  if (menuBtn) menuBtn.addEventListener('click', openMenu);
  if (menuClose) menuClose.addEventListener('click', closeMenu);
  if (menu) {
    $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { closeMenu(); }); });
    menu.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { closeMenu(); return; }
      if (e.key !== 'Tab') return;
      var f = $$('a[href], button:not([disabled])', menu).filter(function (el) { return el.offsetParent !== null; });
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && menuOpen) closeMenu();
  });

  /* ---------- 06 CURSOR ---------- */
  var dot = $('#cursorDot'), ring = $('#cursorRing');
  var mx = -100, my = -100, rx = -100, ry = -100, cursorRaf = null;
  if (dot && ring && !isTouch && !reduced()) {
    document.addEventListener('mousemove', function (e) {
      mx = e.clientX; my = e.clientY;
      document.body.classList.add('cursor-on');
      if (!cursorRaf) cursorRaf = requestAnimationFrame(cursorLoop);
    }, { passive: true });
    document.addEventListener('mouseleave', function () { document.body.classList.remove('cursor-on'); });
    var loop = function () {
      rx += (mx - rx) * 0.16;
      ry += (my - ry) * 0.16;
      dot.style.transform = 'translate3d(' + mx + 'px,' + my + 'px,0)';
      ring.style.transform = 'translate3d(' + rx + 'px,' + ry + 'px,0)';
      if (Math.abs(mx - rx) > 0.4 || Math.abs(my - ry) > 0.4) {
        cursorRaf = requestAnimationFrame(loop);
      } else { cursorRaf = null; }
    };
    var cursorLoop = loop;
    var hot = 'a,button,input,[role="button"],.proj,.skill-card,.tl-item,.role-pills li';
    document.addEventListener('mouseover', function (e) {
      if (e.target.closest && e.target.closest(hot)) document.body.classList.add('cursor-hot');
    });
    document.addEventListener('mouseout', function (e) {
      if (e.target.closest && e.target.closest(hot)) document.body.classList.remove('cursor-hot');
    });
  }

  /* ---------- 07 SIGNATURE ANIMATION ---------- */
  var heroName = $('#heroName');
  var blade = $('#blade');
  var logoMark = $('#logoMark');
  var slicing = false;

  function slice() {
    if (slicing || !heroName) return;
    slicing = true;
    if (reduced() || !blade) {
      heroName.classList.add('is-sliced');
      Sound.dock();
      setTimeout(function () { slicing = false; }, 300);
      return;
    }
    blade.classList.remove('fly');
    void blade.offsetWidth;
    blade.classList.add('fly');
    Sound.slash();
    var done = false;
    var finish = function () {
      if (done) return; done = true;
      heroName.classList.add('is-sliced');
      Sound.dock();
      if (logoMark) {
        logoMark.animate(
          [{ transform: 'scale(1)' }, { transform: 'scale(1.22)' }, { transform: 'scale(1)' }],
          { duration: 520, easing: 'cubic-bezier(.16,1,.3,1)' }
        );
      }
      setTimeout(function () { slicing = false; }, 400);
    };
    blade.addEventListener('animationend', finish, { once: true });
    setTimeout(finish, 1500);
  }
  if (heroName) heroName.addEventListener('click', slice);
  var sliceBtn = $('#sliceBtn');
  if (sliceBtn) sliceBtn.addEventListener('click', slice);

  /* ---------- 08 REVEAL ---------- */
  var revealEls = $$('.sec-head, .proj, .skill-card, .tl-item, .cred, .tc-item, .stat, .scanner, .about-copy > p, .hero-intro, .role-pills, .contact-head, .contact-rows li, .term, .mf-arrow, .proj-more, .marquee');
  revealEls.forEach(function (el, i) {
    el.classList.add('reveal');
    var d = i % 4;
    if (d) el.classList.add('reveal-d' + d);
  });

  if ('IntersectionObserver' in window && !reduced()) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('in');
          io.unobserve(en.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- 09 COUNTERS ---------- */
  function countUp(el) {
    var target = parseFloat(el.getAttribute('data-count')) || 0;
    var suffix = el.getAttribute('data-suffix') || '';
    if (reduced()) { el.textContent = target + suffix; return; }
    var start = performance.now(), dur = 1500;
    (function step(t) {
      var p = clamp((t - start) / dur, 0, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(step);
    })(start);
  }
  var statEls = $$('.stat-num');
  if ('IntersectionObserver' in window) {
    var sio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { countUp(en.target); sio.unobserve(en.target); }
      });
    }, { threshold: 0.6 });
    statEls.forEach(function (el) { sio.observe(el); });
  } else { statEls.forEach(countUp); }

  /* meters */
  var meters = $$('.meter, .sk-meter');
  if ('IntersectionObserver' in window) {
    var mio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); mio.unobserve(en.target); }
      });
    }, { threshold: 0.5 });
    meters.forEach(function (m) { mio.observe(m); });
  } else { meters.forEach(function (m) { m.classList.add('in'); }); }

  /* ---------- 10 MANIFESTO ---------- */
  var mfText = $('#mfText');
  if (mfText) {
    var words = $$('.w', mfText);
    if (reduced()) { words.forEach(function (w) { w.classList.add('lit'); }); }
    else {
      var mfRaf = null;
      var paintWords = function () {
        mfRaf = null;
        var r = mfText.getBoundingClientRect();
        var vh = window.innerHeight;
        // progress 0→1 as the block travels from 85% to 30% of the viewport
        var p = clamp((vh * 0.85 - r.top) / (vh * 0.62), 0, 1);
        var lit = Math.round(p * words.length * 1.02);
        for (var i = 0; i < words.length; i++) {
          words[i].classList.toggle('lit', i < lit);
        }
      };
      var onMfScroll = function () { if (!mfRaf) mfRaf = requestAnimationFrame(paintWords); };
      window.addEventListener('scroll', onMfScroll, { passive: true });
      window.addEventListener('resize', onMfScroll);
      paintWords();
    }
  }

  /* ---------- 11 PARALLAX ---------- */
  var frame = $('#portraitFrame');
  var img = $('#portraitImg');
  if (frame && img && !isTouch && !reduced()) {
    var heroEl = $('.hero');
    heroEl.addEventListener('mousemove', function (e) {
      var r = heroEl.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width - 0.5;
      var py = (e.clientY - r.top) / r.height - 0.5;
      frame.style.transform = 'translate3d(' + (px * -14).toFixed(2) + 'px,' + (py * -14).toFixed(2) + 'px,0)';
      img.style.transform = 'scale(1.05) translate3d(' + (px * 10).toFixed(2) + 'px,' + (py * 10).toFixed(2) + 'px,0)';
    });
    heroEl.addEventListener('mouseleave', function () {
      frame.style.transform = 'translate3d(0,0,0)';
      img.style.transform = 'scale(1.01)';
    });
  }

  /* ---------- 12 SCROLL RAIL ---------- */
  var railFill = $('#railFill'), railCar = $('#railCar'), railKmh = $('#railKmh'), railDrs = $('#railDrs');
  var scrollRaf = null;
  function onScroll() {
    var y = window.scrollY;
    var h = document.documentElement.scrollHeight - window.innerHeight;
    var p = h > 0 ? clamp(y / h, 0, 1) : 0;

    if (railFill) railFill.style.height = (p * 100).toFixed(2) + '%';
    if (railCar) railCar.style.top = (p * 100).toFixed(2) + '%';
    if (railKmh) railKmh.textContent = String(Math.round(p * 312)).padStart(3, '0');
    if (railDrs) railDrs.classList.toggle('on', p > 0.9);

    // nav hide/show
    if (nav && !menuOpen) {
      if (y > 240 && y > lastY + 6) nav.classList.add('nav--hidden');
      else if (y < lastY - 6 || y < 240) nav.classList.remove('nav--hidden');
    }
    lastY = y;

    navInvert();
    scrollRaf = null;
  }
  window.addEventListener('scroll', function () {
    if (!scrollRaf) scrollRaf = requestAnimationFrame(onScroll);
  }, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  /* ---------- 13 COPY EMAIL ---------- */
  var copyBtn = $('#copyEmail');
  if (copyBtn) {
    copyBtn.addEventListener('click', function () {
      var email = copyBtn.getAttribute('data-email');
      var done = function () {
        var old = copyBtn.textContent;
        copyBtn.textContent = 'COPIED ✓';
        Sound.chime();
        setTimeout(function () { copyBtn.textContent = old; }, 2000);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(email).then(done, function () { fallbackCopy(email); done(); });
      } else { fallbackCopy(email); done(); }
    });
  }
  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(ta);
  }

  /* ---------- 14 TERMINAL ---------- */
  var termOut = $('#termOut');
  var termForm = $('#termForm');
  var termInput = $('#termInput');
  var termEl = $('#term');
  var history = [];
  var hIndex = -1;
  var commands = {};
  var cmdNames = [];

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c];
    });
  }
  function print(html, cls) {
    var p = document.createElement('p');
    if (cls) p.className = cls;
    p.innerHTML = html;
    termOut.appendChild(p);
    termOut.scrollTop = termOut.scrollHeight;
  }

  /* data read straight from the DOM so cards and shell never drift */
  function getProjects() {
    return $$('.proj[data-idx]').map(function (el) {
      return {
        idx: el.getAttribute('data-idx'),
        title: el.getAttribute('data-title') || '',
        cat: el.getAttribute('data-cat') || '',
        desc: el.getAttribute('data-desc') || '',
        tech: el.getAttribute('data-tech') || '',
        link: el.getAttribute('data-link') || '',
        node: el
      };
    });
  }
  function getSkills() {
    return $$('.skill-card[data-skill]').map(function (el) {
      return {
        name: el.getAttribute('data-skill'),
        level: el.getAttribute('data-level'),
        badge: el.getAttribute('data-badge')
      };
    });
  }
  function getExperience() {
    return $$('.tl-item').map(function (el) {
      return {
        date: (el.querySelector('.tl-date') || {}).textContent || '',
        co: (el.querySelector('.tl-co') || {}).textContent || '',
        role: (el.querySelector('.tl-role') || {}).textContent || ''
      };
    });
  }

  function goTo(sel) {
    var el = $(sel);
    if (!el) return;
    el.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' });
    el.classList.add('flash');
    setTimeout(function () { el.classList.remove('flash'); }, 1400);
  }

  commands.help = function () {
    print('<span class="ok">available commands</span>');
    var groups = [
      ['help', 'this list'],
      ['whoami', 'short identity'],
      ['about', 'longer bio'],
      ['experience', 'work history from the page'],
      ['projects', 'all projects'],
      ['open &lt;n&gt;', 'jump to project n'],
      ['skills', 'capability matrix'],
      ['contact', 'channels'],
      ['neofetch', 'system info'],
      ['slash', 'run the signature animation'],
      ['sfx / music', 'toggle audio'],
      ['menu', 'open navigation'],
      ['ls / cat', 'list sections / read one'],
      ['date / echo', 'the usual'],
      ['history / clear', 'shell basics']
    ];
    var rows = groups.map(function (g) {
      return '<tr><td>' + g[0] + '</td><td class="dim">' + g[1] + '</td></tr>';
    }).join('');
    print('<table>' + rows + '</table>');
    print('<span class="dim">Tab autocompletes · ↑ ↓ history · try sudo, hack, exit</span>');
  };

  commands.whoami = function () {
    print('PRINCE VAGHASIYA — cloud &amp; devops engineer');
    print('<span class="dim">Pune, Maharashtra · IST UTC+05:30 · 18.5204°N 73.8567°E</span>');
  };

  commands.about = function () {
    print('I provision and run AWS infrastructure: VPC design, EC2, RDS, S3,');
    print('IAM, load balancing and Auto Scaling. Linux is home — shell,');
    print('services, logs — and I automate the rest with Docker, Ansible,');
    print('Terraform and Jenkins pipelines.');
    print('<span class="dim">→ type <b>experience</b> or <b>projects</b></span>');
  };

  commands.experience = function () {
    var xs = getExperience();
    print('<span class="ok">// mission log</span>');
    xs.forEach(function (x) {
      print('<span class="key">' + esc(x.date.trim()) + '</span>  ' + esc(x.co.trim()) + ' — <b>' + esc(x.role.trim()) + '</b>');
    });
    print('<span class="dim">→ full detail in the Experience section</span>');
  };

  commands.projects = function () {
    var ps = getProjects();
    print('<span class="ok">// ' + ps.length + ' entries</span>');
    ps.forEach(function (p) {
      print('<span class="key">' + p.idx + '</span>  <b>' + esc(p.title) + '</b> <span class="dim">· ' + esc(p.cat) + '</span>');
      print('     <span class="dim">' + esc(p.desc) + '</span>');
    });
    print('<span class="dim">→ <b>open 3</b> to jump to a card</span>');
  };

  commands.open = function (arg) {
    if (!arg) { print('<span class="err">usage: open &lt;number&gt;</span>'); Sound.error(); return; }
    var n = String(parseInt(arg, 10));
    var target = null;
    $$('.proj[data-idx]').forEach(function (el) { if (el.getAttribute('data-idx') === (n.length < 2 ? '0' + n : n)) target = el; });
    if (!target) { print('<span class="err">no project with index ' + esc(arg) + '</span>'); Sound.error(); return; }
    print('<span class="ok">→ opening ' + esc(target.getAttribute('data-title')) + '</span>');
    target.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'center' });
    target.classList.add('flash');
    setTimeout(function () { target.classList.remove('flash'); }, 1600);
  };

  commands.skills = function () {
    var ss = getSkills();
    print('<span class="ok">// capability matrix</span>');
    ss.forEach(function (s) {
      var bars = Math.round(parseInt(s.level, 10) / 10);
      var bar = '█'.repeat(bars) + '░'.repeat(10 - bars);
      print('<span class="key">' + esc(s.name) + '</span> <span class="ok">' + bar + '</span> ' + esc(s.level) + '% <span class="dim">[' + esc(s.badge) + ']</span>');
    });
  };

  commands.contact = function () {
    print('<span class="ok">// open a channel</span>');
    print('email     <a href="mailto:vaghasiyaprince13@gmail.com">vaghasiyaprince13@gmail.com</a>');
    print('github    <a href="https://github.com/Prince16605" target="_blank" rel="noopener">github.com/Prince16605</a>');
    print('linkedin  <a href="https://www.linkedin.com/in/prince-vaghasiya-12a4232a3" target="_blank" rel="noopener">in/prince-vaghasiya-12a4232a3</a>');
    print('location  Pune, India · IST UTC+05:30');
  };

  commands.neofetch = function () {
    var ascii = [
      '  ██████╗ ██╗   ██╗',
      '  ██╔══██╗██║   ██║',
      '  ██████╔╝██║   ██║',
      '  ██╔═══╝ ╚██╗ ██╔╝',
      '  ██║      ╚████╔╝ ',
      '  ╚═╝       ╚═══╝  '
    ].join('\n');
    print('<span class="ascii">' + esc(ascii) + '</span>');
    var rows = [
      ['user', 'prince@portfolio'],
      ['os', 'PV-OS 1.0.0'],
      ['host', 'Pune, Maharashtra'],
      ['role', 'cloud & devops engineer'],
      ['cloud', 'AWS · EC2 · VPC · RDS'],
      ['stack', 'Docker · Jenkins · Terraform'],
      ['js', '38kb · 0 dependencies'],
      ['a11y', 'keyboard complete'],
      ['audio', 'synthesised, 0 files'],
      ['uptime', Math.round(performance.now() / 1000) + 's this session']
    ];
    print('<table>' + rows.map(function (r) {
      return '<tr><td>' + r[0] + '</td><td>' + esc(r[1]) + '</td></tr>';
    }).join('') + '</table>');
  };

  commands.slash = function () { print('<span class="ok">// blade away</span>'); slice(); };
  commands.sfx = function () {
    Sound.toggleSfx(!Sound.isSfxOn()); paintToggles();
    print('sfx → <span class="ok">' + (Sound.isSfxOn() ? 'ON' : 'OFF') + '</span>');
  };
  commands.music = function () {
    Sound.unlock(); Sound.toggleMusic(!Sound.isMusicOn()); paintToggles();
    print('bgm → <span class="ok">' + (Sound.isMusicOn() ? 'ON' : 'OFF') + '</span>');
  };
  commands.menu = function () { print('<span class="ok">// opening navigation</span>'); openMenu(); };

  var SECTIONS = {
    home: '#home', about: '#about', experience: '#experience', skills: '#skills',
    projects: '#projects', terminal: '#terminal', contact: '#contact'
  };
  commands.ls = function () {
    print('<span class="ok">// sections</span>');
    print(Object.keys(SECTIONS).map(function (k) {
      return '<span class="key">' + k + '</span>';
    }).join('  '));
    print('<span class="dim">→ cat &lt;section&gt; to read it</span>');
  };
  commands.cat = function (arg) {
    if (!arg) { print('<span class="err">usage: cat &lt;section&gt;</span>'); Sound.error(); return; }
    var key = arg.toLowerCase();
    if (key === 'resume' || key === 'cv') { print('<span class="dim">no cv.txt here — try <b>experience</b></span>'); return; }
    var sel = SECTIONS[key];
    if (!sel) { print('<span class="err">cat: ' + esc(arg) + ': no such section</span>'); Sound.error(); return; }
    var el = $(sel);
    if (!el) return;
    var txt = el.innerText.replace(/\s+/g, ' ').trim().slice(0, 420);
    print(esc(txt) + '…');
    print('<span class="dim">→ <b>' + key + '</b> on the page</span>');
    goTo(sel);
  };

  commands.date = function () { print(new Date().toString()); };
  commands.echo = function (arg) { print(esc(arg || '')); };
  commands.history = function () {
    if (!history.length) { print('<span class="dim">empty</span>'); return; }
    history.forEach(function (h, i) { print('<span class="key">' + (i + 1) + '</span>  ' + esc(h)); });
  };
  commands.clear = function () { termOut.innerHTML = ''; };

  /* hidden jokes */
  commands.sudo = function () {
    print('<span class="err">sudo: permission denied. nice try though.</span>');
    print('<span class="dim">you are already root in this shell. this shell is a div.</span>');
    Sound.glitch();
  };
  commands.rm = function () {
    print('<span class="err">rm: refused — this portfolio is not disposable.</span>');
    print('<span class="dim">(it is 3 files. you could just delete them.)</span>');
    Sound.error();
  };
  commands.hack = function () {
    print('<span class="warn">[■■■■■■□□□□] 60% — bypassing mainframe…</span>');
    setTimeout(function () { print('<span class="warn">[■■■■■■■■■□] 90% — almost in…</span>'); }, 700);
    setTimeout(function () {
      print('<span class="err">ACCESS DENIED — you forgot the film-school password.</span>');
      Sound.glitch();
    }, 1500);
  };
  commands.exit = function () {
    print('<span class="dim">there is no exit. only <b>contact</b>.</span>');
  };
  commands.hey = function () { print('hey. try <b>help</b>.'); };
  commands.hello = commands.hey;
  commands.hi = commands.hey;

  cmdNames = Object.keys(commands).sort();

  function run(raw) {
    var line = String(raw).trim();
    if (!line) return;
    print('<span class="cmd-echo"><b>prince@portfolio:~$</b> ' + esc(line) + '</span>');
    history.push(line);
    hIndex = history.length;
    var parts = line.split(/\s+/);
    var cmd = parts.shift().toLowerCase();
    var rest = parts.join(' ');
    if (commands[cmd]) {
      try { commands[cmd](rest); } catch (e) { print('<span class="err">' + esc(e.message) + '</span>'); }
    } else {
      print('<span class="err">' + esc(cmd) + ': command not found</span>');
      print('<span class="dim">type <b>help</b> for the list</span>');
      Sound.error();
    }
  }

  if (termForm) {
    termForm.addEventListener('submit', function (e) {
      e.preventDefault();
      run(termInput.value);
      termInput.value = '';
    });
  }
  if (termInput) {
    termInput.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (hIndex > 0) { hIndex--; termInput.value = history[hIndex] || ''; }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (hIndex < history.length - 1) { hIndex++; termInput.value = history[hIndex] || ''; }
        else { hIndex = history.length; termInput.value = ''; }
      } else if (e.key === 'Tab') {
        e.preventDefault();
        var v = termInput.value.trim().toLowerCase();
        if (!v) return;
        var hit = cmdNames.filter(function (c) { return c.indexOf(v) === 0; });
        if (hit.length === 1) { termInput.value = hit[0] + ' '; }
        else if (hit.length > 1) { print('<span class="dim">' + hit.join('   ') + '</span>'); }
        else Sound.error();
      } else if (e.key.length === 1) {
        Sound.key();
      }
    });
  }
  if (termEl) {
    termEl.addEventListener('click', function (e) {
      if (e.target.closest('a,button')) return;
      if (termInput) termInput.focus();
    });
  }
  $$('.term-btns button').forEach(function (b) {
    b.addEventListener('click', function () {
      var c = b.getAttribute('data-cmd');
      if (termInput) termInput.focus();
      run(c);
    });
  });

  /* ---------- 15 MISC ---------- */
  // marquee duplication for a seamless loop
  var track = $('#marqueeTrack');
  if (track) track.innerHTML = track.innerHTML + track.innerHTML;

  // footer year
  var yearEl = $('#year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // global hover / click sounds
  document.addEventListener('mouseover', function (e) {
    if (e.target.closest && e.target.closest('a,button,[role="button"]')) Sound.blip();
  });
  document.addEventListener('click', function (e) {
    if (e.target.closest && e.target.closest('a,button,[role="button"]')) Sound.click();
  });

  // suspend audio when the tab is hidden
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) Sound.suspend();
    else Sound.resume();
  });

  // smooth in-page anchors that respect the fixed nav
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute('href');
    if (id === '#' || id.length < 2) return;
    var el = document.querySelector(id);
    if (!el) return;
    e.preventDefault();
    closeMenu();
    el.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' });
    window.history.replaceState(null, '', id);
    // move focus to the target so skip links and nav links actually land there
    if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
    try { el.focus({ preventScroll: true }); } catch (err) { el.focus(); }
  });

  // re-evaluate reduced-motion preference at runtime
  if (mqReduce.addEventListener) {
    mqReduce.addEventListener('change', function () { onScroll(); });
  }
})();
