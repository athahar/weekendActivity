// utils/timeUtil.js

/**
 * Returns true if current time is between 6AM and 8PM.
 */
export function isDaytime() {
  const hour = new Date().getHours();
  return hour >= 6 && hour < 20;
}

/**
 * Returns a string indicating the time of day: 'morning', 'afternoon', or 'evening'.
 */
export function getTimeOfDay() {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
}