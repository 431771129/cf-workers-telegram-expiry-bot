import { handleMessage } from '../handlers/message.js';
import { handleCallback } from '../handlers/callback.js';
import { checkAndNotify } from '../core/notify.js';
import { logError } from '../utils/log.js';

export async function onRequest(context) {
  const { request, env } = context;
  try {
    const update = await request.json();
    if (update.callback_query) {
      await handleCallback(env, update.callback_query);
      return new Response('ok');
    }
    if (update.message) {
      await handleMessage(env, update.message);
      return new Response('ok');
    }
    return new Response('ok');
  } catch (err) {
    logError('Request handler error', { error: err.message, stack: err.stack });
    return new Response('error', { status: 500 });
  }
}