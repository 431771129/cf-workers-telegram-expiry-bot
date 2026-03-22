import { TaskService } from './task.js';
import { sendMessage } from './telegram.js';
import { getFutureDates } from '../utils/time.js';
import { ConcurrencyLimiter } from '../utils/concurrency.js';
import { logInfo } from '../utils/log.js';
import { NOTIFY_DAYS_AHEAD, TELEGRAM_CONCURRENCY } from '../config.js';
import { escapeHtml, getTypeText } from '../ui/messages.js';

export async function checkAndNotify(env) {
  logInfo('Starting notification check');
  const taskService = new TaskService(env);
  const dates = getFutureDates(NOTIFY_DAYS_AHEAD);
  const reminders = [];

  for (const date of dates) {
    const tasks = await taskService.getTasksByExpireDate(date);
    for (const task of tasks) {
      const nowSec = Math.floor(Date.now() / 1000);
      const daysLeft = Math.ceil((task.expire_at - nowSec) / 86400);
      const needNotify = task.notify_days.filter(day => day === daysLeft && !task.notified.includes(day));
      if (needNotify.length) {
        for (const day of needNotify) {
          reminders.push({ chatId: task.user, task, daysLeft: day });
          task.notified.push(day);
        }
        await taskService.update(task.user, task.id, { notified: task.notified });
      }
    }
  }

  if (reminders.length === 0) {
    logInfo('No reminders to send');
    return;
  }

  const limiter = new ConcurrencyLimiter(TELEGRAM_CONCURRENCY);
  const sendPromises = reminders.map(r => limiter.run(() => sendReminder(env, r.chatId, r.task, r.daysLeft)));
  await Promise.all(sendPromises);
  logInfo(`Sent ${reminders.length} reminders`);
}

async function sendReminder(env, chatId, task, daysLeft) {
  const text = `⚠️ <b>到期提醒</b>\n\n任务: ${escapeHtml(task.name)}\n类型: ${getTypeText(task.type)}\n还有 <b>${daysLeft}</b> 天到期！\n过期: ${new Date(task.expire_at * 1000).toLocaleString()}`;
  await sendMessage(env, chatId, text);
}
