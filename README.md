# WeChat Helper Bot

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

1. [Clone repository](https://github.com/junhecui/chatbot).
2. Connect to an SQL Database and create a `.env` file with the following elements: `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `USER_NAME` (Bot user account name), `ADMIN_ROOM_TOPIC` (Room for bot to monitor), and `RESPONSE_ROOM_TOPIC` (Room for responding with the message relay feature).
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

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE.txt) file for details.

### Contact Information

For support, please contact `cjunhe05@gmail.com`.

## 中文

### 功能

#### 自动相似消息响应

* 使用预训练模型根据相似的历史提示自动响应英文和中文消息。
  * 发送的消息和用户在选定群聊中的响应将记录在数据库中，下次发送相似消息时，机器人将以相同方式自动响应用户。

#### 手动关键词输入

* 自动响应包含关键词的消息。
  * 能够在消息服务中添加/删除响应。
  * 为一个响应添加多个关键词将需要消息中同时存在所有关键词才能发送特定响应。

#### 消息中继功能

* 当另一个用户使用相关消息 ping 机器人用户时，自动向机器人用户发送消息。
  * 用户响应将被中继回目标群组。

### 使用的技术

* [**Wechaty 库**](https://wechaty.js.org/) 用于实现基本的微信机器人功能。
* **TypeScript**，托管在 **Node.js** 和 **Express.js** 服务器上，用于实现 Wechaty 库以及处理应用内消息、数据库操作和使用 **Axios** 向 Flask 端点发出 HTTP 请求。
* **Python** 用于开发 **Flask** 中的 REST API 端点，使用 **Stanza** 进行英文的词干化和词形还原，使用 **Jieba** 进行中文的分词，使用预训练模型的 **SentenceTransformers** 进行向量化。
* **MySQL** 用于数据库操作，存储消息和响应。

### 使用方法

1. [克隆仓库](https://github.com/junhecui/chatbot)。
2. 连接到 SQL 数据库并创建一个包含以下元素的 `.env` 文件：`DB_HOST`、`DB_USER`、`DB_PASSWORD`、`DB_NAME`、`USER_NAME`（机器人用户账号名称）、`ADMIN_ROOM_TOPIC`（机器人监控的房间）和 `RESPONSE_ROOM_TOPIC`（消息中继功能响应的房间）。
3. 运行 `npm install`。
   * 如果程序无法正常运行，尝试分别安装 `wechaty`、`wechaty-puppet-wechat4u`、`qrcode-terminal`、`mysql`、`mysql2`。
4. 运行 `pip install flask sentence-transformers stanza jieba nltk`。
5. 使用用户希望机器人运行的微信账号扫描二维码。
6. 机器人将准备就绪。

### 添加关键词/响应的操作说明

程序运行时：

* `!add <关键词> <响应>` 将添加一个关键词及其对应的响应消息到数据库。
* `!editKeyword <索引> <关键词>` 将添加新的关键词到指定索引的响应消息中。
* `!editResponse <索引> <响应>` 将更改指定索引的响应消息。
* `!remove <索引>` 将删除指定索引的关键词-响应配对。
* `!remove <索引> <关键词>` 将删除指定索引的特定关键词。

## 许可证

此项目根据 MIT 许可证授权 - 详细信息请参见 [LICENSE](LICENSE.txt) 文件。

### 联系信息

如需支持，请联系 `cjunhe05@gmail.com`。
