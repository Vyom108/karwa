import {
  ALL_VEHICLES,
  SERVICE_VEHICLES
} from './booking-validation.js';

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

const quickForm = document.querySelector('#quickBookingForm');
const quickService = document.querySelector('#quickService');
const quickVehicle = document.querySelector('#quickVehicle');
const quickPickup = quickForm?.elements.pickup;
const quickDate = quickForm?.elements.date;
const bookingForm = document.querySelector('#bookingForm');

function updateQuickVehicles(preserve = true) {
  const previous = preserve ? quickVehicle.value : '';
  const vehicles = quickService.value
    ? SERVICE_VEHICLES[quickService.value] || []
    : ALL_VEHICLES;
  quickVehicle.replaceChildren(new Option('Choose a vehicle', ''));
  vehicles.forEach((vehicle) => quickVehicle.add(new Option(vehicle, vehicle)));
  if (vehicles.includes(previous)) quickVehicle.value = previous;
}

if (quickForm && bookingForm) {
  updateQuickVehicles();
  quickDate.min = bookingForm.elements.date.min;
  quickService.addEventListener('change', () => updateQuickVehicles());
  bookingForm.elements.date.addEventListener('change', () => {
    quickDate.min = bookingForm.elements.date.min;
  });

  quickForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!quickForm.reportValidity()) return;

    bookingForm.elements.service.value = quickService.value;
    bookingForm.elements.service.dispatchEvent(new Event('change', { bubbles: true }));
    bookingForm.elements.vehicle.value = quickVehicle.value;
    bookingForm.elements.pickup.value = quickPickup.value.trim();
    bookingForm.elements.date.value = quickDate.value;
    bookingForm.elements.date.dispatchEvent(new Event('change', { bubbles: true }));

    const journeyStep = bookingForm.querySelector('[data-booking-step="1"]');
    const detailsStep = bookingForm.querySelector('[data-booking-step="2"]');
    if (detailsStep && !detailsStep.hidden) {
      bookingForm.querySelector('[data-booking-back]')?.click();
    } else {
      journeyStep?.querySelector('h3')?.focus({ preventScroll: true });
    }
    document.querySelector('#booking').scrollIntoView({
      behavior: reducedMotion ? 'auto' : 'smooth',
      block: 'start'
    });
  });
}

// The hero cycles automatically through the ride categories.
const heroVisual = document.querySelector('#heroVisual');
const heroImage = document.querySelector('#heroVehicleImage');
const heroCaption = document.querySelector('#heroVehicleCaption');
const heroName = document.querySelector('#heroVehicleName');
const heroIndex = document.querySelector('#heroVehicleIndex');
const heroVehicles = [
  {
    src: 'assets/images/karwa-hero-car.webp',
    alt: 'Illustrative concept: generic premium navy car, not a Karwa vehicle',
    title: 'A car for your day',
    photo: false
  },
  {
    src: 'assets/images/fleet-bike.webp',
    alt: 'Illustrative concept: motorcycle on Diu’s coastal road',
    title: 'A bike for Diu',
    photo: true
  },
  {
    src: 'assets/images/fleet-scooty.webp',
    alt: 'Illustrative concept: scooty on Diu’s coastal road',
    title: 'A scooty for Diu',
    photo: true
  }
];

if (heroVisual && heroImage && heroCaption && heroName && heroIndex) {
  let activeHeroVehicle = 0;
  let heroTimer;
  let transitionId = 0;

  const showHeroVehicle = (index) => {
    activeHeroVehicle = (index + heroVehicles.length) % heroVehicles.length;
    const vehicle = heroVehicles[activeHeroVehicle];
    const thisTransition = ++transitionId;
    let hasRevealed = false;
    heroImage.classList.add('is-changing');
    heroVisual.classList.add('is-switching');

    const revealVehicle = () => {
      heroImage.removeEventListener('load', revealVehicle);
      heroImage.removeEventListener('error', revealVehicle);
      if (hasRevealed || thisTransition !== transitionId) return;
      hasRevealed = true;
      heroVisual.classList.toggle('is-photo', vehicle.photo);
      heroImage.alt = vehicle.alt;
      heroName.textContent = vehicle.title;
      heroIndex.textContent = String(activeHeroVehicle + 1).padStart(2, '0');
      requestAnimationFrame(() => requestAnimationFrame(() => {
        if (thisTransition !== transitionId) return;
        heroImage.classList.remove('is-changing');
        heroVisual.classList.remove('is-switching');
      }));
    };

    heroImage.addEventListener('load', revealVehicle);
    heroImage.addEventListener('error', revealVehicle);
    heroImage.src = vehicle.src;
  };

  if (!reducedMotion) {
    const startHeroCycle = () => {
      window.clearInterval(heroTimer);
      if (document.hidden) return;
      heroTimer = window.setInterval(() => showHeroVehicle(activeHeroVehicle + 1), 5200);
    };
    document.addEventListener('visibilitychange', startHeroCycle);
    startHeroCycle();
  }
}

