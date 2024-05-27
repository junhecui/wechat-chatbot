# WeChat Assistant Chatbot

This WeChat assistant chatbot uses keyword recognition and text similarity to automate responses to messages, reducing the need for human intervention. It was developed with corporate settings in mind, for efficiently handling customer inquiries, providing quick responses to common questions, and improving overall communication workflows. The automation this bot provides can save time and enhance productivity by automating routing activities.

Developed by Jun He Cui at his internship at 麦斯信通科技(大连)有限公司.

## Features

### Automatic Similar Message Response

* Uses pre-trained models to automatically respond to messages in English and Chinese based on similar historical prompts.
  * Sent messages and user response in chosen group chat is logged in a database such that the next time a similar message is sent, the bot will automatically respond for the user in the same manner.

### Manual Keyword Input

* Automatically respond to messages containing keywords.
  * Ability to add / remove responses within messaging service.
  * Adding multiple keywords for one response will require all the keywords being present in the message for the specific response to be sent.
  * Note: Manual keyword input will *override* automatic similar message response; if a message contains all the keywords for a keyword : response pairing, the associated response will be sent.

### Message Relay Feature

* Automatically messages bot user in response room when message is not automatically responded to through similar message response or keyword : response pairing.
  * User response will be relayed back to target group.

## Technologies Used

* [**Wechaty Library**](https://wechaty.js.org/) was used for the basic WeChat bot functions.
* **TypeScript**, hosted on a **Node.js** and **Express.js** server, was used to implement the Wechaty library as well as handling in-app messages, database operations, and making HTTP requests to the Flask endpoints with **Axios**.
* **Python** was used in developing REST API endpoints in **Flask**, tokenization and lemmatization utilizing **Stanza** in English and **Jieba** in Chinese, and **SentenceTransformers** with pre-trained models for vectorization.
* **MySQL** was used for database operations to store messages and responses.

## How to Use

1. [Clone repository](https://github.com/junhecui/wechat-chatbot).
2. Connect to an SQL Database and create a `.env` file with the following elements: `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `USER_NAME` (Bot user account name), `ADMIN_ROOM_TOPIC` (Room for bot to monitor), and `RESPONSE_ROOM_TOPIC` (Room for responding with the message relay feature).
3. Run `npm install`.
   * If program does not function correctly, try individually installing `wechaty`, `wechaty-puppet-wechat4u`, `qrcode-terminal`, `mysql`, `mysql2`.
4. Run `pip install flask sentence-transformers stanza jieba nltk`.
5. Run `npm start` and `python3.11 api/api.py`
6. Scan QR code with WeChat account user desires the bot to function on.
7. The bot will be ready to function.

## Database Instructions

To ensure all features are functional, please connect to a SQL database with the following tables:

### Messages Table

| Column         | Data Type   | Attributes                  |
|----------------|-------------|-----------------------------|
| `id`           | INT         | AUTO INCREMENT, NOT NULL    |
| `messageText`  | TEXT        | NOT NULL                    |
| `embedding`    | BLOB        | NOT NULL                    |
| `messageSender`| VARCHAR     | NOT NULL                    |
| `roomTOPIC`    | VARCHAR     | NOT NULL                    |
| `response`     | TEXT        |                             |

### Keywords Table

| Column           | Data Type   | Attributes                  |
|------------------|-------------|-----------------------------|
| `id`             | INT         | AUTO INCREMENT, NOT NULL    |
| `keyword`        | VARCHAR     | NOT NULL                    |
| `keywordResponse`| VARCHAR     | NOT NULL                    |

## Instructions for Adding Keywords / Responses

When the program is running:

* `!add <keyword> <response>` will add a keyword paired with a response message to the database.
* `!editKeyword <index> <keyword>` will add new keywords paired with the response message at that specific index.
* `!editResponse <index> <response>` will change the response message at that specific index.
* `!remove <index>` will remove the keyword : response pairing at that index.
* `!remove <index> <keyword>` will remove the specific keyword at that index.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE.txt) file for details.

## Contact Information

For support, please contact `cjunhe05@gmail.com`.
