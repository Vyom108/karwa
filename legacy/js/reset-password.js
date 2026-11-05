import { supabase } from './supabase-client.js';

const status = document.querySelector('#resetStatus');
const form = document.querySelector('#resetForm');
const error = document.querySelector('#resetError');
const returnLink = document.querySelector('#resetReturn');
const submit = form.querySelector('[type="submit"]');
let recoveryReady = false;
const authLinkType = new URLSearchParams(window.location.hash.slice(1)).get('type')
  || new URLSearchParams(window.location.search).get('type');
const isRecoveryLink = authLinkType === 'recovery';
const isInviteLink = authLinkType === 'invite';

function showInvalidLink() {
  status.textContent = 'This reset link is invalid, expired, or already used. Request a new link from the login window.';
  returnLink.hidden = false;
}

const urlError = new URLSearchParams(window.location.hash.slice(1)).get('error_description');
if (urlError) {
  showInvalidLink();
} else {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    if (session && (event === 'PASSWORD_RECOVERY' && isRecoveryLink || event === 'SIGNED_IN' && isInviteLink)) {
      recoveryReady = true;
      status.textContent = 'Enter and confirm your new password.';
      form.hidden = false;
    }
  });

  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (session && !sessionError && recoveryReady && (isRecoveryLink || isInviteLink)) {
      recoveryReady = true;
      status.textContent = 'Enter and confirm your new password.';
      form.hidden = false;
    } else if (!recoveryReady) {
      showInvalidLink();
    }
  } catch {
    showInvalidLink();
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    error.textContent = '';
    const data = new FormData(form);
    const password = data.get('password');
    if (password.length < 8) {
      error.textContent = 'Use at least 8 characters.';
      return;
    }
    if (password !== data.get('confirmPassword')) {
      error.textContent = 'The passwords do not match.';
      form.elements.confirmPassword.focus();
      return;
    }
    if (!recoveryReady) {
      showInvalidLink();
      return;
    }
    submit.disabled = true;
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        error.textContent = 'We could not update your password. Request a fresh reset link and try again.';
        return;
      }
      form.hidden = true;
      status.textContent = 'Your password has been updated. You can return to Karwa and log in.';
      returnLink.hidden = false;
    } catch {
      error.textContent = 'We could not reach the account service. Please try again.';
    } finally {
      submit.disabled = false;
    }
  });
  window.addEventListener('pagehide', () => subscription.unsubscribe(), { once: true });
}
