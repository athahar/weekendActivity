// =============================================
// Profile Persistence (localStorage)
// =============================================
const PROFILE_KEY = 'wanderspark_profile';
const CHATS_KEY = 'wanderspark_chats';

function saveProfile() {
  const profile = {
    city: $('#cityInput').val(),
    kidsAges: getKidsAges(),
    radiusMiles: parseInt($('#radiusSelect').val(), 10),
    targetDate: $('#dateInput').val(),
    preferences: {
      music: $('#music').is(':checked'),
      outdoors: $('#outdoors').is(':checked'),
      kids: $('#kids').is(':checked'),
      food: $('#food').is(':checked'),
      wellness: $('#wellness').is(':checked'),
      markets: $('#markets').is(':checked')
    }
  };
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

function loadProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return;
    const profile = JSON.parse(raw);

    if (profile.city) {
      $('#cityInput').val(profile.city);
    }

    if (profile.radiusMiles) {
      $('#radiusSelect').val(profile.radiusMiles);
    }

    if (profile.targetDate) {
      $('#dateInput').val(profile.targetDate);
    }

    if (profile.preferences) {
      Object.entries(profile.preferences).forEach(([key, val]) => {
        $(`#${key}`).prop('checked', val);
      });
    }

    if (Array.isArray(profile.kidsAges) && profile.kidsAges.length > 0) {
      $('#kidsAgeInputs').empty();
      profile.kidsAges.forEach(age => {
        const row = $(`
          <div class="age-row">
            <input type="number" class="kid-age" min="0" max="17" placeholder="Age" value="${age}" />
            <button type="button" class="remove-kid-btn" title="Remove">&times;</button>
          </div>
        `);
        $('#kidsAgeInputs').append(row);
      });
    }
  } catch (e) {
    console.warn('Failed to load profile:', e);
  }
}

// =============================================
// Chat History (localStorage)
// =============================================
let activeChatId = null;

