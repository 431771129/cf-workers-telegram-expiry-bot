import { DB } from './db.js';
import { getBeijingDate } from '../utils/time.js';
import { logInfo, logError } from '../utils/log.js';
import { MAX_TASK_NAME_LEN, MAX_EXPIRE_DAYS } from '../config.js';

export class TaskService {
  constructor(env) {
    this.db = new DB(env);
  }

  static genId() {
    return Date.now().toString();
  }

  async create(chatId, taskData) {
    const id = TaskService.genId();
    const task = {
      id,
      ...taskData,
      user: chatId,
      notified: [],
      _version: 1
    };
    const key = `task:${chatId}:${id}`;
    await this.db.put(key, JSON.stringify(task));
    const expireDate = getBeijingDate(task.expire_at * 1000);
    await this._addToIndex(expireDate, key);
    logInfo('Task created', { chatId, taskId: id });
    return task;
  }

  async get(chatId, taskId) {
    const key = `task:${chatId}:${taskId}`;
    const data = await this.db.get(key);
    return data ? JSON.parse(data) : null;
  }

  async update(chatId, taskId, updates) {
    const key = `task:${chatId}:${taskId}`;
    let retry = 0;
    while (retry < 2) {
      const data = await this.db.get(key);
      if (!data) throw new Error('任务不存在');
      const task = JSON.parse(data);
      if (task.user !== chatId) throw new Error('无权操作');

      const oldExpireDate = getBeijingDate(task.expire_at * 1000);
      Object.assign(task, updates);
      if (updates.expire_at) {
        const newExpireDate = getBeijingDate(updates.expire_at * 1000);
        if (oldExpireDate !== newExpireDate) {
          await this._removeFromIndex(oldExpireDate, key);
          await this._addToIndex(newExpireDate, key);
        }
      }
      task._version = (task._version || 0) + 1;
      await this.db.put(key, JSON.stringify(task));
      logInfo('Task updated', { chatId, taskId, updates });
      return task;
    }
    throw new Error('更新冲突，请重试');
  }

  async delete(chatId, taskId) {
    const key = `task:${chatId}:${taskId}`;
    const data = await this.db.get(key);
    if (!data) return;
    const task = JSON.parse(data);
    await this.db.delete(key);
    const expireDate = getBeijingDate(task.expire_at * 1000);
    await this._removeFromIndex(expireDate, key);
    logInfo('Task deleted', { chatId, taskId });
  }

  async list(chatId, cursor = null) {
    const prefix = `task:${chatId}:`;
    const list = await this.db.list({ prefix, limit: 10, cursor });
    const tasks = [];
    for (const key of list.keys) {
      const data = await this.db.get(key.name);
      tasks.push(JSON.parse(data));
    }
    return { tasks, cursor: list.cursor, list_complete: list.list_complete };
  }

  async getTasksByExpireDate(dateStr) {
    const indexKey = `idx:expire:${dateStr}`;
    const keysRaw = await this.db.get(indexKey);
    if (!keysRaw) return [];
    const keys = JSON.parse(keysRaw);
    const tasks = [];
    for (const key of keys) {
      const data = await this.db.get(key);
      if (data) tasks.push(JSON.parse(data));
    }
    return tasks;
  }

  async _addToIndex(expireDate, taskKey) {
    const indexKey = `idx:expire:${expireDate}`;
    let list = await this.db.get(indexKey);
    list = list ? JSON.parse(list) : [];
    if (!list.includes(taskKey)) list.push(taskKey);
    await this.db.put(indexKey, JSON.stringify(list));
  }

  async _removeFromIndex(expireDate, taskKey) {
    const indexKey = `idx:expire:${expireDate}`;
    let list = await this.db.get(indexKey);
    if (!list) return;
    list = JSON.parse(list).filter(k => k !== taskKey);
    if (list.length === 0) await this.db.delete(indexKey);
    else await this.db.put(indexKey, JSON.stringify(list));
  }

  static validateTaskData(name, expireDays) {
    if (!name || name.trim().length === 0) throw new Error('任务名称不能为空');
    if (name.length > MAX_TASK_NAME_LEN) throw new Error(`任务名称不能超过${MAX_TASK_NAME_LEN}字符`);
    if (isNaN(expireDays) || expireDays <= 0 || expireDays > MAX_EXPIRE_DAYS) {
      throw new Error(`过期天数必须在1-${MAX_EXPIRE_DAYS}之间`);
    }
  }
}
