import { supabase } from './supabase-client.js';

const form = document.querySelector('#adminLoginForm');
const status = document.querySelector('#adminLoginStatus');

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;
  status.textContent = 'Checking your account…';
  status.classList.remove('is-error');
  const values = new FormData(form);
  const { error: loginError } = await supabase.auth.signInWithPassword({
    email: String(values.get('email')).trim(),
    password: String(values.get('password'))
  });
  if (loginError) {
    status.textContent = 'Sign-in failed. Check your email and password, or use the invitation email to set your password.';
    status.classList.add('is-error');
    button.disabled = false;
    return;
  }

  const { data: authorized, error: roleError } = await supabase.rpc('is_admin');
  if (roleError || authorized !== true) {
    await supabase.auth.signOut();
    status.textContent = 'This account is not authorized for the admin dashboard. Contact the site owner.';
    status.classList.add('is-error');
    button.disabled = false;
    return;
  }
  window.location.replace('admin.html');
});


document.querySelector('#adminForgotPassword').addEventListener('click', async (event) => {
  const email = String(new FormData(form).get('email') || '').trim();
  if (!email) {
    status.textContent = 'Enter the invited account email first.';
    form.elements.email.focus();
    return;
  }
  const button = event.currentTarget;
  button.disabled = true;
  status.classList.remove('is-error');
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password.html`
  });
  status.textContent = error
    ? 'We could not send a password email. Ask the site owner to resend the invitation.'
    : 'If the account is eligible, password instructions will arrive by email.';
  button.disabled = false;
});
