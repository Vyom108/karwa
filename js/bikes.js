document.querySelectorAll('[data-service]').forEach((button) => {
  button.addEventListener('click', () => {
    form.service.value = button.dataset.service;
  });
});
