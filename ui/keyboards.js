import { CALLBACK_ACTIONS } from '../config.js';

export function buildMainMenu() {
  return {
    inline_keyboard: [
      [{ text: '➕ 添加任务', callback_data: CALLBACK_ACTIONS.ADD }],
      [{ text: '📋 我的任务', callback_data: CALLBACK_ACTIONS.LIST }],
      [{ text: '⚙️ 设置', callback_data: CALLBACK_ACTIONS.SETTINGS }]
    ]
  };
}

export function buildTaskDetailKeyboard(taskId) {
  return {
    inline_keyboard: [
      [{ text: '✏️ 编辑', callback_data: `${CALLBACK_ACTIONS.EDIT}:${taskId}` }, { text: '🔙 返回列表', callback_data: CALLBACK_ACTIONS.LIST }]
    ]
  };
}

export function buildNotifyKeyboard(selected = [], isEdit = false) {
  const prefix = isEdit ? `${CALLBACK_ACTIONS.EDIT_NOTIFY}:` : `${CALLBACK_ACTIONS.NOTIFY}:`;
  const days = [7, 3, 1, 0];
  const buttons = days.map(d => ({
    text: `${d === 0 ? '当天' : d + ' 天'}${selected.includes(d) ? ' ✅' : ''}`,
    callback_data: `${prefix}${d}`
  }));
  return {
    inline_keyboard: [
      buttons.slice(0, 2),
      buttons.slice(2),
      [{ text: '✅ 完成', callback_data: isEdit ? CALLBACK_ACTIONS.EDIT_NOTIFY_DONE : CALLBACK_ACTIONS.NOTIFY_DONE }]
    ]
  };
}

export function buildExpireKeyboard(isEdit = false) {
  const prefix = isEdit ? `${CALLBACK_ACTIONS.EDIT_EXPIRE}:` : `${CALLBACK_ACTIONS.EXPIRE}:`;
  return {
    inline_keyboard: [
      [{ text: '7 天', callback_data: `${prefix}7` }, { text: '15 天', callback_data: `${prefix}15` }],
      [{ text: '30 天', callback_data: `${prefix}30` }, { text: '60 天', callback_data: `${prefix}60` }],
      [{ text: '✏️ 自定义', callback_data: isEdit ? CALLBACK_ACTIONS.EDIT_EXPIRE : CALLBACK_ACTIONS.EXPIRE_CUSTOM }]
    ]
  };
}

export function buildListNextPageKeyboard(cursor) {
  return {
    inline_keyboard: [[{ text: '⏩ 下一页', callback_data: `${CALLBACK_ACTIONS.LIST}:${cursor}` }]]
  };
}