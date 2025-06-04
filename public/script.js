document.getElementById('activityForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const city = document.getElementById('cityInput').value;
  const preferences = {
    music: document.getElementById('music').checked,
    outdoors: document.getElementById('outdoors').checked
  };

  const submitBtn = document.getElementById('submitBtn');
  submitBtn.textContent = 'Thinking...';
  submitBtn.disabled = true;

  try {
    const res = await fetch('http://localhost:3000/recommend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ city, preferences })
    });

    const data = await res.json();
    
    renderWeather(data.memory.weather || 'No weather data available.');
    renderStructuredResult(data.recommendation);
    document.getElementById('debugMemory').textContent = JSON.stringify(data.memory, null, 2);
    document.getElementById('resultBox').classList.remove('hidden');

  } catch (error) {
    alert('Something went wrong. Try again.');
    console.error(error);
  } finally {
    submitBtn.textContent = 'Get Recommendation';
    submitBtn.disabled = false;
  }
});

// Naive parser: splits based on common keywords
function renderStructuredResult(text) {
  const container = document.getElementById('structuredResult');
  container.innerHTML = ''; // Clear previous result

  const sections = [
    { title: 'Summary', keywords: ['summary:', 'weather:'] },
    { title: 'Event Suggestions', keywords: ['event', 'festival', 'concert', 'music', 'venue'] },
    { title: 'Advice & Tips', keywords: ['remember', 'carry', 'you might', 'dress', 'be cautious'] }
  ];

  const lowerText = text.toLowerCase();
  const paragraphs = text.split('\n').filter(p => p.trim());

  sections.forEach(({ title, keywords }) => {
    const matched = paragraphs.filter(p =>
      keywords.some(k => p.toLowerCase().includes(k))
    );

    if (matched.length > 0) {
      const section = document.createElement('div');
      const heading = document.createElement('h3');
      heading.textContent = title;
      section.appendChild(heading);

      matched.forEach(p => {
        const para = document.createElement('p');
        para.textContent = p; // Use textContent to avoid XSS
        section.appendChild(para);
      });

      container.appendChild(section);
    }
  });

  // fallback: if nothing matched, dump entire text
  if (container.innerHTML === '') {
    const fallback = document.createElement('p');
    fallback.textContent = text;
    container.appendChild(fallback);
  }
}

function renderWeather(weatherData) {
  const weatherBox = document.getElementById('weatherToday');
  weatherBox.innerHTML = '';

  const heading = document.createElement('h3');
  heading.textContent = "☁️ Today's Weather";
  weatherBox.appendChild(heading);

  if (!weatherData || typeof weatherData !== 'object') {
    const p = document.createElement('p');
    p.textContent = 'Weather data not available.';
    weatherBox.appendChild(p);
    return;
  }

  const lines = (weatherData.summary || '').split('\n');
  lines.forEach(line => {
    if (line.trim()) {
      const p = document.createElement('p');
      p.textContent = line.trim();
      weatherBox.appendChild(p);
    }
  });
} 