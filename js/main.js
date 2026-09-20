const BUSINESS = {
  name: 'Karwa Tours & Travels',
  whatsapp: '918140057861'
};

const form = document.querySelector('#bookingForm');
const error = document.querySelector('#error');
const serviceField = form.elements.service;
const date = form.elements.date;
const termsSection = document.querySelector('#serviceTerms');
const agreement = form.elements.termsAgreement;

function setMinimumDate() {
  const today = new Date();
  today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
  date.min = today.toISOString().slice(0, 10);
}

function renderServiceTerms() {
  const config = SERVICE_TERMS[serviceField.value];
  agreement.checked = false;
  agreement.required = Boolean(config);
  termsSection.hidden = !config;

  if (!config) return;

  termsSection.querySelector('[data-terms-brand]').textContent = config.brand;
  termsSection.querySelector('[data-terms-title]').textContent = config.title;
  termsSection.querySelector('[data-terms-route]').textContent = `Route: ${config.route}`;
  termsSection.querySelector('[data-terms-list]').replaceChildren(
    ...config.terms.map((term) => {
      const item = document.createElement('li');
      item.textContent = term;
      return item;
    })
  );
  termsSection.querySelector('[data-terms-thank-you]').textContent = config.thankYou;
  termsSection.querySelector('[data-terms-agreement]').textContent = config.agreement;
}

function showError(message, target) {
  error.textContent = message;
  if (target) target.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

setMinimumDate();

document.querySelector('.menu').addEventListener('click', () => {
  const navigation = document.querySelector('nav');
  const isOpen = navigation.classList.toggle('open');
  document.querySelector('.menu').setAttribute('aria-expanded', String(isOpen));
});

document.querySelectorAll('nav a').forEach((link) => link.addEventListener('click', () => {
  document.querySelector('nav').classList.remove('open');
  document.querySelector('.menu').setAttribute('aria-expanded', 'false');
}));

serviceField.addEventListener('change', renderServiceTerms);

document.querySelectorAll('[data-vehicle]').forEach((button) => button.addEventListener('click', () => {
  form.elements.vehicle.value = button.dataset.vehicle;
  if (button.dataset.service) {
    serviceField.value = button.dataset.service;
    renderServiceTerms();
  }
  document.querySelector('#booking').scrollIntoView({ behavior: 'smooth', block: 'start' });
  form.elements.vehicle.focus();
}));

form.addEventListener('submit', (event) => {
  event.preventDefault();
  error.textContent = '';
  const data = Object.fromEntries(new FormData(form));
  const termsConfig = SERVICE_TERMS[data.service];

  if (!/^[+\d][\d\s-]{7,14}$/.test(data.phone)) {
    showError('Please enter a valid phone number.');
    return;
  }
  if (data.returnDate && data.returnDate < data.date) {
    showError('Return date cannot be before travel date.');
    return;
  }
  if (termsConfig && !agreement.checked) {
    showError('Please read and agree to the Terms & Conditions before continuing.', termsSection);
    return;
  }

  const acceptance = termsConfig ? '\nTerms & Conditions: Accepted' : '';
  const message = `Hello ${BUSINESS.name},\n\nI would like to book a vehicle.\n\nName: ${data.name}\nPhone: ${data.phone}\nService: ${data.service}\nVehicle: ${data.vehicle}\nPickup Location: ${data.pickup}\nDestination: ${data.destination || 'Not specified'}\nTravel Date: ${data.date}\nReturn Date: ${data.returnDate || 'Not specified'}\nAdditional Message: ${data.message || 'None'}${acceptance}\n\nPlease let me know the availability and price.\n\nThank you.`;
  window.open(`https://wa.me/${BUSINESS.whatsapp}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
});
