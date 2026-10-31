(() => {
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const nav = document.querySelector('.nav');
  const updateNav = () => nav.classList.toggle('is-scrolled', window.scrollY > 18);
  updateNav();
  window.addEventListener('scroll', updateNav, { passive: true });
  if (motionPreference.matches || !('IntersectionObserver' in window)) return;
  document.documentElement.classList.add('motion-ready');
  const sections = document.querySelectorAll('.hero-copy, .hero-image, .feature, .split, .cards article, .booking, .fleet, .fleet-grid article, .why, .destination, .journey-steps, .journey-step-grid li, .reviews, .faq, .cta, .hero-visual, .welcome-strip, .services-section, .service-feature, .service-rate, .booking-stage, .fleet-section, .diu-story, .brand-story, .journey-section, .reviews-section, .faq-section, .contact-section');
  const observer = new IntersectionObserver((entries, currentObserver) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      currentObserver.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -32px 0px' });

  const observeReveal = (section, delay = 0) => {
    section.classList.add('motion-reveal');
    section.style.setProperty('--reveal-delay', `${delay}ms`);
    observer.observe(section);
  };

  sections.forEach((section) => {
    const isCard = section.matches('.cards article, .fleet-grid article, .journey-step-grid li');
    const peerIndex = isCard ? [...section.parentElement.children].indexOf(section) : 0;
    const entranceDelay = isCard ? (peerIndex % 4) * 90 : section.matches('.hero-visual') ? 160 : 0;
    observeReveal(section, entranceDelay);
  });

  const reviewGrid = document.querySelector('.reviews-grid');
  if (reviewGrid) {
    const reviewObserver = new MutationObserver((records) => {
      records.flatMap((record) => [...record.addedNodes])
        .filter((node) => node instanceof HTMLElement)
        .forEach((card, index) => {
          if (motionPreference.matches) {
            card.classList.add('is-visible');
            return;
          }
          observeReveal(card, index * 90);
        });
    });
    reviewObserver.observe(reviewGrid, { childList: true });
  }

  motionPreference.addEventListener?.('change', (event) => {
    if (!event.matches) return;
    document.querySelectorAll('.motion-reveal').forEach((section) => section.classList.add('is-visible'));
    observer.disconnect();
  });
})();
