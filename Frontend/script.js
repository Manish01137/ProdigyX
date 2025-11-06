// companies.js
// Controls marquee behavior: clones groups if needed, handles speed slider,
// pauses on visibility change and respects reduced-motion preference.

(function () {
  const track = document.getElementById('marqueeTrack');
  const speedInput = document.getElementById('marqueeSpeed');

  if (!track) return;

  // If only one .marquee-group exists, clone it to ensure seamless loop
  const groups = track.querySelectorAll('.marquee-group');
  if (groups.length === 1) {
    const clone = groups[0].cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    track.appendChild(clone);
  }

  // Default duration (seconds) — lower = faster movement
  const DEFAULT_DURATION = 14;
  const MIN_DURATION = 6;
  const MAX_DURATION = 30;

  // Helper: apply duration to CSS variable
  function setDuration(seconds) {
    track.style.setProperty('--marquee-duration', `${seconds}s`);
  }

  // Hook up the range input (if present)
  if (speedInput) {
    // Initial value -> set duration (we invert value: higher slider value -> faster, but you used value meaning seconds)
    const initial = parseFloat(speedInput.value) || DEFAULT_DURATION;
    setDuration(initial);

    speedInput.addEventListener('input', (e) => {
      const v = parseFloat(e.target.value);
      const clamped = Math.min(MAX_DURATION, Math.max(MIN_DURATION, v));
      setDuration(clamped);
    });
  } else {
    setDuration(DEFAULT_DURATION);
  }

  // Pause animation when page is hidden to save CPU
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      track.style.animationPlayState = 'paused';
    } else {
      track.style.animationPlayState = '';
    }
  });

  // Respect reduced motion — if user prefers reduce, disable animation
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  function handleReduceMotion() {
    if (reduce.matches) {
      track.style.animation = 'none';
    } else {
      // restore animation by forcing the CSS variable to reapply
      const current = track.style.getPropertyValue('--marquee-duration') || `${DEFAULT_DURATION}s`;
      track.style.animation = ''; // let CSS handle it again
      track.style.setProperty('--marquee-duration', current);
    }
  }
  reduce.addListener(handleReduceMotion);
  handleReduceMotion();

  // Optional: make marquee move in opposite direction if you want
  // To switch to right->left, change keyframes or set animation-direction: reverse.
  // Example: track.style.animationDirection = 'reverse';

  // Accessibility: if focus enters a logo, pause animation so keyboard users can interact
  track.addEventListener('focusin', () => track.style.animationPlayState = 'paused');
  track.addEventListener('focusout', () => track.style.animationPlayState = '');

})();


