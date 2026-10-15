import { publicSupabase, supabase } from './supabase-client.js';
import {
  ALL_VEHICLES,
  SERVICE_VEHICLES,
  getIndiaLocalDate,
  validateBooking
} from './booking-validation.js';

const BUSINESS = {
  name: 'Karwa Tours & Travels',
  whatsapp: '918140057861'
};
const TOKEN_STORAGE_KEY = 'karwa.bookingRequestToken';

const form = document.querySelector('#bookingForm');
const error = document.querySelector('#error');
const bookingStatus = document.querySelector('#bookingStatus');
const serviceField = form.elements.service;
const vehicleField = form.elements.vehicle;
const dateField = form.elements.date;
const returnDateField = form.elements.returnDate;
const submitButton = form.querySelector('[type="submit"]');
const termsSection = document.querySelector('#serviceTerms');
const agreement = form.elements.termsAgreement;
const authDialog = document.querySelector('#authDialog');
const recoveryDialog = document.querySelector('#recoveryDialog');
const accountDialog = document.querySelector('#accountDialog');
const reviewDialog = document.querySelector('#reviewDialog');
const authButton = document.querySelector('#authButton');
let currentUser = null;
let isSubmittingBooking = false;

function createRequestToken() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  const bytes = new Uint8Array(16);
  window.crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map((value) => value.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function loadRequestToken() {
  try {
    const existing = sessionStorage.getItem(TOKEN_STORAGE_KEY);
    if (existing) return existing;
    const token = createRequestToken();
    sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
    return token;
  } catch {
    return createRequestToken();
  }
}

let requestToken = loadRequestToken();

function rotateRequestToken() {
  requestToken = createRequestToken();
  try {
    sessionStorage.setItem(TOKEN_STORAGE_KEY, requestToken);
  } catch {
    // The in-memory token still prevents duplicate requests in this page.
  }
}

function setMinimumDates() {
  const today = getIndiaLocalDate();
  dateField.min = today;
  returnDateField.min = dateField.value || today;
}

function renderVehicleOptions() {
  const previousValue = vehicleField.value;
  const vehicles = serviceField.value ? SERVICE_VEHICLES[serviceField.value] || [] : ALL_VEHICLES;
  vehicleField.replaceChildren(new Option('Select Vehicle', ''));
  vehicles.forEach((vehicle) => vehicleField.add(new Option(vehicle, vehicle)));
  if (vehicles.includes(previousValue)) vehicleField.value = previousValue;
}

function renderServiceTerms() {
  renderVehicleOptions();
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

function clearFieldErrors() {
  document.querySelectorAll('[data-field-error]').forEach((message) => { message.textContent = ''; });
  form.querySelectorAll('[aria-invalid="true"]').forEach((field) => field.removeAttribute('aria-invalid'));
  error.textContent = '';
}

function showValidationErrors(errors) {
  clearFieldErrors();
  const entries = Object.entries(errors);
  entries.forEach(([fieldName, message]) => {
    const target = fieldName === 'terms' ? agreement : form.elements[fieldName];
    const messageElement = form.querySelector(`[data-field-error="${fieldName}"]`);
    if (messageElement) messageElement.textContent = message;
    if (target) target.setAttribute('aria-invalid', 'true');
  });
  const termsError = document.querySelector('[data-field-error="terms"]');
  if (termsError) termsError.textContent = errors.terms || '';
  error.textContent = entries.length ? 'Please review the highlighted fields.' : '';
  const firstInvalid = entries.length ? form.elements[entries[0][0]] : null;
  if (errors.terms) termsSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
  else firstInvalid?.focus();
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
    : 'Log in to send a booking request, check its status, or review a completed journey.';
  document.querySelector('#authNameField').hidden = !isSignup;
  authForm.elements.fullName.required = isSignup;
  authForm.elements.password.autocomplete = isSignup ? 'new-password' : 'current-password';
  document.querySelector('#authSubmit').textContent = isSignup ? 'Create account' : 'Log in';
  document.querySelector('#authSwitch').textContent = isSignup
    ? 'Already have an account? Log in'
    : 'New here? Create an account';
  document.querySelector('#forgotPasswordButton').hidden = isSignup;
  setDialogMessage('#authMessage', '');
}

function formatDate(value) {
  return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeZone: 'Asia/Kolkata' })
    .format(new Date(`${value}T00:00:00+05:30`));
}

function createWhatsAppMessage(data, bookingId) {
  const reference = bookingId.slice(0, 8).toUpperCase();
  const termsConfig = SERVICE_TERMS[data.service];
  const acceptance = termsConfig ? '\nSelf-drive terms: Accepted' : '';
  return `Hello ${BUSINESS.name},\n\nI sent a booking request (reference ${reference}) and would like to check availability and final pricing.\n\nName: ${data.name.trim()}\nPhone: ${data.phone.trim()}\nService: ${data.service}\nVehicle: ${data.vehicle}\nPickup: ${data.pickup.trim()}\nDestination: ${data.destination.trim() || 'Not specified'}\nTravel date: ${data.date}\nReturn date: ${data.returnDate || 'Not specified'}\nAdditional message: ${data.message.trim() || 'None'}${acceptance}\n\nI understand this request is not a confirmed reservation. Thank you.`;
}

