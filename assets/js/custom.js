const updateRatingDisplay = (rating) => {
  const output = rating.closest('.rating-field').querySelector('output');
  const min = Number(rating.min);
  const max = Number(rating.max);
  const progress = ((Number(rating.value) - min) / (max - min)) * 100;

  output.value = rating.value;
  rating.style.setProperty('--rating-progress', `${progress}%`);
};

document.querySelectorAll('.contact-rating').forEach((rating) => {
  rating.addEventListener('input', () => updateRatingDisplay(rating));
  updateRatingDisplay(rating);
});

const normalizeLithuanianPhoneDigits = (value) => {
  let digits = value.replace(/\D/g, '');

  if (digits.startsWith('370') && digits.length > 3) {
    digits = digits.slice(3);
  } else if (digits.startsWith('0')) {
    digits = digits.slice(1);
  }

  if (!digits.startsWith('6')) {
    const mobilePrefixIndex = digits.indexOf('6');
    digits = mobilePrefixIndex === -1 ? '' : digits.slice(mobilePrefixIndex);
  }

  return digits.slice(0, 8);
};

const formatLithuanianPhone = (digits) => {
  const subscriberDigits = digits.slice(1);
  const areaCode = subscriberDigits.slice(0, 2);
  const number = subscriberDigits.slice(2, 7);
  return `+370 6${areaCode}${number ? ` ${number}` : ''}`;
};

const contactForm = document.querySelector('.contact .php-email-form');
const contactFormResults = document.querySelector('#contact-form-results');

if (contactForm && contactFormResults) {
  const submitButton = contactForm.querySelector('button[type="submit"]');
  const fields = Array.from(contactForm.querySelectorAll('[name]'));
  const phoneField = contactForm.querySelector('[name="phone"]');
  const touchedFields = new Set();
  const fieldLabels = {
    name: 'Vardas',
    surname: 'Pavardė',
    email: 'El. paštas',
    phone: 'Tel. Numeris',
    address: 'Adresas',
    design_rating: 'Svetainės dizaino įvertinimas',
    content_rating: 'Informacijos įvertinimas',
    usability_rating: 'Svetainės patogumo įvertinimas'
  };

  const getValidationMessage = (field) => {
    const value = field.value.trim();

    if (field.required && !value) {
      return 'Šį lauką būtina užpildyti.';
    }

    if (field.name === 'name' || field.name === 'surname') {
      return /^\p{L}+$/u.test(field.value) ? '' : 'Galima įvesti tik raides.';
    }

    if (field.type === 'email' && field.validity.typeMismatch) {
      return 'Įveskite tinkamo formato el. pašto adresą.';
    }

    if (field.name === 'phone' && !/^\+370 6\d{2} \d{5}$/.test(value)) {
      return 'Telefono numeris turi būti formato +370 6xx xxxxx.';
    }

    if (field.type === 'range') {
      const score = Number(value);
      if (!Number.isFinite(score) || score < Number(field.min) || score > Number(field.max)) {
        return `Įvertinimas turi būti nuo ${field.min} iki ${field.max}.`;
      }
    }

    return '';
  };

  const updateFieldValidation = (field) => {
    const message = getValidationMessage(field);
    const errorElement = field.parentElement.querySelector('.field-error');
    const showError = touchedFields.has(field) && Boolean(message);

    field.parentElement.classList.toggle('has-validation-error', showError);
    field.setAttribute('aria-invalid', String(showError));
    errorElement.textContent = showError ? message : '';
    errorElement.hidden = !showError;
    return !message;
  };

  const updateValidation = () => {
    const formIsValid = fields.map(updateFieldValidation).every(Boolean);
    submitButton.disabled = !formIsValid;
  };

  fields.forEach((field, index) => {
    const errorElement = document.createElement('span');
    errorElement.className = 'field-error';
    errorElement.id = `contact-field-error-${index}`;
    errorElement.hidden = true;
    field.parentElement.append(errorElement);
    field.setAttribute('aria-describedby', errorElement.id);
  });

  phoneField.addEventListener('input', () => {
    const digits = normalizeLithuanianPhoneDigits(phoneField.value);
    phoneField.value = formatLithuanianPhone(digits);
    phoneField.setSelectionRange(phoneField.value.length, phoneField.value.length);
  });

  contactForm.addEventListener('input', (event) => {
    if (fields.includes(event.target)) {
      touchedFields.add(event.target);
      updateValidation();
    }
  });

  contactForm.addEventListener('change', (event) => {
    if (fields.includes(event.target)) {
      touchedFields.add(event.target);
      updateValidation();
    }
  });

  contactForm.addEventListener('focusout', (event) => {
    if (fields.includes(event.target)) {
      touchedFields.add(event.target);
      updateValidation();
    }
  });

  contactForm.addEventListener('reset', () => {
    window.setTimeout(() => {
      touchedFields.clear();
      contactFormResults.replaceChildren();
      contactFormResults.hidden = true;
      contactForm.querySelector('.error-message').textContent = '';
      contactForm.querySelector('.error-message').classList.remove('d-block');
      contactForm.querySelector('.sent-message').classList.remove('d-block');
      contactForm.querySelector('.loading').classList.remove('d-block');
      contactForm.querySelectorAll('.contact-rating').forEach(updateRatingDisplay);
      updateValidation();
    });
  });

  updateValidation();

  contactForm.addEventListener('submit', (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();

    if (!fields.map(updateFieldValidation).every(Boolean)) {
      fields.forEach((field) => touchedFields.add(field));
      updateValidation();
      return;
    }

    const formData = Object.fromEntries(new FormData(contactForm).entries());
    console.log(formData);

    const resultLines = Object.entries(fieldLabels).map(([fieldName, label]) => {
      const line = document.createElement('p');
      line.textContent = `${label}: ${formData[fieldName]}`;
      return line;
    });

    const ratings = ['design_rating', 'content_rating', 'usability_rating'];
    const average = ratings.reduce((sum, fieldName) => sum + Number(formData[fieldName]), 0) / ratings.length;
    const averageLine = document.createElement('p');
    averageLine.textContent = `${formData.name} ${formData.surname}: ${new Intl.NumberFormat('lt-LT', {
      maximumFractionDigits: 2
    }).format(average)}`;
    averageLine.className = 'rating-average';

    contactFormResults.replaceChildren(...resultLines, averageLine);
    contactFormResults.hidden = false;
  }, true);
}