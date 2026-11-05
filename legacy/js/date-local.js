const localDate = new Date();
localDate.setMinutes(localDate.getMinutes() - localDate.getTimezoneOffset());
date.min = localDate.toISOString().slice(0, 10);
