/* 星音手机 · 交互逻辑 */
(function () {
  "use strict";

  const LOCK_CODE = "530111";
  const HOME_KEY = "dreamphone.notes.v1";

  const $ = function (selector, root) {
    return (root || document).querySelector(selector);
  };

  const $$ = function (selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  };

  const screenEl = $("#screen");
  const homeGrid = $("#homeGrid");
  const dockEl = $("#dock");
  const lockScreen = $("#lockScreen");
  const passcodeScreen = $("#passcodeScreen");
  const passDots = $("#passDots");
  const passError = $("#passError");
  const keypad = $("#keypad");
  const appLayer = $("#appLayer");
  const searchLayer = $("#searchLayer");
  const searchBtn = $("#searchBtn");
  const searchInput = $("#appSearch");
  const searchResults = $("#searchResults");
  const searchCancel = $("#searchCancel");
  const toastEl = $("#phoneToast");
  const homeBar = $("#homeBar");
  const unlockHint = $("#unlockHint");
  const passCancel = $("#passCancel");
  const lockFlash = $("#lockFlash");
  const lockCamera = $("#lockCamera");
  const deviceEl = $("#device");

  /* ================= 图标 ================= */
  const ICONS = {
    wechat:
      '<svg viewBox="0 0 24 24" fill="none">' +
      '<ellipse cx="9.2" cy="9" rx="6.3" ry="5.3" fill="#fff"/>' +
      '<path d="M4.6 12.8 3.2 15.8l3.6-1.2" fill="#fff"/>' +
      '<ellipse cx="16.3" cy="14.2" rx="5" ry="4.3" fill="#fff"/>' +
      '<path d="M19.9 17.3 21.2 19.7l-3-.7" fill="#fff"/>' +
      '<circle cx="7" cy="7.8" r="1" fill="#12a34a"/>' +
      '<circle cx="11.3" cy="7.8" r="1" fill="#12a34a"/>' +
      '<circle cx="14.6" cy="13.1" r=".85" fill="#12a34a"/>' +
      '<circle cx="17.9" cy="13.1" r=".85" fill="#12a34a"/>' +
      "</svg>",
    instagram:
      '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.9" stroke-linecap="round">' +
      '<rect x="3.3" y="3.3" width="17.4" height="17.4" rx="5"/>' +
      '<circle cx="12" cy="12" r="4"/>' +
      '<circle cx="17.1" cy="7" r="1.15" fill="#fff" stroke="none"/>' +
      "</svg>",
    kakao:
      '<svg viewBox="0 0 24 24">' +
      '<path d="M12 3.6C6.6 3.6 2.4 6.9 2.4 11c0 2.4 1.6 4.5 4 5.9l-.9 3.1 3.6-1.6c.9.2 1.9.3 2.9.3 5.4 0 9.6-3.4 9.6-7.7S17.4 3.6 12 3.6z" fill="#3b2a0e"/>' +
      '<text x="12" y="12.5" text-anchor="middle" font-size="5.2" font-weight="700" fill="#ffe94e" font-family="Arial, sans-serif">TALK</text>' +
      "</svg>",
    x:
      '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.1" stroke-linecap="round">' +
      '<path d="M4.2 4 19.8 20M19.8 4 4.2 20"/>' +
      "</svg>",
    weibo:
      '<svg viewBox="0 0 24 24" fill="none">' +
      '<ellipse cx="9.6" cy="14" rx="6.2" ry="4.4" fill="#fff"/>' +
      '<ellipse cx="9.6" cy="14" rx="2.8" ry="2.1" fill="#ff6a2c"/>' +
      '<circle cx="16.2" cy="8.2" r="3.4" fill="#fff"/>' +
      '<circle cx="16.2" cy="8.2" r="1.6" fill="#ff6a2c"/>' +
      '<path d="M18.6 3.6c2.4 0 4.3 1.9 4.3 4.3" stroke="#fff" stroke-width="1.4" stroke-linecap="round"/>' +
      "</svg>",
    camera:
      '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">' +
      "<use href=\"#i-camera\"></use></svg>",
    photos: '<span class="flower"></span>',
    clock: '<span class="clock-face"></span>',
    weather:
      '<svg viewBox="0 0 24 24" fill="none">' +
      '<circle cx="9" cy="8.6" r="3.4" fill="#ffe27a"/>' +
      '<path d="M9 2.2v1.8M9 13.2v1.8M2.6 8.6h1.8M13.6 8.6h1.8M4.3 3.9l1.3 1.3M12.4 12l1.3 1.3M13.7 3.9 12.4 5.2M5.6 12 4.3 13.3" stroke="#ffe27a" stroke-width="1.2"/>' +
      '<path d="M7.6 18.6h8.9a2.9 2.9 0 0 0 .2-5.8 4.4 4.4 0 0 0-8.4 1.1A2.4 2.4 0 0 0 7.6 18.6z" fill="#fff"/>' +
      "</svg>",
    notes: '<span class="paper"></span>',
    calculator:
      '<span class="keys"><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span></span>',
    settings:
      '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.5" stroke-linecap="round">' +
      '<circle cx="12" cy="12" r="3.2"/>' +
      '<path d="M12 2.6v2.6M12 18.8v2.6M2.6 12h2.6M18.8 12h2.6M5.2 5.2l1.9 1.9M16.9 16.9l1.9 1.9M18.8 5.2l-1.9 1.9M7.1 16.9l-1.9 1.9"/>' +
      "</svg>",
    phone:
      '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
      "<use href=\"#i-phone\"></use></svg>",
    messages:
      '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
      "<use href=\"#i-message\"></use></svg>",
    safari:
      '<svg viewBox="0 0 24 24" fill="none">' +
      '<circle cx="12" cy="12" r="9.2" stroke="#fff" stroke-width="1.5"/>' +
      '<circle cx="12" cy="12" r="6.6" stroke="rgba(255,255,255,.55)" stroke-width="0.9"/>' +
      '<path d="M16.2 7.8 10.4 10.4 7.8 16.2l5.8-2.6z" fill="#fff"/>' +
      '<path d="m12.8 11.2-5 5" stroke="#0f6fd8" stroke-width="1.5"/>' +
      "</svg>",
    music:
      '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M9 18V6.2l10-2.2v11.6"/>' +
      '<circle cx="6.8" cy="18" r="2.5"/>' +
      '<circle cx="16.8" cy="15.6" r="2.5"/>' +
      "</svg>"
  };

  const APPS = [
    { id: "wechat", name: "微信", sub: "聊天 · 朋友圈", tone: "icon-wechat", keywords: "微信 wechat 聊天 朋友圈", home: true },
    { id: "instagram", name: "Instagram", sub: "照片与故事", tone: "icon-ig", keywords: "ins instagram 照片 故事", home: true },
    { id: "kakao", name: "KakaoTalk", sub: "韩国聊天", tone: "icon-kakao", keywords: "kakao kkt talk 韩国", home: true },
    { id: "x", name: "X", sub: "实时动态", tone: "icon-x", keywords: "x twitter 推特", home: true },
    { id: "weibo", name: "微博", sub: "热搜与关注", tone: "icon-weibo", keywords: "微博 weibo 热搜", home: true },
    { id: "camera", name: "相机", sub: "随手拍", tone: "icon-camera", keywords: "相机 camera 拍照", home: true },
    { id: "photos", name: "照片", sub: "回忆相册", tone: "icon-photos", keywords: "照片 photos 相册", home: true },
    { id: "clock", name: "时钟", sub: "世界时间", tone: "icon-clock", keywords: "时钟 clock 时间", home: true },
    { id: "weather", name: "天气", sub: "今日预报", tone: "icon-weather", keywords: "天气 weather 预报", home: true },
    { id: "notes", name: "备忘录", sub: "记录灵感", tone: "icon-notes", keywords: "备忘录 notes 记录", home: true },
    { id: "calculator", name: "计算器", sub: "快速计算", tone: "icon-calc", keywords: "计算器 calculator 数学", home: true },
    { id: "settings", name: "设置", sub: "系统与安全", tone: "icon-settings", keywords: "设置 settings 锁屏 密码", home: true },
    { id: "phone", name: "电话", sub: "拨号", tone: "icon-phone", keywords: "电话 phone 拨号", dock: true },
    { id: "messages", name: "信息", sub: "短信", tone: "icon-message", keywords: "信息 messages 短信", dock: true },
    { id: "safari", name: "Safari", sub: "浏览器", tone: "icon-safari", keywords: "safari 浏览器 网页", dock: true },
    { id: "music", name: "Logic", sub: "编曲 Studio", tone: "icon-music", keywords: "logic 音乐 编曲 studio music", dock: true }
  ];

  function findApp(id) {
    for (let i = 0; i < APPS.length; i += 1) {
      if (APPS[i].id === id) return APPS[i];
    }
    return null;
  }

  function appIconHTML(app) {
    return '<span class="app-icon ' + app.tone + '">' + ICONS[app.id] + "</span>";
  }

  function appButtonHTML(app) {
    return '<button class="app" type="button" data-open-app="' + app.id + '" aria-label="' + app.name + '">' +
      appIconHTML(app) +
      '<span class="app-label">' + app.name + "</span>" +
      "</button>";
  }

  /* ================= 状态 ================= */
  const state = {
    entered: "",
    app: null,
    chat: null,
    noteEditing: null,
    flashOn: false,
    cameraFront: false,
    dial: "",
    calc: { display: "0", prev: null, op: null, fresh: true },
    photos: []
  };

  let closeTimer = 0;
  let toastTimer = 0;
  let replyTimer = 0;

  /* ================= 工具 ================= */
  function pad(n) {
    return n < 10 ? "0" + n : String(n);
  }

  function localTime() {
    const d = new Date();
    return d.getHours() + ":" + pad(d.getMinutes());
  }

  function localTimeFull() {
    const d = new Date();
    return pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds());
  }

  function localDate() {
    const d = new Date();
    const week = ["日", "一", "二", "三", "四", "五", "六"];
    return (d.getMonth() + 1) + "月" + d.getDate() + "日 星期" + week[d.getDay()];
  }

  function updateClocks() {
    $$("[data-clock]").forEach(function (el) {
      el.textContent = localTime();
    });
    $$("[data-clock-full]").forEach(function (el) {
      el.textContent = localTimeFull();
    });
    $$("[data-date]").forEach(function (el) {
      el.textContent = localDate();
    });
    $$("[data-tz]").forEach(function (el) {
      try {
        el.textContent = new Date().toLocaleTimeString("zh-CN", {
          timeZone: el.dataset.tz,
          hour12: false,
          hour: "2-digit",
          minute: "2-digit"
        });
      } catch (err) {
        el.textContent = localTime();
      }
    });
  }

  function showToast(message) {
    toastEl.textContent = message;
    toastEl.classList.add("is-show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toastEl.classList.remove("is-show");
    }, 2300);
  }

  /* ================= 音效 ================= */
  let actx = null;

  function beep(freq, dur, type, vol) {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      if (!actx) actx = new AC();
      if (actx.state === "suspended") actx.resume();
      const osc = actx.createOscillator();
      const gain = actx.createGain();
      osc.type = type || "sine";
      osc.frequency.value = freq;
      const now = actx.currentTime;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(vol || 0.06, now + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
      osc.connect(gain);
      gain.connect(actx.destination);
      osc.start(now);
      osc.stop(now + dur + 0.02);
    } catch (err) {
      /* 忽略音频错误 */
    }
  }

  function unlockChime() {
    beep(660, 0.16, "sine", 0.05);
    setTimeout(function () { beep(880, 0.18, "sine", 0.045); }, 90);
    setTimeout(function () { beep(1100, 0.22, "sine", 0.035); }, 190);
  }

  function lockedBuzz() {
    beep(196, 0.22, "sawtooth", 0.035);
    setTimeout(function () { beep(156, 0.26, "sawtooth", 0.03); }, 120);
  }

  /* ================= 桌面构建 ================= */
  function buildHome() {
    homeGrid.innerHTML = APPS.filter(function (app) {
      return app.home;
    }).map(function (app, index) {
      return appButtonHTML(app).replace("<button ", '<button style="animation-delay:' + index * 0.028 + 's" ');
    }).join("");

    dockEl.innerHTML = APPS.filter(function (app) {
      return app.dock;
    }).map(function (app) {
      return appButtonHTML(app).replace("<button ", '<button style="animation-delay:' + 0.2 + 's" ');
    }).join("");
  }

  /* ================= 锁屏与密码 ================= */
  function renderPassDots() {
    let html = "";
    for (let i = 0; i < LOCK_CODE.length; i += 1) {
      html += '<span class="dot' + (i < state.entered.length ? " is-on" : "") + '"></span>';
    }
    passDots.innerHTML = html;
  }

  function clearPassError() {
    passError.textContent = "";
    passError.classList.remove("is-show");
    passDots.classList.remove("is-error");
    passcodeScreen.classList.remove("is-error");
  }

  function showPassError() {
    passError.textContent = "密码错误，请重新输入";
    passError.classList.add("is-show");
    passDots.classList.add("is-error");
    passcodeScreen.classList.add("is-error");
    lockedBuzz();
    setTimeout(function () {
      passDots.classList.remove("is-error");
      passcodeScreen.classList.remove("is-error");
    }, 460);
  }

  function openPasscode() {
    if (screenEl.dataset.state !== "locked") return;
    state.entered = "";
    renderPassDots();
    clearPassError();
    screenEl.dataset.state = "passcode";
    beep(740, 0.06, "sine", 0.04);
  }

  function cancelPasscode() {
    state.entered = "";
    renderPassDots();
    clearPassError();
    screenEl.dataset.state = "locked";
    beep(520, 0.05, "sine", 0.03);
  }

  function unlockPhone() {
    if (screenEl.dataset.state !== "passcode") return;
    state.entered = "";
    renderPassDots();
    clearPassError();
    screenEl.dataset.state = "unlocked";
    unlockChime();
    flushBanners();
    if (window.Drama) updateStoryLayer();
    if (navigator.vibrate) navigator.vibrate(18);
  }

  function pressPassKey(key) {
    if (screenEl.dataset.state !== "passcode") return;

    if (key === "del") {
      if (state.entered.length > 0) {
        state.entered = state.entered.slice(0, -1);
        renderPassDots();
      }
      clearPassError();
      beep(520, 0.04, "sine", 0.03);
      return;
    }

    if (!/^\d$/.test(key)) return;
    if (state.entered.length >= LOCK_CODE.length) return;

    state.entered += key;
    renderPassDots();
    clearPassError();
    beep(880 + state.entered.length * 26, 0.05, "sine", 0.035);

    if (state.entered.length === LOCK_CODE.length) {
      setTimeout(function () {
        if (state.entered === LOCK_CODE) {
          unlockPhone();
        } else {
          showPassError();
          setTimeout(function () {
            state.entered = "";
            renderPassDots();
          }, 380);
        }
      }, 170);
    }
  }

  function lockPhone() {
    state.entered = "";
    renderPassDots();
    clearPassError();
    state.app = null;
    state.chat = null;
    state.noteEditing = null;
    const frame = appLayer.querySelector("iframe");
    if (frame) frame.src = "about:blank";
    closeApps();
    screenEl.dataset.state = "locked";
    updateStoryLayer();
    beep(420, 0.08, "sine", 0.035);
  }

  /* ================= App 开关 ================= */
  function closeApps() {
    const frame = appLayer.querySelector("iframe");
    if (frame) frame.src = "about:blank";
    state.app = null;
    state.chat = null;
    state.noteEditing = null;
    if (window.Drama) drama.setOpen("");
    screenEl.dataset.state = "unlocked";
    updateStoryLayer();
    clearTimeout(closeTimer);
    closeTimer = setTimeout(function () {
      if (screenEl.dataset.state !== "app") {
        appLayer.innerHTML = "";
      }
    }, 430);
  }

  function openApp(id) {
    const app = findApp(id);
    if (!app) return;
    clearTimeout(closeTimer);
    clearTimeout(replyTimer);
    state.app = id;
    state.chat = null;
    state.noteEditing = null;
    if (window.Drama) drama.setOpen("");
    screenEl.dataset.state = "app";
    updateStoryLayer();
    renderApp();
    beep(980, 0.05, "sine", 0.03);
  }

  function renderApp() {
    const app = findApp(state.app);
    if (!app) return;
    if (id_is_music(app)) {
      appLayer.innerHTML = musicPageHTML();
      updateClocks();
      return;
    }
    appLayer.innerHTML = pageFor(app);
    updateClocks();
    const body = appLayer.querySelector(".app-body");
    if (body && state.chat) body.scrollTop = body.scrollHeight;
  }

  function id_is_music(app) {
    return app.id === "music";
  }

  function statusBarHTML() {
    return '<div class="status-bar app-status">' +
      '<span class="status-time" data-clock>20:56</span>' +
      '<span class="status-right">' +
      '<span class="signal"><i></i><i></i><i></i><i></i></span>' +
      '<span class="network">5G</span>' +
      '<span class="battery"><b></b></span>' +
      "</span></div>";
  }

  function pageFor(app) {
    let body = "";
    if (app.id === "wechat" || app.id === "kakao" || app.id === "messages") {
      body = chatBodyHTML(app);
    } else if (app.id === "instagram") {
      body = instagramBodyHTML();
    } else if (app.id === "x") {
      body = xBodyHTML();
    } else if (app.id === "weibo") {
      body = weiboBodyHTML();
    } else if (app.id === "camera") {
      body = cameraBodyHTML();
    } else if (app.id === "photos") {
      body = photosBodyHTML();
    } else if (app.id === "clock") {
      body = clockBodyHTML();
    } else if (app.id === "weather") {
      body = weatherBodyHTML();
    } else if (app.id === "notes") {
      body = notesBodyHTML();
    } else if (app.id === "calculator") {
      body = calculatorBodyHTML();
    } else if (app.id === "settings") {
      body = settingsBodyHTML();
    } else if (app.id === "phone") {
      body = phoneBodyHTML();
    } else if (app.id === "safari") {
      body = safariBodyHTML();
    }

    let title = app.name;
    let backAction = "close";
    let note = "";
    let pageKind = "";
    let navRight = "";
    let bottomBar = "";
    const inKakaoChat = app.id === "kakao" && state.chat && state.chat.app === "kakao";

    if (app.id === "kakao" && !inKakaoChat) {
      title = "聊天";
      pageKind = " kkt-root";
      backAction = "";
      navRight = '<span class="kkt-nav-actions">' +
        '<svg class="ui-icon"><use href="#i-search"></use></svg>' +
        '<svg class="ui-icon"><use href="#i-plus"></use></svg>' +
        "</span>";
      bottomBar = kktTabsHTML();
    }

    if (state.chat && app.id === state.chat.app) {
      const thread = THREADS[app.id] && THREADS[app.id][state.chat.key];
      if (thread) title = thread.name;
      if (inKakaoChat || (app.id === "wechat" && state.chat.key === "ys")) {
        const castKey = state.chat.key;
        title = (drama && drama.cast[castKey]) ? drama.cast[castKey].name : title;
      }
      backAction = "chat-back";
    }

    if (state.noteEditing && app.id === "notes") {
      title = "编辑备忘录";
      backAction = "note-back";
      note = "自动保存到本机";
    }

    return '<div class="app-page' + (app.id === "camera" ? " camera-app" : "") +
      (app.id === "calculator" ? " calc-app" : "") + pageKind + '" data-app="' + app.id + '">' +
      statusBarHTML() +
      '<div class="app-nav">' +
      (backAction ? '<button class="nav-back" type="button" data-action="' + backAction + '" aria-label="返回">‹</button>'
        : '<span class="nav-back-ghost"></span>') +
      '<h1 class="nav-title">' + title + "</h1>" +
      (note ? '<span class="nav-note">' + note + "</span>" : "") +
      navRight +
      "</div>" +
      '<div class="app-body">' + body + "</div>" +
      bottomBar +
      '<button class="app-homebar" type="button" data-action="close" aria-label="回到主屏幕"></button>' +
      "</div>";
  }

  /* ================= 搜索 ================= */
  function openSearch() {
    if (screenEl.dataset.state !== "unlocked") {
      if (screenEl.dataset.state === "locked" || screenEl.dataset.state === "passcode") {
        showToast("请先输入密码解锁手机");
      }
      return;
    }
    searchLayer.classList.add("is-open");
    searchInput.value = "";
    renderSearchResults("");
    setTimeout(function () {
      searchInput.focus();
    }, 120);
  }

  function closeSearch() {
    searchLayer.classList.remove("is-open");
    searchInput.blur();
    if (screenEl.dataset.state === "unlocked") {
      screenEl.dataset.state = "unlocked";
    }
  }

  function renderSearchResults(query) {
    const q = query.trim().toLowerCase();
    const list = APPS.filter(function (app) {
      if (!q) return true;
      return app.name.toLowerCase().indexOf(q) >= 0 ||
        app.id.indexOf(q) >= 0 ||
        (app.keywords || "").indexOf(q) >= 0;
    });

    if (!list.length) {
      searchResults.innerHTML = '<p class="search-empty">没有找到相关 App</p>';
      return;
    }

    searchResults.innerHTML = list.map(function (app) {
      return '<button class="search-result" type="button" data-open-app="' + app.id + '">' +
        appIconHTML(app) +
        "<span><b>" + app.name + "</b><span>" + app.sub + "</span></span>" +
        "</button>";
    }).join("");
  }

  /* ================= 适配屏幕 ================= */
  function isPhoneLayout() {
    return window.matchMedia("(max-width: 640px)").matches || window.innerHeight < 700;
  }

  function fitDevice() {
    const full = isPhoneLayout();
    document.body.classList.toggle("full-screen", full);
    if (full) {
      deviceEl.style.transform = "none";
      deviceEl.style.marginBottom = "0px";
      return;
    }
    const scale = Math.min(1, (window.innerWidth - 26) / 410, (window.innerHeight - 96) / 864);
    deviceEl.style.transform = "scale(" + scale + ")";
    deviceEl.style.marginBottom = 864 * (scale - 1) + "px";
  }

  /* ================= 初始化事件 ================= */
  buildHome();
  renderPassDots();
  updateClocks();
  fitDevice();
  setInterval(updateClocks, 1000);

  unlockHint.addEventListener("click", openPasscode);
  passCancel.addEventListener("click", cancelPasscode);

  lockScreen.addEventListener("click", function (event) {
    if (event.target.closest("button")) return;
    openPasscode();
  });

  keypad.addEventListener("click", function (event) {
    const key = event.target.closest(".key");
    if (!key) return;
    pressPassKey(key.dataset.key);
  });

  lockFlash.addEventListener("click", function () {
    showToast("请先解锁手机，再使用手电筒");
    openPasscode();
  });

  lockCamera.addEventListener("click", function () {
    showToast("请先解锁手机，再使用相机");
    openPasscode();
  });

  homeBar.addEventListener("click", closeApps);
  searchBtn.addEventListener("click", openSearch);
  searchCancel.addEventListener("click", closeSearch);
  searchInput.addEventListener("input", function () {
    renderSearchResults(searchInput.value);
  });

  let lockStartY = null;
  lockScreen.addEventListener("pointerdown", function (event) {
    lockStartY = event.clientY;
  });
  lockScreen.addEventListener("pointerup", function (event) {
    if (lockStartY !== null && lockStartY - event.clientY > 34) {
      openPasscode();
    }
    lockStartY = null;
  });

  document.addEventListener("click", function (event) {
    const trigger = event.target.closest("[data-open-app]");
    if (!trigger) return;
    if (screenEl.dataset.state !== "unlocked") return;
    if (searchLayer.classList.contains("is-open")) {
      closeSearch();
    }
    openApp(trigger.dataset.openApp);
  });

  appLayer.addEventListener("click", function (event) {
    const actionEl = event.target.closest("[data-action]");
    if (actionEl) {
      handleAction(actionEl);
      return;
    }

    const chatRow = event.target.closest("[data-chat]");
    if (chatRow) {
      state.chat = { app: state.app, key: chatRow.dataset.chat };
      if (window.Drama &&
        (state.app === "kakao" || (state.app === "wechat" && chatRow.dataset.chat === "ys"))) {
        drama.setOpen(chatRow.dataset.chat);
      }
      renderApp();
      updateStoryLayer();
      beep(920, 0.04, "sine", 0.03);
      return;
    }

    const tab = event.target.closest("[data-kkt-tab]");
    if (tab) {
      if (tab.dataset.kktTab !== "chats") showToast("这部分暂时还没有内容");
      return;
    }

    const choice = event.target.closest("[data-choice]");
    if (choice) {
      const index = Number(choice.dataset.choice);
      if (window.Drama && drama.answer(index)) {
        renderApp();
        updateStoryLayer();
        beep(1000, 0.05, "sine", 0.03);
      }
      return;
    }

    const storyBtn = event.target.closest("[data-story-view]");
    if (storyBtn) {
      openStoryViewer(Number(storyBtn.dataset.storyView));
      return;
    }

    const likePostBtn = event.target.closest("[data-like-post]");
    if (likePostBtn) {
      const liked = likePostBtn.classList.toggle("is-liked");
      const label = likePostBtn.querySelector("[data-like-count]");
      if (label) {
        const base = Number(label.dataset.base || label.textContent || 0);
        if (!label.dataset.base) label.dataset.base = String(base);
        label.textContent = String(base + (liked ? 1 : 0)) || "";
      }
      beep(liked ? 1040 : 600, 0.05, "sine", 0.03);
      return;
    }

    const likeBtn = event.target.closest("[data-like]");
    if (likeBtn) {
      const liked = likeBtn.classList.toggle("is-liked");
      const base = Number(likeBtn.dataset.count || 0);
      const label = likeBtn.querySelector("span");
      if (label) label.textContent = String(base + (liked ? 1 : 0));
      beep(liked ? 1040 : 600, 0.05, "sine", 0.03);
      return;
    }

    const dialBtn = event.target.closest("[data-dial]");
    if (dialBtn) {
      if (state.dial.length < 14) state.dial += dialBtn.dataset.dial;
      updateDialDisplay();
      beep(760 + Number(dialBtn.dataset.dial) * 30, 0.05, "sine", 0.03);
      return;
    }

    const calcBtn = event.target.closest("[data-calc]");
    if (calcBtn) {
      pressCalc(calcBtn.dataset.calc);
      return;
    }

    const noteOpen = event.target.closest("[data-note-open]");
    if (noteOpen) {
      const index = Number(noteOpen.dataset.noteOpen);
      const note = state.notes[index];
      if (note) {
        state.noteEditing = { index: index, title: note.title, body: note.body };
        renderApp();
      }
      return;
    }

    const topic = event.target.closest("[data-topic]");
    if (topic) {
      showToast("正在打开微博话题：" + topic.dataset.topic);
      return;
    }

    const tile = event.target.closest("[data-tile]");
    if (tile) {
      showToast(tile.dataset.tile);
    }
  });

  appLayer.addEventListener("keydown", function (event) {
    if (event.key === "Enter" && event.target.id === "chatInput") {
      event.preventDefault();
      sendChatMessage();
    }
  });

  document.addEventListener("keydown", function (event) {
    if (screenEl.dataset.state === "passcode") {
      if (/^\d$/.test(event.key)) {
        pressPassKey(event.key);
        event.preventDefault();
      } else if (event.key === "Backspace") {
        pressPassKey("del");
        event.preventDefault();
      } else if (event.key === "Escape") {
        cancelPasscode();
      }
      return;
    }

    if (event.key === "Escape") {
      if (searchLayer.classList.contains("is-open")) {
        closeSearch();
      } else if (screenEl.dataset.state === "app") {
        closeApps();
      }
    }
  });

  window.addEventListener("resize", fitDevice);
  window.addEventListener("orientationchange", function () {
    setTimeout(fitDevice, 120);
  });

  /* ================= 计算器逻辑 ================= */
  function calcNumber(value) {
    const n = Number(value);
    if (!isFinite(n)) return "错误";
    const rounded = Number(n.toFixed(8));
    let text = String(rounded);
    if (text.length > 11) text = rounded.toExponential(4);
    return text;
  }

  function pressCalc(key) {
    const calc = state.calc;

    if (/^\d$/.test(key)) {
      if (calc.fresh || calc.display === "0") {
        calc.display = key;
        calc.fresh = false;
      } else if (calc.display.length < 11) {
        calc.display += key;
      }
    } else if (key === ".") {
      if (calc.fresh) {
        calc.display = "0.";
        calc.fresh = false;
      } else if (calc.display.indexOf(".") < 0) {
        calc.display += ".";
      }
    } else if (key === "AC") {
      calc.display = "0";
      calc.prev = null;
      calc.op = null;
      calc.fresh = true;
    } else if (key === "±") {
      calc.display = calc.display.charAt(0) === "-" ? calc.display.slice(1) : "-" + calc.display;
    } else if (key === "%") {
      calc.display = calcNumber(Number(calc.display) / 100);
      calc.fresh = true;
    } else if (key === "+" || key === "-" || key === "×" || key === "÷") {
      calc.prev = Number(calc.display);
      calc.op = key;
      calc.fresh = true;
      updateCalcDisplay();
      beep(700, 0.05, "sine", 0.03);
      return;
    } else if (key === "=") {
      if (calc.op !== null && calc.prev !== null) {
        const a = calc.prev;
        const b = Number(calc.display);
        let result = b;
        if (calc.op === "+") result = a + b;
        if (calc.op === "-") result = a - b;
        if (calc.op === "×") result = a * b;
        if (calc.op === "÷") result = b === 0 ? NaN : a / b;
        calc.display = calcNumber(result);
        calc.prev = null;
        calc.op = null;
        calc.fresh = true;
      }
    }

    updateCalcDisplay();
    beep(820, 0.04, "sine", 0.025);
  }

  function updateCalcDisplay() {
    const display = appLayer.querySelector(".calc-display");
    if (!display) return;
    display.textContent = state.calc.display;
    $$(".ck.op", appLayer).forEach(function (btn) {
      btn.classList.toggle("is-active", btn.dataset.calc === state.calc.op);
    });
  }

  function updateDialDisplay() {
    const display = appLayer.querySelector(".dial-display");
    if (!display) return;
    if (!state.dial) {
      display.innerHTML = '<span class="hint">输入号码开始呼叫</span>';
    } else {
      display.textContent = state.dial;
    }
  }

  /* ================= 聊天 ================= */
  const THREADS = {
    wechat: {
      mom: {
        name: "妈妈",
        avatar: "妈",
        tone: "av-4",
        time: "20:20",
        msgs: [
          { from: "you", text: "吃饭了吗？" },
          { from: "me", text: "吃过啦，正在做音乐。" },
          { from: "you", text: "早点睡，别太晚。" }
        ],
        reply: "知道啦 ♡"
      },
      mover: {
        name: "微信运动",
        avatar: "走",
        tone: "av-6",
        time: "17:04",
        msgs: [
          { from: "you", text: "你今天走了 12048 步，占领了 6 位朋友的封面。" }
        ],
        reply: "继续加油！"
      },
      file: {
        name: "文件传输助手",
        avatar: "文",
        tone: "av-8",
        time: "昨天",
        msgs: [
          { from: "me", text: "[文件] 星音小样 2026.mid" },
          { from: "me", text: "[链接] Logic · 编曲入口" }
        ],
        reply: "已保存。"
      }
    },
    kakao: {
      mountain: {
        name: "간지폭풍 GIANT MOUNTAIN",
        avatar: "간",
        photo: "assets/kkt-avatar.jpg",
        tone: "av-3",
        time: "20:28",
        unread: 2,
        msgs: [
          { from: "you", text: "오늘 사진 잘 나왔다 ㅋㅋ（今天的照片拍得不错 ㅋㅋ）" },
          { from: "me", text: "그치？光刚好，就多拍了几张。（对吧？光刚好。）" },
          { from: "you", text: "내일도 같이 작업해？（明天也一起做音乐吗？）" }
        ],
        reply: "좋아, 내일 봐！（好，明天见！）"
      }
    },
    messages: {
      courier: {
        name: "快递小哥",
        avatar: "快",
        tone: "av-6",
        time: "18:44",
        msgs: [
          { from: "you", text: "您的包裹已放在门口，请注意查收。" }
        ],
        reply: "收到，谢谢！"
      },
      bank: {
        name: "1069 服务号",
        avatar: "10",
        tone: "av-8",
        time: "昨天",
        msgs: [
          { from: "you", text: "【验证码】您正在登录Logic，验证码 530081，请勿泄露。" }
        ],
        reply: "不用回复。"
      }
    }
  };

  function wechatDramaRow() {
    if (!window.Drama) return "";
    const st = drama.state;
    const list = st.threads.ys || [];
    const peek = st.peek && st.peek.ys;
    if (!list.length && !peek) return "";
    const last = list[list.length - 1];
    const unread = st.unread.ys || 0;
    const name = (drama.cast.ys && drama.cast.ys.name) || "允书";
    const preview = peek || (last ? (last.text || "[图片]") : "发来一条新消息");
    return '<button class="list-row" type="button" data-chat="ys">' +
      '<span class="avatar avatar-img"><img src="assets/story/ys-avatar.jpg" alt="' + name + '" onerror="this.parentNode.classList.add(\'avatar-text\');this.remove()"></span>' +
      '<span class="row-main">' +
      '<span class="row-title">' + name + (unread ? ' <span class="badge">' + unread + "</span>" : "") + "</span>" +
      '<span class="row-sub">' + escapeHTML(preview) + "</span>" +
      "</span>" +
      '<span class="row-meta">' + localTime() + "</span>" +
      "</button>";
  }

  function chatListHTML(app) {
    if (app.id === "kakao" && window.Drama) return dramaChatList();
    const threads = THREADS[app.id] || {};
    let html = '<div class="chat-list">';
    if (app.id === "wechat") html += wechatDramaRow();
    Object.keys(threads).forEach(function (key) {
      const thread = threads[key];
      const last = thread.msgs[thread.msgs.length - 1];
      const avatar = thread.photo
        ? '<span class="avatar avatar-img"><img src="' + thread.photo + '" alt="' + thread.name + '"></span>'
        : '<span class="avatar ' + thread.tone + '">' + thread.avatar + "</span>";
      html += '<button class="list-row" type="button" data-chat="' + key + '">' +
        avatar +
        '<span class="row-main">' +
        '<span class="row-title">' + thread.name + (thread.unread ? ' <span class="badge">' + thread.unread + "</span>" : "") + "</span>" +
        '<span class="row-sub">' + (last ? last.text : "") + "</span>" +
        "</span>" +
        '<span class="row-meta">' + (thread.time || "") + "</span>" +
        "</button>";
    });
    html += "</div>";
    return html;
  }

  function chatBodyHTML(app) {
    if (app.id === "kakao" && window.Drama) return dramaChatBody();
    if (!state.chat || state.chat.app !== app.id) {
      return chatListHTML(app);
    }
    if (app.id === "wechat" && state.chat.key === "ys" && window.Drama) {
      return wechatDramaBody();
    }

    const thread = THREADS[app.id] && THREADS[app.id][state.chat.key];
    if (!thread) return chatListHTML(app);

    let html = '<div class="chat-screen"><span class="chat-day">今天 20:36</span>';
    thread.msgs.forEach(function (item) {
      html += '<div class="msg ' + (item.from === "me" ? "me" : "you") + '">' + item.text + "</div>";
    });
    html += "</div>" +
      '<div class="chat-input-row">' +
      '<input class="chat-input" id="chatInput" type="text" placeholder="发消息…" autocomplete="off" />' +
      '<button class="chat-send" type="button" data-action="send-chat">发送</button>' +
      "</div>";
    return html;
  }

  function sendChatMessage() {
    if (!state.chat) return;
    const input = appLayer.querySelector("#chatInput");
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;

    const isDramaChat = window.Drama &&
      ((state.chat.app === "kakao") ||
        (state.chat.app === "wechat" && state.chat.key === "ys"));

    if (isDramaChat) {
      const list = window.Drama.state.threads[state.chat.key];
      if (!list) return;
      list.push({ from: "me", text: text, img: "" });
      window.Drama.save();
      if (!(state.chat.app === "kakao" ? syncKktChat() : syncWxChat())) renderApp();
      input.value = "";
      beep(1040, 0.06, "sine", 0.035);
      return;
    }

    const thread = THREADS[state.chat.app] && THREADS[state.chat.app][state.chat.key];
    if (!thread) return;

    thread.msgs.push({ from: "me", text: text });
    const app = state.chat.app;
    const key = state.chat.key;
    renderApp();
    beep(1040, 0.06, "sine", 0.035);

    clearTimeout(replyTimer);
    replyTimer = setTimeout(function () {
      if (state.chat && state.chat.app === app && state.chat.key === key) {
        thread.msgs.push({ from: "you", text: thread.reply || "好的～" });
        renderApp();
        beep(820, 0.05, "sine", 0.03);
      }
    }, 900);
  }

  /* ================= 动作分发 ================= */
  function handleAction(el) {
    const action = el.dataset.action;

    if (action === "close") {
      closeApps();
      return;
    }

    if (action === "chat-back") {
      state.chat = null;
      if (window.Drama) drama.setOpen("");
      renderApp();
      updateStoryLayer();
      return;
    }

    if (action === "note-back") {
      state.noteEditing = null;
      renderApp();
      return;
    }

    if (action === "lock") {
      lockPhone();
      return;
    }

    if (action === "open-music") {
      openApp("music");
      return;
    }

    if (action === "open-photos") {
      openApp("photos");
      return;
    }

    if (action === "shutter") {
      takePhoto();
      return;
    }

    if (action === "toggle-flash") {
      state.flashOn = !state.flashOn;
      el.classList.toggle("is-on", state.flashOn);
      beep(700, 0.05, "square", 0.02);
      return;
    }

    if (action === "flip-camera") {
      state.cameraFront = !state.cameraFront;
      showToast(state.cameraFront ? "已切换到前置镜头" : "已切换到后置镜头");
      beep(620, 0.05, "triangle", 0.03);
      return;
    }

    if (action === "send-chat") {
      sendChatMessage();
      return;
    }

    if (action === "note-new") {
      state.noteEditing = { index: -1, title: "", body: "" };
      renderApp();
      return;
    }

    if (action === "note-save") {
      saveNote();
      return;
    }

    if (action === "dial-del") {
      state.dial = state.dial.slice(0, -1);
      updateDialDisplay();
      beep(480, 0.04, "sine", 0.03);
      return;
    }

    if (action === "dial-call") {
      if (!state.dial) {
        showToast("还没有输入号码");
        return;
      }
      showToast("正在呼叫 " + state.dial + " …");
      beep(520, 0.3, "sine", 0.04);
      return;
    }

    if (action === "toggle") {
      el.classList.toggle("is-on");
      beep(720, 0.04, "sine", 0.02);
      return;
    }

    if (action === "safari-topic") {
      showToast(el.dataset.tip || "这个页面还在搭建中");
      return;
    }

    if (action === "about") {
      showToast("Dream Phone · iOS 26 · 星音定制版");
      return;
    }

    if (action === "clear-notes") {
      state.notes = [];
      persistNotes();
      state.noteEditing = null;
      renderApp();
      showToast("备忘录已全部清空");
      return;
    }

    if (action === "restart-game") {
      const now = Date.now();
      if (now - restartArmed > 3500) {
        restartArmed = now;
        showToast("再点一次「重新开始游戏」确认清空剧情与编曲");
        return;
      }
      restartArmed = 0;
      restartGame();
    }
  }

  /* ================= 重新开始 ================= */
  let restartArmed = 0;

  function restartGame() {
    try {
      const keys = [];
      for (let i = 0; i < localStorage.length; i += 1) {
        const key = localStorage.key(i);
        if (key && (key.indexOf("xingyin.") === 0 || key.indexOf("dreamphone.") === 0)) keys.push(key);
      }
      keys.forEach(function (key) {
        localStorage.removeItem(key);
      });
    } catch (err) {
      /* 忽略 */
    }
    if (window.Drama) drama.reset();
    state.chat = null;
    state.noteEditing = null;
    state.notes = [];
    showToast("正在重新开始…");
    setTimeout(function () {
      location.reload();
    }, 500);
  }

  /* ================= 备忘录存储 ================= */
  function loadNotes() {
    try {
      const raw = localStorage.getItem(HOME_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      if (Array.isArray(parsed) && parsed.length) {
        /* 清掉历史默认示例备忘，保留玩家自己写的 */
        return parsed.filter(function (note) {
          return ["晚安旋律", "明日待办", "灵感碎片"].indexOf(note && note.title) < 0;
        });
      }
    } catch (err) {
      /* 忽略存储错误 */
    }
    return [];
  }

  function persistNotes() {
    try {
      localStorage.setItem(HOME_KEY, JSON.stringify(state.notes));
    } catch (err) {
      /* 忽略存储错误 */
    }
  }

  function saveNote() {
    const titleEl = appLayer.querySelector("#noteTitle");
    const bodyEl = appLayer.querySelector("#noteBody");
    if (!titleEl || !bodyEl) return;
    const title = titleEl.value.trim() || "无标题";
    const body = bodyEl.value;
    const editing = state.noteEditing || { index: -1 };

    if (editing.index >= 0 && state.notes[editing.index]) {
      state.notes[editing.index] = {
        title: title,
        body: body,
        date: new Date().toISOString().slice(0, 10)
      };
    } else {
      state.notes.unshift({
        title: title,
        body: body,
        date: new Date().toISOString().slice(0, 10)
      });
    }

    persistNotes();
    state.noteEditing = null;
    renderApp();
    showToast("已保存到本机备忘录");
  }

  /* ================= 拍照 ================= */
  const PHOTO_MEDIA = ["media-1", "media-2", "media-3", "media-4", "media-5", "media-6"];

  function takePhoto() {
    const view = appLayer.querySelector(".camera-view");
    if (!view) return;
    const flash = view.querySelector(".camera-flash");
    if (flash) {
      flash.classList.remove("is-flash");
      void flash.offsetWidth;
      flash.classList.add("is-flash");
    }
    beep(1200, 0.05, "square", 0.03);

    const media = PHOTO_MEDIA[state.photos.length % PHOTO_MEDIA.length];
    state.photos.unshift({ media: media, tag: "刚刚" });

    const thumb = view.querySelector(".cam-thumb");
    if (thumb) thumb.className = "cam-thumb " + media;

    setTimeout(function () {
      showToast("照片已保存到相册");
    }, 260);
  }

  state.notes = loadNotes();

  /* ================= Instagram ================= */
  const IG_NAME = "GIANT MOUNTAIN-ts";
  const IG_HANDLE = "giant.mountain.ts";
  const IG_AVATAR = "assets/wallpaper.jpg";
  const IG_POSTS = [
    { img: "assets/ins-1.jpg", place: "首尔 · 凌晨的巷子", time: "2 小时前", likes: 8412, comments: 236,
      caption: "새벽의 골목。回家的路上风比人先到，突然想做一首很慢的歌。#nightwalk #giantmountain" },
    { img: "assets/ins-2.jpg", place: "屋顶 · 日落", time: "5 小时前", likes: 12043, comments: 402,
      caption: "雪还没化，光先来了。想把这一束留给今晚的歌。#sunset # rooftops" },
    { img: "assets/ins-3.jpg", place: "录音室", time: "昨天", likes: 9630, comments: 318,
      caption: "새 앨범 작업 중 🎧 录到第三遍才满意，耳机摘下来耳朵还在嗡嗡的。#studiolife" },
    { img: "assets/ins-4.jpg", place: "车里 · 深夜", time: "2 天前", likes: 6128, comments: 154,
      caption: "路上有点长，就把车窗当成取景框。晚安。#latenight" },
    { img: "assets/ins-5.jpg", place: "伦敦 · 蓝门", time: "3 天前", likes: 15872, comments: 512,
      caption: "Blue door, white dog, blue sweater。今天被这只大狗治愈了 🐾 #london" }
  ];

  function instagramBodyHTML() {
    if (window.Drama) return dramaFeedHTML();
    const avatar = '<div class="ig-avatar"><span><img src="' + IG_AVATAR + '" alt="' + IG_NAME + '"></span></div>';

    const tiles = IG_POSTS.map(function (post, index) {
      return '<button class="ig-tile" type="button" data-tile="Instagram · 第 ' + (index + 1) + ' 张照片">' +
        '<img src="' + post.img + '" alt=""></button>';
    }).join("");

    const feed = IG_POSTS.map(function (post) {
      return '<article class="post">' +
        '<div class="post-head">' +
        '<span class="post-avatar avatar-img"><img src="' + IG_AVATAR + '" alt=""></span>' +
        "<div>" +
        '<div class="post-name">' + IG_NAME + "</div>" +
        '<div class="post-time">' + post.time + " · " + post.place + "</div>" +
        "</div></div>" +
        '<div class="post-media"><img src="' + post.img + '" alt=""></div>' +
        '<div class="post-actions">' +
        '<button class="like" type="button" data-like data-count="' + post.likes + '">' +
        '<svg class="ui-icon" viewBox="0 0 24 24"><use href="#i-heart"></use></svg><span>' + post.likes + "</span></button>" +
        '<button type="button" data-action="safari-topic" data-tip="评论功能在准备中">' +
        '<svg class="ui-icon" viewBox="0 0 24 24"><use href="#i-comment"></use></svg><span>' + post.comments + "</span></button>" +
        '<button type="button" data-action="safari-topic" data-tip="分享链接已复制">' +
        '<svg class="ui-icon" viewBox="0 0 24 24"><use href="#i-share"></use></svg><span>分享</span></button>' +
        "</div>" +
        '<div class="post-caption"><b>' + IG_HANDLE + "</b> " + post.caption + "</div>" +
        "</article>";
    }).join("");

    return '<div class="ig-profile">' + avatar +
      "<div>" +
      '<div class="ig-name">' + IG_NAME + "</div>" +
      '<div class="ig-meta">' + IG_HANDLE + " · 首尔 / 上海 · 写歌的人</div>" +
      "</div></div>" +
      '<div class="ig-stats">' +
      "<div><b>" + IG_POSTS.length + "</b>帖子</div>" +
      "<div><b>1.8 万</b>粉丝</div>" +
      "<div><b>32</b>关注</div>" +
      "</div>" +
      '<div class="ig-actions">' +
      '<button class="ig-btn primary" type="button" data-action="safari-topic" data-tip="已关注 ' + IG_NAME + '">关注</button>' +
      '<button class="ig-btn" type="button" data-action="safari-topic" data-tip="私信功能在准备中">发消息</button>' +
      "</div>" +
      '<div class="ig-grid">' + tiles + "</div>" +
      feed;
  }

  /* ================= X ================= */
  const X_NAME = "TS";
  const X_AVATAR = "assets/x-1.jpg";
  const X_POSTS = [
    { img: "assets/x-1.jpg", time: "2 分钟", likes: 2381, replies: 94,
      text: "새벽 감성。今天录到很晚，状态意外地好。" },
    { img: "assets/x-2.jpg", time: "32 分钟", likes: 1904, replies: 61,
      text: "초록 불빛 아래에서 한 장。走廊的灯有点绿，刚刚好。" },
    { img: "assets/x-3.jpg", time: "3 小时", likes: 3120, replies: 118,
      text: "드라이브 끝。车里太暗，只拍到了自己的眼睛。" },
    { img: "assets/x-4.jpg", time: "6 小时", likes: 4262, replies: 203,
      text: "운동 끝。练完随手一张，别问练了多久。" },
    { img: "assets/x-5.jpg", time: "昨天", likes: 5814, replies: 312,
      text: "빨간 머리 어때？红发只维持了三天，留个纪念。" },
    { img: "assets/x-6.jpg", time: "2 天前", likes: 6420, replies: 388,
      text: "셀카。今天心情不错，送你们一张。" }
  ];

  function xBodyHTML() {
    return '<div class="app-locked">' +
      '<div class="app-locked-icon">🔒</div>' +
      "<h2>X</h2>" +
      "<p>当前无法解锁</p>" +
      "<span>该账号暂时无法访问，请稍后再试</span>" +
      "</div>";
  }

  /* ================= 微博 ================= */
  function weiboBodyHTML() {
    const topics = [
      ["把晚风写成八小节", "342 万", true],
      ["Logic新增音色", "289 万", true],
      ["二胡一响就是故乡", "176 万", true],
      ["今晚的晚霞像桃子汽水", "98 万", false],
      ["16 格编曲挑战", "76 万", false],
      ["你手机里的第一首歌", "64 万", false],
      ["低音提琴适配性", "51 万", false],
      ["熬夜编曲实录", "43 万", false],
      ["唢呐音色到底有多顶", "31 万", false],
      ["iOS 26 新壁纸", "22 万", false]
    ];

    return '<div class="hot-head">微博热搜 · 实时</div>' +
      topics.map(function (item, index) {
        return '<button class="hot-row' + (item[2] ? " is-hot" : "") + '" type="button" data-topic="' + item[0] + '">' +
          '<span class="hot-rank">' + (index + 1) + "</span>" +
          '<span class="row-main"><span class="hot-title">' + item[0] + "</span>" +
          '<span class="hot-meta">热度 ' + item[1] + "</span></span>" +
          "</button>";
      }).join("");
  }

  /* ================= 相机 ================= */
  function cameraBodyHTML() {
    return '<div class="camera-view">' +
      '<div class="scene"></div>' +
      '<div class="camera-top">' +
      '<button class="cam-chip' + (state.flashOn ? " is-on" : "") + '" type="button" data-action="toggle-flash">⚡ 闪光灯</button>' +
      '<span class="cam-chip">照片</span>' +
      "</div>" +
      '<div class="camera-grid"></div>' +
      '<div class="camera-focus"></div>' +
      '<div class="camera-controls">' +
      '<button class="cam-thumb" type="button" data-action="open-photos" aria-label="打开照片"></button>' +
      '<button class="shutter" type="button" data-action="shutter" aria-label="拍照"></button>' +
      '<button class="cam-flip" type="button" data-action="flip-camera" aria-label="切换镜头">⟳</button>' +
      "</div>" +
      '<span class="cam-mode is-active" style="position:absolute;left:50%;bottom:52px;transform:translateX(-50%)">照片</span>' +
      '<div class="camera-flash"></div>' +
      "</div>";
  }

  /* ================= 照片 ================= */
  function photosBodyHTML() {
    const base = [
      { media: "media-1", tag: "晚霞" },
      { media: "media-2", tag: "海边" },
      { media: "media-3", tag: "森林" },
      { media: "media-4", tag: "夜色" },
      { media: "media-5", tag: "桃子汽水" },
      { media: "media-6", tag: "深蓝" },
      { media: "media-7", tag: "暖光" },
      { media: "media-8", tag: "雾" },
      { media: "media-1", tag: "落日" }
    ];
    const list = state.photos.concat(base);

    return '<div class="photo-head"><h2>照片</h2><span>2026 年 10 月 · ' + list.length + " 张</span></div>" +
      '<div class="photo-grid">' + list.map(function (photo) {
        return '<button class="photo ' + photo.media + '" type="button" data-tile="查看照片 · ' + (photo.tag || "回忆") + '">' +
          '<span class="tag">' + (photo.tag || "回忆") + "</span></button>";
      }).join("") + "</div>";
  }

  /* ================= 时钟 ================= */
  function clockBodyHTML() {
    const cities = [
      ["北京", "中国标准时间", "Asia/Shanghai"],
      ["首尔", "韩国标准时间", "Asia/Seoul"],
      ["东京", "日本标准时间", "Asia/Tokyo"],
      ["伦敦", "英国时间", "Europe/London"],
      ["纽约", "美国东部时间", "America/New_York"]
    ];

    return '<div class="clock-hero">' +
      '<div class="big" data-clock-full>20:56:00</div>' +
      "<p>" + localDate() + "</p>" +
      "</div>" +
      '<div class="clock-tabs">' +
      '<span class="clock-tab is-active">世界时钟</span>' +
      '<span class="clock-tab">闹钟</span>' +
      '<span class="clock-tab">秒表</span>' +
      "</div>" +
      cities.map(function (city) {
        return '<div class="world-row">' +
          '<div><div class="city">' + city[0] + '</div><div class="zone">' + city[1] + "</div></div>" +
          '<div class="time" data-tz="' + city[2] + '">--:--</div>' +
          "</div>";
      }).join("");
  }

  /* ================= 天气 ================= */
  function weatherBodyHTML() {
    const hours = [
      ["现在", "12°", "多云"],
      ["21时", "11°", "多云"],
      ["22时", "10°", "阴"],
      ["23时", "9°", "阴"],
      ["00时", "9°", "晴"],
      ["01时", "8°", "晴"]
    ];
    const days = [
      ["今天", "13°", "6°"],
      ["明天", "14°", "7°"],
      ["周六", "15°", "8°"],
      ["周日", "13°", "5°"],
      ["周一", "12°", "4°"]
    ];

    return '<div class="weather-hero">' +
      '<div class="weather-city">首尔</div>' +
      '<p class="weather-temp">12°</p>' +
      '<p class="weather-desc">多云 · 体感 10°</p>' +
      '<p class="weather-range">最高 13° / 最低 6° · 西北风 3 级</p>' +
      "</div>" +
      '<div class="hourly">' + hours.map(function (hour) {
        return '<div class="hour-card">' + hour[0] + "<b>" + hour[1] + "</b>" + hour[2] + "</div>";
      }).join("") + "</div>" +
      days.map(function (day, index) {
        return '<div class="forecast-row">' +
          '<span class="day">' + day[0] + "</span>" +
          '<span class="icon">' + (index % 2 === 0 ? "☀︎" : "☁︎") + "</span>" +
          '<span class="bar"></span>' +
          '<span>' + day[1] + '&nbsp;&nbsp;<span class="low">' + day[2] + "</span></span>" +
          "</div>";
      }).join("");
  }

  /* ================= 备忘录 ================= */
  function notesBodyHTML() {
    if (state.noteEditing) {
      return '<div class="note-editor">' +
        '<input id="noteTitle" type="text" placeholder="标题" value="' + escapeHTML(state.noteEditing.title) + '" />' +
        '<textarea id="noteBody" placeholder="写点什么…">' + escapeHTML(state.noteEditing.body) + "</textarea>" +
        '<button class="note-save" type="button" data-action="note-save">保存</button>' +
        "</div>";
    }

    if (!state.notes.length && !(window.Drama && drama.state.notes.length)) {
      return '<p class="search-empty">还没有备忘录</p>' +
        '<button class="note-save" type="button" data-action="note-new">新建备忘录</button>';
    }

    const storyNotes = window.Drama ? drama.state.notes.map(function (note) {
      return '<div class="note-row story-note">' +
        "<b>星音提醒</b>" +
        "<span>" + escapeHTML(note.text) + "</span>" +
        "<i>剧情</i></div>";
    }).join("") : "";

    return storyNotes + state.notes.map(function (note, index) {
      return '<button class="note-row" type="button" data-note-open="' + index + '">' +
        "<b>" + escapeHTML(note.title) + "</b>" +
        "<span>" + escapeHTML(note.body.replace(/\n/g, " ")).slice(0, 46) + "</span>" +
        "<i>" + escapeHTML(note.date) + "</i>" +
        "</button>";
    }).join("") +
      '<button class="note-save" type="button" data-action="note-new" style="margin-top:10px">新建备忘录</button>';
  }

  function escapeHTML(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /* ================= 计算器 ================= */
  function calculatorBodyHTML() {
    const keys = [
      ["AC", "fn"], ["±", "fn"], ["%", "fn"], ["÷", "op"],
      ["7", ""], ["8", ""], ["9", ""], ["×", "op"],
      ["4", ""], ["5", ""], ["6", ""], ["−", "op"],
      ["1", ""], ["2", ""], ["3", ""], ["+", "op"],
      ["0", "wide"], [".", ""], ["=", "op"]
    ];

    return '<div class="calc-display">' + state.calc.display + "</div>" +
      '<div class="calc-keys">' + keys.map(function (key) {
        const value = key[0] === "−" ? "-" : key[0];
        return '<button class="ck ' + key[1] + '" type="button" data-calc="' + value + '">' + key[0] + "</button>";
      }).join("") + "</div>";
  }

  /* ================= 设置 ================= */
  function settingsBodyHTML() {
    return '<div class="set-group">' +
      '<div class="set-row"><span class="set-ic b1">梦</span><span class="set-label">梦女</span>' +
      '<span class="set-value">Apple ID ›</span></div>' +
      '<div class="set-row"><span class="set-ic b3">✈</span><span class="set-label">飞行模式</span>' +
      '<span class="set-toggle" data-action="toggle"></span></div>' +
      '<div class="set-row"><span class="set-ic b3">Wi</span><span class="set-label">无线局域网</span>' +
      '<span class="set-value">星音小屋</span></div>' +
      '<div class="set-row"><span class="set-ic b2">⌁</span><span class="set-label">蓝牙</span>' +
      '<span class="set-value">已开启</span></div>' +
      "</div>" +
      '<div class="set-group">' +
      '<div class="set-row"><span class="set-ic b4">☾</span><span class="set-label">专注模式</span>' +
      '<span class="set-value">勿扰 ›</span></div>' +
      '<div class="set-row"><span class="set-ic b1">⏱</span><span class="set-label">屏幕使用时间</span>' +
      '<span class="set-value">2 小时 14 分</span></div>' +
      '<div class="set-row"><span class="set-ic b5">⚙</span><span class="set-label">通用</span>' +
      '<span class="set-value">iOS 26.1 ›</span></div>' +
      "</div>" +
      '<div class="set-group">' +
      '<div class="set-row"><span class="set-ic b2">🔒</span><span class="set-label">锁屏密码</span>' +
      '<span class="set-value">6 位数字</span></div>' +
      '<div class="set-row"><span class="set-ic b4">✦</span><span class="set-label">面容 ID 与密码</span>' +
      '<span class="set-value">已开启 ›</span></div>' +
      "</div>" +
      '<button class="set-btn danger" type="button" data-action="restart-game">重新开始游戏</button>' +
      '<button class="set-btn danger" type="button" data-action="lock">锁定手机</button>' +
      '<button class="set-btn" type="button" data-action="about">关于本机</button>' +
      '<button class="set-btn danger" type="button" data-action="clear-notes">清空备忘录</button>' +
      '<p class="set-foot">Dream Phone · 星音定制版<br />锁屏密码 530111 · 解锁后才能使用</p>';
  }

  /* ================= 电话 ================= */
  function phoneBodyHTML() {
    const dialKeys = [
      ["1", ""], ["2", "ABC"], ["3", "DEF"],
      ["4", "GHI"], ["5", "JKL"], ["6", "MNO"],
      ["7", "PQRS"], ["8", "TUV"], ["9", "WXYZ"],
      ["*", ""], ["0", "+"], ["#", ""]
    ];

    let display = "";
    if (state.dial) {
      display = escapeHTML(state.dial);
    } else {
      display = '<span class="hint">输入号码开始呼叫</span>';
    }

    return '<div class="dial-display">' + display + "</div>" +
      '<div class="dial-pad">' + dialKeys.map(function (key) {
        return '<button class="dial-btn" type="button" data-dial="' + key[0] + '">' + key[0] +
          (key[1] ? "<small>" + key[1] + "</small>" : "") + "</button>";
      }).join("") + "</div>" +
      '<button class="dial-call" type="button" data-action="dial-call" aria-label="呼叫">' +
      '<svg class="ui-icon" viewBox="0 0 24 24"><use href="#i-phone"></use></svg></button>' +
      '<p class="set-foot">轻点号码开始呼叫 · 模拟拨号</p>';
  }

  /* ================= Safari ================= */
  function safariBodyHTML() {
    const favs = [
      { label: "微博", icon: "微", act: 'data-action="safari-topic" data-tip="微博网页版在准备中"' },
      { label: "Instagram", icon: "Ins", act: 'data-action="safari-topic" data-tip="Instagram 网页版在准备中"' },
      { label: "X", icon: "X", act: 'data-action="safari-topic" data-tip="X 网页版在准备中"' },
      { label: "Kakao", icon: "K", act: 'data-action="safari-topic" data-tip="KakaoTalk 网页版在准备中"' },
      { label: "星音", icon: "♪", act: 'data-action="open-music"' },
      { label: "音乐", icon: "♫", act: 'data-action="open-music"' },
      { label: "热搜", icon: "热", act: 'data-action="safari-topic" data-tip="热搜网页版在准备中"' },
      { label: "苹果", icon: "★", act: 'data-action="safari-topic" data-tip="apple.com 网页在准备中"' }
    ];
    const favHtml = favs.map(function (f) {
      return '<button class="safari-fav" type="button" ' + f.act + ">" +
        "<i>" + f.icon + "</i><span>" + f.label + "</span></button>";
    }).join("");

    return '<div class="safari-start">' +
      '<div class="safari-search">' +
      '<span class="safari-aa">aA</span>' +
      '<span class="safari-field"><svg class="ui-icon" viewBox="0 0 24 24"><use href="#i-globe"></use></svg>搜索或输入网站名称</span>' +
      '<span class="safari-reload">↻</span>' +
      "</div>" +
      '<div class="safari-section-title">个人收藏</div>' +
      '<div class="safari-favs">' + favHtml + "</div>" +
      '<div class="safari-section-title">隐私报告</div>' +
      '<div class="safari-card">过去 7 天，Safari 已阻止 3 个跨站跟踪器，你的浏览更私密。</div>' +
      '<div class="safari-section-title">阅读列表</div>' +
      '<div class="safari-card">还没有内容。把想稍后读的网页加进来，就会出现在这里。</div>' +
      "</div>";
  }

  /* ================= Logic ================= */
  function musicPageHTML() {
    return '<div class="app-page music-app" data-app="music">' +
      '<div class="music-nav">' +
      statusBarHTML() +
      '<div class="music-nav-row">' +
      '<button class="nav-back nav-exit" type="button" data-action="close" aria-label="退出 Logic">‹ 退出</button>' +
      "<h1>Logic</h1>" +
      '<span class="music-chip">编曲 Studio</span>' +
      "</div>" +
      "</div>" +
      '<iframe class="music-frame" src="index.html" title="Logic编曲器"></iframe>' +
      "</div>";
  }

  /* ================= 剧情：KKT 与 Instagram ================= */
  const drama = window.Drama;
  const storyLayer = document.createElement("div");
  storyLayer.className = "story-layer";
  screenEl.appendChild(storyLayer);

  function dramaAvatar(key, extra) {
    const c = (drama.cast && drama.cast[key]) || { name: key, letter: "?", tone: "av-1" };
    if (c.avatar) {
      return '<span class="avatar avatar-img ' + (extra || "") + '">' +
        '<img src="' + c.avatar + '" alt="" onerror="this.style.display=\'none\'" /><b>' + c.letter + "</b></span>";
    }
    return '<span class="avatar ' + (c.tone || "av-1") + " " + (extra || "") + '">' + c.letter + "</span>";
  }

  function kktTabsHTML() {
    return '<div class="kkt-tabs">' +
      '<button class="kkt-tab" type="button" data-kkt-tab="friends"><b>好友</b></button>' +
      '<button class="kkt-tab is-on" type="button" data-kkt-tab="chats"><b>聊天</b></button>' +
      '<button class="kkt-tab" type="button" data-kkt-tab="feed"><b>动态</b></button>' +
      '<button class="kkt-tab" type="button" data-kkt-tab="more"><b>更多</b></button>' +
      "</div>";
  }

  function dramaChatList() {
    const st = drama.state;
    let html = '<div class="chat-list kkt-list">' +
      '<div class="kkt-searchbar">' +
      '<svg class="ui-icon"><use href="#i-search"></use></svg>' +
      "<span>搜索聊天</span></div>";
    let rows = "";
    if (st.request) {
      rows += '<button class="list-row" type="button" data-chat="ts">' +
        dramaAvatar("ts") +
        '<span class="row-main">' +
        '<span class="row-title">' + escapeHTML(drama.cast.ts.name) + ' <span class="badge">1</span></span>' +
        '<span class="row-sub">好友申请 · ' + escapeHTML(st.request.text) + "</span>" +
        "</span><span class=\"row-meta\">现在</span></button>";
    }
    ["ts", "wn"].forEach(function (key) {
      const list = st.threads[key] || [];
      const peek = st.peek && st.peek[key];
      if (!list.length && !peek) return;
      const last = list[list.length - 1];
      const unread = st.unread[key] || 0;
      const preview = peek || (last ? (last.img ? "[图片]" : last.text) : "发来一条新消息");
      rows += '<button class="list-row" type="button" data-chat="' + key + '">' +
        dramaAvatar(key) +
        '<span class="row-main">' +
        '<span class="row-title">' + drama.cast[key].name +
        (unread ? ' <span class="badge">' + unread + "</span>" : "") + "</span>" +
        '<span class="row-sub">' + escapeHTML(preview).slice(0, 32) + "</span>" +
        "</span><span class=\"row-meta\">现在</span></button>";
    });
    if (!rows) {
      rows = '<div class="kkt-empty"><span>还没有聊天</span><em>有人加你好友后会出现在这里</em></div>';
    }
    html += rows + "</div>";
    return html;
  }

  function dramaChatBody() {
    if (!state.chat) return dramaChatList();
    const key = state.chat.key;
    const st = drama.state;
    const list = st.threads[key] || [];
    const cast = drama.cast[key] || { name: key };
    let html = '<div class="chat-screen kkt-screen" data-shown="' + list.length + '">';
    if (st.request && key === "ts" && !list.length) {
      html += '<div class="kkt-request">' +
        '<span class="kkt-request-title">好友申请</span>' +
        '<span class="kkt-request-text">' + escapeHTML(st.request.text) + "</span>" +
        '<span class="kkt-request-actions">' +
        '<button class="kkt-btn ghost" type="button" data-choice="1">拒绝</button>' +
        '<button class="kkt-btn" type="button" data-choice="0">同意</button>' +
        "</span></div>";
    }
    list.forEach(function (m) {
      html += kktMsgHTML(m, key, cast);
    });
    html += kktChoicesHTML(st.pending, key);
    html += "</div>" +
      '<div class="chat-input-row kkt-input-row">' +
      '<input class="chat-input" id="chatInput" type="text" placeholder="输入消息…" autocomplete="off" />' +
      '<button class="chat-send" type="button" data-action="send-chat">发送</button>' +
      "</div>";
    return html;
  }

  function kktMsgHTML(m, key, cast) {
    const img = m.img ? '<img class="kkt-photo" src="' + m.img + '" alt="" onerror="this.style.display=\'none\';var r=this.closest(\'.kkt-row\');if(r&&!r.textContent.trim())r.remove();" />' : "";
    const quote = m.quote ? '<div class="kkt-quote">' + escapeHTML(m.quote) + "</div>" : "";
    if (m.from === "me") {
      if (!m.text && !m.img) return "";
      return '<div class="kkt-row me"><div class="kkt-bubble me">' + quote + escapeHTML(m.text) + img + "</div></div>";
    }
    return '<div class="kkt-row you">' + dramaAvatar(key, "kkt-avatar") +
      '<div class="kkt-stack"><span class="kkt-name">' + escapeHTML(cast.name) + "</span>" +
      '<div class="kkt-bubble">' + quote + escapeHTML(m.text) + img + "</div></div></div>";
  }

  function kktChoicesHTML(pend, key) {
    if (!pend || pend.kind !== "ask" || pend.thread !== key || pend.friend) return "";
    let html = '<div class="kkt-choices">';
    pend.options.forEach(function (opt, i) {
      html += '<button class="kkt-choice" type="button" data-choice="' + i + '">' +
        escapeHTML(opt.label) + "</button>";
    });
    return html + "</div>";
  }

  /* ====== 允书的聊天放在微信里 ====== */
  function wxMsgHTML(m) {
    const img = m.img ? '<img class="kkt-photo" src="' + m.img + '" alt="" onerror="this.style.display=\'none\'" />' : "";
    const quote = m.quote ? '<div class="kkt-quote">' + escapeHTML(m.quote) + "</div>" : "";
    return '<div class="msg ' + (m.from === "me" ? "me" : "you") + '">' + quote + escapeHTML(m.text) + img + "</div>";
  }

  function wechatDramaBody() {
    const list = drama.state.threads.ys || [];
    let html = '<div class="chat-screen wx-screen" data-shown="' + list.length + '"><span class="chat-day">今天</span>';
    list.forEach(function (m) {
      html += wxMsgHTML(m);
    });
    html += kktChoicesHTML(drama.state.pending, "ys");
    html += "</div>" +
      '<div class="chat-input-row">' +
      '<input class="chat-input" id="chatInput" type="text" placeholder="发消息…" autocomplete="off" />' +
      '<button class="chat-send" type="button" data-action="send-chat">发送</button>' +
      "</div>";
    return html;
  }

  /* 增量刷新微信里的允书聊天 */
  function syncWxChat() {
    const screen = appLayer.querySelector(".wx-screen");
    if (!screen || !state.chat || state.chat.key !== "ys") return false;
    const st = drama.state;
    const list = st.threads.ys || [];
    const shown = Number(screen.dataset.shown || 0);
    const oldChoices = screen.querySelector(".kkt-choices");
    if (oldChoices) oldChoices.remove();
    let added = 0;
    if (list.length > shown) {
      let html = "";
      for (let i = shown; i < list.length; i += 1) html += wxMsgHTML(list[i]);
      screen.insertAdjacentHTML("beforeend", html);
      screen.dataset.shown = String(list.length);
      added = list.length - shown;
    }
    const choices = kktChoicesHTML(st.pending, "ys");
    if (choices) screen.insertAdjacentHTML("beforeend", choices);
    if (added) {
      const body = appLayer.querySelector(".app-body");
      if (body) body.scrollTop = body.scrollHeight;
    }
    return true;
  }

  /* 增量刷新聊天：只追加新消息，不整页重绘（避免闪屏） */
  function syncKktChat() {
    const screen = appLayer.querySelector(".kkt-screen");
    if (!screen || !state.chat) return false;
    const key = state.chat.key;
    const st = drama.state;
    const list = st.threads[key] || [];
    const cast = drama.cast[key] || { name: key };
    const shown = Number(screen.dataset.shown || 0);
    const oldChoices = screen.querySelector(".kkt-choices");
    if (oldChoices) oldChoices.remove();
    let added = 0;
    if (list.length > shown) {
      let html = "";
      for (let i = shown; i < list.length; i += 1) html += kktMsgHTML(list[i], key, cast);
      screen.insertAdjacentHTML("beforeend", html);
      screen.dataset.shown = String(list.length);
      added = list.length - shown;
    }
    const choices = kktChoicesHTML(st.pending, key);
    if (choices) screen.insertAdjacentHTML("beforeend", choices);
    if (added) {
      const body = appLayer.querySelector(".app-body");
      if (body) body.scrollTop = body.scrollHeight;
    }
    return true;
  }

  function playerHandle(name) {
    const raw = String(name || "").trim();
    const latin = raw.replace(/[^a-zA-Z0-9._]/g, "").toLowerCase();
    if (latin.length >= 2) return "@" + latin;
    let h = 0;
    for (let i = 0; i < raw.length; i += 1) h = (h * 31 + raw.charCodeAt(i)) % 10000;
    return "@music_" + ("0000" + h).slice(-4);
  }

  function igAuthor(key) {
    const st = drama.state;
    if (key === "me") {
      return {
        name: (st.name || "我") + "（我）",
        handle: playerHandle(st.name),
        avatar: "",
        letter: (st.name || "我").slice(0, 1)
      };
    }
    const c = drama.cast[key] || { name: key, letter: "?" };
    const handles = {
      ts: "giant.mountain.ts",
      wn: "woonhak.kim",
      myng: "myng",
      ppparksh: "ppparksh",
      u: "u.livehouse"
    };
    /* IG 上的账号名用英文/ID，不显示中文姓名 */
    const names = {
      ts: "Taesan",
      wn: "Woonhak",
      myng: "myng",
      ppparksh: "ppparksh",
      u: "u livehouse"
    };
    /* IG 使用专用头像（igAvatar），没有配置时回退到 KKT 头像 */
    return { name: names[key] || c.name, handle: "@" + (handles[key] || key), avatar: c.igAvatar || c.avatar, letter: c.letter };
  }

  function igMediaHTML(post) {
    if (post.img) {
      return '<div class="post-media"><img src="' + post.img + '" alt="" onerror="this.style.display=\'none\'" />' +
        '<span class="post-media-fallback">' + escapeHTML(post.cap || "照片") + "</span></div>";
    }
    if (post.rain) {
      return '<div class="post-media post-rain"><span>雨</span></div>';
    }
    if (post.announce) {
      const who = (drama && drama.state && drama.state.name) || "我";
      return '<div class="post-media post-announce"><span>LIVE</span><b>u livehouse</b><i>ep000 × ' + escapeHTML(who) + ' × %1 × RERE</i></div>';
    }
    return "";
  }

  function dramaFeedHTML() {
    const st = drama.state;
    const stories = st.feed.filter(function (p) { return p.story; });
    const posts = st.feed.filter(function (p) { return !p.story; });
    const me = igAuthor("me");

    const ring = stories.map(function (s, i) {
      return '<button class="ig-story" type="button" data-story-view="' + i + '">' +
        '<span class="ig-story-ring">' + igMediaHTML(s) + "</span>" +
        '<span class="ig-story-label">' + escapeHTML(st.name || "我") + "</span></button>";
    }).join("");

    const feed = posts.map(function (post) {
      const who = igAuthor(post.who);
      const rows = post.comments.map(function (c) {
        const cw = igAuthor(c.who);
        return '<div class="post-comment"><b>' + escapeHTML(cw.handle) + "</b> " + escapeHTML(c.text) + "</div>";
      }).join("");
      /* 演出公告的阵容文案按当前玩家名实时渲染，保证老存档也能同步 */
      const capText = post.announce
        ? "本周六 20:00 · " + (post.place || "u livehouse") + " · 阵容：ep000 / " + (st.name || "我") + " / %1 / RERE"
        : post.caption;
      return '<article class="post" data-post="' + post.id + '">' +
        '<div class="post-head">' +
        '<span class="post-avatar avatar-img">' +
        (who.avatar ? '<img src="' + who.avatar + '" alt="" /><b>' + who.letter + "</b>" : "<b>" + who.letter + "</b>") +
        "</span>" +
        "<div>" +
        '<div class="post-name">' + escapeHTML(who.name) + "</div>" +
        '<div class="post-time">' + escapeHTML(post.place || "首尔") + " · 刚刚</div>" +
        "</div></div>" +
        igMediaHTML(post) +
        '<div class="post-actions">' +
        '<button class="like" type="button" data-like-post="' + post.id + '">' +
        '<svg class="ui-icon" viewBox="0 0 24 24"><use href="#i-heart"></use></svg>' +
        '<span data-like-count>' + (post.likes.length || "") + "</span></button>" +
        '<button type="button" data-action="safari-topic" data-tip="评论按剧情解锁">' +
        '<svg class="ui-icon" viewBox="0 0 24 24"><use href="#i-comment"></use></svg>' +
        "<span>" + post.comments.length + "</span></button>" +
        '<button type="button" data-action="safari-topic" data-tip="链接已复制">' +
        '<svg class="ui-icon" viewBox="0 0 24 24"><use href="#i-share"></use></svg><span>分享</span></button>' +
        "</div>" +
        '<div class="post-caption"><b>' + escapeHTML(who.handle) + "</b> " + escapeHTML(capText) + "</div>" +
        rows +
        "</article>";
    }).join("");

    const empty = !stories.length && !posts.length
      ? '<p class="search-empty">还没有动态，先去写歌吧</p>'
      : "";

    return '<div class="ig-top">' +
      '<span class="ig-dot"></span>' +
      '<div class="ig-me"><b>' + escapeHTML(me.name) + "</b><i>" + escapeHTML(me.handle) + "</i></div>" +
      "</div>" +
      (ring ? '<div class="ig-stories">' + ring + "</div>" : "") +
      empty + feed;
  }

  /* 快拍查看层 */
  let storyViewerIndex = -1;

  function storyViewerHTML(index) {
    const st = drama.state;
    const story = st.feed.filter(function (p) { return p.story; })[index];
    if (!story) return "";
    const comments = story.comments.map(function (c) {
      const cw = igAuthor(c.who);
      return '<div class="story-comment"><b>' + escapeHTML(cw.handle) + "</b> " + escapeHTML(c.text) + "</div>";
    }).join("");
    const pend = st.pending;
    const choices = pend && pend.kind === "ask" && pend.ig
      ? '<div class="story-choices">' + pend.options.map(function (o, i) {
        return '<button type="button" data-ig-choice="' + i + '">' + escapeHTML(o.label) + "</button>";
      }).join("") + "</div>"
      : "";
    return '<div class="story-viewer" data-close-viewer>' +
      '<div class="story-viewer-top"><span>' + escapeHTML(igAuthor(story.who).name) + "</span>" +
      '<button type="button" data-close-viewer>×</button></div>' +
      '<div class="story-viewer-body">' + igMediaHTML(story) + "</div>" +
      '<div class="story-viewer-cap">' + escapeHTML(story.caption) + "</div>" +
      (comments ? '<div class="story-comments">' + comments + "</div>" : "") +
      choices + "</div>";
  }

  function openStoryViewer(index) {
    const html = storyViewerHTML(index);
    if (!html) return;
    storyViewerIndex = index;
    storyLayer.classList.add("is-open");
    storyLayer.innerHTML = html;
  }

  function refreshStoryViewer() {
    if (storyViewerIndex < 0 || !storyLayer.classList.contains("is-open")) return;
    storyLayer.innerHTML = storyViewerHTML(storyViewerIndex);
  }

  /* 剧情任务卡 / 提示 */
  const ROUND_STORE_KEY = "xingyin.round.v1";
  const WORK_STORE_KEY = "xingyin.work.v1";
  const ROUND2_WANT_KEY = "xingyin.round2.want";
  const STORY_TOTAL_STEPS = 32;

  /* 直接读本地存档里的鼓点数：不依赖 iframe 是否加载，也不受加载竞态影响 */
  function storyRoundCfg() {
    const cfg = window.STORY_CONTENT && window.STORY_CONTENT.round;
    return cfg && Array.isArray(cfg.sections) && cfg.sections.length ? cfg : null;
  }

  function storySectionSpan(section) {
    const cfg = storyRoundCfg();
    const fallback = Math.max(1, Number(cfg && cfg.sectionSteps) || 8);
    const steps = Number(section && section.steps);
    return Math.max(1, Math.min(STORY_TOTAL_STEPS, Number.isFinite(steps) && steps > 0 ? steps : fallback));
  }

  /* 「第四段」= 最后一段；段范围算法和 app.js 的 roundSectionRange 保持一致 */
  function storyFixRange() {
    const cfg = storyRoundCfg();
    const index = Math.max(0, (cfg ? cfg.sections.length : 4) - 1);
    let start = 0;
    for (let i = 0; i < index; i += 1) {
      start += storySectionSpan(cfg ? cfg.sections[i] : null);
    }
    if (start >= STORY_TOTAL_STEPS) return { start: STORY_TOTAL_STEPS - 1, end: STORY_TOTAL_STEPS };
    const span = storySectionSpan(cfg ? cfg.sections[index] : null);
    return { start: start, end: Math.min(STORY_TOTAL_STEPS, start + span) };
  }

  function readSavedDrums() {
    const keys = [ROUND_STORE_KEY, WORK_STORE_KEY];
    for (let i = 0; i < keys.length; i += 1) {
      try {
        const raw = localStorage.getItem(keys[i]);
        const data = raw ? JSON.parse(raw) : null;
        const grid = data && (data.grid || (data.work && data.work.grid));
        if (grid && Array.isArray(grid.drums)) return grid.drums;
      } catch (err) {
        /* 换下一个存档 */
      }
    }
    return null;
  }

  function storyDrumCount(range) {
    const drums = readSavedDrums();
    if (!drums || !range) return 0;
    let count = 0;
    drums.forEach(function (key) {
      const step = Number(String(key).split("-")[1]);
      if (step >= range.start && step < range.end) count += 1;
    });
    return count;
  }

  /* 任务出现时就锁基准，之后只比较「当前鼓点数 - 基准」 */
  function storyLockFixBase(st) {
    if (!st || !st.flags || st.flags.fixDrumBase !== undefined) return;
    if (st.flags.fixBase !== undefined) delete st.flags.fixBase;
    st.flags.fixDrumBase = storyDrumCount(storyFixRange());
    drama.save();
  }

  function performStoryAction(id) {
    const st = drama.state;
    if (id === "start-round2") {
      drama.action(id);
      /* 用本地标记传递「开始第二轮」：编曲器读档时消费，postMessage 在 iframe 未加载完时会丢 */
      try {
        localStorage.setItem(ROUND2_WANT_KEY, "1");
      } catch (err) {
        /* 存储不可用时标记写不进去，编曲器端也有「第一轮已完成→自动进第二轮」的自愈 */
      }
      openApp("music");
      showToast("在编曲器里完成第二轮，四段都要提交");
    } else if (id === "send-fix") {
      storyLockFixBase(st);
      const base = Number(st.flags.fixDrumBase) || 0;
      const drums = storyDrumCount(storyFixRange());
      if (drums <= base) {
        showToast("先把第四段的鼓改密一点，再发给他");
        return;
      }
      drama.action(id);
      renderApp();
      updateStoryLayer();
      beep(1040, 0.06, "sine", 0.035);
      return;
    } else {
      drama.action(id);
    }
    renderApp();
    updateStoryLayer();
  }

  function updateStoryLayer() {
    if (!drama) return;
    const st = drama.state;
    if (!st.name) {
      storyLayer.classList.add("is-open");
      storyLayer.innerHTML = '<div class="story-modal"><div class="story-modal-card name-card">' +
        "<h2>欢迎来到模拟手机</h2>" +
        "<p>先告诉我你的名字。之后聊天时，大家会用这个名字称呼你。</p>" +
        '<input id="storyName" maxlength="10" placeholder="输入你的名字" autocomplete="off" />' +
        '<button class="kkt-btn" type="button" data-name-ok>进入手机</button>' +
        "</div></div>";
      return;
    }
    storyLayer.classList.add("is-open");
    if (st.modal) {
      storyLayer.innerHTML = '<div class="story-modal"><div class="story-modal-card">' +
        "<p>" + escapeHTML(st.modal) + "</p>" +
        '<button class="kkt-btn" type="button" data-modal-ok>知道了</button>' +
        "</div></div>";
      return;
    }
    const pend = st.pending;
    if (pend && pend.kind === "action" && screenEl.dataset.state === "unlocked") {
      if (pend.id === "send-fix") storyLockFixBase(st);
      storyLayer.innerHTML = '<div class="story-task">' +
        '<span class="story-task-text">' + escapeHTML(pend.hint) + "</span>" +
        '<button class="kkt-btn" type="button" data-story-act="' + pend.id + '">' +
        escapeHTML(pend.label) + "</button></div>";
      return;
    }
    storyLayer.classList.remove("is-open");
    storyLayer.innerHTML = "";
  }

  storyLayer.addEventListener("click", function (event) {
    const igChoice = event.target.closest("[data-ig-choice]");
    if (igChoice) {
      drama.answer(Number(igChoice.dataset.igChoice));
      refreshStoryViewer();
      return;
    }
    if (event.target.closest("[data-close-viewer]")) {
      storyViewerIndex = -1;
      storyLayer.classList.remove("is-open");
      storyLayer.innerHTML = "";
      updateStoryLayer();
      return;
    }
    const nameOk = event.target.closest("[data-name-ok]");
    if (nameOk) {
      const input = storyLayer.querySelector("#storyName");
      const value = input ? input.value.trim() : "";
      if (!value) {
        showToast("先输入名字");
        return;
      }
      drama.setName(value);
      drama.step();
      updateStoryLayer();
      renderApp();
      showToast("你好，" + value);
      return;
    }
    const modalOk = event.target.closest("[data-modal-ok]");
    if (modalOk) {
      drama.state.modal = null;
      drama.save();
      updateStoryLayer();
      return;
    }
    const actBtn = event.target.closest("[data-story-act]");
    if (actBtn) {
      performStoryAction(actBtn.dataset.storyAct);
    }
  });

  /* ================= 来自编曲器（iframe）的故事消息 ================= */
  /* ================= 通知横幅（模仿 iOS 横幅） ================= */
  const phoneBanner = document.createElement("div");
  phoneBanner.className = "phone-banner";
  phoneBanner.hidden = true;
  screenEl.appendChild(phoneBanner);

  const bannerQueue = [];
  let bannerBusy = false;
  let bannerTimer = 0;

  function bannersBlocked() {
    return screenEl.dataset.state === "locked" || screenEl.dataset.state === "passcode";
  }

  function showBanner(item) {
    if (!item) return;
    bannerQueue.push(item);
    if (!bannerBusy && !bannersBlocked()) nextBanner();
  }

  /* 解锁后把锁屏期间积攒的通知放出来 */
  function flushBanners() {
    if (!bannerBusy && bannerQueue.length) nextBanner();
  }

  /* 剧情新任务：用通知横幅提醒玩家该做什么，点击回到桌面去点任务卡 */
  function showTaskBanner(pending) {
    const isStory = pending.id.indexOf("post-story") === 0;
    showBanner({
      app: isStory ? "instagram" : "music",
      label: "新任务",
      title: isStory ? "Instagram" : "Logic",
      text: pending.label + (pending.hint ? "：" + pending.hint : ""),
      home: true
    });
  }

  function nextBanner() {
    const item = bannerQueue.shift();
    if (!item) {
      bannerBusy = false;
      phoneBanner.hidden = true;
      return;
    }
    bannerBusy = true;
    const cast = item.who && drama && drama.cast[item.who];
    const icon = item.app === "instagram"
      ? '<span class="pb-icon icon-ig">' + ICONS.instagram + "</span>"
      : item.app === "wechat"
        ? '<span class="pb-icon icon-wechat">' + ICONS.wechat + "</span>"
        : item.app === "music"
          ? '<span class="pb-icon icon-music">' + ICONS.music + "</span>"
          : '<span class="pb-icon icon-kakao">' + ICONS.kakao + "</span>";
    let head = cast ? cast.name : (item.label || item.title);
    if (item.app === "instagram" && item.who && item.who !== "me") head = igAuthor(item.who).name;
    phoneBanner.innerHTML = icon +
      '<span class="pb-main"><b>' + head + "</b>" +
      '<span class="pb-app">' + item.title + "</span>" +
      "<span class=\"pb-text\">" + escapeHTML(item.text || "") + "</span></span>" +
      '<span class="pb-time">现在</span>';
    phoneBanner.dataset.app = item.app || "";
    phoneBanner.dataset.thread = item.thread || "";
    phoneBanner.dataset.home = item.home ? "1" : "";
    phoneBanner.dataset.story = item.storyId || "";
    phoneBanner.hidden = false;
    window.clearTimeout(bannerTimer);
    bannerTimer = window.setTimeout(function () {
      phoneBanner.classList.add("is-out");
      window.setTimeout(function () {
        phoneBanner.classList.remove("is-out");
        nextBanner();
      }, 260);
    }, 3600);
  }

  phoneBanner.addEventListener("click", function () {
    const appId = phoneBanner.dataset.app;
    const thread = phoneBanner.dataset.thread;
    if (!appId) return;
    bannerQueue.length = 0;
    bannerBusy = false;
    phoneBanner.hidden = true;
    window.clearTimeout(bannerTimer);
    if (phoneBanner.dataset.home) {
      closeApps();
      return;
    }
    if (appId === "instagram" && phoneBanner.dataset.story && drama) {
      openApp("instagram");
      const stories = drama.state.feed.filter(function (p) { return p.story; });
      for (let i = 0; i < stories.length; i += 1) {
        if (stories[i].id === phoneBanner.dataset.story) {
          openStoryViewer(i);
          break;
        }
      }
      return;
    }
    openApp(appId);
    if (thread && (appId === "kakao" || (appId === "wechat" && thread === "ys"))) {
      state.chat = { app: appId, key: thread };
      if (drama) drama.setOpen(thread);
      renderApp();
    }
  });

  /* 允书在微信，其余人在 Kakao */
  function dramaThreadApp(thread) {
    return thread === "ys" ? "wechat" : "kakao";
  }

  function dramaThreadOpen(thread) {
    return Boolean(state.chat && state.chat.key === thread && state.chat.app === dramaThreadApp(thread));
  }

  function dramaChatSync() {
    if (state.app === "kakao") return syncKktChat();
    if (state.app === "wechat") return syncWxChat();
    return false;
  }

  /* 剧情变化 → 更新界面 / 弹横幅 */
  function onDramaChange(kind, info) {
    if (kind === "msg") {
      const appOpen = dramaThreadOpen(info.thread);
      if (appOpen && !dramaChatSync()) renderApp();
      if (!appOpen && !state.chat && (state.app === "wechat" || state.app === "kakao")) renderApp();
      if (info.who !== "me" && !appOpen) {
        const appId = dramaThreadApp(info.thread);
        showBanner({
          app: appId,
          thread: info.thread,
          who: info.thread,
          title: appId === "wechat" ? "微信" : "KakaoTalk",
          text: info.text
        });
      }
      return;
    }
    if (kind === "wait-open") {
      const chatOpen = dramaThreadOpen(info.thread);
      if (!chatOpen) {
        const appId = dramaThreadApp(info.thread);
        showBanner({
          app: appId,
          thread: info.thread,
          who: info.thread,
          title: appId === "wechat" ? "微信" : "KakaoTalk",
          text: info.text || "发来一条新消息"
        });
      }
      /* 聊天列表页也要同步刷新，否则要等退出重进才看到新消息 */
      if (!state.chat && (state.app === "kakao" || state.app === "wechat")) renderApp();
      updateStoryLayer();
      return;
    }
    if (kind === "post") {
      if (state.app === "instagram") renderApp();
      if (info.who !== "me") {
        showBanner({
          app: "instagram",
          who: info.who,
          title: "Instagram",
          text: info.story ? "发布了新快拍：" + info.caption : info.caption
        });
      }
      return;
    }
    if (kind === "comment") {
      if (storyViewerIndex >= 0) refreshStoryViewer();
      else if (state.app === "instagram") renderApp();
      return;
    }
    if (kind === "ask" || kind === "act" || kind === "modal" || kind === "end") {
      if (kind === "act") {
        const p = drama.state.pending;
        if (p && p.kind === "action") showTaskBanner(p);
      }
      if (kind === "ask" && info.thread === "ig") {
        refreshStoryViewer();
        const last = drama.state.feed[0] || {};
        showBanner({
          app: "instagram",
          label: "新评论",
          title: "Instagram",
          text: "有人评论了你的快拍，点开看看并回复",
          storyId: last.story ? last.id : ""
        });
        updateStoryLayer();
        return;
      }
      if ((state.app === "kakao" || state.app === "wechat") && !dramaChatSync()) renderApp();
      updateStoryLayer();
      return;
    }
    if (kind === "request") {
      if (state.app === "kakao") renderApp();
      showBanner({ app: "kakao", thread: "ts", who: info.from, title: "KakaoTalk", text: info.text });
      updateStoryLayer();
    }
  }

  function onLogicMessage(event) {
    const d = event.data;
    if (!d || d.source !== "logic-story") return;
    if (d.type === "song-sent") {
      if (drama && drama.state.pending && drama.state.pending.id === "send-song") {
        drama.action("send-song");
        renderApp();
        updateStoryLayer();
      }
      return;
    }
    if (d.type === "story-event") {
      if (d.event === "section-done" && Number(d.section) === 1 && Number(d.round || 1) === 1) {
        drama.event("section1", { bass: d.bass, drums: d.drums });
      }
      if (d.event === "round-done") {
        drama.event(Number(d.round) === 2 ? "round2done" : "round1", {
          bass: d.bass,
          drums: d.drums,
          melody: d.melody
        });
      }
      if (state.app !== "music") renderApp();
      updateStoryLayer();
    }
  }

  window.addEventListener("message", onLogicMessage);

  if (window.Drama) {
    drama.onChange(onDramaChange);
    drama.step();
    updateStoryLayer();
  }
})();
