import { SessionManager } from '../core/session.js';
import { TaskService } from '../core/task.js';
import { sendMessage } from '../core/telegram.js';
import { sendMainMenu, showTaskDetail } from '../ui/menu.js';
import { finishCreateTask } from './callback.js';

export async function handleMessage(env, msg) {
  const chatId = msg.chat.id;
  const text = msg.text;
  const sessionMgr = new SessionManager(env);
  const session = await sessionMgr.get(chatId);

  // 创建流程：自定义过期天数
  if (session.step === 'custom_expire') {
    const days = parseInt(text);
    if (isNaN(days) || days <= 0 || days > 365) {
      await sendMessage(env, chatId, '❌ 请输入 1-365 之间的数字');
      return;
    }
    session.expire_days = days;
    session.step = 'name';
    await sessionMgr.set(chatId, session);
    await sendMessage(env, chatId, '📝 请输入任务名称\n或点击下方按钮使用默认名称', {
      inline_keyboard: [[{ text: '🏷️ 使用默认名称', callback_data: 'use_default_name' }]]
    });
    return;
  }

  // 创建流程：任务名称
  if (session.step === 'name') {
    if (!text || text.trim() === '') {
      await sendMessage(env, chatId, '❌ 名称不能为空');
      return;
    }
    const name = text.trim().slice(0, 100);
    await finishCreateTask(env, chatId, session, name);
    return;
  }

  // 编辑流程：修改名称
  if (session.edit_step === 'name') {
    if (!text || text.trim() === '') {
      await sendMessage(env, chatId, '❌ 名称不能为空');
      return;
    }
    const newName = text.trim().slice(0, 100);
    const taskService = new TaskService(env);
    try {
      await taskService.update(chatId, session.edit_task_id, { name: newName });
      await sendMessage(env, chatId, '✅ 名称已更新');
    } catch (err) {
      await sendMessage(env, chatId, `❌ 更新失败: ${err.message}`);
    }
    delete session.edit_step;
    await sessionMgr.set(chatId, session);
    const task = await taskService.get(chatId, session.edit_task_id);
    await showTaskDetail(env, chatId, task);
    return;
  }

  // 编辑流程：自定义过期天数
  if (session.edit_step === 'custom_expire') {
    const days = parseInt(text);
    if (isNaN(days) || days <= 0 || days > 365) {
      await sendMessage(env, chatId, '❌ 请输入 1-365 之间的数字');
      return;
    }
    const newExpire = Math.floor(Date.now() / 1000) + days * 86400;
    const taskService = new TaskService(env);
    try {
      await taskService.update(chatId, session.edit_task_id, { expire_at: newExpire });
      await sendMessage(env, chatId, `✅ 过期时间已更新为 ${new Date(newExpire * 1000).toLocaleString()}`);
    } catch (err) {
      await sendMessage(env, chatId, `❌ 更新失败: ${err.message}`);
    }
    delete session.edit_step;
    await sessionMgr.set(chatId, session);
    const task = await taskService.get(chatId, session.edit_task_id);
    await showTaskDetail(env, chatId, task);
    return;
  }

  // 默认：显示主菜单
  await sendMainMenu(env, chatId);
}
