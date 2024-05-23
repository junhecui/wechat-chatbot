# WeChat Helper Bot

## English

### Features

#### Automatic Similar Message Response

* Uses pre-trained models to automatically respond to messages based on similar historical prompts.
  * Sent messages and user response in chosen group chat is logged in a database such that the next time a similar message is sent, the bot will automatically respond for the user in the same manner.

#### Manual Keyword Input

* Automatically respond to messages containing keywords.
  * Ability to add / remove responses within messaging service.

#### Question Relay Feature

* Automatically messages administrator when receiving a question (any message with a question mark).
  * Administrator response will be relayed back to the user.

### Technologies Used

* [**Wechaty Library**](https://wechaty.js.org/) was used for the basic WeChat bot functions.
* **TypeScript**, hosted on a **Node.js** and **Express.js** server, was used to implement the Wechaty library as well as handling in-app messages, database operations, and making HTTP requests to the Flask endpoints with **Axios**.
* **Python** was used in developing REST API endpoints in **Flask**, tokenization and lemmatization utilizing **Stanza** in English and **Jieba** in Chinese, and **SentenceTransformers** with pre-trained models for vectorization.
* **MySQL** was used for database operations to store messages and responses.

### How to Use

1. [Clone repository](https://github.com/junhecui/chatbot).
2. Connect to an SQL Database and create a `.env` file with the following elements: `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `ADMIN_NAME` (WeChat administrator account name), and `ADMIN_ROOM_TOPIC` (WeChat primary group chat).
3. Run `npm install`.
   * If program does not function correctly, try individually installing `wechaty`, `wechaty-puppet-wechat4u`, `qrcode-terminal`, `mysql`, `mysql2`.
4. Run `pip install flask sentence-transformers stanza jieba nltk`.
5. Scan QR code with WeChat account user desires the bot to function on.
6. The bot will be ready to function.

### Instructions for Adding Keywords / Responses

When the program is running:

* `!add <keyword> <response>` will add a keyword paired with a response message to the database.
* `!editKeyword <index> <keyword>` will add new keywords paired with the response message at that specific index.
* `!editResponse <index> <response>` will change the response message at that specific index.
* `!remove <index>` will remove the keyword - response pairing at that index.
* `!remove <index> <keyword>` will remove the specific keyword at that index.

### Instructions for Administrator

If you want to use administrator features, responding to messages remotely, you will need to set an `ADMIN_NAME` (WeChat display name) and `ADMIN_ROOM_TOPIC` (WeChat room topic) in environment variables. The administrator corresponding to `ADMIN_NAME` is the only one who can respond to questions remotely, and the questions will be sent to the room corresponding to `ADMIN_ROOM_TOPIC`.

## 简体中文

### 功能

* 自动回复包含关键字的消息。
  * 能够在消息服务中添加/删除回复。
* 收到问题时（任何带问号的消息）自动向管理员发送消息。
  * 管理员的回复将被转发给用户。

### 使用方法

1. [克隆仓库](https://github.com/junhecui/chatbot)。
2. 设置环境变量并连接到SQL数据库。
3. 运行 `npm install`。
   * 如果程序运行不正常，尝试分别安装wechaty, wechaty-puppet-wechat4u, qrcode-terminal, mysql, mysql2。
4. 使用希望机器人运行的微信账号扫描二维码。
5. 机器人将准备就绪。

### 使用技术

* TypeScript
* Node.js
* MySQL 数据库
* Wechaty 库

### 添加关键字/回复的说明

程序运行时：

* `!add <关键字> <回复>` 将添加一个关键字和一个回复消息到数据库。
* `!editKeyword <索引> <关键字>` 将在特定索引处添加新的关键字并配对相应的回复消息。
* `!editResponse <索引> <回复>` 将更改特定索引处的回复消息。
* `!remove <索引>` 将移除特定索引处的关键字-回复对。
* `!remove <索引> <关键字>` 将移除特定索引处的特定关键字。

### 管理员说明

如果您想使用管理员功能（远程回复消息），您需要在环境变量中设置 `ADMIN_NAME`（微信显示名称）和 `ADMIN_ROOM_TOPIC`（微信群聊主题）。对应 `ADMIN_NAME` 的管理员是唯一可以远程回复问题的人，问题将被发送到对应 `ADMIN_ROOM_TOPIC` 的群聊中。