const serviceCarousel = document.querySelector('#serviceCarousel');
const previousService = document.querySelector('[data-carousel-prev]');
const nextService = document.querySelector('[data-carousel-next]');
function scrollServiceCarousel(direction) {
  const card = serviceCarousel?.querySelector('.service-feature, .service-rate');
  if (!card) return;
  const gap = Number.parseFloat(getComputedStyle(serviceCarousel).columnGap) || 18;
  serviceCarousel.scrollBy({
    left: direction * (card.getBoundingClientRect().width + gap),
    behavior: reducedMotion ? 'auto' : 'smooth'
  });
}
previousService?.addEventListener('click', () => scrollServiceCarousel(-1));
nextService?.addEventListener('click', () => scrollServiceCarousel(1));
serviceCarousel?.addEventListener('keydown', (event) => {
  if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
  event.preventDefault();
  scrollServiceCarousel(event.key === 'ArrowRight' ? 1 : -1);
});

const fleetGrid = document.querySelector('.fleet-grid');
document.querySelectorAll('[data-filter]').forEach((button) => {
  button.addEventListener('click', () => {
    document.querySelectorAll('[data-filter]').forEach((filter) => {
      const active = filter === button;
      filter.classList.toggle('is-active', active);
      filter.setAttribute('aria-pressed', String(active));
    });
    const target = button.dataset.filter;
    fleetGrid?.querySelectorAll('[data-category]').forEach((card) => {
      const hidden = target !== 'all' && card.dataset.category !== target;
      card.setAttribute('aria-hidden', String(hidden));
      card.inert = hidden;
      if (hidden) {
        card.classList.add('is-filtering-out');
        setTimeout(() => { card.hidden = true; }, reducedMotion ? 0 : 240);
      } else {
        card.hidden = false;
        requestAnimationFrame(() => card.classList.remove('is-filtering-out'));
      }
    });
  });
});

const vehicleCards = [...(fleetGrid?.querySelectorAll('article') || [])];
const countTarget = document.querySelector('[data-fleet-count]');
function setFleetCount() {
  if (!countTarget) return;
  const count = vehicleCards.length;
  if (reducedMotion || !('IntersectionObserver' in window)) {
    countTarget.textContent = String(count);
    return;
  }
  const observer = new IntersectionObserver((entries, currentObserver) => {
    if (!entries.some((entry) => entry.isIntersecting)) return;
    currentObserver.disconnect();
    const start = performance.now();
    const duration = 850;
    const tick = (now) => {
      const progress = Math.min(1, (now - start) / duration);
      countTarget.textContent = String(Math.round(count * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, { threshold: 0.45 });
  observer.observe(countTarget);
}
setFleetCount();

const timelineSteps = [...document.querySelectorAll('[data-timeline-step]')];
if (timelineSteps.length && 'IntersectionObserver' in window && !reducedMotion) {
  const visibleSteps = new Map();
  const setProgress = () => {
    const active = [...visibleSteps.entries()]
      .filter(([, ratio]) => ratio >= 0.35)
      .sort((a, b) => b[1] - a[1])[0]?.[0] ?? 0;
    timelineSteps.forEach((step, index) => {
      step.classList.toggle('is-step-active', index === active);
      step.classList.toggle('is-step-complete', index < active);
    });
    document.querySelector('.journey-step-grid')
      ?.style.setProperty('--timeline-progress', `${((active + 1) / timelineSteps.length) * 100}%`);
  };
  const timelineObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const index = timelineSteps.indexOf(entry.target);
      visibleSteps.set(index, entry.intersectionRatio);
    });
    setProgress();
  }, { threshold: [0, 0.2, 0.35, 0.5, 0.75, 1] });
  timelineSteps.forEach((step) => timelineObserver.observe(step));
} else {
  timelineSteps.forEach((step) => step.classList.add('is-step-active'));
  document.querySelector('.journey-step-grid')
    ?.style.setProperty('--timeline-progress', '100%');
}

document.querySelectorAll('.fleet-grid article[data-category]').forEach((card) => {
  const category = card.dataset.category;
  // Bike and scooty cards already show their confirmed 12-hour rates in the markup.
  if (category !== 'car') return;
  const descriptor = document.createElement('p');
  descriptor.className = 'fleet-card-meta';
  descriptor.textContent = 'Car · final price confirmed with Karwa';
  const heading = card.querySelector('h3');
  heading?.after(descriptor);
});
