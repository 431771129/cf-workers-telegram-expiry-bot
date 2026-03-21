import { sendMessage } from '../core/telegram.js';
import { TaskService } from '../core/task.js';
import { buildMainMenu, buildTaskDetailKeyboard, buildListNextPageKeyboard } from './keyboards.js';
import { getTypeText, escapeHtml } from './messages.js';

export async function sendMainMenu(env, chatId) {
  await sendMessage(env, chatId, '📊 到期提醒系统', buildMainMenu());
}

export async function showList(env, chatId, cursor = null) {
  const taskService = new TaskService(env);
  const { tasks, cursor: nextCursor, list_complete } = await taskService.list(chatId, cursor);
  if (tasks.length === 0) {
    await sendMessage(env, chatId, '📭 你还没有任何任务');
    return;
  }
  for (const task of tasks) {
    const text = `📌 <b>${escapeHtml(task.name)}</b>\n类型: ${getTypeText(task.type)}\n过期: ${new Date(task.expire_at * 1000).toLocaleString()}\n提醒: ${task.notify_days.join(', ')} 天`;
    await sendMessage(env, chatId, text, {
      inline_keyboard: [[
        { text: '🔍 查看', callback_data: `view:${task.id}` },
        { text: '🗑 删除', callback_data: `del:${task.id}` }
      ]]
    });
  }
  if (!list_complete && nextCursor) {
    await sendMessage(env, chatId, '📄 更多任务', buildListNextPageKeyboard(nextCursor));
  }
}

export async function showTaskDetail(env, chatId, task) {
  const date = new Date(task.expire_at * 1000).toLocaleString();
  const daysLeft = Math.ceil((task.expire_at - Date.now() / 1000) / 86400);
  const text = `🔖 <b>${escapeHtml(task.name)}</b>\n\n📌 类型: ${getTypeText(task.type)}\n⏰ 过期: ${date}\n📅 剩余: ${daysLeft} 天\n⏱ 提醒: ${task.notify_days.join(', ')} 天`;
  await sendMessage(env, chatId, text, buildTaskDetailKeyboard(task.id));
}
