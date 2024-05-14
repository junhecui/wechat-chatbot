# ChatBot

## Functions

* Automatically respond to messages containing keywords.
  * Ability to add / remove responses within messaging service.
* Automatically messages administrator when receiving a question (any message with a question mark).
  * Administrator response will be relayed back to the user.

## How to Use

1. [Clone repository.](https://github.com/junhecui/chatbot)
2. Set environment variables and connect to a SQL Database.
3. npm install
   * If program does not function correctly, try individually installing wechaty, wechaty-puppet-wechat4u, qrcode-terminal, mysql, mysql2.
4. Scan QR code with WeChat account user desires the bot to function on.
5. The bot will be ready to function.

## Instructions for Adding Keywords / Responses

When the program is running:

* !add \<keyword> \<response> will add a keyword paired with a response message to the database.
* !editKeyword \<index> \<keyword> will add new keywords paired with the response message at that specific index.
* !editResponse \<index> \<response> will change the response message at that specific index.
* !remove \<index> will remove the keyword - response pairing.
* !remove \<index> \<keyword> will remove the specific keyword at that index.
