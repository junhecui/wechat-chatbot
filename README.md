# WeChat Assistant Chatbot

## English

This WeChat assistant chatbot uses keyword recognition and text similarity to automate responses to messages, reducing the need for human intervention. Developed with corporate settings in mind, the Chatbot handles customer inquiries, provides quick responses to common questions, and improves communication workflows. The automation this bot provides can save time and enhance productivity by automating routine activities.

Developed by Jun He Cui at his internship at 麦斯信通科技(大连)有限公司.

### Features

#### Automatic Similar Message Response

* Uses pre-trained models to automatically respond to messages in English and Chinese based on similar historical prompts.
  * Sent messages and user response in chosen group chat is logged in a database such that the next time a similar message is sent, the bot will automatically respond for the user in the same manner.

#### Manual Keyword Input

* Automatically respond to messages containing keywords.
  * Ability to add / remove responses within messaging service.
  * Adding multiple keywords for one response will require all the keywords being present in the message for the specific response to be sent.
  * Note: Manual keyword input will *override* automatic similar message response; if a message contains all the keywords for a keyword : response pairing, the associated response will be sent.

#### Message Relay Feature

* Automatically messages bot user in response room when message is not automatically responded to through similar message response or keyword : response pairing.
  * User response (message beginning with `!respond`) will be relayed back to target group.

### Technologies Used

