export const CALLBACK_ACTIONS = {
  ADD: 'add',
  TYPE: 'type',
  NOTIFY: 'n',
  NOTIFY_DONE: 'notify_done',
  EXPIRE: 'exp',
  EXPIRE_CUSTOM: 'exp_custom',
  USE_DEFAULT_NAME: 'use_default_name',
  LIST: 'list',
  VIEW: 'view',
  DEL: 'del',
  EDIT: 'edit',
  EDIT_NAME: 'edit_name',
  EDIT_NOTIFY: 'edit_notify',
  EDIT_NOTIFY_DONE: 'edit_notify_done',
  EDIT_EXPIRE: 'edit_expire',
  SETTINGS: 'settings'
};

export const ALLOWED_ACTIONS = Object.values(CALLBACK_ACTIONS);

export const MAX_TASK_NAME_LEN = 100;
export const MAX_EXPIRE_DAYS = 365;
export const DEFAULT_SESSION_TTL = 1800;
export const NOTIFY_DAYS_AHEAD = 7;
export const TELEGRAM_CONCURRENCY = 20;
