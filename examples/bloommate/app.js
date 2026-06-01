// Bloommate — pixel flower growth for Meta Display Glasses
// Pinch (Water) = 3 waters per stage · Skip · Reset · Mood · Celebration

(function () {
  'use strict';

  var WATERS_PER_STAGE = 3;
  var STAGE_NAMES = ['Seed', 'Sprout', 'Bud', 'Bloom', 'Full bloom'];
  var FULL_BLOOM_STAGE = 4;
  var PIXEL = 6;
  var GRID = 32;
  var MOOD_NEUTRAL_MS = 30000;
  var MOOD_SAD_MS = 60000;
  var CELEBRATION_MS = 1000;

  var MOOD_EMOJI = {
    happy: '\u263A',
    neutral: '\uD83D\uDE10',
    sad: '\u2639',
  };

  var PALETTE = {
    '.': null,
    '#': '#4a2818',
    'D': '#8a4028',
    'o': '#b85838',
    'O': '#e07848',
    's': '#c9a227',
    'S': '#8a6a18',
    'g': '#1a5c32',
    'G': '#3dcc5c',
    'l': '#5ee878',
    'L': '#8ef8a0',
    'p': '#e85a9a',
    'P': '#ffb0d0',
    'x': '#ffd0e8',
    'y': '#fff6b0',
    'Y': '#ffffff',
  };

  var CELEBRATION_COLORS = ['#ff9ec8', '#fff4a8', '#45d96a'];

  // 32×32 — terracotta pot, bright stem, light leaves, 6 rounded pink petals, no face
  var SPRITES = [
    // 0 — Pot with soil only
    [
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '..............sSSs..............',
      '...............SS...............',
      '..............OOOO..............',
      '.............oOOOOo.............',
      '............o######o............',
      '...........oDDDDDDo.............',
      '..........DDDDDDDD..............',
      '..........DDDDDDDD..............',
      '...........DDDDDD...............',
      '............DDDD................',
    ],
    // 1 — Pot with tiny sprout
    [
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................G...............',
      '................g...............',
      '...............ss...............',
      '..............sSSs..............',
      '...............SS...............',
      '..............OOOO..............',
      '.............oOOOOo.............',
      '............o######o............',
      '...........oDDDDDDo.............',
      '..........DDDDDDDD..............',
      '..........DDDDDDDD..............',
      '...........DDDDDD...............',
      '............DDDD................',
    ],
    // 2 — Pot, stem, small closed pink bud
    [
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................pp..............',
      '...............pppp.............',
      '...............pppp.............',
      '................g...............',
      '................g...............',
      '................g...............',
      '...............ss...............',
      '..............sSSs..............',
      '...............SS...............',
      '..............OOOO..............',
      '.............oOOOOo.............',
      '............o######o............',
      '...........oDDDDDDo.............',
      '..........DDDDDDDD..............',
      '..........DDDDDDDD..............',
      '...........DDDDDD...............',
      '............DDDD................',
    ],
    // 3 — Half-open flower, leaves, yellow center
    [
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '...............p................',
      '..............pPp...............',
      '............p.PyyP.p............',
      '...........p..PyyP..p...........',
      '............p.Pyyp.P............',
      '..............pppp..............',
      '...............lgL..............',
      '................g...............',
      '................g...............',
      '...............ss...............',
      '..............sSSs..............',
      '...............SS...............',
      '..............OOOO..............',
      '.............oOOOOo.............',
      '............o######o............',
      '...........oDDDDDDo.............',
      '..........DDDDDDDD..............',
      '..........DDDDDDDD..............',
      '...........DDDDDD...............',
      '............DDDD................',
    ],
    // 4 — Full 6-petal bloom, leaves, yellow center
    [
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '...............p................',
      '..............pPp...............',
      '.............pPyypP.............',
      '..........p.PyyyyP.p...........',
      '.........p...PyyyyP...p.........',
      '..........p.PyyyyP.p...........',
      '............p.Pyyp.P............',
      '..............pppp..............',
      '...............lgL..............',
      '................g...............',
      '................g...............',
      '................g...............',
      '...............ss...............',
      '..............sSSs..............',
      '...............SS...............',
      '..............OOOO..............',
      '.............oOOOOo.............',
      '............o######o............',
      '...........oDDDDDDo.............',
      '..........DDDDDDDD..............',
      '..........DDDDDDDD..............',
      '...........DDDDDD...............',
      '............DDDD................',
    ],
  ];

  var state = {
    stage: 0,
    waters: 0,
    mood: 'happy',
    lastWaterAt: Date.now(),
  };

  var waterDrop = null;
  var waterDropRaf = null;
  var celebration = null;
  var celebrationRaf = null;
  var moodCheckInterval = null;

  var canvas = document.getElementById('flower-canvas');
  var ctx = canvas.getContext('2d');
  var stageLabel = document.getElementById('stage-label');
  var waterMeter = document.getElementById('water-meter');
  var moodEmojiEl = null;
  var hintEl = document.getElementById('hint');
  var gestureHintEl = document.getElementById('gesture-hint');
  var stageSection = document.getElementById('stage-main');
  var gestureHintDismissed = false;

  ctx.imageSmoothingEnabled = false;

  function setupHudLayout() {
    var hud = document.querySelector('.hud');
    var title = document.querySelector('.hud-title');
    var meta = document.querySelector('.hud-meta');
    if (!hud || !title || !meta || !waterMeter) return;

    var left = document.createElement('div');
    left.className = 'hud-left';

    moodEmojiEl = document.createElement('span');
    moodEmojiEl.id = 'mood-emoji';
    moodEmojiEl.className = 'mood-emoji';
    moodEmojiEl.setAttribute('aria-hidden', 'true');
    moodEmojiEl.textContent = MOOD_EMOJI.happy;

    left.appendChild(moodEmojiEl);
    left.appendChild(title);

    var right = document.createElement('div');
    right.className = 'hud-right';
    right.appendChild(waterMeter);

    hud.insertBefore(left, meta);
    hud.appendChild(right);
  }

  function updateMoodEmoji() {
    var el = document.getElementById('mood-emoji') || moodEmojiEl;
    if (!el) return;
    moodEmojiEl = el;
    el.textContent = MOOD_EMOJI[state.mood] || MOOD_EMOJI.happy;
    el.className = 'mood-emoji mood-' + state.mood;
  }

  function startGestureHint() {
    if (!gestureHintEl || gestureHintDismissed) return;

    setTimeout(function () {
      if (!gestureHintEl || gestureHintDismissed) return;
      gestureHintEl.classList.add('fade-out');

      function onFadeEnd(e) {
        if (e.propertyName !== 'opacity') return;
        gestureHintDismissed = true;
        gestureHintEl.classList.add('is-hidden');
        gestureHintEl.removeEventListener('transitionend', onFadeEnd);
      }

      gestureHintEl.addEventListener('transitionend', onFadeEnd);
    }, 3000);
  }

  function drawPixel(gx, gy, color) {
    ctx.fillStyle = color;
    ctx.fillRect(gx * PIXEL, gy * PIXEL, PIXEL, PIXEL);
  }

  function drawSprite(sprite) {
    for (var y = 0; y < sprite.length; y++) {
      var row = sprite[y];
      for (var x = 0; x < row.length; x++) {
        var color = PALETTE[row.charAt(x)];
        if (color) {
          drawPixel(x, y, color);
        }
      }
    }
  }

  function setMood(mood) {
    var changed = state.mood !== mood;
    state.mood = mood;
    updateMoodEmoji();
    if (changed && stageSection) {
      stageSection.classList.remove('mood-happy', 'mood-neutral', 'mood-sad');
      stageSection.classList.add('mood-' + mood);
    }
    if (changed && !waterDropRaf && !celebrationRaf) {
      render();
    }
  }

  function resetMoodTimer() {
    state.lastWaterAt = Date.now();
    setMood('happy');
  }

  function checkMoodFromIdle() {
    var elapsed = Date.now() - state.lastWaterAt;
    var target = 'happy';
    if (elapsed >= MOOD_SAD_MS) {
      target = 'sad';
    } else if (elapsed >= MOOD_NEUTRAL_MS) {
      target = 'neutral';
    }
    setMood(target);
  }

  function startMoodWatcher() {
    if (moodCheckInterval) clearInterval(moodCheckInterval);
    moodCheckInterval = setInterval(checkMoodFromIdle, 1000);
  }

  function drawAnimatedWaterDrop() {
    if (!waterDrop) return;

    var centerX = (GRID * PIXEL) / 2;
    var radius = 5 * waterDrop.scale;

    ctx.save();
    ctx.globalAlpha = waterDrop.opacity;
    ctx.fillStyle = '#4db8ff';
    ctx.beginPath();
    ctx.arc(centerX, waterDrop.y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#b8e4ff';
    ctx.beginPath();
    ctx.arc(centerX - 1, waterDrop.y - 1, radius * 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawCelebration() {
    if (!celebration) return;

    var elapsed = Date.now() - celebration.start;
    var t = Math.min(1, elapsed / CELEBRATION_MS);
    var fade = 1 - t;

    for (var i = 0; i < celebration.particles.length; i++) {
      var p = celebration.particles[i];
      var px = p.x + p.vx * elapsed * 0.06;
      var py = p.y + p.vy * elapsed * 0.06;

      ctx.save();
      ctx.globalAlpha = fade * p.alpha;
      ctx.fillStyle = p.color;
      ctx.fillRect(
        Math.round(px) - PIXEL / 2,
        Math.round(py) - PIXEL / 2,
        PIXEL,
        PIXEL
      );
      ctx.restore();
    }
  }

  function tickWaterDrop() {
    if (!waterDrop) {
      waterDropRaf = null;
      return;
    }

    waterDrop.y += 5;
    waterDrop.opacity -= 0.06;
    waterDrop.scale = Math.max(0.4, waterDrop.scale - 0.02);

    if (waterDrop.y >= 130 || waterDrop.opacity <= 0) {
      waterDrop = null;
      waterDropRaf = null;
      render();
      return;
    }

    render();
    waterDropRaf = requestAnimationFrame(tickWaterDrop);
  }

  function tickCelebration() {
    if (!celebration) {
      celebrationRaf = null;
      return;
    }

    var elapsed = Date.now() - celebration.start;
    if (elapsed >= CELEBRATION_MS) {
      celebration = null;
      celebrationRaf = null;
      render();
      return;
    }

    render();
    celebrationRaf = requestAnimationFrame(tickCelebration);
  }

  function startCelebration() {
    var cx = (GRID * PIXEL) / 2;
    var cy = 72;
    var count = 8 + Math.floor(Math.random() * 5);
    var particles = [];

    for (var i = 0; i < count; i++) {
      var angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
      var speed = 2.5 + Math.random() * 2.5;
      particles.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: CELEBRATION_COLORS[i % CELEBRATION_COLORS.length],
        alpha: 0.85 + Math.random() * 0.15,
      });
    }

    celebration = { particles: particles, start: Date.now() };

    if (celebrationRaf !== null) {
      cancelAnimationFrame(celebrationRaf);
    }
    celebrationRaf = requestAnimationFrame(tickCelebration);
  }

  function playWaterDropAnimation() {
    waterDrop = {
      y: 12,
      opacity: 1,
      scale: 1,
    };

    if (waterDropRaf !== null) {
      cancelAnimationFrame(waterDropRaf);
    }
    waterDropRaf = requestAnimationFrame(tickWaterDrop);
  }

  function updateHud() {
    stageLabel.textContent = STAGE_NAMES[state.stage];

    var slots = waterMeter.querySelectorAll('.water-slot');
    for (var d = 0; d < slots.length; d++) {
      var filled = d < state.waters;
      slots[d].setAttribute('data-filled', filled ? 'true' : 'false');
      slots[d].textContent = filled ? '\uD83D\uDCA7' : '\u25CB';
      slots[d].setAttribute('aria-label', filled ? 'Water collected' : 'Water slot empty');
    }

    updateMoodEmoji();

    if (state.stage >= STAGE_NAMES.length - 1) {
      hintEl.textContent = 'Full bloom — flower is complete';
      hintEl.classList.add('done');
    } else {
      hintEl.textContent =
        'Pinch to water · ' + (WATERS_PER_STAGE - state.waters) + ' more to grow';
      hintEl.classList.remove('done');
    }
  }

  function render() {
    var w = GRID * PIXEL;
    var h = GRID * PIXEL;
    ctx.clearRect(0, 0, w, h);

    drawSprite(SPRITES[state.stage]);
    drawCelebration();
    drawAnimatedWaterDrop();
    updateHud();
  }

  function advanceStage() {
    if (state.stage < STAGE_NAMES.length - 1) {
      state.stage++;
      state.waters = 0;
      if (state.stage === FULL_BLOOM_STAGE) {
        startCelebration();
      }
      render();
      return true;
    }
    return false;
  }

  function water() {
    playWaterDropAnimation();
    flashWater();
    resetMoodTimer();

    if (state.stage >= STAGE_NAMES.length - 1) {
      if (!waterDropRaf && !celebrationRaf) render();
      return;
    }

    state.waters++;
    updateHud();

    if (state.waters >= WATERS_PER_STAGE) {
      advanceStage();
    }
  }

  function flashWater() {
    stageSection.classList.add('watering');
    setTimeout(function () {
      stageSection.classList.remove('watering');
    }, 180);
  }

  function skipStage() {
    if (state.stage < STAGE_NAMES.length - 1) {
      state.waters = 0;
      advanceStage();
    } else {
      render();
    }
  }

  function resetFlower() {
    state.stage = 0;
    state.waters = 0;
    waterDrop = null;
    celebration = null;
    if (waterDropRaf !== null) {
      cancelAnimationFrame(waterDropRaf);
      waterDropRaf = null;
    }
    if (celebrationRaf !== null) {
      cancelAnimationFrame(celebrationRaf);
      celebrationRaf = null;
    }
    resetMoodTimer();
    render();
  }

  function handleAction(action) {
    switch (action) {
      case 'water':
        water();
        break;
      case 'skip':
        skipStage();
        break;
      case 'reset':
        resetFlower();
        break;
    }
  }

  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-action]');
    if (!btn) return;
    handleAction(btn.getAttribute('data-action'));
  });

  function getFocusables() {
    return Array.prototype.filter.call(
      document.querySelectorAll('.focusable'),
      function (el) {
        return el.offsetParent !== null;
      }
    );
  }

  document.addEventListener('keydown', function (e) {
    var focusables = getFocusables();
    if (focusables.length === 0) return;

    var current = document.activeElement;
    var idx = focusables.indexOf(current);

    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault();
      var next = idx < focusables.length - 1 ? idx + 1 : 0;
      focusables[next].focus();
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault();
      var prev = idx > 0 ? idx - 1 : focusables.length - 1;
      focusables[prev].focus();
    } else if (e.key === 'Enter') {
      if (current && current.getAttribute('data-action')) {
        e.preventDefault();
        handleAction(current.getAttribute('data-action'));
      }
    }
  });

  setupHudLayout();
  state.lastWaterAt = Date.now();
  startMoodWatcher();
  render();
  startGestureHint();

  var first = document.getElementById('btn-water');
  if (first) first.focus();
})();
