import { supabase } from './supabase-client.js';
import { BOOKING_TRANSITIONS, REVIEW_TRANSITIONS } from './admin-workflow.js';

const adminStatus = document.querySelector('#adminStatus');
const bookingList = document.querySelector('#bookingAdminList');
const reviewList = document.querySelector('#reviewAdminList');
const filters = document.querySelector('#bookingFilters');
let bookings = [];
let isAuthorized = false;

function setStatus(message, isError = false) {
  adminStatus.textContent = message;
  adminStatus.classList.toggle('is-error', isError);
}

function formatDate(value) {
  if (!value) return 'Not specified';
  return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeZone: 'Asia/Kolkata' })
    .format(new Date(`${value}T00:00:00+05:30`));
}

function makeSelect(values, selected) {
  const select = document.createElement('select');
  values.forEach((value) => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = value[0].toUpperCase() + value.slice(1);
    option.selected = value === selected;
    select.append(option);
  });
  return select;
}

function makeAction(label, transitions, current, onSave) {
  const actions = document.createElement('div');
  actions.className = 'admin-actions';
  const labelElement = document.createElement('label');
  labelElement.textContent = label;
  const select = makeSelect([current, ...transitions], current);
  const button = document.createElement('button');
  button.className = 'btn';
  button.type = 'button';
  button.textContent = transitions.length ? 'Save status' : 'No further changes';
  button.disabled = transitions.length === 0;
  button.addEventListener('click', () => {
    if (select.value === current) return;
    onSave(select.value, button);
  });
  actions.append(labelElement, select, button);
  return actions;
}

async function changeStatus(table, id, status, button, label, reload) {
  if (!isAuthorized) return;
  if (!window.confirm(`Change this ${label} status to “${status}”?`)) return;
  button.disabled = true;
  const { data, error } = await supabase.from(table).update({ status }).eq('id', id).select('id').maybeSingle();
  button.disabled = false;
  if (error || !data) {
    setStatus(`Unable to update ${label}. Your access may have changed; refresh and try again.`, true);
    return;
  }
  setStatus(`${label[0].toUpperCase() + label.slice(1)} status updated.`);
  await reload();
}

function createBookingCard(booking) {
  const card = document.createElement('article');
  card.className = 'admin-card';
  const details = document.createElement('div');
  const title = document.createElement('h3');
  title.textContent = `${booking.customer_name} — ${booking.vehicle}`;
  const trip = document.createElement('p');
  trip.textContent = `${booking.service} · ${formatDate(booking.travel_date)}${booking.return_date ? ` to ${formatDate(booking.return_date)}` : ''}`;
  const route = document.createElement('p');
  route.textContent = `${booking.pickup_location} → ${booking.destination || 'Destination not specified'}`;
  const contact = document.createElement('p');
  contact.className = 'admin-meta';
  contact.textContent = `Customer phone: ${booking.customer_phone}${booking.customer_message ? ` · Note: ${booking.customer_message}` : ''}`;
  const created = document.createElement('p');
  created.className = 'admin-meta';
  created.textContent = `Request received ${new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(booking.created_at))}`;
  const acceptedTerms = document.createElement('p');
  acceptedTerms.className = 'admin-meta';
  acceptedTerms.textContent = booking.terms_accepted_at
    ? `Self-drive terms accepted ${new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(booking.terms_accepted_at))}`
    : 'No self-drive terms acceptance recorded';
  const currentStatus = document.createElement('p');
  currentStatus.className = `booking-state is-${booking.status}`;
  currentStatus.textContent = `Current status: ${booking.status}`;
  details.append(title, trip, route, contact, created, acceptedTerms, currentStatus);
  const actions = makeAction('Next booking status', BOOKING_TRANSITIONS[booking.status] || [], booking.status, (status, button) =>
    changeStatus('bookings', booking.id, status, button, 'booking', loadBookings));
  card.append(details, actions);
  return card;
}

function createReviewCard(review) {
  const card = document.createElement('article');
  card.className = 'admin-card';
  const details = document.createElement('div');
  const title = document.createElement('h3');
  title.textContent = `${review.reviewer_name} — ${'★'.repeat(review.rating)}`;
  const comment = document.createElement('p');
  comment.className = 'admin-comment';
  comment.textContent = review.comment;
  const meta = document.createElement('p');
  meta.className = 'admin-meta';
  meta.textContent = `Submitted ${new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(new Date(review.created_at))}`;
  const status = document.createElement('p');
  status.className = 'admin-meta';
  status.textContent = `Current status: ${review.status}`;
  details.append(title, comment, meta, status);
  const actions = makeAction('Next review status', REVIEW_TRANSITIONS[review.status] || [], review.status, (next, button) =>
    changeStatus('reviews', review.id, next, button, 'review', loadReviews));
  card.append(details, actions);
  return card;
}

