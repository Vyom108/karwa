(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reducedMotion || !('IntersectionObserver' in window)) return;

  const sections = document.querySelectorAll(
    '.feature, .split, .fleet, .why, .reviews, .cta'
  );
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
