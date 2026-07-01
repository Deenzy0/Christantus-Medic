/**
 * Site-wide 3D floating-panel background.
 * Injects a fixed `.scene3d-root` behind all content on every page,
 * with several `.scene3d-panel` elements at different simulated
 * depths (translateZ). Scroll position drives a CSS custom property
 * that rotates the whole 3D stage, so depth visibly shifts as the
 * user scrolls — pure CSS 3D transforms, this script only reads
 * scroll position and writes two CSS variables (no animation lib).
 *
 * Performance: the scroll handler is rAF-throttled so it never runs
 * more than once per frame, and it only ever updates 2 CSS custom
 * properties (cheap, GPU-composited transform — not layout/paint).
 */

const SCENE3D_PANELS = [
  { px: '12%', py: '18%', pw: '220px', ph: '220px', pr: '32px', pz: '-180px', prx: '12deg', pry: '-18deg', prz: '6deg', duration: '11s', delay: '0s', far: true },
  { px: '85%', py: '12%', pw: '160px', ph: '160px', pr: '24px', pz: '-60px', prx: '-10deg', pry: '20deg', prz: '-8deg', duration: '8.5s', delay: '0.6s', near: true },
  { px: '92%', py: '55%', pw: '130px', ph: '130px', pr: '50%', pz: '-220px', prx: '8deg', pry: '-12deg', prz: '0deg', duration: '12s', delay: '1.2s', far: true, mobileHidden: true },
  { px: '8%', py: '62%', pw: '190px', ph: '120px', pr: '20px', pz: '-90px', prx: '-6deg', pry: '14deg', prz: '4deg', duration: '9.5s', delay: '0.3s' },
  { px: '50%', py: '85%', pw: '240px', ph: '160px', pr: '28px', pz: '-260px', prx: '14deg', pry: '0deg', prz: '-4deg', duration: '13s', delay: '0.9s', far: true, mobileHidden: true },
  { px: '30%', py: '40%', pw: '110px', ph: '110px', pr: '50%', pz: '-30px', prx: '0deg', pry: '0deg', prz: '0deg', duration: '7.5s', delay: '1.5s', near: true, mobileHidden: true },
  { px: '70%', py: '78%', pw: '150px', ph: '150px', pr: '26px', pz: '-140px', prx: '-14deg', pry: '-10deg', prz: '8deg', duration: '10s', delay: '0.4s' }
];

function injectScene3D() {
  if (document.querySelector('.scene3d-root')) return;

  const root = document.createElement('div');
  root.className = 'scene3d-root';
  root.setAttribute('aria-hidden', 'true');

  const stage = document.createElement('div');
  stage.className = 'scene3d-stage';

  SCENE3D_PANELS.forEach((p) => {
    const panel = document.createElement('div');
    panel.className = 'scene3d-panel';
    if (p.far) panel.classList.add('is-far');
    if (p.near) panel.classList.add('is-near');
    if (p.mobileHidden) panel.classList.add('is-mobile-hidden');

    panel.style.setProperty('--px', p.px);
    panel.style.setProperty('--py', p.py);
    panel.style.setProperty('--pw', p.pw);
    panel.style.setProperty('--ph', p.ph);
    panel.style.setProperty('--pr', p.pr);
    panel.style.setProperty('--pz', p.pz);
    panel.style.setProperty('--prx', p.prx);
    panel.style.setProperty('--pry', p.pry);
    panel.style.setProperty('--prz', p.prz);
    panel.style.setProperty('--p-duration', p.duration);
    panel.style.setProperty('--p-delay', p.delay);

    stage.appendChild(panel);
  });

  root.appendChild(stage);
  document.body.insertBefore(root, document.body.firstChild);
}

function initScene3DScroll() {
  const root = document.documentElement;
  let ticking = false;

  const MAX_ROTATE_DEG = 14;
  const MAX_SHIFT_PX = 240;
  const SCROLL_RANGE_PX = 1400;

  function update() {
    const scrollY = window.scrollY || window.pageYOffset || 0;
    const progress = Math.min(scrollY / SCROLL_RANGE_PX, 1);

    root.style.setProperty('--scene-scroll-rotate', `${(progress * MAX_ROTATE_DEG).toFixed(2)}deg`);
    root.style.setProperty('--scene-scroll-shift', `${(progress * MAX_SHIFT_PX).toFixed(1)}`);

    ticking = false;
  }

  window.addEventListener(
    'scroll',
    () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    },
    { passive: true }
  );

  update();
}

document.addEventListener('DOMContentLoaded', () => {
  injectScene3D();

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!prefersReducedMotion) {
    initScene3DScroll();
  }
});
