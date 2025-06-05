$('#activityForm').on('submit', async function (e) {
  e.preventDefault();

  const city = $('#cityInput').val();
  const preferences = {
    music: $('#music').is(':checked'),
    outdoors: $('#outdoors').is(':checked'),
    kids: $('#kids').is(':checked'),
    food: $('#food').is(':checked'),
    wellness: $('#wellness').is(':checked'),
    markets: $('#markets').is(':checked')
  };

  const $submitBtn = $('#submitBtn');
  const $thinkingBox = $('#thinkingBox');
  const $resultBox = $('#resultBox');
  const $structured = $('#structuredResult');
  const $weatherEl = $('#weatherToday');
  const $debug = $('#debugMemory');

  $submitBtn.prop('disabled', true);
  $submitBtn.text('Thinking...');
  $resultBox.addClass('hidden');
  $structured.html('');
  $weatherEl.html('');
  $debug.text('');
  $thinkingBox.removeClass('hidden').text('🔎 Checking the weather...');

  try {
    const res = await fetch('/recommend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ city, preferences })
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
  } catch (err) {
    alert('❌ Something went wrong.');
    console.error(err);
    $thinkingBox.text('❌ Failed to fetch recommendations.');
  } finally {
    $submitBtn.prop('disabled', false);
    $submitBtn.text('Get Recommendation');
  }
});

function renderWeather(weather) {
  const $weatherBox = $('#weatherToday');
  $weatherBox.html('');

  const heading = $('<h3>').text("🌤️ Today's Weather");
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
      div.append($('<strong>').text(`${ev.emoji} ${ev.name}`).css({ display: 'block', marginBottom: '0.25em' }));
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
