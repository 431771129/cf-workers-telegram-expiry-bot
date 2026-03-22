// handlers/callback.js
import { SessionManager } from '../core/session.js';
import { TaskService } from '../core/task.js';
import { sendMessage, editMessage, answerCallback } from '../core/telegram.js';
import { sendMainMenu, showList, showTaskDetail } from '../ui/menu.js';
import { buildNotifyKeyboard, buildExpireKeyboard } from '../ui/keyboards.js';  // 修改这一行
import { CALLBACK_ACTIONS, ALLOWED_ACTIONS } from '../config.js';
import { getBeijingDate } from '../utils/time.js';
import { getTypeText, escapeHtml } from '../ui/messages.js';

// ... 其余代码保持不变

export async function handleCallback(env, cb) {
  const chatId = cb.message.chat.id;
  const msgId = cb.message.message_id;
  const rawData = cb.data;

  await answerCallback(env, cb.id, '⏳ 处理中...');

  let action, param;
  if (rawData.includes(':')) {
    [action, param] = rawData.split(':');
  } else {
    action = rawData;
    param = null;
  }

  if (!ALLOWED_ACTIONS.includes(action)) {
    await sendMessage(env, chatId, '❓ 未知操作');
    return;
  }

  const sessionMgr = new SessionManager(env);
  const taskService = new TaskService(env);
  const session = await sessionMgr.get(chatId);

  switch (action) {
    case CALLBACK_ACTIONS.ADD:
      await sessionMgr.set(chatId, { step: 'type' });
      await editMessage(env, chatId, msgId, '📌 请选择任务类型', {
        inline_keyboard: [
          [{ text: '🎬 Emby', callback_data: `${CALLBACK_ACTIONS.TYPE}:emby` }, { text: '🌐 域名', callback_data: `${CALLBACK_ACTIONS.TYPE}:domain` }],
          [{ text: '📦 订阅', callback_data: `${CALLBACK_ACTIONS.TYPE}:sub` }]
        ]
      });
      break;

    case CALLBACK_ACTIONS.TYPE:
      const type = param;
      await sessionMgr.set(chatId, { step: 'notify_days', type, notify_days: [] });
      await editMessage(env, chatId, msgId, '⏰ 选择提醒时间（可多选）\n当前已选: 无', {
        inline_keyboard: buildNotifyKeyboard([])
      });
      break;

    case CALLBACK_ACTIONS.NOTIFY:
      const day = parseInt(param);
      if (!session.notify_days.includes(day)) session.notify_days.push(day);
      await sessionMgr.set(chatId, session);
      const selected = session.notify_days.join(', ') || '无';
      await editMessage(env, chatId, msgId, `⏰ 选择提醒时间（可多选）\n当前已选: ${selected}`, {
        inline_keyboard: buildNotifyKeyboard(session.notify_days)
      });
      break;

    case CALLBACK_ACTIONS.NOTIFY_DONE:
      if (!session.notify_days || session.notify_days.length === 0) {
        await sendMessage(env, chatId, '❌ 请至少选择一个提醒时间');
        return;
      }
      session.step = 'expire_days';
      await sessionMgr.set(chatId, session);
      await editMessage(env, chatId, msgId, '📅 选择过期时间', {
        inline_keyboard: buildExpireKeyboard()
      });
      break;

    case CALLBACK_ACTIONS.EXPIRE:
      const days = parseInt(param);
      if (days > 365) {
        await sendMessage(env, chatId, '❌ 天数不能超过 365 天');
        return;
      }
      session.expire_days = days;
      session.step = 'name';
      await sessionMgr.set(chatId, session);
      await sendMessage(env, chatId, '📝 请输入任务名称\n或点击下方按钮使用默认名称', {
        inline_keyboard: [[{ text: '🏷️ 使用默认名称', callback_data: CALLBACK_ACTIONS.USE_DEFAULT_NAME }]]
      });
      break;

    case CALLBACK_ACTIONS.EXPIRE_CUSTOM:
      session.step = 'custom_expire';
      await sessionMgr.set(chatId, session);
      await sendMessage(env, chatId, '📝 请输入过期天数（数字）');
      break;

    case CALLBACK_ACTIONS.USE_DEFAULT_NAME:
      const now = new Date();
      const expireDate = getBeijingDate(now.getTime() + session.expire_days * 86400000);
      const defaultName = `${getTypeText(session.type)} - ${expireDate}`.slice(0, 100);
      await finishCreateTask(env, chatId, session, defaultName);
      break;

    case CALLBACK_ACTIONS.LIST:
      await showList(env, chatId);
      break;

    case CALLBACK_ACTIONS.VIEW:
      const taskId = param;
      const task = await taskService.get(chatId, taskId);
      if (!task) {
        await sendMessage(env, chatId, '❌ 任务不存在或已删除');
        return;
      }
      await showTaskDetail(env, chatId, task);
      break;

    case CALLBACK_ACTIONS.DEL:
      const delId = param;
      await taskService.delete(chatId, delId);
      await sendMessage(env, chatId, '🗑 删除成功');
      break;

    case CALLBACK_ACTIONS.EDIT:
      const editId = param;
      const editTask = await taskService.get(chatId, editId);
      if (!editTask) {
        await sendMessage(env, chatId, '❌ 任务不存在');
        return;
      }
      await sessionMgr.set(chatId, { edit_task_id: editId, edit_task: editTask });
      await sendMessage(env, chatId, '✏️ 选择要修改的内容', {
        inline_keyboard: [
          [{ text: '📝 修改名称', callback_data: CALLBACK_ACTIONS.EDIT_NAME }],
          [{ text: '⏰ 修改提醒天数', callback_data: CALLBACK_ACTIONS.EDIT_NOTIFY }],
          [{ text: '📅 修改过期时间', callback_data: CALLBACK_ACTIONS.EDIT_EXPIRE }],
          [{ text: '🔙 返回', callback_data: `${CALLBACK_ACTIONS.VIEW}:${editId}` }]
        ]
      });
      break;

    case CALLBACK_ACTIONS.EDIT_NAME:
      if (!session.edit_task_id) {
        await sendMessage(env, chatId, '❌ 会话失效，请重新操作');
        return;
      }
      session.edit_step = 'name';
      await sessionMgr.set(chatId, session);
      await sendMessage(env, chatId, '📝 请输入新的任务名称');
      break;

    case CALLBACK_ACTIONS.EDIT_NOTIFY:
      if (!session.edit_task_id) {
        await sendMessage(env, chatId, '❌ 会话失效，请重新操作');
        return;
      }
      session.edit_step = 'notify_days';
      session.edit_notify_days = session.edit_task.notify_days || [];
      await sessionMgr.set(chatId, session);
      const curSelected = session.edit_notify_days.join(', ') || '无';
      await sendMessage(env, chatId, `⏰ 当前提醒天数: ${curSelected}\n请重新选择（可多选）`, {
        inline_keyboard: buildNotifyKeyboard(session.edit_notify_days, true)
      });
      break;

    case CALLBACK_ACTIONS.EDIT_NOTIFY_DONE:
      if (!session.edit_notify_days || session.edit_notify_days.length === 0) {
        await sendMessage(env, chatId, '❌ 请至少选择一个提醒时间');
        return;
      }
      try {
        await taskService.update(chatId, session.edit_task_id, { notify_days: session.edit_notify_days });
        await sendMessage(env, chatId, '✅ 提醒天数已更新');
      } catch (err) {
        await sendMessage(env, chatId, `❌ 更新失败: ${err.message}`);
      }
      delete session.edit_step;
      delete session.edit_notify_days;
      await sessionMgr.set(chatId, session);
      const updatedTask = await taskService.get(chatId, session.edit_task_id);
      await showTaskDetail(env, chatId, updatedTask);
      break;

    case CALLBACK_ACTIONS.EDIT_EXPIRE:
      if (!session.edit_task_id) {
        await sendMessage(env, chatId, '❌ 会话失效，请重新操作');
        return;
      }
      session.edit_step = 'expire_days';
      await sessionMgr.set(chatId, session);
      await sendMessage(env, chatId, '📅 选择新的过期时间', {
        inline_keyboard: buildExpireKeyboard(true)
      });
      break;

    case CALLBACK_ACTIONS.SETTINGS:
      await sendMessage(env, chatId, '⚙️ 设置功能开发中');
      break;

    default:
      await sendMessage(env, chatId, '❓ 未知操作');
  }
}

export async function finishCreateTask(env, chatId, session, name) {
  const taskService = new TaskService(env);
  const expire_at = Math.floor(Date.now() / 1000) + session.expire_days * 86400;
  const task = {
    name,
    type: session.type,
    notify_days: session.notify_days,
    expire_at,
    user: chatId,
    notified: []
  };
  await taskService.create(chatId, task);
  const sessionMgr = new SessionManager(env);
  await sessionMgr.clear(chatId);
  const expireStr = new Date(expire_at * 1000).toLocaleString();
  await sendMessage(env, chatId, `✅ 任务已添加\n名称: ${escapeHtml(name)}\n过期: ${expireStr}\n提醒: ${session.notify_days.join(', ')} 天`);
  await sendMainMenu(env, chatId);
}
