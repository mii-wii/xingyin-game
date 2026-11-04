/* Logic · 主逻辑 */
(function () {
  "use strict";

  const ROOTS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

  const SCALES = {
    majorPent: { label: "大调五声", intervals: [0, 2, 4, 7, 9] },
    minorPent: { label: "小调五声", intervals: [0, 3, 5, 7, 10] },
    major: { label: "自然大调", intervals: [0, 2, 4, 5, 7, 9, 11] },
    minor: { label: "自然小调", intervals: [0, 2, 3, 5, 7, 8, 10] },
    blues: { label: "蓝调", intervals: [0, 2, 3, 5, 6, 7, 10] }
  };

  const DRUM_ROWS = [
    { label: "开镲", type: "openhat", midi: 46 },
    { label: "闭镲", type: "hat", midi: 42 },
    { label: "军鼓", type: "snare", midi: 38 },
    { label: "踢鼓", type: "kick", midi: 36 }
  ];

  const TRACKS = [
    { id: "melody", name: "旋律", sub: "12 音", color: "#bf5af2", rows: 12 },
    { id: "bass", name: "低音", sub: "6 音", color: "#64d2ff", rows: 6 },
    { id: "drums", name: "鼓组", sub: "4 层", color: "#ff9f0a", rows: 4 }
  ];

  const MELODY_INSTRUMENTS = [
    { label: "键盘 / 电子", options: [["piano", "钢琴"], ["bell", "铃音"], ["pulse", "电子脉冲"]] },
    { label: "拨弦", options: [["guitar", "木吉他"], ["eguitar", "电吉他"], ["harp", "竖琴"]] },
    { label: "弓弦", options: [["violin", "小提琴"], ["viola", "中提琴"], ["cello", "大提琴"], ["erhu", "二胡"]] },
    { label: "吹奏", options: [["suona", "唢呐"], ["flute", "长笛"]] }
  ];

  const BASS_INSTRUMENTS = [
    ["bass", "合成贝斯"],
    ["ebass", "电贝斯"],
    ["upright", "低音提琴"],
    ["cello", "大提琴"]
  ];

  const MELODY_TYPES = MELODY_INSTRUMENTS.reduce(function (types, group) {
    return types.concat(group.options.map(function (item) { return item[0]; }));
  }, []);

  const BASS_TYPES = BASS_INSTRUMENTS.map(function (item) { return item[0]; });

  const STEPS = 32;
  const LIB_SECTION_STEPS = 8;
  const SAVE_KEY = "xingyin.work.v1";
  const ROUND_KEY = "xingyin.round.v1";

  const state = {
    root: 0,
    scale: "majorPent",
    bpm: 96,
    instrument: "piano",
    bassInstrument: "bass",
    playing: false,
    step: -1,
    muted: { melody: false, bass: false, drums: false },
    grid: { melody: new Set(), bass: new Set(), drums: new Set() },
    comboBySection: [null, null, null, null]
  };

  /* 段落闭环运行状态：只记录当前段、已完成段与播放/连续失败次数 */
  const roundState = {
    active: false,
    finished: false,
    round: 1,
    section: 0,
    passed: [false, false, false, false],
    notes: [],
    fails: 0,
    playing: false,
    timer: null,
    tick: null,
    kktTimer: null,
    advanceTimer: null,
    saveTimer: null
  };

  const tracksEl = document.getElementById("tracks");
  const cardPanelEl = document.getElementById("cardPanel");
  const playBtn = document.getElementById("playBtn");
  const playIcon = document.getElementById("playIcon");
  const playText = document.getElementById("playText");
  const bpmInput = document.getElementById("bpm");
  const bpmVal = document.getElementById("bpmVal");
  const rootSelect = document.getElementById("rootSelect");
  const scaleSelect = document.getElementById("scaleSelect");
  const noteLegend = document.getElementById("noteLegend");
  const statusText = document.getElementById("statusText");
  const presetList = document.getElementById("presetList");
  const toastEl = document.getElementById("toast");

  /* ---------- 工具函数 ---------- */
  function buildScale(rootOffset, intervals, count, base) {
    const notes = [];
    for (let i = 0; i < count; i += 1) {
      const octave = Math.floor(i / intervals.length);
      notes.push(base + rootOffset + intervals[i % intervals.length] + octave * 12);
    }
    return notes;
  }

  function noteName(midi) {
    const pitch = ROOTS[((midi % 12) + 12) % 12];
    const octave = Math.floor(midi / 12) - 1;
    return pitch + octave;
  }

  function trackMidis(trackId) {
    if (trackId === "bass") {
      return buildScale(state.root, SCALES[state.scale].intervals, 6, 36);
    }
    return buildScale(state.root, SCALES[state.scale].intervals, 12, 60);
  }

  function midiForRow(trackId, displayRow) {
    if (trackId === "drums") {
      return DRUM_ROWS[displayRow].midi;
    }
    const notes = trackMidis(trackId);
    return notes[notes.length - 1 - displayRow];
  }

  function isRootRow(trackId, displayRow) {
    if (trackId === "drums") return false;
    return ((midiForRow(trackId, displayRow) % 12) + 12) % 12 === state.root % 12;
  }

  function trackRowCount(trackId) {
    const track = TRACKS.find(function (item) { return item.id === trackId; });
    return track ? track.rows : 0;
  }

  function cellKey(row, step) {
    return row + "-" + step;
  }

  function totalNotes() {
    return state.grid.melody.size + state.grid.bass.size + state.grid.drums.size;
  }

  function activeTracks() {
    return TRACKS.filter(function (track) {
      return state.grid[track.id].size > 0;
    }).length;
  }

  function showToast(message, duration) {
    toastEl.textContent = message;
    toastEl.classList.add("is-show");
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(function () {
      toastEl.classList.remove("is-show");
    }, duration || 2600);
  }

  /* iOS 静音模式会静音合成音，首次进入时提示一次 */
  function hintIosSilentMode() {
    const ua = navigator.userAgent;
    const isIos = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    if (!isIos) return;
    setTimeout(function () {
      showToast("没声音？请关闭 iOS 静音模式（控制中心铃铛）", 5000);
    }, 1500);
  }

  /* ---------- 渲染 ---------- */
  function renderRootOptions() {
    rootSelect.innerHTML = ROOTS.map(function (name, index) {
      return '<option value="' + index + '"' + (index === state.root ? " selected" : "") + ">" + name + "</option>";
    }).join("");
  }

  function renderLegend() {
    const intervals = SCALES[state.scale].intervals;
    noteLegend.innerHTML = intervals.map(function (interval, index) {
      const name = ROOTS[(state.root + interval) % 12];
      return '<span class="legend-note' + (index === 0 ? " is-root" : "") + '">' + name + "</span>";
    }).join("") + '<span class="legend-note">…</span>';
  }

  function buildInstrumentSelect(track) {
    const isMelody = track.id === "melody";
    if (!isMelody && track.id !== "bass") return "";
    const allowed = roundAllowedInstruments(isMelody ? "melody" : "bass");
    let groups = isMelody
      ? MELODY_INSTRUMENTS
      : [{ label: "低音音色", options: BASS_INSTRUMENTS }];
    if (allowed) {
      groups = groups.map(function (group) {
        return {
          label: group.label,
          options: group.options.filter(function (item) { return allowed.indexOf(item[0]) >= 0; })
        };
      }).filter(function (group) { return group.options.length > 0; });
    }
    if (!groups.length) return "";
    const current = isMelody ? state.instrument : state.bassInstrument;
    const options = groups.map(function (group) {
      return '<optgroup label="' + group.label + '">' + group.options.map(function (item) {
        return '<option value="' + item[0] + '"' + (current === item[0] ? " selected" : "") + ">" + item[1] + "</option>";
      }).join("") + "</optgroup>";
    }).join("");
    return '<select class="inst-select" data-instrument="' + track.id + '" aria-label="' + track.name + '音色">' +
      options + "</select>";
  }

  function buildTrackHeader(track) {
    const isMuted = state.muted[track.id];
    const instrumentSelect = buildInstrumentSelect(track);

    return '<div class="track-head">' +
      '<span class="track-dot"></span>' +
      '<span class="track-name">' + track.name + "</span>" +
      '<span class="track-sub">' + track.sub + "</span>" +
      '<div class="track-actions">' + instrumentSelect +
      '<button class="mute-btn' + (isMuted ? " is-muted" : "") + '" data-mute="' + track.id + '" type="button" aria-label="静音' + track.name + '">' + (isMuted ? "✕" : "♪") + "</button>" +
      "</div></div>";
  }

  function buildGrid(track) {
    const lockRange = activeLockRange();
    let html = '<div class="step-head"></div>';
    for (let step = 0; step < STEPS; step += 1) {
      const beat = step % 4 === 0;
      const current = state.step === step;
      const stepLocked = lockRange ? (step < lockRange.start || step >= lockRange.end) : false;
      const task = roundState.active ? !stepLocked : (Boolean(libState.restoreSongId) && step >= STEPS - LIB_SECTION_STEPS);
      html += '<div class="step-head' + (beat ? " is-beat" : "") + (current ? " is-current" : "") +
        (task ? " is-task" : "") +
        (stepLocked ? " is-ref" : "") +
        '" data-step="' + step + '">' + (step + 1) + "</div>";
    }

    for (let row = 0; row < track.rows; row += 1) {
      let label = "";
      let labelClass = "row-label";
      if (track.id === "drums") {
        label = DRUM_ROWS[row].label;
        labelClass += " is-drum";
      } else {
        const midi = midiForRow(track.id, row);
        label = noteName(midi);
        if (isRootRow(track.id, row)) labelClass += " is-root";
      }

      html += '<div class="' + labelClass + '">' + label + "</div>";

      for (let step = 0; step < STEPS; step += 1) {
        const key = cellKey(row, step);
        const on = state.grid[track.id].has(key);
        const stepLocked = lockRange ? (step < lockRange.start || step >= lockRange.end) : false;
        const classes = ["cell"];
        if (step % 4 === 0) classes.push("is-beat");
        if (on) classes.push("is-on");
        if (state.step === step) classes.push("is-current");
        const refCls = stepLocked ? " is-ref" : "";
        const ghostCls = (track.id === "melody" && !roundState.active && libState.storySection != null &&
          !stepLocked && libState.storyGhost && libState.storyGhost.has(key) && !on) ? " is-ghost" : "";
        html += '<button class="' + classes.join(" ") + refCls + ghostCls + '" type="button" data-track="' + track.id +
          '" data-row="' + row + '" data-step="' + step + '" data-key="' + key +
          '" aria-label="' + track.name + " 第 " + (step + 1) + " 步，第 " + (row + 1) + ' 行"></button>';
      }
    }

    return '<div class="roll-wrap"><div class="grid">' + html + "</div></div>";
  }

  function renderTracks() {
    tracksEl.innerHTML = TRACKS.map(function (track) {
      return '<section class="track-card" style="--track:' + track.color + '">' +
        buildTrackHeader(track) + buildGrid(track) +
        "</section>";
    }).join("");
    renderLegend();
    updateStatus();
  }

  function applyPlayhead(step) {
    tracksEl.querySelectorAll(".cell.is-current, .step-head.is-current").forEach(function (node) {
      node.classList.remove("is-current");
    });
    if (step < 0) return;
    tracksEl.querySelectorAll('[data-step="' + step + '"]').forEach(function (node) {
      node.classList.add("is-current");
    });
  }

  /* ---------- 音符绘制 ---------- */
  let painting = false;
  let paintValue = true;
  let activePointer = null;
  let lastPaintKey = "";
  let lastPaintAt = 0;

  function cellInActiveRange(cell) {
    const range = activeLockRange();
    if (!range) return true;
    const step = Number(cell.dataset.step);
    return step >= range.start && step < range.end;
  }

  function previewCell(trackId, row, step) {
    if (state.muted[trackId]) return;
    const midi = midiForRow(trackId, row);
    const combo = Number.isInteger(step) ? state.comboBySection[Math.floor(step / LIB_SECTION_STEPS)] : null;
    if (trackId === "drums") {
      Synth.play(DRUM_ROWS[row].type, midi, Synth.now() + 0.01, 0.1, 0.8);
    } else if (trackId === "bass") {
      Synth.play(combo && combo.bass ? combo.bass : state.bassInstrument, midi, Synth.now() + 0.01, 0.3, 0.8);
    } else {
      Synth.play(combo && combo.melody ? combo.melody : state.instrument, midi, Synth.now() + 0.01, 0.3, 0.9);
    }
  }

  function applyCell(cell, on, withPreview) {
    const trackId = cell.dataset.track;
    const row = Number(cell.dataset.row);
    const step = Number(cell.dataset.step);
    const key = cell.dataset.key;
    const wasOn = state.grid[trackId].has(key);

    if (on) {
      state.grid[trackId].add(key);
    } else {
      state.grid[trackId].delete(key);
    }
    cell.classList.toggle("is-on", on);
    if (on) cell.classList.remove("is-ghost");
    cell.classList.remove("is-wrong");
    lastPaintKey = key;
    lastPaintAt = Date.now();

    if (!wasOn && on && withPreview) {
      Synth.init();
      previewCell(trackId, row, step);
    }
    if (roundState.active) roundQueueSave();
    updateStatus();
  }

  function handlePointerDown(event) {
    const cell = event.target.closest(".cell");
    if (!cell) return;
    if (!cellInActiveRange(cell)) return;
    event.preventDefault();
    Synth.init();

    painting = true;
    activePointer = event.pointerId;
    const isErase = event.button === 2 || event.ctrlKey || event.metaKey;
    paintValue = isErase ? false : !state.grid[cell.dataset.track].has(cell.dataset.key);
    applyCell(cell, paintValue, true);
  }

  function handlePointerMove(event) {
    if (!painting || event.pointerId !== activePointer) return;
    const target = document.elementFromPoint(event.clientX, event.clientY);
    const cell = target && target.closest(".cell");
    if (!cell) return;
    if (cell.dataset.track && state.grid[cell.dataset.track].has(cell.dataset.key) === paintValue) return;
    applyCell(cell, paintValue, true);
  }

  function endPainting() {
    painting = false;
    activePointer = null;
  }

  tracksEl.addEventListener("pointerdown", handlePointerDown);
  window.addEventListener("pointermove", handlePointerMove);
  window.addEventListener("pointerup", endPainting);
  window.addEventListener("pointercancel", endPainting);
  window.addEventListener("blur", endPainting);
  tracksEl.addEventListener("contextmenu", function (event) {
    event.preventDefault();
  });

  /* 兼容只发 click 的环境：pointerdown 刚处理过同一格时不再重复切换 */
  tracksEl.addEventListener("click", function (event) {
    const cell = event.target.closest(".cell");
    if (!cell) return;
    if (Date.now() - lastPaintAt < 500 && lastPaintKey === cell.dataset.key) return;
    if (!cellInActiveRange(cell)) return;
    Synth.init();
    const trackId = cell.dataset.track;
    applyCell(cell, !state.grid[trackId].has(cell.dataset.key), true);
  });

  tracksEl.addEventListener("scroll", function (event) {
    const wrap = event.target;
    if (!wrap.classList || !wrap.classList.contains("roll-wrap")) return;
    tracksEl.querySelectorAll(".roll-wrap").forEach(function (other) {
      if (other !== wrap && Math.abs(other.scrollLeft - wrap.scrollLeft) > 1) {
        other.scrollLeft = wrap.scrollLeft;
      }
    });
  }, true);

  /* ---------- 头部按钮 ---------- */
  tracksEl.addEventListener("change", function (event) {
    const select = event.target.closest("[data-instrument]");
    if (!select) return;
    const trackId = select.dataset.instrument;
    if (trackId === "bass") {
      state.bassInstrument = select.value;
    } else {
      state.instrument = select.value;
    }
    showToast((trackId === "bass" ? "低音" : "旋律") + "音色切换为「" + select.options[select.selectedIndex].text + "」");
    Synth.init();
    previewCell(trackId, trackId === "bass" ? 2 : 5);
    updateStatus();
  });

  tracksEl.addEventListener("click", function (event) {
    const muteBtn = event.target.closest("[data-mute]");
    if (!muteBtn) return;
    const trackId = muteBtn.dataset.mute;
    state.muted[trackId] = !state.muted[trackId];
    muteBtn.classList.toggle("is-muted", state.muted[trackId]);
    muteBtn.textContent = state.muted[trackId] ? "✕" : "♪";
    showToast((state.muted[trackId] ? "已静音：" : "已恢复：") + TRACKS.find(function (t) { return t.id === trackId; }).name);
  });

  /* ---------- 播放 ---------- */
  let schedulerId = null;
  let nextStepTime = 0;
  let scheduleStep = 0;
  let visualQueue = [];
  let rafId = null;

  function stepDuration() {
    return 60 / state.bpm / 2;
  }

  function triggerStep(step, when) {
    const duration = stepDuration();
    const combo = state.comboBySection[Math.floor(step / LIB_SECTION_STEPS)] || null;
    const melodyType = combo && combo.melody ? combo.melody : state.instrument;
    const bassType = combo && combo.bass ? combo.bass : state.bassInstrument;
    TRACKS.forEach(function (track) {
      if (state.muted[track.id]) return;
      for (let row = 0; row < track.rows; row += 1) {
        if (!state.grid[track.id].has(cellKey(row, step))) continue;
        const midi = midiForRow(track.id, row);
        if (track.id === "drums") {
          Synth.play(DRUM_ROWS[row].type, midi, when, 0.1, 1);
        } else if (track.id === "bass") {
          Synth.play(bassType, midi, when, duration, 1);
        } else {
          Synth.play(melodyType, midi, when, Math.max(duration * 1.1, 0.26), 1);
        }
      }
    });
  }

  function pump() {
    const horizon = Synth.now() + 0.14;
    while (nextStepTime < horizon) {
      triggerStep(scheduleStep, nextStepTime);
      visualQueue.push({ step: scheduleStep, time: nextStepTime });
      nextStepTime += stepDuration();
      scheduleStep = (scheduleStep + 1) % STEPS;
    }
  }

  function visualTick() {
    if (!state.playing) return;
    const time = Synth.now();
    let changed = false;
    while (visualQueue.length && visualQueue[0].time <= time) {
      state.step = visualQueue.shift().step;
      changed = true;
    }
    if (changed) applyPlayhead(state.step);
    rafId = requestAnimationFrame(visualTick);
  }

  function updatePlayButton() {
    playBtn.classList.toggle("is-playing", state.playing);
    playIcon.textContent = state.playing ? "❚❚" : "▶";
    playText.textContent = state.playing ? "暂停" : "播放";
    playBtn.setAttribute("aria-label", state.playing ? "暂停" : "播放");
  }

  function startPlayback() {
    if (totalNotes() === 0) {
      showToast("先点亮一些音符，再开始演奏吧");
      return;
    }
    Synth.init();
    state.playing = true;
    state.step = -1;
    scheduleStep = 0;
    visualQueue = [];
    nextStepTime = Synth.now() + 0.08;
    pump();
    schedulerId = setInterval(pump, 25);
    rafId = requestAnimationFrame(visualTick);
    updatePlayButton();
    updateStatus();
  }

  function stopPlayback() {
    state.playing = false;
    if (schedulerId) {
      clearInterval(schedulerId);
      schedulerId = null;
    }
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    Synth.stopAll();
    visualQueue = [];
    state.step = -1;
    applyPlayhead(-1);
    updatePlayButton();
    updateStatus();
  }

  function togglePlayback() {
    if (state.playing) {
      stopPlayback();
    } else {
      startPlayback();
    }
  }

  /* ---------- 状态与挑战 ---------- */
  function updateStatus() {
    if (roundState.active) {
      const range = roundSectionRange(roundState.section);
      if (range) {
        const count = TRACKS.reduce(function (sum, track) {
          return sum + roundCountTrack(track.id, range);
        }, 0);
        statusText.textContent = "第 " + (roundState.section + 1) + " 段 · 本段 " +
          (range.end - range.start) + " 步 · 已点亮 " + count + " 颗";
        return;
      }
    }
    const count = totalNotes();
    if (count === 0) {
      statusText.textContent = state.playing
        ? "轨道还是空的，先放几颗音符上去吧"
        : "还没有音符，先点亮第一颗小星星吧";
    } else {
      statusText.textContent = count + " 颗音符在轨道上发光" + (state.playing ? " · 正在演奏" : " · 按播放听听看");
    }
  }

  /* ---------- 示例曲 ---------- */
  const PRESETS = [
    {
      id: "twinkle",
      name: "小星星",
      emoji: "⭐",
      desc: "童谣",
      root: 0,
      scale: "major",
      bpm: 92,
      instrument: "piano",
      bassInstrument: "upright",
      melody: { 0: 0, 1: 0, 2: 4, 3: 4, 4: 5, 5: 5, 6: 4, 8: 3, 9: 3, 10: 2, 11: 2, 12: 1, 13: 1, 14: 0 },
      bass: { 0: 0, 8: 3, 12: 4, 14: 0 },
      drums: { 0: 3, 2: 1, 4: 2, 6: 1, 8: 3, 10: 1, 12: 2, 14: 1 }
    },
    {
      id: "rain",
      name: "雨后",
      emoji: "🌧",
      desc: "氛围",
      root: 9,
      scale: "minorPent",
      bpm: 74,
      instrument: "bell",
      bassInstrument: "cello",
      melody: { 0: 3, 2: 5, 4: 7, 6: 9, 8: 6, 10: 4, 12: 2, 14: 4 },
      bass: { 0: 0, 4: 3, 8: 0, 12: 4 },
      drums: { 0: 3, 2: 1, 6: 1, 8: 3, 10: 1, 12: 2, 14: 1 }
    },
    {
      id: "pixel",
      name: "像素冒险",
      emoji: "👾",
      desc: "8-bit",
      root: 0,
      scale: "majorPent",
      bpm: 134,
      instrument: "pulse",
      bassInstrument: "ebass",
      melody: { 0: 0, 1: 2, 2: 4, 4: 5, 5: 7, 6: 9, 8: 11, 9: 9, 10: 5, 12: 4, 13: 2, 14: 0, 15: 2 },
      bass: { 0: 0, 4: 3, 8: 0, 12: 4 },
      drums: { 0: 3, 2: 1, 4: 2, 6: 1, 8: 3, 10: 1, 12: 2, 14: 0 }
    }
  ];

  function renderPresetList() {
    presetList.innerHTML = PRESETS.map(function (preset) {
      return '<button class="preset" type="button" data-preset="' + preset.id + '">' +
        '<span class="preset-emoji">' + preset.emoji + "</span>" +
        '<span class="preset-name">' + preset.name + "</span>" +
        '<span class="preset-desc">' + preset.desc + "</span>" +
        "</button>";
    }).join("");
  }

  function fillPresetGrid(trackId, map) {
    const rows = trackRowCount(trackId);
    const range = activeLockRange();
    Object.keys(map).forEach(function (stepKey) {
      const step = Number(stepKey);
      if (step >= STEPS) return;
      if (range && (step < range.start || step >= range.end)) return;
      let row;
      if (trackId === "drums") {
        row = Number(map[stepKey]);
      } else {
        row = rows - 1 - Number(map[stepKey]);
      }
      if (row < 0 || row >= rows) return;
      state.grid[trackId].add(cellKey(row, step));
    });
  }

  function loadPreset(preset) {
    stopPlayback();
    state.root = preset.root;
    state.scale = preset.scale;
    state.bpm = preset.bpm;
    state.instrument = preset.instrument;
    state.bassInstrument = preset.bassInstrument || "bass";
    roundClampInstrument();
    Object.keys(state.grid).forEach(function (trackId) {
      state.grid[trackId].clear();
    });
    fillPresetGrid("melody", preset.melody);
    fillPresetGrid("bass", preset.bass);
    fillPresetGrid("drums", preset.drums);

    rootSelect.value = String(state.root);
    scaleSelect.value = state.scale;
    bpmInput.value = String(state.bpm);
    bpmVal.textContent = String(state.bpm);
    renderTracks();
    showToast("载入了「" + preset.name + "」，按播放听听看");
  }

  presetList.addEventListener("click", function (event) {
    const button = event.target.closest("[data-preset]");
    if (!button) return;
    const preset = PRESETS.find(function (item) { return item.id === button.dataset.preset; });
    if (preset) loadPreset(preset);
  });

  /* ---------- 随机灵感 ---------- */
  function randomInspire() {
    if (totalNotes() > 0) {
      const confirmed = window.confirm("要用一段新灵感替换现在的音符吗？");
      if (!confirmed) return;
    }

    Object.keys(state.grid).forEach(function (trackId) {
      state.grid[trackId].clear();
    });

    const rhythms = [
      [0, 2, 4, 6, 8, 10, 12, 14],
      [0, 1, 3, 5, 6, 8, 9, 11, 13, 14],
      [0, 2, 3, 5, 7, 8, 10, 11, 13, 15],
      [1, 2, 4, 6, 7, 9, 10, 12, 14, 15]
    ];
    const rhythm = rhythms[Math.floor(Math.random() * rhythms.length)];
    const steps = [-2, -1, -1, 0, 1, 1, 2];
    let degree = 5 + Math.floor(Math.random() * 3);

    rhythm.forEach(function (step) {
      degree += steps[Math.floor(Math.random() * steps.length)];
      degree = Math.max(1, Math.min(10, degree));
      state.grid.melody.add(cellKey(11 - degree, step));
    });

    const bassChoices = [
      { 0: 0, 4: 3, 8: 0, 12: 4 },
      { 0: 0, 4: 4, 8: 3, 12: 0 },
      { 0: 0, 6: 3, 8: 0, 12: 4 }
    ];
    const bass = bassChoices[Math.floor(Math.random() * bassChoices.length)];
    fillPresetGrid("bass", bass);

    state.grid.drums.add(cellKey(3, 0));
    state.grid.drums.add(cellKey(3, 8));
    state.grid.drums.add(cellKey(2, 4));
    state.grid.drums.add(cellKey(2, 12));
    [2, 6, 10, 14].forEach(function (step) {
      state.grid.drums.add(cellKey(1, step));
    });
    if (Math.random() > 0.6) state.grid.drums.add(cellKey(0, 14));
    roundPruneGrid();

    state.instrument = MELODY_TYPES[Math.floor(Math.random() * MELODY_TYPES.length)];
    state.bassInstrument = BASS_TYPES[Math.floor(Math.random() * BASS_TYPES.length)];
    roundClampInstrument();
    renderTracks();
    showToast("新灵感已装进轨道，按播放试试");
  }

  /* ---------- 存档 ---------- */
  function stopIfPlaying() {
    if (state.playing) stopPlayback();
  }

  function serializeWork() {
    return {
      version: 1,
      root: state.root,
      scale: state.scale,
      bpm: state.bpm,
      instrument: state.instrument,
      bassInstrument: state.bassInstrument,
      muted: state.muted,
      grid: {
        melody: Array.from(state.grid.melody),
        bass: Array.from(state.grid.bass),
        drums: Array.from(state.grid.drums)
      }
    };
  }

  function saveWork() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(serializeWork()));
      showToast("作品已保存到这台设备");
    } catch (err) {
      showToast("保存失败，浏览器可能禁用了本地存储");
    }
  }

  function setFromArray(trackId, values) {
    const rows = trackRowCount(trackId);
    const next = new Set();
    (values || []).forEach(function (key) {
      const match = /^(\d+)-(\d+)$/.exec(String(key));
      if (!match) return;
      const row = Number(match[1]);
      const step = Number(match[2]);
      if (row >= 0 && row < rows && step >= 0 && step < STEPS) next.add(key);
    });
    state.grid[trackId] = next;
  }

  function loadWork() {
    let saved = null;
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) {
        showToast("还没有存档，先保存一次吧");
        return;
      }
      saved = JSON.parse(raw);
    } catch (err) {
      showToast("存档读取失败");
      return;
    }

    stopIfPlaying();
    const savedRoot = Number(saved.root);
    state.root = Number.isInteger(savedRoot) && savedRoot >= 0 && savedRoot < 12 ? savedRoot : 0;
    state.scale = SCALES[saved.scale] ? saved.scale : "majorPent";
    state.bpm = Math.min(160, Math.max(60, Number(saved.bpm) || 96));
    state.instrument = MELODY_TYPES.indexOf(saved.instrument) >= 0 ? saved.instrument : "piano";
    state.bassInstrument = BASS_TYPES.indexOf(saved.bassInstrument) >= 0 ? saved.bassInstrument : "bass";
    if (saved.muted) {
      TRACKS.forEach(function (track) {
        state.muted[track.id] = Boolean(saved.muted[track.id]);
      });
    }

    setFromArray("melody", saved.grid && saved.grid.melody);
    setFromArray("bass", saved.grid && saved.grid.bass);
    setFromArray("drums", saved.grid && saved.grid.drums);

    rootSelect.value = String(state.root);
    scaleSelect.value = state.scale;
    bpmInput.value = String(state.bpm);
    bpmVal.textContent = String(state.bpm);
    renderTracks();
    showToast("存档已回到作曲台");
  }

  function clearWork() {
    if (totalNotes() === 0) {
      showToast("作曲台已经是空的了");
      return;
    }
    if (!window.confirm("确定清空所有音符吗？")) return;
    stopIfPlaying();
    Object.keys(state.grid).forEach(function (trackId) {
      state.grid[trackId].clear();
    });
    renderTracks();
    showToast("画布已清空，重新开始吧");
  }

  /* ---------- MIDI 导出 ---------- */
  function toVLQ(value) {
    let number = Math.max(0, Math.floor(value));
    const bytes = [number & 0x7f];
    number = Math.floor(number / 128);
    while (number > 0) {
      bytes.unshift((number & 0x7f) | 0x80);
      number = Math.floor(number / 128);
    }
    return bytes;
  }

  function buildMidiFile() {
    const PPQ = 480;
    const STEP_TICK = 240;
    const NOTE_TICK = 205;
    const tempo = Math.round(60000000 / state.bpm);
    const events = [];

    events.push({
      tick: 0,
      order: 0,
      bytes: [0xff, 0x51, 0x03, (tempo >> 16) & 0xff, (tempo >> 8) & 0xff, tempo & 0xff]
    });

    function addNote(midi, step, channel) {
      const start = step * STEP_TICK;
      events.push({ tick: start, order: 2, bytes: [0x90 | channel, midi & 0x7f, 100] });
      events.push({ tick: start + NOTE_TICK, order: 1, bytes: [0x80 | channel, midi & 0x7f, 42] });
    }

    ["melody", "bass"].forEach(function (trackId) {
      const rows = trackRowCount(trackId);
      for (let row = 0; row < rows; row += 1) {
        for (let step = 0; step < STEPS; step += 1) {
          if (state.grid[trackId].has(cellKey(row, step))) {
            addNote(midiForRow(trackId, row), step, 0);
          }
        }
      }
    });

    for (let row = 0; row < DRUM_ROWS.length; row += 1) {
      for (let step = 0; step < STEPS; step += 1) {
        if (state.grid.drums.has(cellKey(row, step))) {
          addNote(DRUM_ROWS[row].midi, step, 9);
        }
      }
    }

    events.sort(function (a, b) {
      return a.tick - b.tick || a.order - b.order;
    });

    const trackData = [];
    let lastTick = 0;
    events.forEach(function (event) {
      toVLQ(event.tick - lastTick).forEach(function (byte) { trackData.push(byte); });
      event.bytes.forEach(function (byte) { trackData.push(byte); });
      lastTick = event.tick;
    });
    [0, 0xff, 0x2f, 0x00].forEach(function (byte) { trackData.push(byte); });

    const header = [0x4d, 0x54, 0x68, 0x64, 0, 0, 0, 6, 0, 0, 0, 1, 0x01, 0xe0];
    const length = trackData.length;
    const trackHeader = [
      0x4d, 0x54, 0x72, 0x6b,
      (length >> 24) & 0xff, (length >> 16) & 0xff, (length >> 8) & 0xff, length & 0xff
    ];

    return new Uint8Array(header.concat(trackHeader, trackData));
  }

  function downloadMidi() {
    if (totalNotes() === 0) {
      showToast("先点亮一些音符再导出 MIDI");
      return;
    }
    const bytes = buildMidiFile();
    const blob = new Blob([bytes], { type: "audio/midi" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "xingyin-melody.mid";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
    showToast("MIDI 已导出，可以放进音乐软件继续编辑");
  }

  /* ---------- 音乐库 ---------- */
  const LIB_KEY = "xingyin.library.v1";
  const SONG_DATA = window.SONG_DATA || {};
  const LIB_DATA_VERSION = String(SONG_DATA.version || 1);
  const LIBRARY = Array.isArray(SONG_DATA.songs) ? SONG_DATA.songs : [];
  const LIB_PATTERNS = Array.isArray(SONG_DATA.patterns) ? SONG_DATA.patterns : [];

  /* 时间轴：intro 是他留下的残稿，arrange 是玩家能编曲的区间（默认 8s 之后） */
  function libIntro(song) {
    const cfg = (song && song.intro) || SONG_DATA.intro || {};
    const start = Math.max(0, Number(cfg.start) || 0);
    const end = Number(cfg.end) > start ? Number(cfg.end) : start + 8;
    return { start: start, end: end };
  }

  function libArrange(song) {
    const cfg = (song && song.arrange) || SONG_DATA.arrange || {};
    const intro = libIntro(song);
    const start = Number(cfg.start) > 0 ? Number(cfg.start) : intro.end;
    const end = Number(cfg.end) > start ? Number(cfg.end) : start + 8;
    return { start: start, end: end };
  }

  /* 第 idx 段的试听窗口；歌曲可用 sectionStarts 单独指定每段起点 */
  function libSectionWindow(song, idx) {
    const arrange = libArrange(song);
    const index = Math.max(0, Math.min(3, idx));
    const custom = song && Array.isArray(song.sectionStarts) ? song.sectionStarts : [];
    if (custom.length >= 4) {
      const start = Number(custom[index]);
      const end = index < 3 ? Number(custom[index + 1]) : arrange.end;
      if (start >= 0 && end > start) return { start: start, end: end };
    }
    const span = (arrange.end - arrange.start) / 4;
    return {
      start: arrange.start + index * span,
      end: arrange.start + (index + 1) * span
    };
  }

  function libRangeText(start, end) {
    return libTime(start) + "–" + libTime(end);
  }

  function libArrangeLabel(song) {
    const arrange = libArrange(song);
    return libRangeText(arrange.start, arrange.end) + " · 四段待补";
  }

  const LIB_COMBOS = [
    [
      {
        id: "c0", name: "钢琴 · 低音提琴", melody: "piano", bass: "upright",
        desc: "钢琴颗粒清晰，低音提琴圆润地垫在下面"
      },
      {
        id: "c1", name: "铃音 · 合成贝斯", melody: "bell", bass: "bass",
        desc: "铃音带金属光泽，合成贝斯更冷更紧"
      },
      {
        id: "c2", name: "木吉他 · 大提琴", melody: "guitar", bass: "cello",
        desc: "木吉他是木质拨弦，大提琴低音厚一点"
      }
    ],
    [
      {
        id: "c0", name: "铃音 · 低音提琴", melody: "bell", bass: "upright",
        desc: "铃音的点，配低音提琴的圆"
      },
      {
        id: "c1", name: "电吉他 · 电贝斯", melody: "eguitar", bass: "ebass",
        desc: "失真电吉他与电贝斯，整段更硬"
      },
      {
        id: "c2", name: "钢琴 · 合成贝斯", melody: "piano", bass: "bass",
        desc: "干净的钢琴，合成贝斯带一点电子味"
      }
    ],
    [
      {
        id: "c0", name: "电子脉冲 · 合成贝斯", melody: "pulse", bass: "bass",
        desc: "电子脉冲的短促音头，合成贝斯跟着走"
      },
      {
        id: "c1", name: "小提琴 · 低音提琴", melody: "violin", bass: "upright",
        desc: "弓弦的连贯线条，低音提琴托底"
      },
      {
        id: "c2", name: "竖琴 · 大提琴", melody: "harp", bass: "cello",
        desc: "竖琴的泛音很轻，大提琴把重量压下来"
      }
    ]
  ];

  const libState = {
    view: "studio",
    songId: null,
    restoreSongId: null,
    storySection: null,
    storyCards: null,
    storyCardDone: null,
    storyGhost: null,
    wrongCount: 0,
    _fullPlaying: false,
    _fullTimer: null,
    _fullLoop: 0,
    _fullMax: 0
  };

  const appRoot = document.querySelector(".app");
  const studioViewEl = document.getElementById("studioView");
  const libraryViewEl = document.getElementById("libraryView");
  const libraryHeadEl = document.querySelector(".library-head");
  const libraryListEl = document.getElementById("libraryList");
  const songSheetEl = document.getElementById("songSheet");
  const libAudioEl = document.getElementById("libAudio");
  const remixBarEl = document.getElementById("remixBar");
  const remixTitleEl = document.getElementById("remixTitle");
  const remixRangeEl = document.getElementById("remixRange");
  const notesTabEl = document.getElementById("notesTab");
  const notesDrawerEl = document.getElementById("notesDrawer");
  const notesScrimEl = document.getElementById("notesScrim");
  const notesHistoryEl = document.getElementById("notesHistory");
  const notesCountEl = document.getElementById("notesCount");
  const noteInputEl = document.getElementById("noteInput");
  const noteAddEl = document.getElementById("noteAdd");
  const notesCloseEl = document.getElementById("notesClose");
  const lrMetaEl = document.getElementById("lrMeta");

  function libQueryAll(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  function libFind(id) {
    return LIBRARY.find(function (song) { return song.id === id; }) || null;
  }

  function libEsc(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function libTime(seconds) {
    const total = Math.max(0, Math.floor(seconds || 0));
    const m = Math.floor(total / 60);
    const s = total % 60;
    return m + ":" + (s < 10 ? "0" : "") + s;
  }

  function libAll() {
    let all = {};
    try {
      all = JSON.parse(localStorage.getItem(LIB_KEY)) || {};
    } catch (err) {
      all = {};
    }
    if (!all || typeof all !== "object") all = {};
    /* 换曲（数据版本变化）时清掉旧存档，避免时间轴/段落对不上 */
    if (all.__version !== LIB_DATA_VERSION) {
      all = { __version: LIB_DATA_VERSION };
      try {
        localStorage.setItem(LIB_KEY, JSON.stringify(all));
      } catch (err) {
        /* 忽略存储错误 */
      }
    }
    return all;
  }

  function libSections(value) {
    const raw = Array.isArray(value) ? value : [];
    return [0, 1, 2, 3].map(function (index) {
      return typeof raw[index] === "string" && raw[index] ? raw[index] : null;
    });
  }

  function libGet(id) {
    const all = libAll();
    const entry = all[id] || {};
    const s = entry.story || {};
    return {
      memo: typeof entry.memo === "string" ? entry.memo : "",
      sections: libSections(entry.sections),
      versions: Array.isArray(entry.versions) ? entry.versions : [],
      story: {
        unlocked: typeof s.unlocked === "number" ? s.unlocked : 1,
        passed: Array.isArray(s.passed) && s.passed.length === 4 ? s.passed : [false, false, false, false],
        wrong: Array.isArray(s.wrong) && s.wrong.length === 4 ? s.wrong : [0, 0, 0, 0],
        forms: Array.isArray(s.forms) && s.forms.length === 4 ? s.forms : ["cards", "cards", "cards", "cards"]
      }
    };
  }

  function libSet(id, entry) {
    const all = libAll();
    all[id] = entry;
    try {
      localStorage.setItem(LIB_KEY, JSON.stringify(all));
    } catch (err) {
      /* 忽略存储错误 */
    }
  }

  function libCombosFor(song) {
    return LIB_COMBOS[song.pattern % LIB_COMBOS.length] || LIB_COMBOS[0];
  }

  function libComboById(song, id) {
    if (!id) return null;
    return libCombosFor(song).find(function (combo) { return combo.id === id; }) || null;
  }

  function libComboState(song, sections) {
    const list = libSections(sections);
    return list.map(function (id) { return libComboById(song, id); });
  }

  function libSetView(view) {
    libState.view = view;
    if (view === "library") libState.restoreSongId = null;
    appRoot.dataset.view = view;
    studioViewEl.hidden = view !== "studio";
    libraryViewEl.hidden = view !== "library";
    libQueryAll(".view-tab").forEach(function (tab) {
      tab.classList.toggle("is-active", tab.dataset.view === view);
    });

    const restoring = (Boolean(libState.restoreSongId) || roundState.active) && view === "studio";
    remixBarEl.hidden = !restoring;
    tracksEl.hidden = false;
    if (cardPanelEl) cardPanelEl.hidden = true;
    if (restoring) {
      appRoot.dataset.remix = "on";
      const restoringSong = libFind(libState.restoreSongId);
      if (restoringSong) remixRangeEl.textContent = libArrangeLabel(restoringSong);
    } else {
      delete appRoot.dataset.remix;
      state.comboBySection = [null, null, null, null];
    }

    if (view === "library") {
      lrMetaEl.textContent = "音乐库 · " + LIBRARY.length + " 段原音";
      if (state.playing) stopPlayback();
      renderLibraryList();
      if (libState.songId) {
        libraryListEl.hidden = true;
        renderSongSheet();
      } else {
        libraryListEl.hidden = false;
        libraryHeadEl.hidden = false;
        songSheetEl.hidden = true;
      }
    } else {
      lrMetaEl.textContent = roundState.active
        ? "故事模式 · 第 " + (roundState.section + 1) + " 段"
        : (restoring ? "还原模式 · 原音不受影响" : "32 步音序器 · 4/4 · 循环");
      if (!libAudioEl.paused) libAudioEl.pause();
    }
  }

  function renderLibraryList() {
    libraryListEl.innerHTML = LIBRARY.map(function (song) {
      return '<button class="song-row" type="button" data-song="' + song.id + '">' +
        '<span class="song-cover is-system"><span class="sys-glyph">♫</span></span>' +
        '<span class="song-main">' +
        '<b>' + libEsc(song.title) + "</b>" +
        "<small>" + libEsc(song.subtitle) + "</small>" +
        "</span>" +
        '<span class="song-chev">›</span>' +
        "</button>";
    }).join("");
  }

  function libAudioSet(song) {
    if (libAudioEl.dataset.song === song.id && libAudioEl.getAttribute("src")) return;
    libAudioEl.pause();
    libAudioEl.dataset.song = song.id;
    libAudioEl.src = song.file;
    libAudioEl.load();
  }

  function openSong(id, autoplay) {
    const song = libFind(id);
    if (!song) return;
    libState.songId = id;
    libraryHeadEl.hidden = true;
    libraryListEl.hidden = true;
    songSheetEl.hidden = false;
    libAudioSet(song);
    renderSongSheet();
    window.scrollTo(0, 0);
    if (autoplay !== false) libStartFragment();
  }

  function libStartFragment() {
    const song = libFind(libState.songId);
    if (!song) return;
    if (state.playing) stopPlayback();
    const intro = libIntro(song);
    try {
      libAudioEl.currentTime = intro.start;
    } catch (err) {
      /* 元数据尚未就绪时忽略 */
    }
    const promise = libAudioEl.play();
    if (promise && promise.catch) {
      promise.catch(function () {
        libSyncPlayer();
      });
    }
    libSyncPlayer();
  }

  function closeSong() {
    libState.songId = null;
    songSheetEl.hidden = true;
    libraryHeadEl.hidden = false;
    libraryListEl.hidden = false;
    if (!libAudioEl.paused) libAudioEl.pause();
    renderLibraryList();
  }

  function libSectionCards(song, entry) {
    const combos = libCombosFor(song);
    const s = entry.story;
    const tol = (window.STORY_CONTENT && window.STORY_CONTENT.defaultTolerance) || { failThreshold: 3 };
    const content = (window.STORY_CONTENT && window.STORY_CONTENT.songs[song.id] && window.STORY_CONTENT.songs[song.id].sections) || [];
    return [0, 1, 2, 3].map(function (index) {
      const chosen = entry.sections[index];
      const unlocked = index < s.unlocked;
      const passed = s.passed[index];
      const wrong = s.wrong[index] || 0;
      const form = s.forms[index] || "cards";
      const sectionContent = content[index] || {};
      const showPh = form === "cards" ? wrong > 0 : wrong > tol.failThreshold;
      const placeholder = showPh ? (sectionContent.placeholderNote || "") : "";
      const buttons = combos.map(function (combo) {
        const on = chosen === combo.id;
        return '<button class="combo-btn' + (on ? " is-on" : "") + (unlocked ? "" : " is-locked") + '" type="button" data-section="' +
          index + '" data-combo="' + combo.id + '" aria-pressed="' + on + '"' + (unlocked ? "" : " disabled") + '>' +
          '<span class="combo-name">' + libEsc(combo.name) +
          '<span class="combo-try">▶ 预听</span></span>' +
          '<span class="combo-desc">' + libEsc(combo.desc) + "</span>" +
          "</button>";
      }).join("");
      const formToggle = '<div class="form-toggle">' +
        '<button class="form-opt' + (form === "cards" ? " is-on" : "") + '" type="button" data-form-toggle="' + index + '" data-form="cards">简单 · 选卡片</button>' +
        '<button class="form-opt' + (form === "sequencer" ? " is-on" : "") + '" type="button" data-form-toggle="' + index + '" data-form="sequencer">进阶 · 编曲</button>' +
        "</div>";
      const body = (form === "sequencer")
        ? '<div class="combo-list">' + buttons + "</div>"
        : '<p class="form-hint">进入后从 3 段旋律里选 1 段（选对即过，选错出备注）</p>';
      const enterBtn = passed
        ? '<button class="restore-enter is-done" type="button" disabled>第 ' + (index + 1) + " 段已完成</button>"
        : (unlocked
          ? '<button class="restore-enter" type="button" data-story-enter="' + index + '">进入第 ' + (index + 1) + " 段</button>"
          : '<button class="restore-enter is-locked" type="button" disabled>完成上一段后解锁</button>');
      const win = libSectionWindow(song, index);
      return '<div class="section-card' + (passed ? " is-done" : "") + (unlocked ? "" : " is-locked") + '">' +
        '<div class="section-head">' +
        '<span class="section-no">第 ' + (index + 1) + " 段</span>" +
        '<span class="section-steps">原曲 ' + libRangeText(win.start, win.end) + " · 共 " +
        LIB_SECTION_STEPS + " 步</span>" +
        "</div>" +
        formToggle +
        body +
        (placeholder ? '<p class="section-ph">' + libEsc(placeholder) + "</p>" : "") +
        enterBtn +
        "</div>";
    }).join("");
  }

  function libVersionList(entry) {
    if (!entry.versions.length) {
      return '<p class="empty-line">还没有私密版本。把 4 段配器选满，在编曲台按「存私密版本」留一版。</p>';
    }
    return '<div class="version-list">' + entry.versions.map(function (version, index) {
      const work = version.work || {};
      const grid = work.grid || {};
      const total = (grid.melody || []).length + (grid.bass || []).length + (grid.drums || []).length;
      return '<div class="version-row">' +
        "<div><b>" + libEsc(version.name || "私密版本") + "</b>" +
        "<span>" + libEsc(version.date || "") + " · " + total + " 颗音符</span></div>" +
        '<button type="button" data-version-load="' + index + '">载入</button>' +
        '<button class="danger" type="button" data-version-del="' + index + '">删除</button>' +
        "</div>";
    }).join("") + "</div>";
  }

  function renderSongSheet() {
    const song = libFind(libState.songId);
    if (!song) return;
    const entry = libGet(song.id);
    const playing = !libAudioEl.paused;
    const icon = playing ? "❚❚" : "▶";
    const intro = libIntro(song);
    const pos = Math.min(intro.end, Math.max(intro.start, libAudioEl.currentTime || 0));
    const progress = Math.round(((pos - intro.start) / (intro.end - intro.start)) * 1000);
    const done = entry.story.passed.filter(Boolean).length;

    songSheetEl.innerHTML =
      '<div class="sheet-top">' +
      '<button class="sheet-back" type="button" data-sheet-back>‹ 音乐库</button>' +
      '<span class="sheet-chip">原音未改</span>' +
      "</div>" +
      '<div class="song-hero">' +
      '<div class="hero-cover is-system">' +
      '<span class="sys-glyph">♫</span>' +
      '<button class="hero-play' + (playing ? " is-playing" : "") +
      '" type="button" data-lib-play aria-label="播放">' + icon + "</button>" +
      "</div>" +
      '<div class="hero-meta">' +
      "<h2>" + libEsc(song.title) + "</h2>" +
      '<p class="hero-sub">' + libEsc(song.subtitle) + "</p>" +
      '<p class="hero-src">' + libEsc(song.source) + "</p>" +
      "</div></div>" +
      '<div class="player-card">' +
      '<button class="player-toggle' + (playing ? " is-playing" : "") +
      '" type="button" data-lib-play aria-label="播放片段">' + icon + "</button>" +
      '<div class="player-body">' +
      '<input class="player-seek" id="libSeek" type="range" min="0" max="1000" step="1" value="' + progress + '" aria-label="片段进度" />' +
      '<div class="player-times"><span id="libCur">' + libTime(pos) + "</span>" +
      '<span class="fragment-tag">残稿 ' + libRangeText(intro.start, intro.end) + "</span></div>" +
      "</div>" +
      '<span class="player-chip">原音</span>' +
      "</div>" +
      '<section class="restore">' +
      '<div class="restore-head"><h3>故事模式 · 还原他的编曲</h3>' +
      '<span class="restore-count">已完成 ' + done + "/4 段</span></div>" +
      '<p class="restore-intro">前 ' + libRangeText(intro.start, intro.end) + ' 是他留下的残稿；' +
      libRangeText(libArrange(song).start, libArrange(song).end) + ' 按四段推进：每段先选乐器，再补上他当时错过的那段旋律，差不多就算过。完成一段才会解锁下一段。</p>' +
      libSectionCards(song, entry) +
      '<button class="restore-enter" type="button" data-restore-enter>继续 / 进入下一段</button>' +
      "</section>" +
      (done === 4 ? '<div class="restore-done">' +
        '<p>四段已全部还原 ✦ 听听这一大段吧</p>' +
        '<button class="full-play" type="button" data-lib-full>▶ 循环听还原段（3 遍）</button>' +
        "</div>" : "") +
      '<section class="sheet-memo">' +
      '<div class="sheet-memo-head"><h3>备注</h3><span>自动保存</span></div>' +
      '<textarea id="sheetMemo" rows="3" placeholder="想记下的东西：速度 / 段落 / 下次要改的地方">' +
      libEsc(entry.memo) + "</textarea>" +
      "</section>" +
      '<h3 class="version-head">私密版本</h3>' +
      libVersionList(entry);
  }

  function libSyncPlayer() {
    if (libState.view !== "library" || !libState.songId) return;
    const song = libFind(libState.songId);
    if (!song || songSheetEl.hidden) return;
    const playing = !libAudioEl.paused;
    const icon = playing ? "❚❚" : "▶";
    libQueryAll("[data-lib-play]", songSheetEl).forEach(function (btn) {
      btn.textContent = icon;
      btn.classList.toggle("is-playing", playing);
    });
    const intro = libIntro(song);
    const pos = Math.min(intro.end, Math.max(intro.start, libAudioEl.currentTime || 0));
    const seek = songSheetEl.querySelector("#libSeek");
    if (seek) seek.value = String(Math.round(((pos - intro.start) / (intro.end - intro.start)) * 1000));
    const cur = songSheetEl.querySelector("#libCur");
    if (cur) cur.textContent = libTime(pos);
  }

  function libTogglePlay() {
    libState._fullPlaying = false;
    window.clearTimeout(libState._fullTimer);
    const song = libFind(libState.songId);
    if (!song) return;
    libAudioSet(song);
    const intro = libIntro(song);
    if (libAudioEl.paused) {
      if (state.playing) stopPlayback();
      if (libAudioEl.currentTime >= intro.end - 0.1 || libAudioEl.currentTime < intro.start) {
        try {
          libAudioEl.currentTime = intro.start;
        } catch (err) {
          /* 忽略 */
        }
      }
      const promise = libAudioEl.play();
      if (promise && promise.catch) promise.catch(function () {});
    } else {
      libAudioEl.pause();
    }
    libSyncPlayer();
  }

  function libPreviewCombo(song, combo, section) {
    Synth.init();
    Synth.stopAll();
    const melodyNotes = buildScale(song.root, SCALES[song.scale].intervals, 12, 60);
    const bassNotes = buildScale(song.root, SCALES[song.scale].intervals, 6, 36);
    const pattern = LIB_PATTERNS[song.pattern % LIB_PATTERNS.length];
    const start = Synth.now() + 0.06;
    const gap = 0.42;
    for (let local = 0; local < LIB_SECTION_STEPS; local += 1) {
      const step = section * LIB_SECTION_STEPS + local;
      const source = step % 16;
      const when = start + local * gap;
      const degree = pattern.melody[source];
      if (typeof degree === "number") {
        Synth.play(combo.melody, melodyNotes[Math.min(11, Math.max(0, degree))], when, gap * 0.95, 1);
      }
      const bassDegree = pattern.bass[source];
      if (typeof bassDegree === "number") {
        Synth.play(combo.bass, bassNotes[Math.min(5, Math.max(0, Number(bassDegree)))], when, gap * 0.85, 1);
      }
      const drumRow = pattern.drums[source];
      if (typeof drumRow === "number" && DRUM_ROWS[drumRow]) {
        Synth.play(DRUM_ROWS[drumRow].type, DRUM_ROWS[drumRow].midi, when, 0.1, 1);
      }
    }
  }

  function libRestoreBase(song) {
    maybeStopStudio();
    state.root = song.root;
    state.scale = song.scale;
    state.bpm = song.bpm;
    state.instrument = song.instrument;
    state.bassInstrument = song.bass;
    TRACKS.forEach(function (track) {
      state.muted[track.id] = false;
    });
    Object.keys(state.grid).forEach(function (trackId) {
      state.grid[trackId].clear();
    });

    const pattern = LIB_PATTERNS[song.pattern % LIB_PATTERNS.length];
    const givenSteps = STEPS - LIB_SECTION_STEPS;
    for (let step = 0; step < givenSteps; step += 1) {
      const degree = pattern.melody[step % 16];
      if (typeof degree === "number") {
        state.grid.melody.add(cellKey(11 - degree, step));
      }
    }
  }

  function libApplySections(song, sections) {
    state.comboBySection = libComboState(song, sections);
    const pattern = LIB_PATTERNS[song.pattern % LIB_PATTERNS.length];
    for (let step = 0; step < STEPS; step += 1) {
      const source = step % 16;
      const drumRow = pattern.drums[source];
      if (typeof drumRow === "number") {
        state.grid.drums.add(cellKey(drumRow, step));
      }
      const bassDegree = pattern.bass[source];
      if (typeof bassDegree === "number") {
        state.grid.bass.add(cellKey(5 - bassDegree, step));
      }
    }
  }

  function libTargetMelody(song) {
    const pattern = LIB_PATTERNS[song.pattern % LIB_PATTERNS.length];
    const target = new Set();
    for (let step = 0; step < STEPS; step += 1) {
      const degree = pattern.melody[step % 16];
      if (typeof degree === "number") {
        target.add(cellKey(11 - degree, step));
      }
    }
    return target;
  }

  function libClearWrongMarks() {
    tracksEl.querySelectorAll(".cell.is-wrong, .step-head.is-wrong").forEach(function (node) {
      node.classList.remove("is-wrong");
    });
  }

  function libMarkWrong(target) {
    let marked = 0;
    tracksEl.querySelectorAll('.cell[data-track="melody"]').forEach(function (cell) {
      const wrong = state.grid.melody.has(cell.dataset.key) && !target.has(cell.dataset.key);
      cell.classList.toggle("is-wrong", wrong);
      if (wrong) marked += 1;
    });

    for (let step = 0; step < STEPS; step += 1) {
      let mismatch = false;
      for (let row = 0; row < 12; row += 1) {
        const key = cellKey(row, step);
        if (target.has(key) !== state.grid.melody.has(key)) {
          mismatch = true;
          break;
        }
      }
      if (!mismatch) continue;
      tracksEl.querySelectorAll('.step-head[data-step="' + step + '"]').forEach(function (head) {
        head.classList.add("is-wrong");
      });
    }

    return marked;
  }

  function libCheckArrangement() {
    const song = libFind(libState.restoreSongId);
    if (!song) {
      showToast("先进入一首歌的还原台，再检查编曲");
      return;
    }
    const target = libTargetMelody(song);
    let extra = 0;
    let missing = 0;
    state.grid.melody.forEach(function (key) {
      if (!target.has(key)) extra += 1;
    });
    target.forEach(function (key) {
      if (!state.grid.melody.has(key)) missing += 1;
    });

    if (extra === 0 && missing === 0) {
      libState.wrongCount = 0;
      libClearWrongMarks();
      showToast("全对！32 步旋律和原曲完全一致，可以存私密版本了");
      return;
    }

    libState.wrongCount += 1;
    if (libState.wrongCount > 3) {
      libMarkWrong(target);
      showToast("第 " + libState.wrongCount + " 次不对。红色格子和红色步位有问题，还漏着 " + missing + " 颗音");
    } else {
      libClearWrongMarks();
      showToast("还不对：多弹了 " + extra + " 颗，漏了 " + missing + " 颗（第 " + libState.wrongCount + " 次）");
    }
  }

  function libLoadWork(song, work, sections) {
    maybeStopStudio();
    const savedRoot = Number(work.root);
    state.root = Number.isInteger(savedRoot) && savedRoot >= 0 && savedRoot < 12 ? savedRoot : song.root;
    state.scale = SCALES[work.scale] ? work.scale : song.scale;
    state.bpm = Math.min(160, Math.max(60, Number(work.bpm) || song.bpm));
    state.instrument = MELODY_TYPES.indexOf(work.instrument) >= 0 ? work.instrument : song.instrument;
    state.bassInstrument = BASS_TYPES.indexOf(work.bassInstrument) >= 0 ? work.bassInstrument : song.bass;
    TRACKS.forEach(function (track) {
      state.muted[track.id] = false;
    });
    setFromArray("melody", work.grid && work.grid.melody);
    setFromArray("bass", work.grid && work.grid.bass);
    setFromArray("drums", work.grid && work.grid.drums);
    state.comboBySection = libComboState(song, sections);
  }

  function maybeStopStudio() {
    if (state.playing) stopPlayback();
    if (!libAudioEl.paused) libAudioEl.pause();
  }

  function libSyncControls() {
    rootSelect.value = String(state.root);
    scaleSelect.value = state.scale;
    bpmInput.value = String(state.bpm);
    bpmVal.textContent = String(state.bpm);
  }

  function libScrollGridToEnd() {
    tracksEl.querySelectorAll(".roll-wrap").forEach(function (wrap) {
      wrap.scrollLeft = wrap.scrollWidth;
    });
  }

  /* ================= 故事模式 ================= */
  function storyNotify(type, payload) {
    if (window.self !== window.top && window.parent) {
      window.parent.postMessage(Object.assign({ source: "logic-story", type: type }, payload), "*");
    } else {
      showToast((payload && payload.text) || "收到新消息");
    }
  }

  /* 给手机的剧情事件：段落完成、整轮完成、状态查询 */
  function storyEvent(name, payload) {
    storyNotify("story-event", Object.assign({ event: name }, payload || {}));
  }

  function trackCount(id) {
    const cells = state.grid[id];
    return cells ? cells.size : 0;
  }

  function showStoryHint(text) {
    const el = document.getElementById("remixHint");
    if (!el) return;
    el.textContent = text || "";
    el.hidden = !text;
  }

  function libScrollGridToSection(idx) {
    const ref = tracksEl.querySelector('.cell[data-step="0"]');
    if (!ref) return;
    const w = ref.getBoundingClientRect().width || 26;
    const firstStep = roundState.active
      ? (roundSectionRange(roundState.section) || { start: 0 }).start
      : idx * LIB_SECTION_STEPS;
    const x = firstStep * (w + 6);
    tracksEl.querySelectorAll(".roll-wrap").forEach(function (wrap) {
      wrap.scrollLeft = x;
    });
  }

  /* ================= 段落闭环 ================= */
  function roundConfig() {
    return (window.STORY_CONTENT && window.STORY_CONTENT.round) || null;
  }

  function roundSectionCount() {
    const cfg = roundConfig();
    return cfg && Array.isArray(cfg.sections) ? cfg.sections.length : 0;
  }

  function roundSectionConfig(index) {
    const cfg = roundConfig();
    if (!cfg || !Array.isArray(cfg.sections)) return null;
    return cfg.sections[index] || null;
  }

  function roundSectionSteps(section) {
    const cfg = roundConfig();
    const fallback = Math.max(1, Number(cfg && cfg.sectionSteps) || LIB_SECTION_STEPS);
    const steps = Number(section && section.steps);
    return Math.max(1, Math.min(STEPS, Number.isFinite(steps) && steps > 0 ? steps : fallback));
  }

  function roundSectionRange(index) {
    const cfg = roundConfig();
    if (!cfg || !Array.isArray(cfg.sections) || !cfg.sections[index]) return null;
    let start = 0;
    for (let i = 0; i < index; i += 1) {
      start += roundSectionSteps(cfg.sections[i]);
    }
    if (start >= STEPS) return { start: STEPS - 1, end: STEPS };
    return { start: start, end: Math.min(STEPS, start + roundSectionSteps(cfg.sections[index])) };
  }

  /* 当前允许点亮的步位范围：段落模式 = 本段；旧还原模式 = 该段 */
  function activeLockRange() {
    if (roundState.active) {
      const range = roundSectionRange(roundState.section);
      if (range) return range;
    }
    if (libState.storySection != null) {
      const start = libState.storySection * LIB_SECTION_STEPS;
      return { start: start, end: start + LIB_SECTION_STEPS };
    }
    return null;
  }

  function roundAllowedInstruments(kind) {
    if (!roundState.active) return null;
    const section = roundSectionConfig(roundState.section);
    const list = section && section.instruments && section.instruments[kind];
    return Array.isArray(list) && list.length ? list : null;
  }

  function roundClampInstrument() {
    const melody = roundAllowedInstruments("melody");
    if (melody && melody.indexOf(state.instrument) < 0) state.instrument = melody[0];
    const bass = roundAllowedInstruments("bass");
    if (bass && bass.indexOf(state.bassInstrument) < 0) state.bassInstrument = bass[0];
  }

  function roundTrackMinimum(section, trackId) {
    if (!section) return 1;
    const judge = section.judge || {};
    const perTrack = judge.minNotesPerTrack || {};
    if (typeof perTrack[trackId] === "number") return Math.max(0, perTrack[trackId]);
    const track = section.tracks && section.tracks[trackId];
    if (track && typeof track.minNotes === "number") return Math.max(0, track.minNotes);
    return 1;
  }

  function roundAnchorList(section) {
    const judge = (section && section.judge) || {};
    const list = judge.anchors && judge.anchors.length ? judge.anchors : ((section && section.anchors) || []);
    return Array.isArray(list) ? list : [];
  }

  function roundCountTrack(trackId, range) {
    const cells = state.grid[trackId];
    let count = 0;
    for (let step = range.start; step < range.end; step += 1) {
      for (let row = 0; row < trackRowCount(trackId); row += 1) {
        if (cells.has(cellKey(row, step))) count += 1;
      }
    }
    return count;
  }

  /* 灵感/预设只允许落在本段，避免提前填好后面的段落 */
  function roundPruneGrid() {
    const range = activeLockRange();
    if (!range || !roundState.active) return;
    TRACKS.forEach(function (track) {
      const cells = state.grid[track.id];
      cells.forEach(function (key) {
        const step = Number(String(key).split("-")[1]);
        if (step < range.start || step >= range.end) cells.delete(key);
      });
    });
  }

  function roundJudge() {
    const section = roundSectionConfig(roundState.section);
    const range = roundSectionRange(roundState.section);
    const result = { pass: false, short: [], anchors: 0, range: range };
    if (!section || !range) return result;

    TRACKS.forEach(function (track) {
      const need = roundTrackMinimum(section, track.id);
      const count = roundCountTrack(track.id, range);
      if (count < need) result.short.push({ name: track.name, need: need - count });
    });

    roundAnchorList(section).forEach(function (anchor) {
      if (!anchor) return;
      const track = TRACKS.find(function (item) { return item.id === anchor.track; });
      if (!track) return;
      const row = Number(anchor.row);
      const local = Number(anchor.step);
      if (!Number.isInteger(row) || !Number.isInteger(local)) return;
      if (row < 0 || row >= track.rows) return;
      const step = range.start + local;
      if (step < range.start || step >= range.end) return;
      if (!state.grid[track.id].has(cellKey(row, step))) result.anchors += 1;
    });

    result.pass = result.short.length === 0 && result.anchors === 0;
    return result;
  }

  function roundMissingText(result) {
    if (result.short.length) {
      return "还差：" + result.short.map(function (item) {
        return item.name + " " + item.need + " 颗";
      }).join(" · ");
    }
    if (result.anchors) return "还有 " + result.anchors + " 个指定步位没点亮";
    return "本段还不完整";
  }

  function roundBarCheck() {
    return remixBarEl.querySelector(".remix-check");
  }

  function roundBarSkip() {
    return remixBarEl.querySelector(".remix-skip");
  }

  function roundUpdateBar() {
    const total = roundSectionCount();
    const section = roundSectionConfig(roundState.section);
    const range = roundSectionRange(roundState.section);
    if (!section || !range || total === 0) return;
    const passed = Boolean(roundState.passed[roundState.section]);
    remixTitleEl.textContent = roundState.finished
      ? "四段已完成"
      : (roundState.round === 2 ? "第二轮 · 第 " : "第 ") + (roundState.section + 1) + " 段 / 共 " + total + " 段";
    remixRangeEl.textContent = roundState.finished
      ? "闭环占位 · 后续段落待填"
      : "本段 " + (range.end - range.start) + " 步 · " + (passed ? "已完成" : "自由完成度");
    const check = roundBarCheck();
    if (check) {
      check.hidden = roundState.finished;
      check.disabled = passed || roundState.finished;
      check.textContent = passed ? "已完成" : "交给他听";
    }
    const skip = roundBarSkip();
    if (skip) {
      const allow = Boolean(section.judge && section.judge.allowSkip);
      skip.hidden = !allow || passed || roundState.finished;
    }
  }

  function roundShowReaction(reaction) {
    const bar = document.getElementById("reactionBar");
    const fromEl = document.getElementById("reactionFrom");
    const textEl = document.getElementById("reactionText");
    if (!bar || !textEl) return;
    const text = reaction && typeof reaction.text === "string" ? reaction.text : "";
    if (!text) {
      bar.hidden = true;
      textEl.textContent = "";
      if (fromEl) {
        fromEl.textContent = "";
        fromEl.hidden = true;
      }
      return;
    }
    textEl.textContent = text;
    if (fromEl) {
      fromEl.textContent = reaction.from || "";
      fromEl.hidden = !reaction.from;
    }
    bar.hidden = false;
  }

  function roundShowKkt(kkt) {
    const wrap = document.getElementById("kktChips");
    if (!wrap) return;
    if (roundState.kktTimer) {
      window.clearTimeout(roundState.kktTimer);
      roundState.kktTimer = null;
    }
    if (!kkt) {
      wrap.hidden = true;
      wrap.innerHTML = "";
      return;
    }
    const preview = typeof kkt.preview === "string" && kkt.preview ? kkt.preview : "新消息";
    wrap.innerHTML = '<span class="kkt-chip"><b>KakaoTalk</b><span>' + libEsc(preview) + "</span></span>";
    wrap.hidden = false;
    roundState.kktTimer = window.setTimeout(function () {
      roundState.kktTimer = null;
      wrap.hidden = true;
    }, 6000);
  }

  /* ---------- 编曲备注：按段留档，侧边可翻阅 ---------- */
  function renderRoundNotes() {
    if (!notesHistoryEl) return;
    if (!roundState.notes.length) {
      notesHistoryEl.innerHTML = '<p class="notes-empty">还没有备注，记下第一句吧。</p>';
    } else {
      notesHistoryEl.innerHTML = roundState.notes.map(function (note) {
        const section = Number(note.section);
        const label = Number.isInteger(section) ? "第 " + (section + 1) + " 段" : "备注";
        const who = typeof note.from === "string" && note.from ? note.from : "我";
        return '<article class="note-item">' +
          '<div class="note-meta"><span class="note-sec">' + label + "</span>" +
          '<span class="note-who">' + libEsc(who) + "</span></div>" +
          '<p class="note-text">' + libEsc(note.text) + "</p>" +
          "</article>";
      }).join("");
    }
    if (notesCountEl) notesCountEl.textContent = String(roundState.notes.length);
  }

  function notesScrollToEnd() {
    if (!notesHistoryEl) return;
    notesHistoryEl.scrollTop = notesHistoryEl.scrollHeight;
  }

  function roundAddNote(note) {
    if (!note || !note.text) return;
    roundState.notes.push(note);
    renderRoundNotes();
    if (!notesDrawerEl.hidden) notesScrollToEnd();
    roundQueueSave(true);
  }

  function roundSubmitNote() {
    if (!roundState.active || !noteInputEl) return;
    const text = noteInputEl.value.trim();
    if (!text) {
      noteInputEl.focus();
      return;
    }
    roundAddNote({
      id: "n-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6),
      section: roundState.section,
      from: "",
      text: text,
      at: Date.now()
    });
    noteInputEl.value = "";
  }

  /* 剧情备注：进入某段时把前面各段配置里的 notes 补进历史，避免刷掉过往 */
  function roundSeedNotes(limit) {
    const end = Number.isInteger(limit) ? limit : roundState.section;
    let changed = false;
    for (let index = 0; index <= end; index += 1) {
      const section = roundSectionConfig(index);
      const list = section && Array.isArray(section.notes) ? section.notes : [];
      list.forEach(function (entry, i) {
        if (!entry || typeof entry.text !== "string" || !entry.text) return;
        const id = "seed-" + index + "-" + i;
        const exists = roundState.notes.some(function (note) { return note.id === id; });
        if (exists) return;
        roundState.notes.push({
          id: id,
          section: index,
          from: typeof entry.from === "string" ? entry.from : "",
          text: entry.text,
          at: Date.now()
        });
        changed = true;
      });
    }
    renderRoundNotes();
    if (changed) roundQueueSave(true);
  }

  function roundOpenNotes() {
    if (!roundState.active || !notesDrawerEl) return;
    notesDrawerEl.hidden = false;
    notesScrimEl.hidden = false;
    if (notesTabEl) notesTabEl.hidden = true;
    renderRoundNotes();
    notesScrollToEnd();
  }

  function roundCloseNotes() {
    if (!notesDrawerEl) return;
    notesDrawerEl.hidden = true;
    notesScrimEl.hidden = true;
    if (notesTabEl && roundState.active) notesTabEl.hidden = false;
  }

  function roundStopPreview() {
    if (roundState.timer) {
      window.clearTimeout(roundState.timer);
      roundState.timer = null;
    }
    if (roundState.tick) {
      window.clearInterval(roundState.tick);
      roundState.tick = null;
    }
    roundState.playing = false;
  }

  function roundPlaySection(done) {
    const range = roundSectionRange(roundState.section);
    if (!range) {
      done();
      return;
    }
    Synth.init();
    const gap = stepDuration();
    const start = Synth.now() + 0.06;
    const total = range.end - range.start;
    for (let local = 0; local < total; local += 1) {
      triggerStep(range.start + local, start + local * gap);
    }
    roundState.playing = true;
    let shown = -1;
    roundState.tick = window.setInterval(function () {
      shown += 1;
      if (shown >= total) return;
      applyPlayhead(range.start + shown);
    }, gap * 1000);
    roundState.timer = window.setTimeout(function () {
      roundStopPreview();
      applyPlayhead(-1);
      done();
    }, total * gap * 1000 + 160);
  }

  function roundSaveNow() {
    const cfg = roundConfig();
    if (!cfg || !roundState.active) return;
    try {
      localStorage.setItem(ROUND_KEY, JSON.stringify({
        version: Number(cfg.version) || 1,
        round: roundState.round,
        section: roundState.section,
        passed: roundState.passed,
        finished: roundState.finished,
        root: state.root,
        scale: state.scale,
        bpm: state.bpm,
        instrument: state.instrument,
        bassInstrument: state.bassInstrument,
        notes: roundState.notes,
        grid: {
          melody: Array.from(state.grid.melody),
          bass: Array.from(state.grid.bass),
          drums: Array.from(state.grid.drums)
        }
      }));
    } catch (err) {
      /* 忽略存储错误 */
    }
  }

  function roundQueueSave(immediate) {
    if (!roundState.active) return;
    if (roundState.saveTimer) {
      window.clearTimeout(roundState.saveTimer);
      roundState.saveTimer = null;
    }
    if (immediate) {
      roundSaveNow();
      return;
    }
    roundState.saveTimer = window.setTimeout(function () {
      roundState.saveTimer = null;
      roundSaveNow();
    }, 400);
  }

  function roundReadSaved() {
    const cfg = roundConfig();
    if (!cfg) return null;
    try {
      const raw = localStorage.getItem(ROUND_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (!data || Number(data.version) !== (Number(cfg.version) || 1)) return null;
      return data;
    } catch (err) {
      return null;
    }
  }

  function roundApplyBase(source) {
    const cfg = roundConfig() || {};
    const use = source || cfg;
    const root = Number(use.root);
    state.root = Number.isInteger(root) && root >= 0 && root < 12
      ? root
      : (Number.isInteger(Number(cfg.root)) && Number(cfg.root) >= 0 ? Number(cfg.root) : 0);
    state.scale = SCALES[use.scale] ? use.scale : (SCALES[cfg.scale] ? cfg.scale : "minorPent");
    const bpm = Number(use.bpm);
    state.bpm = Math.min(160, Math.max(60, Number.isFinite(bpm) && bpm > 0 ? bpm : 96));
    state.instrument = MELODY_TYPES.indexOf(use.instrument) >= 0
      ? use.instrument
      : (MELODY_TYPES.indexOf(cfg.instrument) >= 0 ? cfg.instrument : "piano");
    state.bassInstrument = BASS_TYPES.indexOf(use.bassInstrument) >= 0
      ? use.bassInstrument
      : (BASS_TYPES.indexOf(cfg.bassInstrument) >= 0 ? cfg.bassInstrument : "bass");
  }

  function roundEnter(index) {
    const cfg = roundConfig();
    const total = roundSectionCount();
    if (!cfg || total === 0) return;
    const next = Math.max(0, Math.min(total - 1, index));
    if (state.playing) stopPlayback();
    roundStopPreview();
    window.clearTimeout(roundState.advanceTimer);
    roundState.advanceTimer = null;
    roundState.active = true;
    roundState.finished = false;
    roundState.section = next;
    roundState.fails = 0;
    roundClampInstrument();
    roundSeedNotes(next);

    libSetView("studio");
    appRoot.dataset.round = "on";
    remixBarEl.hidden = false;
    if (notesTabEl) notesTabEl.hidden = false;
    const check = roundBarCheck();
    if (check) check.hidden = false;
    const refBtn = remixBarEl.querySelector(".remix-ref");
    if (refBtn) refBtn.hidden = true;
    const saveBtn = remixBarEl.querySelector(".remix-save");
    if (saveBtn) saveBtn.hidden = true;
    const exitBtn = remixBarEl.querySelector(".remix-exit");
    if (exitBtn) exitBtn.hidden = true;

    roundShowReaction(null);
    const section = roundSectionConfig(next);
    showStoryHint((section && section.note) || "");
    libSyncControls();
    renderTracks();
    libScrollGridToSection(next);
    const skip = roundBarSkip();
    if (skip) skip.hidden = true;
    const resetBtn = remixBarEl.querySelector(".remix-reset");
    if (resetBtn) resetBtn.hidden = false;
    roundUpdateBar();
    roundQueueSave(true);
  }

  function roundFail(result) {
    roundState.fails += 1;
    const section = roundSectionConfig(roundState.section);
    const judge = (section && section.judge) || {};
    const threshold = Math.max(1, Number(judge.failThreshold) || 3);
    if (roundState.fails >= threshold && section && section.failNote) {
      showStoryHint(section.failNote);
    } else {
      showStoryHint(roundMissingText(result));
    }
    showToast(roundState.fails >= threshold
      ? "第 " + (roundState.section + 1) + " 段还没完成（第 " + roundState.fails + " 次）"
      : "还差一点，" + roundMissingText(result));
    roundQueueSave();
  }

  function roundPass() {
    const section = roundSectionConfig(roundState.section);
    const index = roundState.section;
    roundState.passed[index] = true;
    roundState.fails = 0;

    roundShowReaction(section && section.reaction);
    roundShowKkt(section && section.kkt);
    const kkt = (section && section.kkt) || {};
    storyNotify("kkt", { thread: kkt.thread || "star", text: kkt.preview || "" });
    storyEvent("section-done", {
      section: index + 1,
      round: roundState.round,
      bass: trackCount("bass"),
      drums: trackCount("drums"),
      melody: trackCount("melody")
    });
    showStoryHint((section && section.onPass) || "");

    remixTitleEl.textContent = "第 " + (index + 1) + " 段完成";
    remixRangeEl.textContent = "他在听 · 准备下一段";
    const check = roundBarCheck();
    if (check) {
      check.disabled = true;
      check.textContent = "已完成";
    }
    const skip = roundBarSkip();
    if (skip) skip.hidden = true;
    roundQueueSave(true);

    const hasNext = index + 1 < roundSectionCount();
    const reaction = (section && section.reaction) || {};
    const delay = reaction.text ? 2100 : 1400;
    roundState.advanceTimer = window.setTimeout(function () {
      roundState.advanceTimer = null;
      if (hasNext) roundEnter(index + 1);
      else roundFinish();
    }, delay);
  }

  function roundSubmit() {
    if (!roundState.active || roundState.playing) return;
    if (roundState.finished || roundState.passed[roundState.section]) return;
    const result = roundJudge();
    if (!result.pass) {
      roundFail(result);
      return;
    }
    showStoryHint("");
    roundPlaySection(roundPass);
  }

  function roundSkip() {
    const section = roundSectionConfig(roundState.section);
    const allow = Boolean(section && section.judge && section.judge.allowSkip);
    if (!allow || roundState.playing || roundState.finished) return;
    const hasNext = roundState.section + 1 < roundSectionCount();
    if (hasNext) roundEnter(roundState.section + 1);
    else roundFinish();
  }

  /* 第二轮：保留已写好的音符，重新走四段判定 */
  function storyStartRound2() {
    if (roundState.playing) return;
    roundState.round = 2;
    roundState.finished = false;
    roundState.passed = [false, false, false, false];
    roundState.fails = 0;
    roundEnter(0);
    showToast("第二轮：在原来的基础上修改");
  }

  window.addEventListener("message", function (event) {
    const d = event.data;
    if (!d || d.source !== "phone-story") return;
    if (d.type === "round2") {
      storyStartRound2();
    } else if (d.type === "query") {
      storyNotify("query-result", {
        id: d.id,
        round: roundState.round,
        finished: roundState.finished,
        bass: trackCount("bass"),
        drums: trackCount("drums"),
        melody: trackCount("melody")
      });
    } else if (d.type === "toast" && d.text) {
      showToast(d.text);
    }
  });

  function roundReset() {
    if (roundState.playing) return;
    if (!window.confirm("重新开始会清空编曲进度和备注，确定吗？")) return;
    roundState.round = 1;
    roundState.passed = [false, false, false, false];
    roundState.finished = false;
    roundState.notes = [];
    setFromArray("melody", []);
    setFromArray("bass", []);
    setFromArray("drums", []);
    roundApplyBase(null);
    roundShowKkt(null);
    renderRoundNotes();
    roundEnter(0);
    showToast("已清空进度，从第 1 段重新开始");
  }

  function roundFinish() {
    roundState.finished = true;
    roundState.passed = roundState.passed.map(function (_, index) {
      return index < roundSectionCount() ? true : false;
    });
    roundStopPreview();
    if (state.playing) stopPlayback();
    applyPlayhead(-1);
    roundState.section = Math.max(0, roundSectionCount() - 1);
    roundUpdateBar();
    const check = roundBarCheck();
    if (check) check.hidden = true;
    const skip = roundBarSkip();
    if (skip) skip.hidden = true;
    roundShowReaction(null);
    showStoryHint("");
    if (notesTabEl) notesTabEl.hidden = false;
    renderRoundNotes();
    renderTracks();
    roundQueueSave(true);
    showToast("四段占位闭环已跑通");
    storyEvent("round-done", {
      round: roundState.round,
      bass: trackCount("bass"),
      drums: trackCount("drums"),
      melody: trackCount("melody")
    });
  }

  function roundBoot() {
    const cfg = roundConfig();
    if (!cfg || !Array.isArray(cfg.sections) || !cfg.sections.length) return;
    roundState.active = true;
    const saved = roundReadSaved();
    if (saved) {
      roundApplyBase(saved);
      roundState.round = Number(saved.round) === 2 ? 2 : 1;
      if (saved.grid) {
        setFromArray("melody", saved.grid.melody);
        setFromArray("bass", saved.grid.bass);
        setFromArray("drums", saved.grid.drums);
      }
      const total = roundSectionCount();
      const passed = [false, false, false, false];
      for (let i = 0; i < Math.min(total, 4); i += 1) {
        passed[i] = Boolean(saved.passed && saved.passed[i]);
      }
      roundState.passed = passed;
      if (Array.isArray(saved.notes)) {
        roundState.notes = saved.notes.filter(function (note) {
          return note && typeof note.text === "string" && note.text;
        });
      } else if (typeof saved.memo === "string" && saved.memo) {
        roundState.notes = [{
          id: "legacy-memo",
          section: Number(saved.section) || 0,
          from: "",
          text: saved.memo,
          at: Date.now()
        }];
      }
      let index = 0;
      while (index < total && passed[index]) index += 1;
      if (index >= total) {
        roundEnter(total - 1);
        roundFinish();
        return;
      }
      roundEnter(index);
      return;
    }

    Object.keys(state.grid).forEach(function (trackId) {
      state.grid[trackId].clear();
    });
    roundApplyBase(null);
    roundEnter(0);
  }

  function libFillFullPattern(song) {
    const pattern = LIB_PATTERNS[song.pattern % LIB_PATTERNS.length];
    Object.keys(state.grid).forEach(function (id) {
      state.grid[id].clear();
    });
    for (let step = 0; step < STEPS; step += 1) {
      const src = step % 16;
      const deg = pattern.melody[src];
      if (typeof deg === "number") state.grid.melody.add(cellKey(11 - deg, step));
      const bd = pattern.bass[src];
      if (typeof bd === "number") state.grid.bass.add(cellKey(5 - bd, step));
      const dr = pattern.drums[src];
      if (typeof dr === "number" && DRUM_ROWS[dr]) state.grid.drums.add(cellKey(dr, step));
    }
  }

  function sectionTargetCells(song, idx) {
    const pattern = LIB_PATTERNS[song.pattern % LIB_PATTERNS.length];
    const set = new Set();
    for (let local = 0; local < LIB_SECTION_STEPS; local += 1) {
      const step = idx * LIB_SECTION_STEPS + local;
      const deg = pattern.melody[step % 16];
      if (typeof deg === "number") set.add(cellKey(11 - deg, step));
    }
    return set;
  }

  function libJudgeSection(song, idx) {
    const target = sectionTargetCells(song, idx);
    let match = 0;
    let missing = 0;
    let extra = 0;
    target.forEach(function (k) {
      if (state.grid.melody.has(k)) match += 1;
      else missing += 1;
    });
    for (let step = idx * LIB_SECTION_STEPS; step < (idx + 1) * LIB_SECTION_STEPS; step += 1) {
      for (let row = 0; row < 12; row += 1) {
        const k = cellKey(row, step);
        if (state.grid.melody.has(k) && !target.has(k)) extra += 1;
      }
    }
    const tol = (window.STORY_CONTENT && window.STORY_CONTENT.defaultTolerance) || { overlap: 0.7, precision: 0.6 };
    const overlap = target.size ? match / target.size : 1;
    const precision = (match + extra) ? match / (match + extra) : 1;
    return {
      pass: overlap >= tol.overlap && precision >= tol.precision,
      missing: missing,
      extra: extra,
      match: match,
      total: target.size
    };
  }

  function libEnterStorySection(song, idx) {
    const entry = libGet(song.id);
    const form = entry.story.forms[idx] || "cards";
    if (form === "cards") libEnterStoryCard(song, idx);
    else libEnterStorySequencer(song, idx);
  }

  function libEnterStorySequencer(song, idx) {
    libState.restoreSongId = song.id;
    libState.storySection = idx;
    libState.wrongCount = 0;
    const entry = libGet(song.id);
    const combos = libCombosFor(song);
    const sections = entry.sections.slice();
    for (let i = 0; i < 4; i += 1) {
      if (!sections[i]) sections[i] = combos[0].id;
    }
    entry.sections = sections;
    libSet(song.id, entry);

    remixTitleEl.textContent = "故事模式 · 第 " + (idx + 1) + " 段 / 《" + song.title + "》";
    const checkBtn = remixBarEl.querySelector(".remix-check");
    if (checkBtn) checkBtn.textContent = "完成该段";
    maybeStopStudio();

    state.root = song.root;
    state.scale = song.scale;
    state.bpm = song.bpm;
    state.instrument = song.instrument;
    state.bassInstrument = song.bass;
    TRACKS.forEach(function (track) {
      state.muted[track.id] = false;
    });

    libFillFullPattern(song);
    for (let step = idx * LIB_SECTION_STEPS; step < (idx + 1) * LIB_SECTION_STEPS; step += 1) {
      for (let row = 0; row < 12; row += 1) {
        state.grid.melody.delete(cellKey(row, step));
      }
    }
    state.comboBySection = libComboState(song, sections);
    libState.storyGhost = sectionTargetCells(song, idx);

    libSyncControls();
    renderTracks();
    libSetView("studio");
    libShowStoryUI("sequencer");
    libScrollGridToSection(idx);
    showStoryHint("");
    showToast("第 " + (idx + 1) + " 段：补上他当时错过的那段旋律（亮起的格子是参考音，照着点即可）");
  }

  function libCheckStorySection() {
    const song = libFind(libState.restoreSongId);
    if (!song) return;
    const idx = libState.storySection;
    if (idx == null) return;
    const r = libJudgeSection(song, idx);
    const entry = libGet(song.id);

    if (r.pass) {
      entry.story.passed[idx] = true;
      entry.story.unlocked = Math.max(entry.story.unlocked, idx + 2);
      entry.story.wrong[idx] = 0;
      libSet(song.id, entry);
      const content = (window.STORY_CONTENT && window.STORY_CONTENT.songs[song.id] && window.STORY_CONTENT.songs[song.id].sections[idx]) || {};
      const kkt = content.onPassKkt || {};
      storyNotify("kkt", { thread: kkt.thread || "star", text: kkt.text || "" });
      showToast("第 " + (idx + 1) + " 段完成，下一段已解锁（回音乐库查看）");
      libState.storySection = null;
      libExitRestore();
      return;
    }

    entry.story.wrong[idx] = (entry.story.wrong[idx] || 0) + 1;
    libSet(song.id, entry);
    const tol = (window.STORY_CONTENT && window.STORY_CONTENT.defaultTolerance) || { failThreshold: 3 };
    if (entry.story.wrong[idx] > tol.failThreshold) {
      libMarkWrong(libTargetMelody(song));
      const content = (window.STORY_CONTENT && window.STORY_CONTENT.songs[song.id] && window.STORY_CONTENT.songs[song.id].sections[idx]) || {};
      showStoryHint(content.placeholderNote || ("第 " + (idx + 1) + " 段还差一点：多弹了 " + r.extra + " 颗，漏了 " + r.missing + " 颗"));
      showToast("第 " + (idx + 1) + " 段暂时不对（第 " + entry.story.wrong[idx] + " 次）");
    } else {
      libClearWrongMarks();
      showToast("第 " + (idx + 1) + " 段还差一点：多弹了 " + r.extra + " 颗，漏了 " + r.missing + " 颗（第 " + entry.story.wrong[idx] + " 次）");
    }
  }

  function libEnterStoryFirst() {
    const song = libFind(libState.songId);
    if (!song) return;
    const entry = libGet(song.id);
    const s = entry.story;
    let target = -1;
    for (let i = 0; i < 4; i += 1) {
      if (i < s.unlocked && !s.passed[i]) {
        target = i;
        break;
      }
    }
    if (target < 0) {
      if (s.passed.every(Boolean)) {
        showToast("4 段都已完成，可以去存私密版本了");
        return;
      }
      target = Math.max(0, s.unlocked - 1);
    }
    libEnterStorySection(song, target);
  }

  /* ================= 故事模式 · 选卡片形式 ================= */
  function libShowStoryUI(form) {
    const isCards = form === "cards";
    tracksEl.hidden = isCards;
    if (cardPanelEl) cardPanelEl.hidden = !isCards;
    const refBtn = remixBarEl.querySelector(".remix-ref");
    if (refBtn) refBtn.hidden = isCards;
    const checkBtn = remixBarEl.querySelector(".remix-check");
    if (checkBtn) checkBtn.hidden = isCards;
    const saveBtn = remixBarEl.querySelector(".remix-save");
    if (saveBtn) saveBtn.hidden = isCards;
  }

  function sectionTargetDegrees(song, idx) {
    const pattern = LIB_PATTERNS[song.pattern % LIB_PATTERNS.length];
    const arr = [];
    for (let local = 0; local < LIB_SECTION_STEPS; local += 1) {
      arr.push(pattern.melody[(idx * LIB_SECTION_STEPS + local) % 16]);
    }
    return arr;
  }

  function libGenCardOptions(song, idx) {
    const correct = sectionTargetDegrees(song, idx);
    const wrong1 = correct.map(function (d) {
      return typeof d === "number" ? Math.min(11, d + 2) : null;
    });
    const otherPattern = LIB_PATTERNS[(song.pattern + 1) % LIB_PATTERNS.length];
    const wrong2 = [];
    for (let local = 0; local < LIB_SECTION_STEPS; local += 1) {
      wrong2.push(otherPattern.melody[(idx * LIB_SECTION_STEPS + local) % 16]);
    }
    const opts = [
      { degrees: correct, correct: true },
      { degrees: wrong1, correct: false },
      { degrees: wrong2, correct: false }
    ];
    for (let i = opts.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = opts[i];
      opts[i] = opts[j];
      opts[j] = t;
    }
    return opts;
  }

  function libRenderCards(song, idx) {
    const opts = libState.storyCards || [];
    const done = (typeof libState.storyCardDone === "number") ? libState.storyCardDone : -1;
    const cardsHtml = opts.map(function (opt, i) {
      const wave = opt.degrees.map(function (deg) {
        if (typeof deg !== "number") return '<span class="mc-col is-rest"></span>';
        const h = Math.max(10, Math.round((1 - deg / 11) * 100));
        return '<span class="mc-col" style="--h:' + h + '%"><i></i></span>';
      }).join("");
      const picked = done === i;
      const pickDisabled = done >= 0 && !picked;
      const pickLabel = picked ? "已选 ✓" : "选这段";
      return '<div class="melody-card' + (picked ? " is-picked" : "") + '">' +
        '<div class="mc-wave">' + wave + "</div>" +
        '<div class="mc-row">' +
        '<button class="mc-try" type="button" data-card-try="' + i + '">▶ 预听</button>' +
        '<button class="mc-pick" type="button" data-card-pick="' + i + '"' + (pickDisabled ? " disabled" : "") + ">" + pickLabel + "</button>" +
        "</div></div>";
    }).join("");
    const actions = done >= 0 ? '<div class="card-actions">' +
      '<button class="mc-replay" type="button" data-card-replay>▶ 再听原曲这段</button>' +
      '<button class="mc-save" type="button" data-card-save>存私密版本</button>' +
      '<button class="mc-back" type="button" data-card-back>返回音乐库</button>' +
      "</div>" : "";
    cardPanelEl.innerHTML = '<div class="card-head">第 ' + (idx + 1) + " 段 · 选一段旋律（选对即过，选错会在备注栏出提示）</div>" +
      '<div class="card-list">' + cardsHtml + "</div>" + actions;
  }

  function libPreviewCard(song, degrees) {
    Synth.init();
    Synth.stopAll();
    const melodyNotes = buildScale(song.root, SCALES[song.scale].intervals, 12, 60);
    const start = Synth.now() + 0.06;
    const gap = 0.42;
    degrees.forEach(function (deg, local) {
      if (typeof deg !== "number") return;
      Synth.play(song.instrument, melodyNotes[Math.min(11, Math.max(0, deg))], start + local * gap, gap * 0.95, 1);
    });
  }

  function libPreviewReference() {
    const song = libFind(libState.restoreSongId);
    if (!song || libState.storySection == null) return;
    Synth.init();
    Synth.stopAll();
    const melodyNotes = buildScale(song.root, SCALES[song.scale].intervals, 12, 60);
    const start = Synth.now() + 0.06;
    const gap = 0.42;
    sectionTargetDegrees(song, libState.storySection).forEach(function (deg, local) {
      if (typeof deg !== "number") return;
      Synth.play(song.instrument, melodyNotes[Math.min(11, Math.max(0, deg))], start + local * gap, gap * 0.95, 1);
    });
  }

  function libEnterStoryCard(song, idx) {
    libState.restoreSongId = song.id;
    libState.storySection = idx;
    libState.storyCards = libGenCardOptions(song, idx);
    libState.storyCardDone = null;
    libState.storyGhost = null;
    const entry = libGet(song.id);
    remixTitleEl.textContent = "故事模式 · 第 " + (idx + 1) + " 段（选卡片）/ 《" + song.title + "》";
    const checkBtn = remixBarEl.querySelector(".remix-check");
    if (checkBtn) checkBtn.textContent = "完成该段";
    maybeStopStudio();

    state.root = song.root;
    state.scale = song.scale;
    state.bpm = song.bpm;
    state.instrument = song.instrument;
    state.bassInstrument = song.bass;
    TRACKS.forEach(function (track) {
      state.muted[track.id] = false;
    });

    libSetView("studio");
    libShowStoryUI("cards");
    libRenderCards(song, idx);
    showStoryHint("");
    showToast("第 " + (idx + 1) + " 段：从 3 段旋律里选 1 段");
  }

  function libPickCard(song, idx, cardIndex) {
    const opts = libState.storyCards;
    if (!opts) return;
    const correct = opts[cardIndex].correct;
    const entry = libGet(song.id);

    if (correct) {
      entry.story.passed[idx] = true;
      entry.story.unlocked = Math.max(entry.story.unlocked, idx + 2);
      entry.story.wrong[idx] = 0;
      libSet(song.id, entry);
      const content = (window.STORY_CONTENT && window.STORY_CONTENT.songs[song.id] && window.STORY_CONTENT.songs[song.id].sections[idx]) || {};
      const kkt = content.onPassKkt || {};
      const text = kkt.text || ("第 " + (idx + 1) + " 段旋律原样找回，下一段已解锁");
      storyNotify("kkt", { thread: kkt.thread || "star", text: text });
      libPlaySection(song, idx);
      libState.storyCardDone = cardIndex;
      libRenderCards(song, idx);
      showToast("第 " + (idx + 1) + " 段完成，下一段已解锁（回音乐库查看）");
      return;
    }

    entry.story.wrong[idx] = (entry.story.wrong[idx] || 0) + 1;
    libSet(song.id, entry);
    const content = (window.STORY_CONTENT && window.STORY_CONTENT.songs[song.id] && window.STORY_CONTENT.songs[song.id].sections[idx]) || {};
    showStoryHint(content.placeholderNote || ("第 " + (idx + 1) + " 段好像不是他原来的走向，再听听别的片段"));
    showToast("这段不太对，备注栏已给出提示");
  }

  function libPlaySection(song, idx) {
    libAudioSet(song);
    const win = libSectionWindow(song, idx);
    const dur = win.end - win.start;
    try {
      libAudioEl.currentTime = win.start;
    } catch (err) {
      /* 元数据尚未就绪时忽略 */
    }
    Synth.init();
    const p = libAudioEl.play();
    if (p && p.catch) p.catch(function () {});
    window.clearTimeout(libState._sectionTimer);
    libState._sectionTimer = window.setTimeout(function () {
      try {
        libAudioEl.pause();
      } catch (err) {
        /* 忽略 */
      }
    }, dur * 1000 + 250);
  }

  function libPlayFullRestore(song) {
    libAudioSet(song);
    libState._fullPlaying = true;
    libState._fullLoop = 0;
    libState._fullMax = 3;
    const arrange = libArrange(song);
    const dur = arrange.end - arrange.start;
    function playOnce() {
      try {
        libAudioEl.currentTime = arrange.start;
      } catch (err) {
        /* 忽略 */
      }
      Synth.init();
      const p = libAudioEl.play();
      if (p && p.catch) p.catch(function () {});
      libState._fullLoop += 1;
      if (libState._fullLoop < libState._fullMax) {
        window.clearTimeout(libState._fullTimer);
        libState._fullTimer = window.setTimeout(playOnce, dur * 1000 + 400);
      } else {
        libState._fullPlaying = false;
        try {
          libAudioEl.pause();
        } catch (err) {
          /* 忽略 */
        }
      }
    }
    window.clearTimeout(libState._fullTimer);
    playOnce();
  }

  function libSaveCardsVersion(song) {
    maybeStopStudio();
    state.root = song.root;
    state.scale = song.scale;
    state.bpm = song.bpm;
    state.instrument = song.instrument;
    state.bassInstrument = song.bass;
    TRACKS.forEach(function (track) {
      state.muted[track.id] = false;
    });
    libFillFullPattern(song);
    const entry = libGet(song.id);
    const combos = libCombosFor(song);
    const sections = entry.sections.slice();
    for (let i = 0; i < 4; i += 1) {
      if (!sections[i]) sections[i] = combos[0].id;
    }
    state.comboBySection = libComboState(song, sections);
    const work = serializeWork();
    work.sections = state.comboBySection.map(function (combo) {
      return combo ? combo.id : null;
    });
    entry.versions.unshift({
      name: "还原 · " + song.title,
      date: libStamp(),
      work: work
    });
    entry.versions = entry.versions.slice(0, 8);
    libSet(song.id, entry);
    showToast("已存私密版本：「还原 · " + song.title + "」");
  }

  function libEnterRestore(song, sections, label) {
    libState.restoreSongId = song.id;
    libState.wrongCount = 0;
    const entry = libGet(song.id);
    remixTitleEl.textContent = "正在还原《" + song.title + "》";
    libRestoreBase(song);
    libApplySections(song, sections === undefined ? entry.sections : sections);
    libSyncControls();
    renderTracks();
    libSetView("studio");
    libScrollGridToEnd();
    showToast(label || ("已进入《" + song.title + "》的还原台"));
  }

  function libExitRestore() {
    const song = libFind(libState.restoreSongId);
    libState._fullPlaying = false;
    window.clearTimeout(libState._fullTimer);
    libState.restoreSongId = null;
    libState.storySection = null;
    libState.storyGhost = null;
    libState.storyCards = null;
    libState.storyCardDone = null;
    showStoryHint("");
    tracksEl.hidden = false;
    if (cardPanelEl) cardPanelEl.hidden = true;
    const cb = remixBarEl.querySelector(".remix-check");
    if (cb) cb.textContent = "检查编曲";
    if (state.playing) stopPlayback();
    libSetView("library");
    if (song) openSong(song.id, false);
  }

  function pad2(value) {
    return value < 10 ? "0" + value : String(value);
  }

  function libStamp() {
    const now = new Date();
    return now.getFullYear() + "-" + pad2(now.getMonth() + 1) + "-" + pad2(now.getDate()) +
      " " + pad2(now.getHours()) + ":" + pad2(now.getMinutes());
  }

  function libSavePrivateVersion() {
    const song = libFind(libState.restoreSongId);
    if (!song) {
      showToast("先进入一首歌的还原台，再存私密版本");
      return;
    }
    const entry = libGet(song.id);
    const work = serializeWork();
    work.sections = state.comboBySection.map(function (combo) {
      return combo ? combo.id : null;
    });
    entry.versions.unshift({
      name: "私密版本 " + (entry.versions.length + 1),
      date: libStamp(),
      work: work
    });
    entry.versions = entry.versions.slice(0, 8);
    libSet(song.id, entry);
    showToast("已存进《" + song.title + "》的私密版本");
  }

  function libLoadVersion(index) {
    const song = libFind(libState.songId) || libFind(libState.restoreSongId);
    if (!song) return;
    const entry = libGet(song.id);
    const version = entry.versions[index];
    if (!version) return;
    const work = version.work || {};
    const sections = work.sections ? work.sections : entry.sections;
    libState.restoreSongId = song.id;
    libState.wrongCount = 0;
    remixTitleEl.textContent = "正在还原《" + song.title + "》";
    libLoadWork(song, work, sections);
    libSyncControls();
    renderTracks();
    libSetView("studio");
    showToast("已载入「" + (version.name || "私密版本") + "」");
  }

  function libDeleteVersion(index) {
    const song = libFind(libState.songId);
    if (!song) return;
    const entry = libGet(song.id);
    entry.versions.splice(index, 1);
    libSet(song.id, entry);
    renderSongSheet();
    showToast("私密版本已删除");
  }

  function libSelectCombo(section, id) {
    const song = libFind(libState.songId);
    if (!song) return;
    const entry = libGet(song.id);
    const combo = libComboById(song, id);
    if (!combo) return;
    entry.sections[section] = combo.id;
    libSet(song.id, entry);
    renderSongSheet();
    libPreviewCombo(song, combo, section);
    showToast("第 " + (section + 1) + " 段选了「" + combo.name + "」");
  }

  function libEnterFromSheet() {
    const song = libFind(libState.songId);
    if (!song) return;
    const entry = libGet(song.id);
    const missing = entry.sections.filter(function (id) { return !id; }).length;
    if (missing > 0) {
      showToast("还差 " + missing + " 段没选配器，先选满 4 段");
      return;
    }
    libEnterRestore(song, entry.sections);
  }

  /* ---------- 音乐库事件 ---------- */
  function bindLibraryUI() {
    libQueryAll(".view-tab").forEach(function (tab) {
      tab.addEventListener("click", function () {
        libSetView(tab.dataset.view);
      });
    });

    remixBarEl.addEventListener("click", function (event) {
      const action = event.target.closest("[data-remix-action]");
      if (!action) return;
      const name = action.dataset.remixAction;
      if (roundState.active) {
        if (name === "check") roundSubmit();
        else if (name === "skip") roundSkip();
        else if (name === "reset") roundReset();
        return;
      }
      if (name === "save") {
        libSavePrivateVersion();
      } else if (name === "ref") {
        libPreviewReference();
      } else if (name === "check") {
        if (libState.storySection != null) libCheckStorySection();
        else libCheckArrangement();
      } else {
        libExitRestore();
      }
    });

    libraryViewEl.addEventListener("click", function (event) {
      const songRow = event.target.closest("[data-song]");
      if (songRow) {
        openSong(songRow.dataset.song);
        return;
      }

      if (event.target.closest("[data-sheet-back]")) {
        closeSong();
        return;
      }

      if (event.target.closest("[data-lib-play]")) {
        libTogglePlay();
        return;
      }

      if (event.target.closest("[data-lib-full]")) {
        const song = libFind(libState.songId);
        if (song) libPlayFullRestore(song);
        return;
      }

      const comboBtn = event.target.closest("[data-combo]");
      if (comboBtn) {
        libSelectCombo(Number(comboBtn.dataset.section), comboBtn.dataset.combo);
        return;
      }

      const formToggle = event.target.closest("[data-form-toggle]");
      if (formToggle) {
        const i = Number(formToggle.dataset.formToggle);
        const f = formToggle.dataset.form;
        const song = libFind(libState.songId);
        if (song) {
          const entry = libGet(song.id);
          entry.story.forms[i] = f;
          libSet(song.id, entry);
          renderSongSheet();
        }
        return;
      }

      const storyEnter = event.target.closest("[data-story-enter]");
      if (storyEnter) {
        const song = libFind(libState.songId);
        if (song) libEnterStorySection(song, Number(storyEnter.dataset.storyEnter));
        return;
      }

      if (event.target.closest("[data-restore-enter]")) {
        libEnterStoryFirst();
        return;
      }

      const versionLoad = event.target.closest("[data-version-load]");
      if (versionLoad) {
        libLoadVersion(Number(versionLoad.dataset.versionLoad));
        return;
      }

      const versionDel = event.target.closest("[data-version-del]");
      if (versionDel) {
        libDeleteVersion(Number(versionDel.dataset.versionDel));
      }
    });

    if (cardPanelEl) {
      cardPanelEl.addEventListener("click", function (event) {
        const song = libFind(libState.restoreSongId);
        if (!song) return;
        const tryBtn = event.target.closest("[data-card-try]");
        if (tryBtn) {
          const ci = Number(tryBtn.dataset.cardTry);
          if (libState.storyCards[ci] && libState.storyCards[ci].correct) {
            libPlaySection(song, libState.storySection);
          } else {
            libPreviewCard(song, libState.storyCards[ci].degrees);
          }
          return;
        }
        const replayBtn = event.target.closest("[data-card-replay]");
        if (replayBtn) {
          libPlaySection(song, libState.storySection);
          return;
        }
        const saveBtn = event.target.closest("[data-card-save]");
        if (saveBtn) {
          libSaveCardsVersion(song);
          return;
        }
        const backBtn = event.target.closest("[data-card-back]");
        if (backBtn) {
          libExitRestore();
          return;
        }
        const pickBtn = event.target.closest("[data-card-pick]");
        if (pickBtn) {
          libPickCard(song, libState.storySection, Number(pickBtn.dataset.cardPick));
        }
      });
    }

    libraryViewEl.addEventListener("input", function (event) {
      if (event.target.id === "sheetMemo") {
        const song = libFind(libState.songId);
        if (!song) return;
        const entry = libGet(song.id);
        entry.memo = event.target.value;
        libSet(song.id, entry);
        return;
      }
      if (event.target.id === "libSeek") {
        const song = libFind(libState.songId);
        if (!song || songSheetEl.hidden) return;
        const intro = libIntro(song);
        try {
          libAudioEl.currentTime = intro.start + (Number(event.target.value) / 1000) * (intro.end - intro.start);
        } catch (err) {
          /* 忽略 */
        }
        libSyncPlayer();
      }
    });

    libAudioEl.addEventListener("timeupdate", libSyncPlayer);
    libAudioEl.addEventListener("timeupdate", function () {
      if (libState.view !== "library" || songSheetEl.hidden) return;
      if (libState._fullPlaying) return;
      const song = libFind(libState.songId);
      if (!song) return;
      const intro = libIntro(song);
      if (libAudioEl.currentTime < intro.end) return;
      if (!libAudioEl.paused) {
        libAudioEl.pause();
        showToast("这段音频只到这里，剩下的要靠你补回来");
      }
      try {
        libAudioEl.currentTime = intro.end;
      } catch (err) {
        /* 忽略 */
      }
      libSyncPlayer();
    });
    libAudioEl.addEventListener("loadedmetadata", libSyncPlayer);
    libAudioEl.addEventListener("play", libSyncPlayer);
    libAudioEl.addEventListener("pause", libSyncPlayer);
    libAudioEl.addEventListener("ended", libSyncPlayer);
  }

  /* ---------- 界面事件 ---------- */
  function bindUI() {
    playBtn.addEventListener("click", togglePlayback);

    bpmInput.addEventListener("input", function () {
      state.bpm = Number(bpmInput.value);
      bpmVal.textContent = String(state.bpm);
    });

    rootSelect.addEventListener("change", function () {
      state.root = Number(rootSelect.value);
      renderTracks();
      if (roundState.active) {
        libScrollGridToSection(roundState.section);
        roundQueueSave();
      } else if (libState.restoreSongId) {
        libScrollGridToEnd();
      }
      showToast("主音切换为 " + ROOTS[state.root]);
    });

    scaleSelect.addEventListener("change", function () {
      state.scale = scaleSelect.value;
      renderTracks();
      if (roundState.active) {
        libScrollGridToSection(roundState.section);
        roundQueueSave();
      } else if (libState.restoreSongId) {
        libScrollGridToEnd();
      }
      showToast("音阶切换为「" + SCALES[state.scale].label + "」");
    });

    document.getElementById("randomBtn").addEventListener("click", randomInspire);
    document.getElementById("clearBtn").addEventListener("click", clearWork);
    document.getElementById("saveBtn").addEventListener("click", saveWork);
    document.getElementById("loadBtn").addEventListener("click", loadWork);
    document.getElementById("midiBtn").addEventListener("click", downloadMidi);

    notesTabEl.addEventListener("click", roundOpenNotes);
    notesCloseEl.addEventListener("click", roundCloseNotes);
    notesScrimEl.addEventListener("click", roundCloseNotes);
    noteAddEl.addEventListener("click", roundSubmitNote);
    noteInputEl.addEventListener("keydown", function (event) {
      if (event.isComposing) return;
      if (event.key !== "Enter" || event.shiftKey) return;
      event.preventDefault();
      roundSubmitNote();
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && notesDrawerEl && !notesDrawerEl.hidden) {
        event.preventDefault();
        roundCloseNotes();
        return;
      }
      if (event.code !== "Space") return;
      if (libState.view !== "studio") return;
      if (/^(INPUT|SELECT|TEXTAREA|BUTTON)$/.test(event.target.tagName)) return;
      event.preventDefault();
      togglePlayback();
    });
  }

  /* ---------- 星空 ---------- */
  function renderStars() {
    const container = document.getElementById("stars");
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < 78; i += 1) {
      const star = document.createElement("span");
      star.className = "star";
      const size = Math.random() * 1.8 + 0.8;
      star.style.left = (Math.random() * 100).toFixed(2) + "%";
      star.style.top = (Math.random() * 100).toFixed(2) + "%";
      star.style.width = size.toFixed(1) + "px";
      star.style.height = size.toFixed(1) + "px";
      star.style.setProperty("--dur", (3 + Math.random() * 4).toFixed(1) + "s");
      star.style.setProperty("--delay", (Math.random() * 5).toFixed(1) + "s");
      fragment.appendChild(star);
    }
    container.appendChild(fragment);
  }

  /* ---------- 启动 ---------- */
  function libInit() {
    document.getElementById("libCount").textContent = String(LIBRARY.length);
    renderLibraryList();
    bindLibraryUI();
    libSetView("studio");
  }

  function init() {
    renderRootOptions();
    renderPresetList();
    bindUI();
    bpmInput.value = String(state.bpm);
    bpmVal.textContent = String(state.bpm);
    renderTracks();
    updatePlayButton();
    renderStars();
    libInit();
    const libTab = document.querySelector('.view-tab[data-view="library"]');
    if (libTab) libTab.hidden = true;
    roundBoot();
    hintIosSilentMode();
  }

  init();
})();
