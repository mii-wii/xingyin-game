/* Logic · Web Audio 合成音色 */
(function () {
  "use strict";

  let ctx = null;
  let master = null;
  let noiseBuffer = null;
  const activeSources = new Set();

  function init() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      ctx = new AC();

      master = ctx.createGain();
      master.gain.value = 0.82;

      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.value = -18;
      compressor.knee.value = 28;
      compressor.ratio.value = 4;
      compressor.attack.value = 0.004;
      compressor.release.value = 0.24;

      master.connect(compressor);
      compressor.connect(ctx.destination);

      noiseBuffer = createNoise();
    }
    if (ctx.state === "suspended") {
      ctx.resume();
    }
  }

  function createNoise() {
    const length = Math.floor(ctx.sampleRate * 1.2);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  function now() {
    return ctx ? ctx.currentTime : 0;
  }

  function midiToFreq(midi) {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  function trackSource(node) {
    activeSources.add(node);
    node.addEventListener("ended", function () {
      activeSources.delete(node);
    });
  }

  function stopAll() {
    activeSources.forEach(function (node) {
      try {
        node.stop(0);
      } catch (err) {
        /* 已停止的节点忽略 */
      }
    });
    activeSources.clear();
  }

  function makeGain(peak, attack, decay, when, destination) {
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.linearRampToValueAtTime(Math.max(peak, 0.0002), when + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + attack + decay);
    gain.connect(destination);
    return gain;
  }

  function playPiano(midi, when, dur, velocity) {
    const f = midiToFreq(midi);
    const end = when + Math.max(dur, 0.3) * 1.1 + 0.5;
    const peak = 0.2 * velocity;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.linearRampToValueAtTime(peak, when + 0.014);
    gain.gain.exponentialRampToValueAtTime(0.0001, end);
    gain.connect(master);

    const main = ctx.createOscillator();
    main.type = "triangle";
    main.frequency.value = f;
    main.connect(gain);
    main.start(when);
    main.stop(end + 0.05);
    trackSource(main);

    const overtone = ctx.createOscillator();
    overtone.type = "sine";
    overtone.frequency.value = f * 2.01;
    const overtoneGain = ctx.createGain();
    overtoneGain.gain.value = 0.16;
    overtone.connect(overtoneGain);
    overtoneGain.connect(gain);
    overtone.start(when);
    overtone.stop(end + 0.05);
    trackSource(overtone);
  }

  function playBell(midi, when, dur, velocity) {
    const f = midiToFreq(midi);
    const end = when + 1.8;
    const peak = 0.14 * velocity;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.linearRampToValueAtTime(peak, when + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, end);
    gain.connect(master);

    const partials = [
      { ratio: 1, level: 1 },
      { ratio: 2.76, level: 0.32 },
      { ratio: 5.04, level: 0.14 }
    ];

    partials.forEach(function (part) {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = f * part.ratio;
      const g = ctx.createGain();
      g.gain.value = part.level;
      osc.connect(g);
      g.connect(gain);
      osc.start(when);
      osc.stop(end + 0.05);
      trackSource(osc);
    });
  }

  function playPulse(midi, when, dur, velocity) {
    const f = midiToFreq(midi);
    const end = when + Math.max(dur, 0.18) + 0.18;
    const peak = 0.13 * velocity;

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(2400, when);
    filter.frequency.exponentialRampToValueAtTime(700, end);
    filter.Q.value = 1.2;
    filter.connect(master);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.linearRampToValueAtTime(peak, when + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, end);
    gain.connect(filter);

    const main = ctx.createOscillator();
    main.type = "square";
    main.frequency.value = f;
    main.connect(gain);
    main.start(when);
    main.stop(end + 0.03);
    trackSource(main);

    const saw = ctx.createOscillator();
    saw.type = "sawtooth";
    saw.frequency.value = f * 0.995;
    const sawGain = ctx.createGain();
    sawGain.gain.value = 0.5;
    saw.connect(sawGain);
    sawGain.connect(gain);
    saw.start(when);
    saw.stop(end + 0.03);
    trackSource(saw);
  }

  function playBass(midi, when, dur, velocity) {
    const f = midiToFreq(midi);
    const end = when + Math.max(dur, 0.24) + 0.22;
    const peak = 0.2 * velocity;

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 420;
    filter.Q.value = 0.9;
    filter.connect(master);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.linearRampToValueAtTime(peak, when + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, end);
    gain.connect(filter);

    const main = ctx.createOscillator();
    main.type = "sawtooth";
    main.frequency.value = f;
    main.connect(gain);
    main.start(when);
    main.stop(end + 0.03);
    trackSource(main);

    const sub = ctx.createOscillator();
    sub.type = "sine";
    sub.frequency.value = f;
    const subGain = ctx.createGain();
    subGain.gain.value = 0.45;
    sub.connect(subGain);
    subGain.connect(gain);
    sub.start(when);
    sub.stop(end + 0.03);
    trackSource(sub);
  }

  /* ---------- 扩展音色：拨弦 / 弓弦 / 吹奏 ---------- */
  let distortionCurve = null;

  function getDistortionCurve() {
    if (!distortionCurve) {
      const size = 1024;
      distortionCurve = new Float32Array(size);
      for (let i = 0; i < size; i += 1) {
        const x = (i * 2) / size - 1;
        distortionCurve[i] = Math.tanh(x * 3.2) * 0.82;
      }
    }
    return distortionCurve;
  }

  function addOsc(type, frequency, level, when, end, destination) {
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.value = frequency;
    const oscGain = ctx.createGain();
    oscGain.gain.value = level;
    osc.connect(oscGain);
    oscGain.connect(destination);
    osc.start(when);
    osc.stop(end);
    trackSource(osc);
    return osc;
  }

  function playGuitar(midi, when, dur, velocity) {
    const f = midiToFreq(midi);
    const end = when + Math.max(dur, 0.28) + 0.55;
    const peak = 0.17 * velocity;

    const body = ctx.createBiquadFilter();
    body.type = "lowpass";
    body.frequency.value = 3600;
    body.Q.value = 0.7;
    body.connect(master);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.linearRampToValueAtTime(peak, when + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, end);
    gain.connect(body);

    addOsc("triangle", f, 0.8, when, end + 0.02, gain);
    addOsc("sine", f * 2, 0.26, when, end + 0.02, gain);
    addOsc("sine", f * 3, 0.08, when, end + 0.02, gain);

    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    const pickFilter = ctx.createBiquadFilter();
    pickFilter.type = "bandpass";
    pickFilter.frequency.value = 1700;
    pickFilter.Q.value = 0.9;
    const pickGain = ctx.createGain();
    pickGain.gain.value = 0.055;
    noise.connect(pickFilter);
    pickFilter.connect(pickGain);
    pickGain.connect(gain);
    noise.start(when);
    noise.stop(when + 0.04);
    trackSource(noise);
  }

  function playElectricGuitar(midi, when, dur, velocity) {
    const f = midiToFreq(midi);
    const end = when + Math.max(dur, 0.22) + 0.28;
    const peak = 0.2 * velocity;

    const shaper = ctx.createWaveShaper();
    shaper.curve = getDistortionCurve();
    shaper.oversample = "4x";

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 2400;
    filter.Q.value = 1.4;
    filter.connect(master);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.linearRampToValueAtTime(peak, when + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, end);
    gain.connect(filter);

    const preGain = ctx.createGain();
    preGain.gain.value = 0.55;
    preGain.connect(shaper);
    shaper.connect(gain);

    addOsc("sawtooth", f, 0.7, when, end + 0.02, preGain);
    addOsc("sawtooth", f * 1.008, 0.55, when, end + 0.02, preGain);
    addOsc("triangle", f * 0.5, 0.18, when, end + 0.02, preGain);
  }

  function playHarp(midi, when, dur, velocity) {
    const f = midiToFreq(midi);
    const end = when + Math.max(dur, 0.3) + 1.0;
    const peak = 0.12 * velocity;

    const body = ctx.createBiquadFilter();
    body.type = "lowpass";
    body.frequency.value = 2800;
    body.connect(master);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.linearRampToValueAtTime(peak, when + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, end);
    gain.connect(body);

    addOsc("sine", f, 0.85, when, end + 0.02, gain);
    addOsc("sine", f * 2, 0.24, when, end + 0.02, gain);
    addOsc("triangle", f * 3, 0.06, when, end + 0.02, gain);
  }

  function playElectricBass(midi, when, dur, velocity) {
    const f = midiToFreq(midi);
    const end = when + Math.max(dur, 0.26) + 0.34;
    const peak = 0.22 * velocity;

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 680;
    filter.Q.value = 1.1;
    filter.connect(master);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.linearRampToValueAtTime(peak, when + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, end);
    gain.connect(filter);

    addOsc("sawtooth", f, 0.7, when, end + 0.02, gain);
    addOsc("sine", f, 0.55, when, end + 0.02, gain);
    addOsc("triangle", f * 2, 0.08, when, end + 0.02, gain);
  }

  function playUpright(midi, when, dur, velocity) {
    const f = midiToFreq(midi);
    const end = when + Math.max(dur, 0.28) + 0.45;
    const peak = 0.2 * velocity;

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 360;
    filter.Q.value = 0.8;
    filter.connect(master);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.linearRampToValueAtTime(peak, when + 0.016);
    gain.gain.exponentialRampToValueAtTime(0.0001, end);
    gain.connect(filter);

    addOsc("sine", f, 0.7, when, end + 0.02, gain);
    addOsc("triangle", f, 0.55, when, end + 0.02, gain);
    addOsc("triangle", f * 2, 0.06, when, end + 0.02, gain);
  }

  const BOWED_PROFILES = {
    violin: { cutoff: 3100, q: 1.1, peak: 0.13, attack: 0.065, release: 0.2, vibRate: 5.4, vibDepth: 0.006, nasal: 0 },
    viola: { cutoff: 2300, q: 1.2, peak: 0.14, attack: 0.08, release: 0.22, vibRate: 5.0, vibDepth: 0.0055, nasal: 0 },
    cello: { cutoff: 1350, q: 1.1, peak: 0.16, attack: 0.095, release: 0.26, vibRate: 4.6, vibDepth: 0.005, nasal: 0 },
    erhu: { cutoff: 2700, q: 1.0, peak: 0.13, attack: 0.11, release: 0.24, vibRate: 6.0, vibDepth: 0.011, nasal: 1 }
  };

  function playBowed(profile, midi, when, dur, velocity) {
    const cfg = BOWED_PROFILES[profile] || BOWED_PROFILES.violin;
    const f = midiToFreq(midi);
    const sustainEnd = when + Math.max(dur, 0.28);
    const end = sustainEnd + cfg.release;
    const peak = cfg.peak * velocity;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.linearRampToValueAtTime(peak, when + cfg.attack);
    gain.gain.setValueAtTime(peak, sustainEnd);
    gain.gain.exponentialRampToValueAtTime(0.0001, end);
    gain.connect(master);

    const lowpass = ctx.createBiquadFilter();
    lowpass.type = "lowpass";
    lowpass.frequency.value = cfg.cutoff;
    lowpass.Q.value = cfg.q;
    lowpass.connect(gain);

    let mix = lowpass;
    if (cfg.nasal) {
      const nasal = ctx.createBiquadFilter();
      nasal.type = "peaking";
      nasal.frequency.value = 1400;
      nasal.Q.value = 2.4;
      nasal.gain.value = 9;
      nasal.connect(lowpass);
      mix = nasal;
    }

    const osc1 = addOsc("sawtooth", f, 0.62, when, end + 0.02, mix);
    const osc2 = addOsc("sawtooth", f * 1.004, 0.4, when, end + 0.02, mix);

    const lfo = ctx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.value = cfg.vibRate;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = f * cfg.vibDepth;
    lfo.connect(lfoGain);
    lfoGain.connect(osc1.frequency);
    lfoGain.connect(osc2.frequency);
    lfo.start(when);
    lfo.stop(end + 0.02);
    trackSource(lfo);
  }

  function playSuona(midi, when, dur, velocity) {
    const f = midiToFreq(midi);
    const end = when + Math.max(dur, 0.28) + 0.2;
    const peak = 0.16 * velocity;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.linearRampToValueAtTime(peak, when + 0.012);
    gain.gain.setValueAtTime(peak, end - 0.16);
    gain.gain.exponentialRampToValueAtTime(0.0001, end);
    gain.connect(master);

    const lowpass = ctx.createBiquadFilter();
    lowpass.type = "lowpass";
    lowpass.frequency.value = 6200;
    lowpass.connect(gain);

    const peaking = ctx.createBiquadFilter();
    peaking.type = "peaking";
    peaking.frequency.value = 1350;
    peaking.Q.value = 1.8;
    peaking.gain.value = 7;
    peaking.connect(lowpass);

    addOsc("sawtooth", f, 0.6, when, end + 0.02, peaking);
    addOsc("square", f * 1.006, 0.28, when, end + 0.02, peaking);
    addOsc("sine", f * 2, 0.1, when, end + 0.02, peaking);
  }

  function playFlute(midi, when, dur, velocity) {
    const f = midiToFreq(midi);
    const sustainEnd = when + Math.max(dur, 0.3);
    const end = sustainEnd + 0.18;
    const peak = 0.1 * velocity;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.linearRampToValueAtTime(peak, when + 0.08);
    gain.gain.setValueAtTime(peak, sustainEnd);
    gain.gain.exponentialRampToValueAtTime(0.0001, end);
    gain.connect(master);

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 2400;
    filter.connect(gain);

    addOsc("sine", f, 0.85, when, end + 0.02, filter);
    addOsc("triangle", f * 2, 0.12, when, end + 0.02, filter);

    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    const breathFilter = ctx.createBiquadFilter();
    breathFilter.type = "bandpass";
    breathFilter.frequency.value = 1400;
    breathFilter.Q.value = 0.6;
    const breathGain = ctx.createGain();
    breathGain.gain.value = 0.018;
    noise.connect(breathFilter);
    breathFilter.connect(breathGain);
    breathGain.connect(gain);
    noise.start(when);
    noise.stop(when + 0.45);
    trackSource(noise);
  }

  function playKick(when, velocity) {
    const end = when + 0.3;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.linearRampToValueAtTime(0.42 * velocity, when + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, end);
    gain.connect(master);

    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(168, when);
    osc.frequency.exponentialRampToValueAtTime(46, when + 0.17);
    osc.connect(gain);
    osc.start(when);
    osc.stop(end + 0.02);
    trackSource(osc);
  }

  function playSnare(when, velocity) {
    const end = when + 0.2;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.linearRampToValueAtTime(0.22 * velocity, when + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, end);
    gain.connect(master);

    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 1650;
    filter.Q.value = 0.8;
    noise.connect(filter);
    filter.connect(gain);
    noise.start(when);
    noise.stop(end + 0.02);
    trackSource(noise);

    const tone = ctx.createOscillator();
    tone.type = "triangle";
    tone.frequency.value = 180;
    const toneGain = ctx.createGain();
    toneGain.gain.value = 0.4;
    tone.connect(toneGain);
    toneGain.connect(gain);
    tone.start(when);
    tone.stop(end + 0.02);
    trackSource(tone);
  }

  function playHat(when, velocity) {
    const end = when + 0.07;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.linearRampToValueAtTime(0.13 * velocity, when + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.0001, end);
    gain.connect(master);

    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = 7600;
    noise.connect(filter);
    filter.connect(gain);
    noise.start(when);
    noise.stop(end + 0.02);
    trackSource(noise);
  }

  function playOpenHat(when, velocity) {
    const end = when + 0.34;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.linearRampToValueAtTime(0.12 * velocity, when + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, end);
    gain.connect(master);

    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = 6200;
    noise.connect(filter);
    filter.connect(gain);
    noise.start(when);
    noise.stop(end + 0.02);
    trackSource(noise);
  }

  function play(type, midi, when, dur, velocity) {
    if (!ctx) init();
    const start = Math.max(when, ctx.currentTime + 0.002);
    const vel = velocity == null ? 1 : velocity;
    const length = dur == null ? 0.3 : dur;

    switch (type) {
      case "piano":
        playPiano(midi, start, length, vel);
        break;
      case "bell":
        playBell(midi, start, length, vel);
        break;
      case "pulse":
        playPulse(midi, start, length, vel);
        break;
      case "bass":
        playBass(midi, start, length, vel);
        break;
      case "guitar":
        playGuitar(midi, start, length, vel);
        break;
      case "eguitar":
        playElectricGuitar(midi, start, length, vel);
        break;
      case "harp":
        playHarp(midi, start, length, vel);
        break;
      case "ebass":
        playElectricBass(midi, start, length, vel);
        break;
      case "upright":
        playUpright(midi, start, length, vel);
        break;
      case "violin":
      case "viola":
      case "cello":
      case "erhu":
        playBowed(type, midi, start, length, vel);
        break;
      case "suona":
        playSuona(midi, start, length, vel);
        break;
      case "flute":
        playFlute(midi, start, length, vel);
        break;
      case "kick":
        playKick(start, vel);
        break;
      case "snare":
        playSnare(start, vel);
        break;
      case "hat":
        playHat(start, vel);
        break;
      case "openhat":
        playOpenHat(start, vel);
        break;
      default:
        playPiano(midi, start, length, vel);
    }
  }

  window.Synth = {
    init: init,
    now: now,
    play: play,
    stopAll: stopAll,
    isReady: function () {
      return Boolean(ctx);
    }
  };
})();
