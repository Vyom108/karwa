import { supabase } from './supabase-client.js';

const BUSINESS = {
  name: 'Karwa Tours & Travels',
  whatsapp: '918140057861'
};

const form = document.querySelector('#bookingForm');
const error = document.querySelector('#error');
const bookingStatus = document.querySelector('#bookingStatus');
const serviceField = form.elements.service;
const date = form.elements.date;
const termsSection = document.querySelector('#serviceTerms');
const agreement = form.elements.termsAgreement;
const authDialog = document.querySelector('#authDialog');
const accountDialog = document.querySelector('#accountDialog');
const reviewDialog = document.querySelector('#reviewDialog');
const authButton = document.querySelector('#authButton');
let currentUser = null;

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
  termsSection.querySelector('[data-terms-list]').replaceChildren(...config.terms.map((term) => {
    const item = document.createElement('li');
    item.textContent = term;
    return item;
  }));
  termsSection.querySelector('[data-terms-thank-you]').textContent = config.thankYou;
  termsSection.querySelector('[data-terms-agreement]').textContent = config.agreement;
}

function showError(message, target) {
  error.textContent = message;
  if (target) target.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function openDialog(dialog) {
  if (!dialog.open) dialog.showModal();
}

function closeDialog(dialog) {
  if (dialog.open) dialog.close();
}

function setDialogMessage(id, message, isError = false) {
  const element = document.querySelector(id);
  element.textContent = message;
  element.classList.toggle('is-error', isError);
}

function updateAuthButton() {
  authButton.textContent = currentUser ? 'My account' : 'Log in';
}

function setAuthMode(mode) {
  const isSignup = mode === 'signup';
  const authForm = document.querySelector('#authForm');
  authForm.elements.mode.value = mode;
  document.querySelector('#authTitle').textContent = isSignup ? 'Create your account.' : 'Log in to book.';
  document.querySelector('#authIntro').textContent = isSignup
    ? 'Use your email and a secure password. We will send a confirmation email.'
    : 'Log in to make a booking, check its status, or write a review after a completed journey.';
  document.querySelector('#authNameField').hidden = !isSignup;
  authForm.elements.fullName.required = isSignup;
  authForm.elements.password.autocomplete = isSignup ? 'new-password' : 'current-password';
  document.querySelector('#authSubmit').textContent = isSignup ? 'Create account' : 'Log in';
  document.querySelector('#authSwitch').textContent = isSignup
    ? 'Already have an account? Log in'
    : 'New here? Create an account';
  setDialogMessage('#authMessage', '');
}

function formatDate(value) {
  return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(new Date(`${value}T00:00:00`));
}

function createWhatsAppMessage(data) {
  const termsConfig = SERVICE_TERMS[data.service];
  const acceptance = termsConfig ? '\nTerms & Conditions: Accepted' : '';
  return `Hello ${BUSINESS.name},\n\nI would like to book a vehicle.\n\nName: ${data.name}\nPhone: ${data.phone}\nService: ${data.service}\nVehicle: ${data.vehicle}\nPickup Location: ${data.pickup}\nDestination: ${data.destination || 'Not specified'}\nTravel Date: ${data.date}\nReturn Date: ${data.returnDate || 'Not specified'}\nAdditional Message: ${data.message || 'None'}${acceptance}\n\nPlease let me know the availability and price.\n\nThank you.`;
}

function showBookingSuccess(whatsappUrl) {
  const link = document.createElement('a');
  link.href = whatsappUrl;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.textContent = 'Send it on WhatsApp too ↗';
  bookingStatus.replaceChildren('Your booking request has been saved. ', link);
}

async function loadPublicReviews() {
  const { data, error: requestError } = await supabase
    .from('reviews')
    .select('reviewer_name, rating, comment, created_at')
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(6);
  if (requestError) return;
  const list = document.querySelector('#reviewsList');
  const empty = document.querySelector('#reviewsEmpty');
  list.replaceChildren();
  empty.hidden = data.length > 0;
  data.forEach((review) => {
    const card = document.createElement('article');
    card.className = 'review-card';
    const stars = document.createElement('p');
    stars.className = 'review-stars';
    stars.textContent = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
    const quote = document.createElement('p');
    quote.className = 'review-comment';
    quote.textContent = `“${review.comment}”`;
    const name = document.createElement('p');
    name.className = 'review-name';
    name.textContent = review.reviewer_name;
    const dateText = document.createElement('time');
    dateText.dateTime = review.created_at;
    dateText.textContent = new Intl.DateTimeFormat('en-IN', { month: 'short', year: 'numeric' }).format(new Date(review.created_at));
    name.append(' · ', dateText);
    card.append(stars, quote, name);
    list.append(card);
  });
}

async function loadMyBookings() {
  const container = document.querySelector('#myBookings');
  container.textContent = 'Loading your bookings…';
  const [{ data: bookings, error: bookingError }, { data: reviews, error: reviewError }] = await Promise.all([
    supabase.from('bookings').select('id, service, vehicle, travel_date, status, created_at').order('created_at', { ascending: false }),
    supabase.from('reviews').select('booking_id, status')
  ]);
  if (bookingError || reviewError) {
    container.textContent = 'We could not load your bookings right now. Please try again.';
    return;
  }
  if (!bookings.length) {
    container.textContent = 'You have not placed a booking yet.';
    return;
  }
  const reviewByBooking = new Map(reviews.map((review) => [review.booking_id, review]));
  container.replaceChildren(...bookings.map((booking) => {
    const item = document.createElement('article');
    item.className = 'booking-item';
    const title = document.createElement('h3');
    title.textContent = booking.vehicle;
    const details = document.createElement('p');
    details.textContent = `${booking.service} · ${formatDate(booking.travel_date)}`;
    const status = document.createElement('p');
    status.className = `booking-state is-${booking.status}`;
    status.textContent = booking.status;
    item.append(title, details, status);
    if (booking.status === 'completed' && !reviewByBooking.has(booking.id)) {
      const reviewButton = document.createElement('button');
      reviewButton.className = 'outline';
      reviewButton.type = 'button';
      reviewButton.textContent = 'Write a review';
      reviewButton.addEventListener('click', () => openReviewDialog(booking));
      item.append(reviewButton);
    } else if (booking.status === 'completed') {
      const reviewStatus = document.createElement('p');
      reviewStatus.className = 'review-pending';
      reviewStatus.textContent = `Review ${reviewByBooking.get(booking.id).status}`;
      item.append(reviewStatus);
    }
    return item;
  }));
}

function openReviewDialog(booking) {
  document.querySelector('#reviewForm').reset();
  document.querySelector('#reviewForm').elements.bookingId.value = booking.id;
  document.querySelector('#reviewBookingLabel').textContent = `${booking.vehicle} · ${formatDate(booking.travel_date)}`;
  setDialogMessage('#reviewMessage', '');
  closeDialog(accountDialog);
  openDialog(reviewDialog);
}

async function handleAuthSubmit(event) {
  event.preventDefault();
  const authForm = event.currentTarget;
  const data = Object.fromEntries(new FormData(authForm));
  const signup = data.mode === 'signup';
  setDialogMessage('#authMessage', '');
  let response;
  if (signup) {
    const redirectUrl = ['http:', 'https:'].includes(window.location.protocol) ? window.location.href : undefined;
    response = await supabase.auth.signUp({
      email: data.email.trim(),
      password: data.password,
      options: {
        data: { full_name: data.fullName.trim() },
        ...(redirectUrl ? { emailRedirectTo: redirectUrl } : {})
      }
    });
  } else {
    response = await supabase.auth.signInWithPassword({ email: data.email.trim(), password: data.password });
  }
  if (response.error) {
    setDialogMessage('#authMessage', response.error.message, true);
    return;
  }
  if (signup && !response.data.session) {
    setDialogMessage('#authMessage', 'Check your email and confirm your account before logging in.');
    return;
  }
  authForm.reset();
  closeDialog(authDialog);
}

async function handleBookingSubmit(event) {
  event.preventDefault();
  error.textContent = '';
  bookingStatus.replaceChildren();
  if (!currentUser) {
    showError('Please log in or create an account before submitting a booking.');
    setAuthMode('login');
    openDialog(authDialog);
    return;
  }
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
  const { error: insertError } = await supabase.from('bookings').insert({
    user_id: currentUser.id,
    customer_name: data.name.trim(),
    customer_phone: data.phone.trim(),
    service: data.service,
    vehicle: data.vehicle,
    pickup_location: data.pickup.trim(),
    destination: data.destination.trim() || null,
    travel_date: data.date,
    return_date: data.returnDate || null,
    customer_message: data.message.trim() || null,
    terms_accepted_at: termsConfig ? new Date().toISOString() : null
  });
  if (insertError) {
    showError('Your booking could not be saved. Please try again.');
    return;
  }
  const whatsappUrl = `https://wa.me/${BUSINESS.whatsapp}?text=${encodeURIComponent(createWhatsAppMessage(data))}`;
  showBookingSuccess(whatsappUrl);
  window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  form.reset();
  termsSection.hidden = true;
  agreement.required = false;
  setMinimumDate();
}

async function handleReviewSubmit(event) {
  event.preventDefault();
  const reviewForm = event.currentTarget;
  const data = Object.fromEntries(new FormData(reviewForm));
  setDialogMessage('#reviewMessage', '');
  if (!currentUser) return;
  const { error: insertError } = await supabase.from('reviews').insert({
    booking_id: data.bookingId,
    user_id: currentUser.id,
    rating: Number(data.rating),
    comment: data.comment.trim()
  });
  if (insertError) {
    setDialogMessage('#reviewMessage', 'Your review could not be submitted. Please try again.', true);
    return;
  }
  setDialogMessage('#reviewMessage', 'Thank you. Your review is now waiting for admin approval.');
  await loadMyBookings();
}

setMinimumDate();
renderServiceTerms();
loadPublicReviews();

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
document.querySelectorAll('[data-close-dialog]').forEach((button) => button.addEventListener('click', () => closeDialog(button.closest('dialog'))));
authButton.addEventListener('click', () => {
  if (currentUser) {
    openDialog(accountDialog);
    loadMyBookings();
  } else {
    setAuthMode('login');
    openDialog(authDialog);
  }
});
document.querySelector('#authSwitch').addEventListener('click', () => setAuthMode(document.querySelector('#authForm').elements.mode.value === 'login' ? 'signup' : 'login'));
document.querySelector('#authForm').addEventListener('submit', handleAuthSubmit);
document.querySelector('#signOutButton').addEventListener('click', async () => {
  await supabase.auth.signOut();
  closeDialog(accountDialog);
});
form.addEventListener('submit', handleBookingSubmit);
document.querySelector('#reviewForm').addEventListener('submit', handleReviewSubmit);
supabase.auth.getSession().then(({ data: { session } }) => {
  currentUser = session?.user ?? null;
  updateAuthButton();
});
supabase.auth.onAuthStateChange((_event, session) => {
  currentUser = session?.user ?? null;
  updateAuthButton();
});
