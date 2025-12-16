/**
 * Schedule utility functions for formatting and calculating group training schedules
 */

const DAY_SHORT_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * Format a group's schedule into a short string
 * Example: "Sun 18:00 • Tue 19:00"
 * @param {Object} group - Group object with trainingDays and trainingTime
 * @returns {string} Formatted schedule string
 */
export const formatGroupSchedule = (group) => {
  if (!group || !group.trainingDays || !Array.isArray(group.trainingDays) || group.trainingDays.length === 0) {
    return 'No schedule';
  }

  const defaultTime = group.trainingTime?.startTime || '18:00';
  
  // Sort days
  const sortedDays = [...group.trainingDays].sort((a, b) => a - b);

  // Simple format: "Sun, Tue • 18:00"
  const dayNames = sortedDays.map(day => DAY_SHORT_NAMES[day]).join(', ');
  return `${dayNames} • ${defaultTime}`;
};

/**
 * Get the next session for a group starting from a given date
 * @param {Object} group - Group object with trainingDays, trainingTime, cancelledDates, addedDates, dateTimes
 * @param {Date} fromDate - Date to start searching from (defaults to now)
 * @returns {Object|null} Next session object with { date, dayName, time, endTime, location } or null
 */
export const getNextSession = (group, fromDate = null) => {
  if (!group || !group.trainingDays || !Array.isArray(group.trainingDays) || group.trainingDays.length === 0) {
    return null;
  }

  const now = fromDate || new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes(); // minutes since midnight
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  const defaultTime = group.trainingTime?.startTime || '18:00';
  const defaultEndTime = group.trainingTime?.endTime || '19:30';

  let nextSession = null;
  let minDaysUntil = Infinity;
  let minTimeMinutes = Infinity;

  // Check next 14 days
  for (let daysAhead = 0; daysAhead < 14; daysAhead++) {
    const checkDate = new Date(today);
    checkDate.setDate(today.getDate() + daysAhead);
    
    const dayOfWeek = checkDate.getDay();
    const dateKey = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;

    // Check if this day is a recurring training day
    const isRecurringDay = group.trainingDays.includes(dayOfWeek);
    
    // Check if this date is cancelled
    const isCancelled = group.cancelledDates && 
      Array.isArray(group.cancelledDates) && 
      group.cancelledDates.includes(dateKey);
    
    // Check if this date is added (replacement)
    const isAdded = group.addedDates && 
      Array.isArray(group.addedDates) && 
      group.addedDates.includes(dateKey);

    if (isCancelled) continue;

    let sessionTime = null;
    let sessionEndTime = defaultEndTime;

    if (isAdded || isRecurringDay) {
      // Check for per-date time override first
      if (group.dateTimes && group.dateTimes[dateKey]) {
        sessionTime = group.dateTimes[dateKey].startTime || defaultTime;
        sessionEndTime = group.dateTimes[dateKey].endTime || defaultEndTime;
      } else {
        sessionTime = defaultTime;
      }

      if (sessionTime) {
        const [hours, minutes] = sessionTime.split(':').map(Number);
        const sessionMinutes = (hours || 0) * 60 + (minutes || 0);

        // If today and time hasn't passed, or future day
        const isToday = daysAhead === 0;
        if (isToday && sessionMinutes <= currentTime) continue;

        // Check if this is earlier than current best
        if (daysAhead < minDaysUntil || 
            (daysAhead === minDaysUntil && sessionMinutes < minTimeMinutes)) {
          minDaysUntil = daysAhead;
          minTimeMinutes = sessionMinutes;
          nextSession = {
            date: new Date(checkDate),
            dayName: DAY_NAMES[dayOfWeek],
            time: sessionTime,
            endTime: sessionEndTime,
            location: group.location || null,
          };
        }
      }
    }
  }

  return nextSession;
};

