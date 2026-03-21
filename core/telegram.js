import { retryWithBackoff } from '../utils/retry.js';
import { delay } from '../utils/time.js';
import { logError } from '../utils/log.js';

const TG_API = 'https://api.telegram.org/bot';

export async function sendMessage(env, chatId, text, keyboard = null, parseMode = 'HTML') {
  const url = `${TG_API}${env.TG_TOKEN}/sendMessage`;
  const payload = { chat_id: chatId, text, parse_mode: parseMode };
  if (keyboard) payload.reply_markup = keyboard;
  await retryWithBackoff(async () => {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res;
  }, { retries: 3, onRetry: (err, attempt) => delay(1000 * attempt) });
}

export async function editMessage(env, chatId, msgId, text, keyboard = null) {
  const url = `${TG_API}${env.TG_TOKEN}/editMessageText`;
  const payload = { chat_id: chatId, message_id: msgId, text, parse_mode: 'HTML' };
  if (keyboard) payload.reply_markup = keyboard;
  await retryWithBackoff(async () => {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res;
  }, { retries: 3 });
}

export async function answerCallback(env, cbId, text = null) {
  const url = `${TG_API}${env.TG_TOKEN}/answerCallbackQuery`;
  const payload = { callback_query_id: cbId };
  if (text) payload.text = text;
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch (err) {
    logError('Answer callback failed', { error: err.message });
  }
}
