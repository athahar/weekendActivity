// utils/getEventInfo.js

export async function getEventInfo(city) {
  // Mock data - in a real app, this would fetch from an events API
  return [
    { name: 'Food Festival', time: '12:00 PM', location: 'City Square' },
    { name: 'Book Reading', time: '4:00 PM', location: 'Library Hall' },
    { name: 'Outdoor Movie', time: '8:00 PM', location: 'Central Park' }
  ];
}