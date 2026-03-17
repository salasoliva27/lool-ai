(function (global) {
  'use strict';

  // ─── Asset base — resolves relative to this script's own location ─────────────
  var _scriptSrc = (document.currentScript && document.currentScript.src) || '';
  var _base      = _scriptSrc ? _scriptSrc.replace(/\/src\/widget\.js.*$/, '') : '';

  var FACE_API_URL = _base + '/vendor/face-api.js';
  var MODEL_URL    = _base + '/vendor/models/';

  // 68-point landmark indices
  var LM = {
    LEFT_TEMPLE:  1,   // left side of face
    RIGHT_TEMPLE: 15,  // right side of face
    LEFT_EYE:     [36, 37, 38, 39, 40, 41],
    RIGHT_EYE:    [42, 43, 44, 45, 46, 47],
  };

  // ─── Modal CSS ────────────────────────────────────────────────────────────────
  var CSS = [
    '#lool-overlay{position:fixed;inset:0;z-index:2147483647;background:rgba(0,0,0,.9);',
    'display:flex;flex-direction:column;align-items:center;justify-content:center;',
    'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}',
    '#lool-wrap{position:relative;width:100%;max-width:520px}',
    '#lool-video{width:100%;display:block;border-radius:14px;transform:scaleX(-1)}',
    '#lool-canvas{position:absolute;inset:0;width:100%;height:100%;border-radius:14px;transform:scaleX(-1)}',
    '#lool-actions{margin-top:18px;display:flex;gap:12px}',
    '#lool-actions button{padding:11px 26px;border-radius:8px;border:none;cursor:pointer;font-size:14px;font-weight:600}',
    '#lool-btn-save{background:#fff;color:#111}',
    '#lool-btn-close{background:rgba(255,255,255,.14);color:#fff}',
    '#lool-status{margin-top:14px;font-size:13px;color:rgba(255,255,255,.55);text-align:center;max-width:400px}',
    '#lool-privacy{margin-top:8px;font-size:11px;color:rgba(255,255,255,.28);max-width:380px;text-align:center}',
  ].join('');

  // ─── State ────────────────────────────────────────────────────────────────────
  var glassesImg    = null;
  var videoEl       = null;
  var canvasEl      = null;
  var stream        = null;
  var rafId         = null;
  var modelsLoaded  = false;
  var faceApiLoaded = false;
  var lastPositions = null;

  // ─── Helpers ─────────────────────────────────────────────────────────────────
  function loadScript(src, cb) {
    var s = document.createElement('script');
    s.src = src;
    s.onload = function () { cb(); };
    s.onerror = function () { cb(new Error('Could not load ' + src)); };
    document.head.appendChild(s);
  }

  function injectCSS() {
    if (document.getElementById('lool-css')) return;
    var el = document.createElement('style');
    el.id = 'lool-css';
    el.textContent = CSS;
    document.head.appendChild(el);
  }

  function setStatus(msg) {
    var el = document.getElementById('lool-status');
    if (el) el.textContent = msg;
  }

  function avg(landmarks, indices) {
    var x = 0, y = 0;
    for (var i = 0; i < indices.length; i++) {
      x += landmarks[indices[i]].x;
      y += landmarks[indices[i]].y;
    }
    return { x: x / indices.length, y: y / indices.length };
  }

  // ─── Glasses drawing ──────────────────────────────────────────────────────────
  function drawGlasses(ctx, positions, W, H) {
    if (!glassesImg || !glassesImg.complete || !glassesImg.naturalWidth) return;

    var left  = positions.leftTemple;
    var right = positions.rightTemple;
    var eyeL  = positions.leftEyeCenter;
    var eyeR  = positions.rightEyeCenter;

    var dx     = right.x - left.x;
    var dy     = right.y - left.y;
    var width  = Math.sqrt(dx * dx + dy * dy) * 1.05;
    var angle  = Math.atan2(dy, dx);
    var aspect = glassesImg.naturalHeight / glassesImg.naturalWidth;
    var height = width * aspect;
    var cx     = (eyeL.x + eyeR.x) / 2;
    var cy     = (eyeL.y + eyeR.y) / 2;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    ctx.drawImage(glassesImg, -width / 2, -height / 2, width, height);
    ctx.restore();
  }

  // ─── Detection loop ───────────────────────────────────────────────────────────
  function extractPositions(landmarks) {
    var pts = landmarks.positions;
    return {
      leftTemple:     { x: pts[LM.LEFT_TEMPLE].x,  y: pts[LM.LEFT_TEMPLE].y },
      rightTemple:    { x: pts[LM.RIGHT_TEMPLE].x, y: pts[LM.RIGHT_TEMPLE].y },
      leftEyeCenter:  avg(pts, LM.LEFT_EYE),
      rightEyeCenter: avg(pts, LM.RIGHT_EYE),
    };
  }

  function runDetection() {
    if (!videoEl || videoEl.paused || videoEl.ended) return;

    var faceapi = global.faceapi;
    faceapi.detectSingleFace(
      videoEl,
      new faceapi.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.4 })
    )
    .withFaceLandmarks(true)
    .then(function (result) {
      var W = videoEl.videoWidth;
      var H = videoEl.videoHeight;
      canvasEl.width  = W;
      canvasEl.height = H;
      var ctx = canvasEl.getContext('2d');
      ctx.clearRect(0, 0, W, H);

      if (result && result.landmarks) {
        lastPositions = extractPositions(result.landmarks);
        drawGlasses(ctx, lastPositions, W, H);
        setStatus('Move around to check how they look — hit "Save photo" to keep it');
      } else {
        lastPositions = null;
        setStatus('Point your camera at your face');
      }

      if (document.getElementById('lool-overlay')) {
        rafId = requestAnimationFrame(runDetection);
      }
    })
    .catch(function () {
      if (document.getElementById('lool-overlay')) {
        rafId = requestAnimationFrame(runDetection);
      }
    });
  }

  // ─── Photo capture ────────────────────────────────────────────────────────────
  function capturePhoto() {
    if (!videoEl) return;
    var out = document.createElement('canvas');
    out.width  = videoEl.videoWidth;
    out.height = videoEl.videoHeight;
    var ctx = out.getContext('2d');

    ctx.save();
    ctx.translate(out.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(videoEl, 0, 0);
    ctx.restore();

    if (lastPositions) {
      ctx.save();
      ctx.translate(out.width, 0);
      ctx.scale(-1, 1);
      drawGlasses(ctx, lastPositions, out.width, out.height);
      ctx.restore();
    }

    var link = document.createElement('a');
    link.download = 'lool-tryon.png';
    link.href = out.toDataURL('image/png');
    link.click();
  }

  // ─── Close ───────────────────────────────────────────────────────────────────
  function closeModal() {
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    if (stream) { stream.getTracks().forEach(function (t) { t.stop(); }); stream = null; }
    var overlay = document.getElementById('lool-overlay');
    if (overlay) overlay.remove();
    lastPositions = null;
  }

  // ─── Build modal ──────────────────────────────────────────────────────────────
  function buildModal() {
    var overlay = document.createElement('div');
    overlay.id = 'lool-overlay';
    overlay.innerHTML = [
      '<div id="lool-wrap">',
        '<video id="lool-video" autoplay playsinline muted></video>',
        '<canvas id="lool-canvas"></canvas>',
      '</div>',
      '<div id="lool-actions">',
        '<button id="lool-btn-save">Save photo</button>',
        '<button id="lool-btn-close">Close</button>',
      '</div>',
      '<p id="lool-status">Starting\u2026</p>',
      '<p id="lool-privacy">Camera runs in your browser. No images are sent or stored.</p>',
    ].join('');

    document.body.appendChild(overlay);
    document.getElementById('lool-btn-close').onclick = closeModal;
    document.getElementById('lool-btn-save').onclick  = capturePhoto;
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeModal();
    });
  }

  // ─── Start camera ─────────────────────────────────────────────────────────────
  function startCamera() {
    setStatus('Requesting camera\u2026');
    navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: 'user' } })
      .then(function (s) {
        stream  = s;
        videoEl = document.getElementById('lool-video');
        canvasEl = document.getElementById('lool-canvas');
        videoEl.srcObject = s;
        videoEl.onloadedmetadata = function () {
          videoEl.play();
          setStatus('Loading face detection\u2026');
          loadModels();
        };
      })
      .catch(function (err) {
        setStatus('Camera access denied. Please allow camera permission and try again.');
      });
  }

  // ─── Load models ─────────────────────────────────────────────────────────────
  function loadModels() {
    if (modelsLoaded) { runDetection(); return; }

    var faceapi = global.faceapi;
    Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
    ]).then(function () {
      modelsLoaded = true;
      setStatus('Point your camera at your face');
      runDetection();
    }).catch(function (err) {
      setStatus('Failed to load face detection models. Check your connection and try again.');
      console.error('[lool-ai]', err);
    });
  }

  // ─── Open try-on ─────────────────────────────────────────────────────────────
  function openTryOn(glassesSrc) {
    injectCSS();

    glassesImg = new Image();
    glassesImg.crossOrigin = 'anonymous';
    glassesImg.src = glassesSrc;

    buildModal();

    if (faceApiLoaded) {
      startCamera();
      return;
    }

    setStatus('Loading\u2026');
    loadScript(FACE_API_URL, function (err) {
      if (err) {
        setStatus('Failed to load face detection. Check your connection and try again.');
        console.error('[lool-ai]', err);
        return;
      }
      faceApiLoaded = true;
      startCamera();
    });
  }

  // ─── Auto-init ───────────────────────────────────────────────────────────────
  function init() {
    document.querySelectorAll('[data-lool-try-on]').forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.preventDefault();
        var src = el.getAttribute('data-lool-try-on');
        if (src) openTryOn(src);
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  global.LoolAI = { open: openTryOn };

}(window));
