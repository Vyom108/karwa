(() => {
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const nav = document.querySelector('.nav');
  const updateNav = () => nav.classList.toggle('is-scrolled', window.scrollY > 18);
  updateNav();
  window.addEventListener('scroll', updateNav, { passive: true });
  if (motionPreference.matches || !('IntersectionObserver' in window)) return;
  const sections = document.querySelectorAll('.hero-copy, .hero-image, .feature, .split, .cards article, .booking, .fleet, .fleet-grid article, .why, .destination, .journey-steps, .journey-step-grid li, .reviews, .faq, .cta');
  sections.forEach((section) => {
    section.classList.add('motion-reveal');
    if (section.matches('.cards article, .fleet-grid article')) {
      const peers = [...section.parentElement.children];
      section.style.transitionDelay = `${(peers.indexOf(section) % 4) * 75}ms`;
    }
  });
  const observer = new IntersectionObserver((entries, currentObserver) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      currentObserver.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -32px 0px' });
  sections.forEach((section) => observer.observe(section));

  motionPreference.addEventListener?.('change', (event) => {
    if (!event.matches) return;
    document.querySelectorAll('.motion-reveal').forEach((section) => section.classList.add('is-visible'));
    observer.disconnect();
  });
})();
