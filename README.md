📊 Telegram 到期提醒机器人
一个基于 Cloudflare Workers 和 KV 存储的 Telegram 机器人，用于管理到期任务并自动发送提醒。

https://img.shields.io/badge/Cloudflare-Workers-orange
https://img.shields.io/badge/Telegram-Bot-blue

✨ 功能特点
✅ 创建任务：选择类型（Emby/域名/订阅），设置提醒天数（7天/3天/1天/当天），输入任务名称和过期天数。

✅ 任务管理：查看任务列表（分页）、查看详情、编辑任务（名称、提醒天数、过期时间）、删除任务。

✅ 自动提醒：定时检查即将到期的任务，根据用户设置的天数发送提醒消息，避免重复提醒。

✅ 用户体验：按钮式操作，无需输入指令；回调响应快速；支持自定义过期天数。

✅ 高性能：使用日期索引分桶，避免全表扫描；并发控制限速，安全可靠。

✅ 数据安全：乐观锁防止并发更新冲突；会话 TTL 自动清理；权限校验确保用户只能操作自己的任务。

🏗️ 技术架构
运行时：Cloudflare Workers（边缘计算，全球低延迟）

数据存储：Cloudflare KV（键值存储，持久化）

定时任务：Cron Triggers（自动触发提醒检查）

Bot 通信：Telegram Bot API

代码结构：模块化设计，分层清晰（数据访问层、业务层、平台层、UI层）

text
├── index.js               # Worker 入口
├── config.js              # 全局配置
├── core/                  # 核心业务
│   ├── db.js              # KV 数据访问
│   ├── task.js            # 任务 CRUD + 索引
│   ├── session.js         # 会话管理
│   ├── notify.js          # 定时提醒逻辑
│   └── telegram.js        # Telegram API 封装
├── handlers/              # 消息与回调处理
│   ├── message.js
│   └── callback.js
├── ui/                    # 界面组件
│   ├── keyboards.js
│   ├── messages.js
│   └── menu.js
└── utils/                 # 工具函数
    ├── time.js
    ├── retry.js
    ├── concurrency.js
    └── log.js
🚀 快速部署
前提条件
一个 Cloudflare 账户

一个 Telegram Bot Token（通过 @BotFather 创建）

（可选）自定义域名（用于 Webhook）

部署步骤
创建 KV 命名空间
在 Cloudflare Dashboard → Workers & Pages → KV，创建一个命名空间，例如 DB。

创建 Worker

进入 Workers & Pages，点击“创建应用程序” → “创建 Worker”。

将本项目的所有代码文件（按目录结构）上传到 Worker。

或者使用 wrangler CLI 部署（推荐）。

绑定 KV
在 Worker 的“设置” → “KV 命名空间绑定”中，添加绑定：

变量名：DB

命名空间：选择你创建的 DB

设置环境变量
在“变量和机密”中添加：

变量名：TG_TOKEN

值：你的 Telegram Bot Token

配置 Cron 触发器（可选）
在“触发器” → “Cron 触发器”中添加定时任务，例如 0 10 * * *（每天北京时间 10:00 执行提醒检查）。

设置 Webhook
获取 Worker 的 URL（例如 https://your-worker.workers.dev），将其设置为 Telegram Bot 的 Webhook：

text
https://api.telegram.org/bot<你的TOKEN>/setWebhook?url=<你的Worker地址>
测试
打开 Telegram，向你的 Bot 发送任意消息，应看到主菜单。尝试添加任务并等待提醒。

📖 使用指南
用户命令
Bot 无需命令，通过按钮交互即可完成所有操作。

创建任务流程
点击“➕ 添加任务”

选择任务类型（Emby/域名/订阅）

选择提醒天数（可多选）

选择过期时间（预设或自定义）

输入任务名称（或使用默认名称）

完成创建

查看/编辑任务
点击“📋 我的任务”查看所有任务（分页）

点击任务卡片上的“🔍 查看”查看详情

在详情页点击“✏️ 编辑”可修改名称、提醒天数、过期时间

点击“🗑 删除”可删除任务

自动提醒
系统每天根据 Cron 触发器自动扫描未来 7 天内到期的任务，并在用户设置的时间点（7/3/1/0 天）发送提醒消息。

⚙️ 配置说明
可在 config.js 中调整以下参数：

参数	说明	默认值
MAX_TASK_NAME_LEN	任务名称最大长度	100
MAX_EXPIRE_DAYS	过期天数上限	365
DEFAULT_SESSION_TTL	会话 TTL（秒）	1800
NOTIFY_DAYS_AHEAD	提前提醒天数范围	7
TELEGRAM_CONCURRENCY	发送消息并发数	20
🛠️ 开发与扩展
本地开发（使用 Wrangler）
bash
# 安装 Wrangler
npm install -g wrangler

# 克隆项目
git clone https://github.com/yourname/telegram-reminder-bot.git
cd telegram-reminder-bot

# 配置 wrangler.toml
wrangler kv:namespace create "DB"
# 将输出信息添加到 wrangler.toml

# 设置环境变量（在 .dev.vars 或 dashboard 中）
echo "TG_TOKEN=your_token" >> .dev.vars

# 本地预览
wrangler dev
添加新功能
新消息类型：在 handlers/message.js 中添加处理逻辑

新回调动作：在 config.js 的 CALLBACK_ACTIONS 中添加常量，并在 handlers/callback.js 的 switch 中实现

新 UI 组件：在 ui/ 下创建新的构建函数，复用 keyboards.js 和 messages.js

📄 许可证
MIT License

🤝 贡献
欢迎提交 Issue 和 Pull Request。

📞 联系
如有问题，可通过 Telegram 联系 @yuangs_tang。

⭐ 如果这个项目对你有帮助，请给个 Star 支持一下！