function getChats() {
  try {
    const raw = localStorage.getItem(CHATS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveChat(chatEntry) {
  const chats = getChats();
  chats.unshift(chatEntry);
  if (chats.length > 50) chats.length = 50;
  localStorage.setItem(CHATS_KEY, JSON.stringify(chats));
}

function deleteChat(chatId) {
  const chats = getChats().filter(c => c.id !== chatId);
  localStorage.setItem(CHATS_KEY, JSON.stringify(chats));
  if (activeChatId === chatId) {
    activeChatId = null;
    clearResults();
  }
  renderChatList();
}

function renderChatList() {
  const $list = $('#chatList');
  const chats = getChats();

  if (!chats.length) {
    $list.html('<div class="chat-list-empty">No past searches yet</div>');
    return;
  }

  $list.empty();
  chats.forEach(chat => {
    const date = new Date(chat.timestamp);
    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const ages = chat.kidsAges && chat.kidsAges.length
      ? ` (ages ${chat.kidsAges.join(', ')})`
      : '';
    const label = `${chat.city}${ages}`;

    const $item = $('<div>')
      .addClass('chat-item')
      .toggleClass('active', chat.id === activeChatId)
      .attr('data-id', chat.id);

    $item.append($('<span>').addClass('chat-item-text').text(label).attr('title', label));
    $item.append($('<span>').addClass('chat-item-date').text(dateStr));
    $item.append(
      $('<button>')
        .addClass('chat-delete-btn')
        .html('&times;')
        .attr('title', 'Delete')
        .on('click', function (e) {
          e.stopPropagation();
          deleteChat(chat.id);
        })
    );

    $item.on('click', function () {
      loadChat(chat);
    });

    $list.append($item);
  });
}

function loadChat(chat) {
  activeChatId = chat.id;
  renderChatList();

  $('#cityInput').val(chat.city);

  if (chat.radiusMiles) {
    $('#radiusSelect').val(chat.radiusMiles);
  }
  if (chat.targetDate) {
    $('#dateInput').val(chat.targetDate);
  }

  if (chat.preferences) {
    Object.entries(chat.preferences).forEach(([key, val]) => {
      $(`#${key}`).prop('checked', val);
    });
  }

  if (Array.isArray(chat.kidsAges)) {
    $('#kidsAgeInputs').empty();
    const ages = chat.kidsAges.length ? chat.kidsAges : [''];
    ages.forEach(age => {
      const row = $(`
        <div class="age-row">
          <input type="number" class="kid-age" min="0" max="17" placeholder="Age" value="${age === '' ? '' : age}" />
          <button type="button" class="remove-kid-btn" title="Remove">&times;</button>
        </div>
      `);
      $('#kidsAgeInputs').append(row);
    });
  }

  const memory = chat.memory || {};
  const events = Array.isArray(memory.events) ? memory.events : [];
  renderWeather(memory.weather);
  renderEventsGrouped(events);
  $('#debugMemory').text(JSON.stringify(memory, null, 2));
  $('#resultBox').removeClass('hidden');
}

function clearResults() {
  $('#resultBox').addClass('hidden');
  $('#structuredResult').html('');
  $('#weatherToday').html('');
  $('#debugMemory').text('');
}

// =============================================
// Kids age input management
// =============================================
$('#addKidBtn').on('click', function () {
  const row = $(`
    <div class="age-row">
      <input type="number" class="kid-age" min="0" max="17" placeholder="Age" />
      <button type="button" class="remove-kid-btn" title="Remove">&times;</button>
    </div>
  `);
  $('#kidsAgeInputs').append(row);
});

$('#kidsAgeInputs').on('click', '.remove-kid-btn', function () {
  const $rows = $('#kidsAgeInputs .age-row');
  if ($rows.length > 1) {
    $(this).closest('.age-row').remove();
  } else {
    $(this).closest('.age-row').find('.kid-age').val('');
  }
});

function getKidsAges() {
  const ages = [];
  $('.kid-age').each(function () {
    const val = $(this).val();
    if (val !== '' && val !== null) {
      const age = parseInt(val, 10);
      if (!isNaN(age) && age >= 0 && age <= 17) {
        ages.push(age);
      }
    }
  });
  return ages;
}

// =============================================
// Sidebar toggle (mobile)
// =============================================
$('#sidebarToggle').on('click', function () {
  $('#sidebar').toggleClass('collapsed');
});

$('#newChatBtn').on('click', function () {
  activeChatId = null;
  clearResults();
  renderChatList();
});

// =============================================
// Calendar export (.ics)
// =============================================
function generateICS(ev) {
  // Parse date and time into a basic DTSTART
  const dateStr = ev.date; // "2025-06-08"
  const timeStr = ev.time || '12:00 PM';

  // Parse time like "6:00 PM" -> { hours, minutes }
  const timeParts = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  let hours = 12, minutes = 0;
  if (timeParts) {
    hours = parseInt(timeParts[1], 10);
    minutes = parseInt(timeParts[2], 10);
    const ampm = timeParts[3].toUpperCase();
    if (ampm === 'PM' && hours < 12) hours += 12;
    if (ampm === 'AM' && hours === 12) hours = 0;
  }

  const startDate = new Date(`${dateStr}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`);
  const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // assume 2-hour duration

  const fmt = d => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//WanderSpark//EN',
    'BEGIN:VEVENT',
    `DTSTART:${fmt(startDate)}`,
    `DTEND:${fmt(endDate)}`,
    `SUMMARY:${ev.name}`,
    `DESCRIPTION:${ev.description || ''}`,
    `LOCATION:${ev.location || ''}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  return ics;
}

function downloadICS(ev) {
  const ics = generateICS(ev);
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${ev.name.replace(/[^a-zA-Z0-9]/g, '_')}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// =============================================
// Form submission
// =============================================
$('#activityForm').on('submit', async function (e) {
  e.preventDefault();

  const city = $('#cityInput').val();
  const kidsAges = getKidsAges();
  const radiusMiles = parseInt($('#radiusSelect').val(), 10) || 25;
  const targetDate = $('#dateInput').val() || '';
  const preferences = {
    music: $('#music').is(':checked'),
    outdoors: $('#outdoors').is(':checked'),
    kids: $('#kids').is(':checked'),
    food: $('#food').is(':checked'),
    wellness: $('#wellness').is(':checked'),
    markets: $('#markets').is(':checked')
  };

  saveProfile();

  const $submitBtn = $('#submitBtn');
  const $thinkingBox = $('#thinkingBox');
  const $resultBox = $('#resultBox');
  const $structured = $('#structuredResult');
  const $weatherEl = $('#weatherToday');
  const $debug = $('#debugMemory');

  $submitBtn.prop('disabled', true);
  $submitBtn.find('.btn-text').text('Thinking...');
  $resultBox.addClass('hidden');
  $structured.html('');
  $weatherEl.html('');
  $debug.text('');
  $thinkingBox.removeClass('hidden').text('🔎 Checking the weather...');

  try {
    const res = await fetch('/recommend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ city, preferences, kidsAges, radiusMiles, targetDate })
    });

    $thinkingBox.text('🎭 Looking for local events...');

    const data = await res.json();
    const memory = data.memory || {};
    const events = Array.isArray(memory.events) ? memory.events : [];

    $thinkingBox.text('✨ Finding your spark...');

    renderWeather(memory.weather);
    renderEventsGrouped(events);
    $debug.text(JSON.stringify(memory, null, 2));
    $resultBox.removeClass('hidden');
    $thinkingBox.addClass('hidden');

    const chatEntry = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      city,
      kidsAges,
      radiusMiles,
      targetDate,
      preferences,
      memory,
      timestamp: new Date().toISOString()
    };
    saveChat(chatEntry);
    activeChatId = chatEntry.id;
    renderChatList();
  } catch (err) {
    alert('Something went wrong.');
    console.error(err);
    $thinkingBox.text('Failed to fetch recommendations.');
  } finally {
    $submitBtn.prop('disabled', false);
    $submitBtn.find('.btn-text').text('Get Recommendation');
  }
});

// =============================================
// Rendering helpers
// =============================================
function renderWeather(weather) {
  const $weatherBox = $('#weatherToday');
  $weatherBox.html('');

  const heading = $('<h3>').text("Today's Weather");
  $weatherBox.append(heading);

  if (!weather?.summary) {
    $weatherBox.append('Weather data unavailable.');
    return;
  }

  weather.summary.split('\n').forEach(line => {
    $weatherBox.append($('<p>').text(line.trim()));
  });
}

function renderEventsGrouped(events) {
  const $container = $('#structuredResult').html('');

  if (!events.length) {
    $container.append($('<p>').text('No events found.').css('color', '#999'));
    return;
  }

  const weekend = events.filter(ev => ev.when === 'this weekend');
  const upcoming = events.filter(ev => ev.when === 'upcoming');

  const renderGroup = (label, emoji, list) => {
    if (!list.length) return;

    list.sort((a, b) => new Date(a.date) - new Date(b.date));
    const section = $('<section>').css('margin-top', '2rem');
    const heading = $('<h3>').html(`<strong>${emoji} ${label}</strong>`).css('margin-bottom', '1rem');
    section.append(heading);

    list.forEach(ev => {
      const div = $('<div>').addClass('eventCard').css('margin-bottom', '1.2em');
      const header = $('<div>').css({ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25em', flexWrap: 'wrap' });
      header.append($('<strong>').text(`${ev.emoji} ${ev.name}`));
      if (ev.ageRange) {
        header.append($('<span>').addClass('age-badge').text(ev.ageRange));
      }
      const calBtn = $('<button>')
        .attr('type', 'button')
        .addClass('cal-export-btn')
        .text('Add to Calendar')
        .on('click', function () { downloadICS(ev); });
      header.append(calBtn);
      div.append(header);
      div.append($('<p>').text(`${ev.description} (${formatDate(ev.date)}, ${ev.time})`));
      div.append($('<p>').text(`📍 ${ev.location}`).css({ fontSize: '0.85em', color: '#666', marginTop: '0.25em' }));
      section.append(div);
    });

    $container.append(section);
  };

  renderGroup('This Weekend', '🎉', weekend);
  renderGroup('Upcoming Events', '📌', upcoming);
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
}

// =============================================
// Init on page load
// =============================================
$(function () {
  loadProfile();
  renderChatList();
  if (window.innerWidth <= 768) {
    $('#sidebar').addClass('collapsed');
  }
});
