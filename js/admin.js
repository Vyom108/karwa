import { supabase } from './supabase-client.js';

const adminStatus = document.querySelector('#adminStatus');
const bookingList = document.querySelector('#bookingAdminList');
const reviewList = document.querySelector('#reviewAdminList');

function setStatus(message, isError = false) {
  adminStatus.textContent = message;
  adminStatus.classList.toggle('is-error', isError);
}

function formatDate(value) {
  return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(new Date(`${value}T00:00:00`));
}

function makeSelect(values, selected) {
  const select = document.createElement('select');
  values.forEach((value) => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = value;
    option.selected = value === selected;
    select.append(option);
  });
  return select;
}

function makeAction(label, values, selected, onSave) {
  const actions = document.createElement('div');
  actions.className = 'admin-actions';
  const labelElement = document.createElement('label');
  labelElement.textContent = label;
  const select = makeSelect(values, selected);
  const button = document.createElement('button');
  button.className = 'btn';
  button.type = 'button';
  button.textContent = 'Save';
  button.addEventListener('click', () => onSave(select.value, button));
  actions.append(labelElement, select, button);
  return actions;
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
  contact.textContent = `${booking.customer_phone}${booking.customer_message ? ` · Note: ${booking.customer_message}` : ''}`;
  details.append(title, trip, route, contact);
  const actions = makeAction('Booking status', ['pending', 'confirmed', 'completed', 'cancelled'], booking.status, async (status, button) => {
    button.disabled = true;
    const { error } = await supabase.from('bookings').update({ status }).eq('id', booking.id);
    button.disabled = false;
    if (error) {
      setStatus('You do not have permission to update this booking.', true);
      return;
    }
    setStatus('Booking status updated.');
    loadBookings();
  });
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
  details.append(title, comment, meta);
  const actions = makeAction('Review status', ['pending', 'approved', 'rejected'], review.status, async (status, button) => {
    button.disabled = true;
    const { error } = await supabase.from('reviews').update({ status }).eq('id', review.id);
    button.disabled = false;
    if (error) {
      setStatus('You do not have permission to update this review.', true);
      return;
    }
    setStatus('Review status updated.');
    loadReviews();
  });
  card.append(details, actions);
  return card;
}

async function loadBookings() {
  bookingList.textContent = 'Loading bookings…';
  const { data, error } = await supabase
    .from('bookings')
    .select('id, customer_name, customer_phone, service, vehicle, pickup_location, destination, travel_date, return_date, customer_message, status, created_at')
    .order('created_at', { ascending: false });
  if (error) {
    bookingList.textContent = 'Unable to load bookings.';
    setStatus('Admin access is required. Log in on the main website using the approved admin email.', true);
    return;
  }
  bookingList.replaceChildren();
  if (!data.length) {
    const empty = document.createElement('p');
    empty.className = 'admin-empty';
    empty.textContent = 'No bookings are available yet.';
    bookingList.append(empty);
    return;
  }
  bookingList.append(...data.map(createBookingCard));
}

async function loadReviews() {
  reviewList.textContent = 'Loading reviews…';
  const { data, error } = await supabase
    .from('reviews')
    .select('id, reviewer_name, rating, comment, status, created_at')
    .order('created_at', { ascending: false });
  if (error) {
    reviewList.textContent = 'Unable to load reviews.';
    setStatus('Admin access is required. Log in on the main website using the approved admin email.', true);
    return;
  }
  reviewList.replaceChildren();
  if (!data.length) {
    const empty = document.createElement('p');
    empty.className = 'admin-empty';
    empty.textContent = 'No reviews are awaiting approval.';
    reviewList.append(empty);
    return;
  }
  reviewList.append(...data.map(createReviewCard));
}

async function initialize() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    setStatus('Log in on the main website first, then return here with your approved admin account.', true);
    bookingList.textContent = 'Admin login required.';
    reviewList.textContent = 'Admin login required.';
    return;
  }
  setStatus(`Signed in as ${session.user.email}. Loading admin data…`);
  await Promise.all([loadBookings(), loadReviews()]);
}

document.querySelector('#refreshBookings').addEventListener('click', loadBookings);
document.querySelector('#refreshReviews').addEventListener('click', loadReviews);
initialize();