function showBookingSuccess(bookingId, data) {
  const reference = bookingId.slice(0, 8).toUpperCase();
  const whatsappNumber = String(BUSINESS.whatsapp || '').replace(/\D/g, '');
  const message = document.createElement('p');
  message.textContent = `Your request is saved (reference ${reference}). Karwa will confirm availability and final pricing with you. This is not yet a confirmed reservation.`;
  const fallback = document.createElement('p');
  if (/^\d{8,15}$/.test(whatsappNumber)) {
    const link = document.createElement('a');
    link.href = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(createWhatsAppMessage(data, bookingId))}`;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.className = 'btn whatsapp-continue';
    link.textContent = 'Continue on WhatsApp to check availability ↗';
    fallback.textContent = 'If WhatsApp does not open, use the button again or contact Karwa using the numbers in the Contact section.';
    bookingStatus.replaceChildren(message, link, fallback);
  } else {
    fallback.textContent = 'To check availability, contact Karwa using the numbers in the Contact section.';
    bookingStatus.replaceChildren(message, fallback);
  }
  bookingStatus.focus?.();
}

async function saveBooking(payload) {
  const { data, error: insertError } = await supabase
    .from('bookings')
    .insert(payload)
    .select('id')
    .single();
  if (!insertError && data?.id) return data.id;
  if (insertError?.code === '23505') {
    const { data: existing, error: lookupError } = await supabase
      .from('bookings')
      .select('id')
      .eq('user_id', payload.user_id)
      .eq('request_token', payload.request_token)
      .maybeSingle();
    if (!lookupError && existing?.id) return existing.id;
  }
  throw insertError || new Error('Booking request could not be saved.');
}

async function loadPublicReviews() {
  const list = document.querySelector('#reviewsList');
  const empty = document.querySelector('#reviewsEmpty');
  try {
    const { data, error: requestError } = await publicSupabase
      .from('reviews')
      .select('reviewer_name, rating, comment, created_at')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .limit(6);
    if (requestError || !data) return;
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
  } catch {
    // Keep the page usable if the reviews service is temporarily unavailable.
  }
}

async function loadMyBookings() {
  const container = document.querySelector('#myBookings');
  container.textContent = 'Loading your bookings…';
  try {
    const [{ data: bookings, error: bookingError }, { data: reviews, error: reviewError }] = await Promise.all([
      supabase.from('bookings').select('id, service, vehicle, travel_date, status, created_at').order('created_at', { ascending: false }),
      supabase.from('reviews').select('booking_id, status')
    ]);
    if (bookingError || reviewError || !bookings || !reviews) {
      container.textContent = 'We could not load your bookings right now. Please try again.';
      return;
    }
    if (!bookings.length) {
      container.textContent = 'You have not placed a booking request yet.';
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
      status.textContent = booking.status === 'pending' ? 'Request received — awaiting confirmation' : booking.status;
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
  } catch {
    container.textContent = 'We could not load your bookings right now. Please try again.';
  }
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
  const submit = document.querySelector('#authSubmit');
  submit.disabled = true;
  setDialogMessage('#authMessage', '');
  try {
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
      setDialogMessage('#authMessage', signup
        ? 'We could not create the account. Check the details and try again.'
        : 'We could not log you in. Check your details or use password recovery.', true);
      return;
    }
    if (signup && !response.data.session) {
      setDialogMessage('#authMessage', 'If this address can be registered, confirmation instructions will arrive by email.');
      return;
    }
    authForm.reset();
    closeDialog(authDialog);
  } catch {
    setDialogMessage('#authMessage', 'We could not reach the account service. Please try again.', true);
  } finally {
    submit.disabled = false;
  }
}

async function handleRecoverySubmit(event) {
  event.preventDefault();
  const recoveryForm = event.currentTarget;
  const submit = recoveryForm.querySelector('[type="submit"]');
  submit.disabled = true;
  setDialogMessage('#recoveryMessage', '');
  try {
    const email = new FormData(recoveryForm).get('email').trim();
    const redirectTo = new URL('/reset-password.html', window.location.origin).toString();
    const { error: recoveryError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    if (recoveryError) {
      setDialogMessage('#recoveryMessage', 'We could not send a reset link right now. Please try again shortly.', true);
      return;
    }
    setDialogMessage('#recoveryMessage', 'If an account can be recovered with that address, a reset link will arrive by email.');
  } catch {
    setDialogMessage('#recoveryMessage', 'We could not reach the account service. Please try again.', true);
  } finally {
    submit.disabled = false;
  }
}

async function handleBookingSubmit(event) {
  event.preventDefault();
  if (isSubmittingBooking) return;
  clearFieldErrors();
  bookingStatus.replaceChildren();
  const data = Object.fromEntries(new FormData(form));
  const errors = validateBooking(data);
  if (SERVICE_TERMS[data.service] && !agreement.checked) {
    errors.terms = 'Please read and agree to the self-drive terms before continuing.';
  }
  if (Object.keys(errors).length) {
    showValidationErrors(errors);
    return;
  }
  if (!currentUser) {
    error.textContent = 'Log in or create an account to send this request. Your trip details will remain in the form.';
    setAuthMode('login');
    openDialog(authDialog);
    return;
  }

  isSubmittingBooking = true;
  submitButton.disabled = true;
  submitButton.textContent = 'Saving request…';
  form.setAttribute('aria-busy', 'true');
  const payload = {
    request_token: requestToken,
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
    terms_accepted_at: SERVICE_TERMS[data.service] ? new Date().toISOString() : null
  };
  try {
    const bookingId = await saveBooking(payload);
    showBookingSuccess(bookingId, data);
    form.reset();
    termsSection.hidden = true;
    agreement.required = false;
    renderVehicleOptions();
    setMinimumDates();
    rotateRequestToken();
  } catch {
    error.textContent = 'We could not save your request. Your details are still here; please try again.';
  } finally {
    isSubmittingBooking = false;
    submitButton.disabled = false;
    submitButton.textContent = 'Send Booking Request ↗';
    form.removeAttribute('aria-busy');
  }
}

async function handleReviewSubmit(event) {
  event.preventDefault();
  const reviewForm = event.currentTarget;
  const submit = reviewForm.querySelector('[type="submit"]');
  const data = Object.fromEntries(new FormData(reviewForm));
  setDialogMessage('#reviewMessage', '');
  if (!currentUser) {
    setDialogMessage('#reviewMessage', 'Log in again to submit your review.', true);
    return;
  }
  submit.disabled = true;
  try {
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
    setDialogMessage('#reviewMessage', 'Thank you. Your review is waiting for approval.');
    await loadMyBookings();
  } catch {
    setDialogMessage('#reviewMessage', 'We could not reach the reviews service. Please try again.', true);
  } finally {
    submit.disabled = false;
  }
}

setMinimumDates();
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
serviceField.addEventListener('change', () => {
  renderServiceTerms();
  clearFieldErrors();
});
dateField.addEventListener('change', () => {
  setMinimumDates();
  clearFieldErrors();
});
returnDateField.addEventListener('change', clearFieldErrors);
form.querySelectorAll('input, select, textarea').forEach((field) => field.addEventListener('input', () => {
  const errorMessage = form.querySelector(`[data-field-error="${field.name}"]`);
  if (errorMessage) errorMessage.textContent = '';
  field.removeAttribute('aria-invalid');
  const remainingErrors = [...form.querySelectorAll('[data-field-error]')].some((item) => item.textContent);
  error.textContent = remainingErrors ? 'Please review the highlighted fields.' : '';
}));
document.querySelectorAll('[data-vehicle]').forEach((button) => button.addEventListener('click', () => {
  const requestedVehicle = button.dataset.vehicle;
  const requestedService = button.dataset.service;
  if (requestedService) serviceField.value = requestedService;
  renderServiceTerms();
  if ([...vehicleField.options].some((option) => option.value === requestedVehicle)) {
    vehicleField.value = requestedVehicle;
  }
  document.querySelector('#booking').scrollIntoView({ behavior: 'smooth', block: 'start' });
  (requestedService ? dateField : serviceField).focus();
}));
document.querySelectorAll('[data-open-auth]').forEach((button) => button.addEventListener('click', () => {
  setAuthMode(button.dataset.openAuth);
  openDialog(authDialog);
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
document.querySelector('#forgotPasswordButton').addEventListener('click', () => {
  setDialogMessage('#recoveryMessage', '');
  closeDialog(authDialog);
  openDialog(recoveryDialog);
});
document.querySelector('#recoveryBackButton').addEventListener('click', () => {
  closeDialog(recoveryDialog);
  setAuthMode('login');
  openDialog(authDialog);
});
document.querySelector('#authForm').addEventListener('submit', handleAuthSubmit);
document.querySelector('#recoveryForm').addEventListener('submit', handleRecoverySubmit);
document.querySelector('#signOutButton').addEventListener('click', async () => {
  await supabase.auth.signOut();
  closeDialog(accountDialog);
});
form.addEventListener('submit', handleBookingSubmit);
document.querySelector('#reviewForm').addEventListener('submit', handleReviewSubmit);
const authInitialization = supabase.auth.getSession().then(({ data: { session } }) => {
  currentUser = session?.user ?? null;
  updateAuthButton();
}).catch(() => {
  currentUser = null;
  updateAuthButton();
});
supabase.auth.onAuthStateChange((_event, session) => {
  currentUser = session?.user ?? null;
  updateAuthButton();
});
await authInitialization;
