export function logInfo(message, data = {}) {
  console.log(JSON.stringify({ level: 'info', message, ...data, timestamp: new Date().toISOString() }));
}

export function logError(message, data = {}) {
  console.error(JSON.stringify({ level: 'error', message, ...data, timestamp: new Date().toISOString() }));
}
