(function (global) {
  'use strict';

  // ─── MediaPipe CDN ────────────────────────────────────────────────────────────
  var MP_VERSION = '0.4.1633559619';
  var FACE_MESH_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@' + MP_VERSION + '/face_mesh.js';
  var CAMERA_UTILS_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils@0.3.1632090706/camera_utils.js';

  // ─── Face landmark indices (MediaPipe Face Mesh 468-point model) ──────────────
  var LM = {
    LEFT_TEMPLE:   234,
    RIGHT_TEMPLE:  454,
    LEFT_EYE:      159,
    RIGHT_EYE:     386,
    NOSE_BRIDGE:   6,
  };

  // ─── Modal CSS ────────────────────────────────────────────────────────────────
  var CSS = [
    '#lool-overlay{position:fixed;inset:0;z-index:2147483647;background:rgba(0,0,0,.9);',
    'display:flex;flex-direction:column;align-items:center;justify-content:center;',
    'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}',

    '#lool-wrap{position:relative;width:100%;max-width:520px}',

    '#lool-video{width:100%;display:block;border-radius:14px;transform:scaleX(-1)}',

    '#lool-canvas{position:absolute;inset:0;width:100%;height:100%;',
    'border-radius:14px;transform:scaleX(-1)}',

    '#lool-actions{margin-top:18px;display:flex;gap:12px}',

    '#lool-actions button{padding:11px 26px;border-radius:8px;border:none;',
    'cursor:pointer;font-size:14px;font-weight:600;letter-spacing:.01em}',

    '#lool-btn-save{background:#ffffff;color:#111}',
    '#lool-btn-close{background:rgba(255,255,255,.14);color:#fff}',

    '#lool-status{margin-top:14px;font-size:13px;color:rgba(255,255,255,.55)}',

    '#lool-privacy{margin-top:10px;font-size:11px;color:rgba(255,255,255,.3);max-width:380px;text-align:center}',
  ].join('');

  // ─── State ────────────────────────────────────────────────────────────────────
  var glassesImg   = null;
  var camera       = null;
  var faceMesh     = null;
  var lastLandmarks = null;
  var scriptsLoaded = false;

  // ─── Utilities ────────────────────────────────────────────────────────────────
  function loadScript(src, cb) {
    var s = document.createElement('script');
    s.src = src;
    s.onload = cb;
    s.onerror = function () { cb(new Error('Failed to load ' + src)); };
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

  // ─── Glasses drawing ──────────────────────────────────────────────────────────
  function drawGlasses(ctx, landmarks, W, H) {
    if (!glassesImg || !glassesImg.complete || !glassesImg.naturalWidth) return;

    function pt(i) { return { x: landmarks[i].x * W, y: landmarks[i].y * H }; }

    var left  = pt(LM.LEFT_TEMPLE);
    var right = pt(LM.RIGHT_TEMPLE);
    var eyeL  = pt(LM.LEFT_EYE);
    var eyeR  = pt(LM.RIGHT_EYE);

    var dx = right.x - left.x;
    var dy = right.y - left.y;
    var width  = Math.sqrt(dx * dx + dy * dy) * 1.05;
    var angle  = Math.atan2(dy, dx);
    var aspect = glassesImg.naturalHeight / glassesImg.naturalWidth;
    var height = width * aspect;

    var cx = (eyeL.x + eyeR.x) / 2;
    var cy = (eyeL.y + eyeR.y) / 2 - height * 0.08;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    ctx.drawImage(glassesImg, -width / 2, -height / 2, width, height);
    ctx.restore();
  }

  // ─── Photo capture ────────────────────────────────────────────────────────────
  function capturePhoto() {
    var video = document.getElementById('lool-video');
    if (!video) return;

    var out = document.createElement('canvas');
    out.width  = video.videoWidth;
    out.height = video.videoHeight;
    var ctx = out.getContext('2d');

    // Mirror + draw video frame
    ctx.save();
    ctx.translate(out.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);
    ctx.restore();

    // Draw glasses on top
    if (lastLandmarks) {
      ctx.save();
      ctx.translate(out.width, 0);
      ctx.scale(-1, 1);
      drawGlasses(ctx, lastLandmarks, out.width, out.height);
      ctx.restore();
    }

    var link = document.createElement('a');
    link.download = 'lool-tryon.png';
    link.href = out.toDataURL('image/png');
    link.click();
  }

  // ─── Close ───────────────────────────────────────────────────────────────────
  function closeModal() {
    if (camera) { try { camera.stop(); } catch (e) {} camera = null; }
    var overlay = document.getElementById('lool-overlay');
    if (overlay) overlay.remove();
    lastLandmarks = null;
  }

  // ─── Build modal ─────────────────────────────────────────────────────────────
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
      '<p id="lool-status">Starting camera\u2026</p>',
      '<p id="lool-privacy">Camera runs entirely in your browser. No images are sent or stored.</p>',
    ].join('');

    document.body.appendChild(overlay);

    document.getElementById('lool-btn-close').onclick = closeModal;
    document.getElementById('lool-btn-save').onclick  = capturePhoto;
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeModal();
    });
  }

  // ─── Start FaceMesh ───────────────────────────────────────────────────────────
  function startFaceMesh(videoEl, canvasEl) {
    faceMesh = new global.FaceMesh({
      locateFile: function (file) {
        return 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@' + MP_VERSION + '/' + file;
      },
    });

    faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: false,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    faceMesh.onResults(function (results) {
      var W = videoEl.videoWidth;
      var H = videoEl.videoHeight;
      canvasEl.width  = W;
      canvasEl.height = H;
      var ctx = canvasEl.getContext('2d');
      ctx.clearRect(0, 0, W, H);

      if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
        lastLandmarks = results.multiFaceLandmarks[0];
        drawGlasses(ctx, lastLandmarks, W, H);
        setStatus('Move around to check how they look \u2014 hit \u201cSave photo\u201d to keep it');
      } else {
        lastLandmarks = null;
        setStatus('Point your camera at your face');
      }
    });

    camera = new global.Camera(videoEl, {
      onFrame: function () { return faceMesh.send({ image: videoEl }); },
      width: 640,
      height: 480,
    });

    setStatus('Loading face detection\u2026');
    camera.start().then(function () {
      setStatus('Point your camera at your face');
    });
  }

  // ─── Load scripts then open ───────────────────────────────────────────────────
  function openTryOn(glassesSrc) {
    injectCSS();

    glassesImg = new Image();
    glassesImg.crossOrigin = 'anonymous';
    glassesImg.src = glassesSrc;

    buildModal();

    var videoEl  = document.getElementById('lool-video');
    var canvasEl = document.getElementById('lool-canvas');

    if (scriptsLoaded) {
      startFaceMesh(videoEl, canvasEl);
      return;
    }

    setStatus('Loading\u2026');
    loadScript(FACE_MESH_URL, function (err) {
      if (err) { setStatus('Failed to load face detection. Check your connection.'); return; }
      loadScript(CAMERA_UTILS_URL, function (err2) {
        if (err2) { setStatus('Failed to load camera utils.'); return; }
        scriptsLoaded = true;
        startFaceMesh(videoEl, canvasEl);
      });
    });
  }

  // ─── Auto-init: attach to any [data-lool-try-on] element ─────────────────────
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

  // Manual API: LoolAI.open('glasses.png')
  global.LoolAI = { open: openTryOn };

}(window));
