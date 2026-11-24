/**
 * Zero-dependency Web Audio Synthesizer
 * Cheerful, upbeat birthday party melody & cinema celebration chiptune
 * Auto-plays on first interaction (respecting browser autoplay policies)
 */

(function(window) {
  'use strict';

  let audioCtx = null;
  let isPlaying = false;
  let isMuted = false;
  let loopTimeout = null;
  let masterGain = null;
  let userInteracted = false;

  const NOTES = {
    'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23, 'G4': 392.00,
    'A4': 440.00, 'B4': 493.88, 'C5': 523.25, 'D5': 587.33, 'E5': 659.25,
    'F5': 698.46, 'G5': 783.99, 'A5': 880.00
  };

  // Joyful upbeat birthday theme score
  const MELODY = [
    ['C4', 0.25], ['C4', 0.15], ['D4', 0.4], ['C4', 0.4], ['F4', 0.4], ['E4', 0.8],
    ['C4', 0.25], ['C4', 0.15], ['D4', 0.4], ['C4', 0.4], ['G4', 0.4], ['F4', 0.8],
    ['C4', 0.25], ['C4', 0.15], ['C5', 0.4], ['A4', 0.4], ['F4', 0.4], ['E4', 0.4], ['D4', 0.6],
    ['A4', 0.25], ['A4', 0.15], ['F5', 0.4], ['C5', 0.4], ['G4', 0.4], ['F4', 0.8],
    // Cheerful cinema fanfare flourish!
    ['G4', 0.2], ['A4', 0.2], ['C5', 0.3], ['E5', 0.3], ['G5', 0.6]
  ];

  function getAudioContext() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
        masterGain = audioCtx.createGain();
        masterGain.gain.setValueAtTime(0.12, audioCtx.currentTime);
        masterGain.connect(audioCtx.destination);
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function playNote(freq, startTime, duration) {
    if (!audioCtx || isMuted || !freq) return;

    const osc = audioCtx.createOscillator();
    const noteGain = audioCtx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, startTime);

    noteGain.gain.setValueAtTime(0.001, startTime);
    noteGain.gain.exponentialRampToValueAtTime(0.32, startTime + 0.03);
    noteGain.gain.exponentialRampToValueAtTime(0.001, startTime + duration * 0.95);

    osc.connect(noteGain);
    noteGain.connect(masterGain);

    osc.start(startTime);
    osc.stop(startTime + duration);

    // Warm bass accompaniment
    const bassOsc = audioCtx.createOscillator();
    const bassGain = audioCtx.createGain();
    bassOsc.type = 'sine';
    bassOsc.frequency.setValueAtTime(freq / 2, startTime);
    bassGain.gain.setValueAtTime(0.001, startTime);
    bassGain.gain.exponentialRampToValueAtTime(0.16, startTime + 0.04);
    bassGain.gain.exponentialRampToValueAtTime(0.001, startTime + duration * 0.9);

    bassOsc.connect(bassGain);
    bassGain.connect(masterGain);

    bassOsc.start(startTime);
    bassOsc.stop(startTime + duration);
  }

  function playPartyPopperSFX() {
    try {
      const ctx = getAudioContext();
      if (!ctx || isMuted) return;

      const now = ctx.currentTime;
      const bufferSize = ctx.sampleRate * 0.2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2200, now);
      filter.frequency.exponentialRampToValueAtTime(100, now + 0.18);

      const sfxGain = ctx.createGain();
      sfxGain.gain.setValueAtTime(0.4, now);
      sfxGain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);

      whiteNoise.connect(filter);
      filter.connect(sfxGain);
      sfxGain.connect(masterGain);

      whiteNoise.start(now);

      playNote(NOTES['C5'], now + 0.05, 0.15);
      playNote(NOTES['G5'], now + 0.15, 0.25);
    } catch (e) {
      // Audio fallback
    }
  }

  function startMelodyLoop() {
    if (!isPlaying) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    let time = ctx.currentTime + 0.1;
    MELODY.forEach(([noteName, duration]) => {
      const freq = NOTES[noteName];
      playNote(freq, time, duration);
      time += duration * 0.9;
    });

    const totalDuration = (time - ctx.currentTime) * 1000 + 1500;
    loopTimeout = setTimeout(() => {
      if (isPlaying) {
        startMelodyLoop();
      }
    }, totalDuration);
  }

  function startMusic() {
    if (isPlaying) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    isPlaying = true;
    isMuted = false;
    if (masterGain) {
      masterGain.gain.setValueAtTime(0.12, ctx.currentTime);
    }
    startMelodyLoop();
    updateUI(true);
  }

  function stopMusic() {
    isPlaying = false;
    clearTimeout(loopTimeout);
    const ctx = getAudioContext();
    if (ctx && masterGain) {
      masterGain.gain.setValueAtTime(0, ctx.currentTime);
    }
    updateUI(false);
  }

  function toggleMusic() {
    if (isPlaying) {
      stopMusic();
      return false;
    } else {
      startMusic();
      return true;
    }
  }

  function updateUI(playing) {
    const btn = document.getElementById('btn-toggle-music');
    const label = document.getElementById('music-btn-label');
    if (btn) {
      if (playing) {
        btn.classList.add('playing');
        if (label) label.textContent = 'Music: ON';
      } else {
        btn.classList.remove('playing');
        if (label) label.textContent = 'Music: OFF';
      }
    }
  }

  // Attempt auto-start on load & first touch/click
  function setupAutoplay() {
    // Try immediate start
    try {
      startMusic();
    } catch (e) {}

    // First interaction unlocks audio if browser blocked cold autoplay
    const unlockAudio = () => {
      if (!userInteracted) {
        userInteracted = true;
        if (!isPlaying) {
          startMusic();
        }
      }
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };

    window.addEventListener('click', unlockAudio, { passive: true });
    window.addEventListener('touchstart', unlockAudio, { passive: true });
    window.addEventListener('keydown', unlockAudio, { passive: true });
  }

  window.PartyMusic = {
    start: startMusic,
    stop: stopMusic,
    toggle: toggleMusic,
    setupAutoplay: setupAutoplay,
    playPopperSFX: playPartyPopperSFX,
    isPlaying: () => isPlaying
  };

})(window);
