# WeChat Assistant Chatbot

## English

### Features

#### Automatic Similar Message Response

* Uses pre-trained models to automatically respond to messages in English and Chinese based on similar historical prompts.
  * Sent messages and user response in chosen group chat is logged in a database such that the next time a similar message is sent, the bot will automatically respond for the user in the same manner.

#### Manual Keyword Input

* Automatically respond to messages containing keywords.
  * Ability to add / remove responses within messaging service.
  * Adding multiple keywords for one response will require all the keywords being present in the message for the specific response to be sent.

#### Message Relay Feature

* Automatically messages bot user when pinged by another user with associated message.
  * User response will be relayed back to target group.

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

## Messages Table

| Column         | Data Type   | Attributes                  |
|----------------|-------------|-----------------------------|
| `id`           | INT         | AUTO INCREMENT, NOT NULL    |
| `messageText`  | TEXT        | NOT NULL                    |
| `embedding`    | BLOB        | NOT NULL                    |
| `messageSender`| VARCHAR     | NOT NULL                    |
| `roomTOPIC`    | VARCHAR     | NOT NULL                    |
| `response`     | TEXT        |                             |

## Keywords Table

| Column           | Data Type   | Attributes                  |
|------------------|-------------|-----------------------------|
| `id`             | INT         | AUTO INCREMENT, NOT NULL    |
| `keyword`        | VARCHAR     | NOT NULL                    |
| `keywordResponse`| VARCHAR     | NOT NULL                    |

### Instructions for Adding Keywords / Responses

When the program is running:

* `!add <keyword> <response>` will add a keyword paired with a response message to the database.
* `!editKeyword <index> <keyword>` will add new keywords paired with the response message at that specific index.
* `!editResponse <index> <response>` will change the response message at that specific index.
* `!remove <index>` will remove the keyword - response pairing at that index.
* `!remove <index> <keyword>` will remove the specific keyword at that index.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE.txt) file for details.

### Contact Information

For support, please contact `cjunhe05@gmail.com`.

## 中文

### 功能

#### 自动相似消息响应

* 使用预训练模型根据相似的历史提示自动响应英文和中文消息。
  * 发送的消息和用户在选定群聊中的响应会记录在数据库中，以便下次发送类似消息时，机器人会以相同方式自动响应用户。

#### 手动关键词输入

* 自动响应包含关键词的消息。
  * 能够在消息服务中添加/删除响应。
  * 为一个响应添加多个关键词时，需要消息中同时存在所有关键词才能发送特定响应。

#### 消息中继功能

* 当其他用户通过相关消息提醒机器人用户时，自动向机器人用户发送消息。
  * 用户响应将被中继回目标群。

### 使用的技术

* [**Wechaty库**](https://wechaty.js.org/)用于基本的微信机器人功能。
* **TypeScript**，托管在**Node.js**和**Express.js**服务器上，用于实现Wechaty库以及处理应用内消息、数据库操作和使用**Axios**向Flask端点发送HTTP请求。
* **Python**用于开发**Flask**中的REST API端点，使用**Stanza**进行英文的分词和词形还原，使用**Jieba**进行中文分词，使用**SentenceTransformers**的预训练模型进行向量化。
* **MySQL**用于存储消息和响应的数据库操作。

### 如何使用

1. [克隆仓库](https://github.com/junhecui/wechat-chatbot)。
2. 连接到SQL数据库并创建一个包含以下元素的`.env`文件：`DB_HOST`，`DB_USER`，`DB_PASSWORD`，`DB_NAME`，`USER_NAME`（机器人用户账号名称），`ADMIN_ROOM_TOPIC`（机器人监控的房间），和`RESPONSE_ROOM_TOPIC`（消息中继功能的响应房间）。
3. 运行`npm install`。
   * 如果程序运行不正确，请尝试单独安装`wechaty`，`wechaty-puppet-wechat4u`，`qrcode-terminal`，`mysql`，`mysql2`。
4. 运行`pip install flask sentence-transformers stanza jieba nltk`。
5. 运行`npm start`和`python3.11 api/api.py`。
6. 使用微信账号扫描二维码。
7. 机器人将准备就绪。

### 数据库说明

为了确保所有功能正常，请连接到一个包含以下表格的SQL数据库：

## 消息表

| 列名            | 数据类型    | 属性                         |
|----------------|-------------|-----------------------------|
| `id`           | INT         | AUTO INCREMENT, NOT NULL              |
| `messageText`  | TEXT        | NOT NULL                        |
| `embedding`    | BLOB        | NOT NULL                        |
| `messageSender`| VARCHAR     | NOT NULL                         |
| `roomTOPIC`    | VARCHAR     | NOT NULL                         |
| `response`     | TEXT        |                             |

## 关键词表

| 列名              | 数据类型    | 属性                         |
|------------------|-------------|-----------------------------|
| `id`             | INT         | AUTO INCREMENT, NOT NULL              |
| `keyword`        | VARCHAR     | NOT NULL                       |
| `keywordResponse`| VARCHAR     | NOT NULL                       |

### 添加关键词/响应的说明

程序运行时：

* `!add <keyword> <response>` 将添加一个关键词与响应消息配对到数据库。
* `!editKeyword <index> <keyword>` 将在特定索引处为响应消息添加新关键词。
* `!editResponse <index> <response>` 将更改特定索引处的响应消息。
* `!remove <index>` 将删除特定索引处的关键词-响应配对。
* `!remove <index> <keyword>` 将删除特定索引处的特定关键词。

## 许可证

此项目是根据MIT许可证授权的 - 有关详细信息，请参阅[LICENSE](LICENSE.txt)文件。

### 联系信息

如需支持，请联系`cjunhe05@gmail.com`。
