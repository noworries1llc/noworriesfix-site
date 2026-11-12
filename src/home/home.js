ScrollCraft.mount(document.body);

/* The held price: page-local, engine untouched. */
(function () {
  var tag = document.querySelector('[data-nw-tag]');
  var slot = document.querySelector('[data-nw-slot]');
  var hero = document.querySelector('.nw-hero');
  var close = document.querySelector('.nw-close');
  var statusEl = tag.querySelector('[data-nw-status]');
  var zones = Array.prototype.slice.call(document.querySelectorAll('[data-nw-status][data-sc-act]'));
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var dx = 0, dy = 0, lastStatus = '', queued = false;

  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function pinned(el) {
    var r = el.getBoundingClientRect();
    return clamp01(-r.top / Math.max(1, r.height - innerHeight));
  }
  function ease(t) { return t * t * (3 - 2 * t); }

  function frame() {
    queued = false;
    var vh = innerHeight;

    tag.classList.toggle('is-on', pinned(hero) > 0.5);

    var mid = vh * 0.5, status = lastStatus;
    for (var i = 0; i < zones.length; i++) {
      var r = zones[i].getBoundingClientRect();
      if (r.top <= mid && r.bottom > mid) { status = zones[i].getAttribute('data-nw-status'); break; }
    }

    var p = pinned(close);
    var t = reduced ? (p > 0.4 ? 1 : 0) : ease(clamp01((p - 0.16) / 0.4));
    if (t > 0) {
      var a = tag.getBoundingClientRect(), b = slot.getBoundingClientRect();
      var homeX = a.left + a.width / 2 - dx, homeY = a.top + a.height / 2 - dy;
      dx = (b.left + b.width / 2 - homeX) * t;
      dy = (b.top + b.height / 2 - homeY) * t;
    } else { dx = 0; dy = 0; }
    tag.style.translate = dx.toFixed(1) + 'px ' + dy.toFixed(1) + 'px';
    tag.style.rotate = (-3 + 4.5 * t).toFixed(2) + 'deg';
    if (t >= 1) status = 'Same as quoted';

    if (status !== lastStatus) { statusEl.textContent = status; lastStatus = status; }
  }
  function ask() { if (!queued) { queued = true; requestAnimationFrame(frame); } }
  addEventListener('scroll', ask, { passive: true });
  addEventListener('resize', ask);
  addEventListener('load', ask);
  ask();

  /* Picking a job re-prices the tag, the invoice and the text message. */
  var picks = Array.prototype.slice.call(document.querySelectorAll('[data-nw-pick]'));
  picks.forEach(function (btn) {
      btn.addEventListener('click', function () {
      picks.forEach(function (b) {
        var on = b === btn;
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
        b.textContent = on ? 'On the tag' : b.dataset.idle;
      });
      var job = btn.dataset.job, amount = '$' + btn.dataset.amount;
      tag.querySelector('[data-nw-amount]').textContent = amount;
      tag.querySelector('[data-nw-jobname]').textContent = job;
      document.querySelector('[data-nw-line]').textContent = btn.dataset.line;
      document.querySelector('[data-nw-total]').textContent = amount + ', the same as quoted';
      var body = "Hi, I'd like a flat-price quote for " + job.replace(/, 3 windows$/, '') + '. Photos attached:';
      document.querySelectorAll('[data-nw-sms]').forEach(function (a) {
        a.href = a.href.split('body=')[0] + 'body=' + encodeURIComponent(body);
      });
    });
  });
})();

/* The index sheet. Without JS the Menu link jumps to the page links instead. */
(function () {
  var menu = document.querySelector('[data-nw-menu]');
  var opener = document.querySelector('[data-nw-menu-open]');
  if (!menu.showModal) return;
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var timer;

  function shut() { menu.classList.remove('is-open'); opener.setAttribute('aria-expanded', 'false'); }
  function hide() { shut(); timer = setTimeout(function () { menu.close(); }, reduced ? 0 : 200); }

  opener.setAttribute('aria-expanded', 'false');
  opener.addEventListener('click', function (e) {
    e.preventDefault();
    clearTimeout(timer);
    if (!menu.open) menu.showModal();
    menu.offsetWidth; /* flush so the opening transition runs */
    menu.classList.add('is-open');
    opener.setAttribute('aria-expanded', 'true');
  });
  menu.addEventListener('cancel', function (e) { e.preventDefault(); hide(); });
  menu.addEventListener('click', function (e) {
    if (e.target === menu || e.target.closest('[data-nw-menu-close]')) hide();
    else if (e.target.closest('a[href^="#"]')) { shut(); menu.close(); }
  });
})();
