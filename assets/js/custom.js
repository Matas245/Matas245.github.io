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

const skills = [
  { name: 'HTML semantika', status: 'Atlikta', xp: 80 },
  { name: 'CSS ir prisitaikomas dizainas', status: 'Atlikta', xp: 70 },
  { name: 'JavaScript programavimas', status: 'Mokomasi', xp: 65 },
  { name: 'Git ir GitHub', status: 'Atlikta', xp: 60 },
  { name: 'REST API integracija', status: 'Mokomasi', xp: 55 },
  { name: 'SQL duomenų bazės', status: 'Planuojama', xp: 50 },
  { name: 'Naudotojo patirties testavimas', status: 'Planuojama', xp: 45 },
  { name: 'Žiniatinklio saugumas', status: 'Mokomasi', xp: 35 }
];

const skillStatusStorageKey = 'cv-skill-statuses-v1';
const validSkillStatuses = ['Planuojama', 'Mokomasi', 'Atlikta'];

function loadSkillStatuses() {
  const savedData = localStorage.getItem(skillStatusStorageKey);
  if (savedData === null) {
    return;
  }

  const savedStatuses = JSON.parse(savedData);
  if (!savedStatuses || typeof savedStatuses !== 'object' || Array.isArray(savedStatuses)) {
    throw new TypeError('Išsaugotos įgūdžių būsenos turi būti objektas.');
  }

  skills.forEach((skill) => {
    if (!Object.prototype.hasOwnProperty.call(savedStatuses, skill.name)) {
      return;
    }

    const savedStatus = savedStatuses[skill.name];
    if (!validSkillStatuses.includes(savedStatus)) {
      throw new TypeError(`Netinkama išsaugota įgūdžio „${skill.name}“ būsena.`);
    }

    skill.status = savedStatus;
  });
}

function saveSkillStatuses(changedSkill, newStatus) {
  const statuses = Object.fromEntries(skills.map((skill) => [skill.name, skill.status]));
  statuses[changedSkill.name] = newStatus;
  localStorage.setItem(skillStatusStorageKey, JSON.stringify(statuses));
}

function updateSkillAvatar(level, rank) {
  const avatar = document.getElementById('skill-level-avatar');
  let avatarPath;

  if (level === 1) {
    avatarPath = 'assets/img/skill-avatar-level-1.svg';
  } else if (level === 2) {
    avatarPath = 'assets/img/skill-avatar-level-2.svg';
  } else if (level === 3) {
    avatarPath = 'assets/img/skill-avatar-level-3.svg';
  } else {
    avatarPath = 'assets/img/skill-avatar-level-4.svg';
  }

  avatar.src = avatarPath;
  avatar.alt = `Vartotojo personažas: ${rank}, ${level} lygis`;
}

function updateAchievements(completedSkillCount, level) {
  const achievements = [
    { id: 'achievement-discoverer', unlocked: completedSkillCount >= 1 },
    { id: 'achievement-master', unlocked: completedSkillCount >= 4 },
    { id: 'achievement-expert', unlocked: level >= 4 }
  ];

  achievements.forEach((achievement) => {
    const card = document.getElementById(achievement.id);
    card.classList.toggle('is-unlocked', achievement.unlocked);
    card.classList.toggle('is-locked', !achievement.unlocked);
    card.querySelector('.achievement-status').textContent = achievement.unlocked ? 'Atrakinta' : 'Neatrakinta';
  });
}

function createSkillCard(skill) {
  const card = document.createElement('article');
  card.className = 'skill-card';

  const header = document.createElement('div');
  header.className = 'skill-card-header';

  const title = document.createElement('h5');
  title.textContent = skill.name;

  const xp = document.createElement('span');
  xp.className = 'skill-xp';
  xp.textContent = `${skill.xp} XP`;

  header.append(title, xp);

  const statusSelect = document.createElement('select');
  statusSelect.className = 'skill-status';

  ['Planuojama', 'Mokomasi', 'Atlikta'].forEach((status) => {
    const option = document.createElement('option');
    option.value = status;
    option.textContent = status;
    option.selected = skill.status === status;
    statusSelect.append(option);
  });

  statusSelect.addEventListener('change', () => {
    const newStatus = statusSelect.value;

    try {
      saveSkillStatuses(skill, newStatus);
    } catch (error) {
      statusSelect.value = skill.status;
      throw error;
    }

    skill.status = newStatus;
    renderSkillKanban();
  });

  card.append(header, statusSelect);
  return card;
}

function renderSkillKanban() {
  const columns = {
    'Planuojama': document.getElementById('kanban-planned'),
    'Mokomasi': document.getElementById('kanban-learning'),
    'Atlikta': document.getElementById('kanban-completed')
  };

  Object.values(columns).forEach((column) => column.replaceChildren());

  skills.forEach((skill) => {
    const column = columns[skill.status];
    if (column) {
      column.append(createSkillCard(skill));
    }
  });

  const completedSkills = skills.filter((skill) => skill.status === 'Atlikta');
  const completedXp = completedSkills.reduce((total, skill) => total + skill.xp, 0);
  const completedPercent = skills.length === 0 ? 0 : Math.round((completedSkills.length / skills.length) * 100);

  let level;
  let rank;
  let levelStartXp;
  let nextLevelXp;

  if (completedXp >= 300) {
    level = 4;
    rank = 'Profesionalas';
    levelStartXp = 300;
    nextLevelXp = 300;
  } else if (completedXp >= 150) {
    level = 3;
    rank = 'Specialistas';
    levelStartXp = 150;
    nextLevelXp = 300;
  } else if (completedXp >= 50) {
    level = 2;
    rank = 'Praktikantas';
    levelStartXp = 50;
    nextLevelXp = 150;
  } else {
    level = 1;
    rank = 'Pradedantysis';
    levelStartXp = 0;
    nextLevelXp = 50;
  }

  const isMaxLevel = level === 4;
  const progressPercent = isMaxLevel ? 100 : Math.round(((completedXp - levelStartXp) / (nextLevelXp - levelStartXp)) * 100);

  document.getElementById('skill-total-xp').textContent = `${completedXp} XP`;
  document.getElementById('skill-level').textContent = level;
  document.getElementById('skill-rank').textContent = rank;
  updateSkillAvatar(level, rank);
  document.getElementById('skill-count').textContent = skills.length;
  document.getElementById('completed-skill-count').textContent = completedSkills.length;
  document.getElementById('completed-skill-percent').textContent = `${completedPercent}%`;
  updateAchievements(completedSkills.length, level);
  document.getElementById('level-progress-title').textContent = isMaxLevel ? 'Maksimalus lygis pasiektas' : `Progresas iki ${level + 1} lygio`;
  document.getElementById('level-progress-xp').textContent = isMaxLevel ? `${completedXp} XP` : `${completedXp} / ${nextLevelXp} XP`;
  document.getElementById('level-progress-fill').style.width = `${progressPercent}%`;
}

if (document.querySelector('.skill-kanban')) {
  loadSkillStatuses();
  renderSkillKanban();
}