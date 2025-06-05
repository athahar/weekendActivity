document.getElementById('activityForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const city = document.getElementById('cityInput').value;
  const preferences = {
    music: document.getElementById('music').checked,
    outdoors: document.getElementById('outdoors').checked,
    kids: document.getElementById('kids').checked,
    food: document.getElementById('food').checked,
    wellness: document.getElementById('wellness').checked,
    markets: document.getElementById('markets').checked
  };

  const submitBtn = document.getElementById('submitBtn');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Thinking...';

  const resultBox = document.getElementById('resultBox');
  const structured = document.getElementById('structuredResult');
  const weatherEl = document.getElementById('weatherToday');
  const debug = document.getElementById('debugMemory');

  resultBox.classList.add('hidden');
  structured.innerHTML = '';
  weatherEl.innerHTML = '';
  debug.textContent = '';

  try {
    const res = await fetch('/recommend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ city, preferences })
    });

    const data = await res.json();
    const memory = data.memory || {};
    const weather = memory.weather?.summary || 'No weather data';
    const events = Array.isArray(memory.events) ? memory.events : [];

    renderWeather(memory.weather);
    renderEventsGrouped(events);
    debug.textContent = JSON.stringify(memory, null, 2);
    resultBox.classList.remove('hidden');
  } catch (err) {
    alert('❌ Something went wrong.');
    console.error(err);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Get Recommendation';
  }
});

function renderWeather(weather) {
  const weatherBox = document.getElementById('weatherToday');
  weatherBox.innerHTML = '';

  const heading = document.createElement('h3');
  heading.textContent = "🌤️ Today's Weather";
  weatherBox.appendChild(heading);

  if (!weather?.summary) {
    weatherBox.appendChild(document.createTextNode('Weather data unavailable.'));
    return;
  }

  const lines = weather.summary.split('\n');
  lines.forEach(line => {
    const p = document.createElement('p');
    p.textContent = line.trim();
    weatherBox.appendChild(p);
  });
}

function renderEventsGrouped(events) {
  const container = document.getElementById('structuredResult');
  container.innerHTML = '';

  if (!events.length) {
    const fallback = document.createElement('p');
    fallback.textContent = 'No events found. Try adjusting preferences or checking your internet connection.';
    fallback.style.color = '#999';
    container.appendChild(fallback);
    return;
  }

  const weekend = events.filter(ev => ev.when === 'this weekend');
  const upcoming = events.filter(ev => ev.when === 'upcoming');

  const renderGroup = (label, emoji, list) => {
    if (!list.length) return;

    list.sort((a, b) => new Date(a.date) - new Date(b.date));

    const section = document.createElement('section');
    section.style.marginTop = '2rem';

    const heading = document.createElement('h3');
    heading.innerHTML = `<strong>${emoji} ${label}</strong>`;
    heading.style.marginBottom = '1rem';
    section.appendChild(heading);

    list.forEach(ev => {
      const div = document.createElement('div');
      div.className = 'eventCard';
      div.style.marginBottom = '1.2em';

      const title = document.createElement('strong');
      title.textContent = `${ev.emoji} ${ev.name}`;
      title.style.display = 'block';
      title.style.marginBottom = '0.25em';

      const meta = document.createElement('p');
      meta.textContent = `${ev.description} (${formatDate(ev.date)}, ${ev.time})`;

      const loc = document.createElement('p');
      loc.textContent = `📍 ${ev.location}`;
      loc.style.fontSize = '0.85em';
      loc.style.color = '#666';
      loc.style.marginTop = '0.25em';

      // const badge = document.createElement('span');
      // badge.textContent = ev.indoor ? '🏠 Indoor' : '🌳 Outdoor';
      // badge.style.fontSize = '0.85em';
      // badge.style.display = 'block';
      // badge.style.marginTop = '0.2em';

      div.appendChild(title);
      div.appendChild(meta);
      div.appendChild(loc);
      div.appendChild(badge);
      section.appendChild(div);
    });

    container.appendChild(section);
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