* [**Wechaty Library**](https://wechaty.js.org/) was used for the basic WeChat bot functions.
* **TypeScript**, hosted on a **Node.js** and **Express.js** server, was used to implement the Wechaty library as well as handling in-app messages, database operations, and making HTTP requests to the Flask endpoints with **Axios**.
* **Python** was used in developing REST API endpoints in **Flask**, tokenization and lemmatization utilizing **Stanza** in English and **Jieba** in Chinese, and **SentenceTransformers** with pre-trained models for vectorization.
* **MySQL** was used for database operations to store messages and responses.

### How to Use

1. [Clone repository](https://github.com/junhecui/wechat-chatbot).
2. Connect to an SQL Database and create a `.env` file with the following elements: `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `USER_NAME` (Bot user account name), `ADMIN_ROOM_TOPIC` (Room for bot to monitor), and `RESPONSE_ROOM_TOPIC` (Room for responding with the message relay feature).
3. Run `npm install`.
   * If program does not function correctly, try individually installing `wechaty`, `wechaty-puppet-wechat4u`, `qrcode-terminal`, `mysql`, `mysql2`.
4. Run `pip install flask sentence-transformers stanza jieba nltk`.
5. Run `npm start` and `python3.11 api/api.py`
6. Scan QR code with WeChat account user desires the bot to function on.
7. The bot will be ready to function.

### Database Instructions

To ensure all features are functional, please connect to a SQL database with the following tables:

#### Messages Table

| Column         | Data Type   | Attributes                  |
|----------------|-------------|-----------------------------|
| `id`           | INT         | AUTO INCREMENT, NOT NULL    |
| `messageText`  | TEXT        | NOT NULL                    |
| `embedding`    | BLOB        | NOT NULL                    |
| `messageSender`| VARCHAR     | NOT NULL                    |
| `roomTOPIC`    | VARCHAR     | NOT NULL                    |
| `response`     | TEXT        |                             |

#### Keywords Table

| Column           | Data Type   | Attributes                  |
|------------------|-------------|-----------------------------|
| `id`             | INT         | AUTO INCREMENT, NOT NULL    |
| `keyword`        | VARCHAR     | NOT NULL                    |
| `keywordResponse`| VARCHAR     | NOT NULL                    |

### Instructions for Adding Keywords / Responses

When the program is running, user may enter the following commands in any WeChat chat:

* `!add <keyword> <response>` will add a keyword paired with a response message to the database.
* `!editKeyword <index> <keyword>` will add new keywords paired with the response message at that specific index.
* `!editResponse <index> <response>` will change the response message at that specific index.
* `!remove <index>` will remove the keyword : response pairing at that index.
* `!remove <index> <keyword>` will remove the specific keyword at that index.

### License

This project is licensed under the MIT License - see the [LICENSE](LICENSE.txt) file for details.

### Contact Information

For support, please contact `cjunhe05@gmail.com`.

## 微信助手聊天机器人

这个微信助手聊天机器人使用关键词识别和文本相似度来自动回复消息，减少了人工干预的需求。它专为企业环境而开发，能够处理客户咨询，快速回复常见问题，并改善沟通工作流程。通过自动化常规活动，这个机器人可以节省时间并提高生产力。

由崔俊鹤在他的实习期间在麦斯信通科技（大连）有限公司开发。

### 功能

#### 自动相似消息回复

* 使用预训练模型根据类似的历史提示自动回复英文和中文消息。
  * 在数据库中记录发送的消息和用户在选定群聊中的回复，这样下次发送类似消息时，机器人会以相同的方式自动回复用户。

#### 手动关键词输入

* 自动回复包含关键词的消息。
  * 能够在消息服务中添加/删除回复。
  * 为一个回复添加多个关键词时，需要消息中同时包含所有关键词才能发送特定回复。
  * 注意：手动关键词输入将*覆盖*自动相似消息回复；如果消息中包含所有关键词：回复配对，关联的回复将被发送。

#### 消息转发功能

* 当消息未通过相似消息回复或关键词：回复配对自动回复时，自动在响应房间中向机器人用户发送消息。
  * 用户回复（以 `!respond` 开头的消息）将被转发回目标群。

### 使用技术

* [**Wechaty库**](https://wechaty.js.org/) 用于基本的微信机器人功能。
* 使用 **TypeScript**，托管在 **Node.js** 和 **Express.js** 服务器上，来实现Wechaty库以及处理应用内消息、数据库操作和通过 **Axios** 向 Flask 端点发送HTTP请求。
* **Python** 用于开发 **Flask** 中的 REST API 端点，使用 **Stanza** 进行英文和 **Jieba** 进行中文的分词和词形还原，以及使用预训练模型的 **SentenceTransformers** 进行向量化。
* **MySQL** 用于数据库操作以存储消息和回复。

### 使用方法

1. [克隆存储库](https://github.com/junhecui/wechat-chatbot)。
2. 连接到 SQL 数据库并创建 `.env` 文件，包含以下元素：`DB_HOST`，`DB_USER`，`DB_PASSWORD`，`DB_NAME`，`USER_NAME`（机器人用户账号名称），`ADMIN_ROOM_TOPIC`（机器人监控的房间），以及 `RESPONSE_ROOM_TOPIC`（消息转发功能的响应房间）。
3. 运行 `npm install`。
   * 如果程序运行不正常，尝试单独安装 `wechaty`，`wechaty-puppet-wechat4u`，`qrcode-terminal`，`mysql`，`mysql2`。
4. 运行 `pip install flask sentence-transformers stanza jieba nltk`。
5. 运行 `npm start` 和 `python3.11 api/api.py`。
6. 使用希望机器人运行的微信账户扫描二维码。
7. 机器人将准备就绪。

### 数据库说明

为确保所有功能正常运行，请连接到具有以下表格的 SQL 数据库：

#### 消息表

| 列名             | 数据类型   | 属性                          |
|------------------|-------------|-----------------------------|
| `id`             | INT         | 自动递增，非空                |
| `messageText`    | TEXT        | 非空                         |
| `embedding`      | BLOB        | 非空                         |
| `messageSender`  | VARCHAR     | 非空                         |
| `roomTOPIC`      | VARCHAR     | 非空                         |
| `response`       | TEXT        |                             |

#### 关键词表

| 列名               | 数据类型   | 属性                          |
|------------------|-------------|-----------------------------|
| `id`             | INT         | 自动递增，非空                |
| `keyword`        | VARCHAR     | 非空                         |
| `keywordResponse`| VARCHAR     | 非空                         |

### 添加关键词/回复的说明

当程序运行时，用户可以在任何微信聊天中输入以下命令：

* `!add <keyword> <response>` 将添加一对关键词与回复消息到数据库。
* `!editKeyword <index> <keyword>` 将在特定索引处添加与回复消息配对的新关键词。
* `!editResponse <index> <response>` 将更改特定索引处的回复消息。
* `!remove <index>` 将删除特定索引处的关键词：回复配对。
* `!remove <index> <keyword>` 将删除特定索引处的特定关键词。

### 许可证

该项目根据 MIT 许可证授权 - 有关详细信息，请参阅 [LICENSE](LICENSE.txt) 文件。

### 联系信息

如需支持，请联系 `cjunhe05@gmail.com`。