function populateFilterOptions(name, values) {
  const select = filters.elements[name];
  const current = select.value;
  select.replaceChildren(new Option(`All ${name}s`, ''));
  [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b)).forEach((value) => select.add(new Option(value, value)));
  select.value = values.includes(current) ? current : '';
}

function renderBookings() {
  if (!isAuthorized) return;
  const query = filters.elements.search.value.trim().toLocaleLowerCase();
  const status = filters.elements.status.value;
  const service = filters.elements.service.value;
  const vehicle = filters.elements.vehicle.value;
  const date = filters.elements.date.value;
  const filtered = bookings.filter((booking) => {
    const searchable = [booking.customer_name, booking.customer_phone, booking.pickup_location, booking.destination, booking.customer_message]
      .filter(Boolean).join(' ').toLocaleLowerCase();
    return (!query || searchable.includes(query))
      && (!status || booking.status === status)
      && (!service || booking.service === service)
      && (!vehicle || booking.vehicle === vehicle)
      && (!date || booking.travel_date === date);
  });
  bookingList.replaceChildren();
  if (!filtered.length) {
    const empty = document.createElement('p');
    empty.className = 'admin-empty';
    empty.textContent = bookings.length ? 'No bookings match these filters.' : 'No bookings are available yet.';
    bookingList.append(empty);
    return;
  }
  bookingList.append(...filtered.map(createBookingCard));
}

async function loadBookings() {
  if (!isAuthorized) return;
  bookingList.textContent = 'Loading bookings…';
  const { data, error } = await supabase
    .from('bookings')
    .select('id, customer_name, customer_phone, service, vehicle, pickup_location, destination, travel_date, return_date, customer_message, status, created_at, terms_accepted_at')
    .order('created_at', { ascending: false });
  if (error) {
    bookingList.textContent = 'Unable to load bookings.';
    setStatus('Admin access is required. Sign in at the admin login page using the account approved by the site owner.', true);
    return;
  }
  bookings = data || [];
  populateFilterOptions('service', bookings.map((booking) => booking.service));
  populateFilterOptions('vehicle', bookings.map((booking) => booking.vehicle));
  renderBookings();
}

async function loadReviews() {
  if (!isAuthorized) return;
  reviewList.textContent = 'Loading reviews…';
  const { data, error } = await supabase
    .from('reviews')
    .select('id, reviewer_name, rating, comment, status, created_at')
    .order('created_at', { ascending: false });
  if (error) {
    reviewList.textContent = 'Unable to load reviews.';
    setStatus('Unable to load reviews. Your admin access may have changed.', true);
    return;
  }
  reviewList.replaceChildren();
  if (!data?.length) {
    const empty = document.createElement('p');
    empty.className = 'admin-empty';
    empty.textContent = 'No reviews are available yet.';
    reviewList.append(empty);
    return;
  }
  reviewList.append(...data.map(createReviewCard));
}

async function initialize() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error || !session) {
    setStatus('Admin sign in is required.', true);
    bookingList.textContent = 'Sign in to view protected booking information.';
    reviewList.textContent = 'Sign in to view customer reviews.';
    window.location.replace('admin-login.html');
    return;
  }
  const { data: authorized, error: roleError } = await supabase.rpc('is_admin');
  if (roleError || authorized !== true) {
    setStatus('This account is not authorized to manage bookings or reviews.', true);
    bookingList.textContent = 'Admin access required.';
    reviewList.textContent = 'Admin access required.';
    await supabase.auth.signOut();
    window.location.replace('admin-login.html');
    return;
  }
  isAuthorized = true;
  setStatus('Admin access confirmed. Customer information is visible to authorized staff only.');
  await Promise.all([loadBookings(), loadReviews()]);
}

filters.addEventListener('input', renderBookings);
filters.addEventListener('change', renderBookings);
filters.addEventListener('reset', () => setTimeout(renderBookings));
document.querySelector('#refreshBookings').addEventListener('click', loadBookings);
document.querySelector('#refreshReviews').addEventListener('click', loadReviews);
document.querySelector('#adminLogout').addEventListener('click', async (event) => {
  event.currentTarget.disabled = true;
  await supabase.auth.signOut();
  window.location.replace('admin-login.html');
});
supabase.auth.onAuthStateChange((event) => {
  if (event === 'SIGNED_OUT') window.location.replace('admin-login.html');
});
initialize();
