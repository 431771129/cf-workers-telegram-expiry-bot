export function getBeijingDate(timestamp = Date.now()) {
  const date = new Date(timestamp);
  const offset = 8 * 60 * 60 * 1000;
  const beijingTime = new Date(date.getTime() + offset);
  return beijingTime.toISOString().split('T')[0];
}

export function getFutureDates(daysAhead) {
  const dates = [];
  const now = new Date();
  for (let i = 0; i <= daysAhead; i++) {
    const date = new Date(now);
    date.setDate(now.getDate() + i);
    dates.push(getBeijingDate(date.getTime()));
  }
  return dates;
}

export function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
