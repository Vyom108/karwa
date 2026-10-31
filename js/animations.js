(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const nav = document.querySelector('.nav');
  const updateNav = () => nav.classList.toggle('is-scrolled', window.scrollY > 18);
  updateNav();
  window.addEventListener('scroll', updateNav, { passive: true });
  if (reducedMotion || !('IntersectionObserver' in window)) return;
  const sections = document.querySelectorAll('.hero-copy, .hero-image, .feature, .split, .cards article, .booking, .fleet, .fleet-grid article, .why, .reviews, .cta');
  sections.forEach((section) => section.classList.add('motion-reveal'));
  const observer = new IntersectionObserver((entries, currentObserver) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      currentObserver.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -32px 0px' });
  sections.forEach((section) => observer.observe(section));
})();
