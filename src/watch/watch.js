(function () {
  var watch = document.querySelector('[data-dw-watch]');
  if (!watch || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var fig = watch.querySelector('.dw-fig');
  var steps = watch.querySelectorAll('.dw-steps li');
  var last = steps.length - 1;
  var queued = false;

  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function ease(t) { return t * t * (3 - 2 * t); }

  function frame() {
    queued = false;
    // On phones the photo pins over the top 40% of the screen, so reading happens lower down.
    var mid = innerHeight * (innerWidth < 900 ? 0.64 : 0.5);
    // Which step is being read, as a fraction: 1.5 means halfway from step 2 to step 3.
    var at = 0;
    for (var i = 0; i < steps.length; i++) {
      var r = steps[i].getBoundingClientRect();
      var c = r.top + Math.min(r.height, innerHeight * 0.4) / 2;
      if (c <= mid) at = i;
      if (c > mid) {
        if (i > 0) {
          var pr = steps[i - 1].getBoundingClientRect();
          var pc = pr.top + Math.min(pr.height, innerHeight * 0.4) / 2;
          at = i - 1 + clamp01((mid - pc) / Math.max(1, c - pc));
        }
        break;
      }
    }
    // Damaged wall while step 1 is read; the repair sweeps across steps 2 and 3; done by step 4.
    var p = ease(clamp01((at - 0.7) / (last - 0.7)));
    fig.style.setProperty('--p', p.toFixed(3));
    var on = Math.round(at);
    for (var j = 0; j < steps.length; j++) steps[j].classList.toggle('is-on', j === on);
  }
  function ask() { if (!queued) { queued = true; requestAnimationFrame(frame); } }
  addEventListener('scroll', ask, { passive: true });
  addEventListener('resize', ask);
  ask();
})();
