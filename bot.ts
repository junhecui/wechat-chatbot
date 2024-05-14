import 'dotenv/config.js'
import connectToDatabase from './db'
import mysql from 'mysql2/promise'
import { Contact, Message, ScanStatus, WechatyBuilder, log } from 'wechaty'
import qrcodeTerminal from 'qrcode-terminal'

let dbConnection: mysql.Connection | null = null

async function initializeDatabase() {
    try {
        dbConnection = await connectToDatabase();
        log.info('Database', 'Connected successfully');
    } catch (error) {
        if (error instanceof Error) { 
            log.error('Database', 'Failed to connect: ' + error.message);
        } else {
            log.error('Database', 'Failed to connect and error type is not standard Error.');
        }
        dbConnection = null;
    }
}

function onScan(qrcode: string, status: ScanStatus) {
    if (status === ScanStatus.Waiting || status === ScanStatus.Timeout) {
        const qrcodeImageUrl = [
            'https://wechaty.js.org/qrcode/',
            encodeURIComponent(qrcode),
        ].join('')
        log.info('Bot', 'onScan: %s(%s) - %s', ScanStatus[status], status, qrcodeImageUrl)

        qrcodeTerminal.generate(qrcode, { small: true })

    } else {
        log.info('Bot', 'onScan: %s(%s)', ScanStatus[status], status)
    }
}

function onLogin(user: Contact) {
    log.info('Bot logged into', '%s', user.name())
}

function onLogout(user: Contact) {
    log.info('Bot logged out of', '%s', user.name())
}

async function onMessage(msg: Message) {
    const messageText = msg.text()
    const sender = msg.talker()
    const senderName = sender.name()
    const room = msg.room()
    let topic = "No Room"
    let toReplyTo = await bot.Room.find({ topic: "Test Chat" }) // replace with any temp value
    let message = msg.text()
    let respondCommand = "!respond "

    if (room) {
        topic = await room.topic()
    }

    if (dbConnection && messageText && topic === 'Test Chat') {
        try {
            const [results] = await dbConnection.execute<mysql.ResultSetHeader>(
                'INSERT INTO messages (messageText, messageSender, roomTopic) VALUES (?, ?, ?)',
                [messageText, senderName, topic]
            );
            console.log('Message Logged to DB:', results.insertId);
        } catch (error) {
            if (error instanceof Error) {
                console.error('DB Error:', error.message);
            }
        }
    }

    if (msg.self()) {
        if (message.startsWith('!add ')) {
            await addKeyword(message);
        } else if (message.startsWith('!editKeyword ')) {
            await editKeyword(message);
        } else if (message.startsWith('!editResponse ')) {
            await editKeywordResponse(message);
        } else if (message.startsWith('!remove ')) {
            await removeKeyword(message);
        }
    } else {
        type KeywordResult = {
            keyword: string;
            keywordResponse: string;
        };

        const searchQuery = 'SELECT keyword, keywordResponse FROM keywords';
        try {
            const [results] = await dbConnection!.query<mysql.RowDataPacket[]>(searchQuery);
            let foundResponse: string | null = null;

            results.forEach((result: mysql.RowDataPacket) => {
                const { keyword, keywordResponse } = result as KeywordResult;
                const keywords: string[] = keyword.split(','); // Split the keywords by comma
                // Check if any keyword is contained within the message
                keywords.forEach((keyword: string) => {
                    if (message.includes(keyword.trim())) {
                        foundResponse = keywordResponse;
                    }
                });
            });

            if (!foundResponse) {
                console.log('No matching keyword found.');
            } else {
                msg.say(foundResponse);
            }
        } catch (error) {
            if (error instanceof Error) {
                console.error('Error searching for keyword:', error.message);
            }
        }

        if (message.includes('?')) { // for catching missed messages
            const forwardRecipient = await bot.Room.find({ topic: 'Test Chat' }) // replace with admin id or room topic - room id changes every instance so does not work

            if (forwardRecipient) {
                log.info(forwardRecipient.id)
                await forwardRecipient.say(sender?.name() + " 提出了以下问题：" + message)
                log.info('forwarded', message, 'to', forwardRecipient?.topic())
            }
        }
    }

    if (msg.text().startsWith(respondCommand)) {
        const sender = msg.talker()
        let admin = await bot.Contact.find({ name: "Jun He Cui" }) // replace with admin name
        if (admin && sender.name() === admin.name()) {
            await toReplyTo?.say(toReplyTo?.topic() + ", " + message + " - " + sender?.name())
        }
    }
}

async function addKeyword(message: string) {
    const parts = message.split(' ');
    const keyword = parts[1];
    const keywordResponse = parts.slice(2).join(' ');

    if (!keyword || !keywordResponse) {
        console.error('Invalid format for !add command.');
        return;
    }

    const query = 'INSERT INTO keywords (keyword, keywordResponse) VALUES (?, ?)';
    try {
        await dbConnection!.execute(query, [keyword, keywordResponse]);
        console.log('Keyword added successfully.');
    } catch (error) {
        if (error instanceof Error) {
            console.error('Error adding keyword:', error.message);
        }
    }
}

async function editKeyword(message: string) {
    const parts = message.split(' ');
    const id = parts[1];
    const keyword = parts[2];

    if (!id || !keyword) {
        console.error('Invalid format for !editKeyword command.');
        return;
    }

    try {
        const selectQuery = 'SELECT keyword FROM keywords WHERE id = ?';
        const [rows]: any = await dbConnection!.execute<mysql.RowDataPacket[]>(selectQuery, [id]);

        if (rows.length === 0) {
            console.error('No entry found for the given ID.');
            return;
        }

        const existingKeyword = rows[0].keyword;
        const newKeyword = `${existingKeyword},${keyword}`;

        const updateQuery = 'UPDATE keywords SET keyword = ? WHERE id = ?';
        await dbConnection!.execute(updateQuery, [newKeyword, id]);
        console.log('Keyword updated successfully.');
    } catch (error) {
        if (error instanceof Error) {
            console.error('Error editing keyword:', error.message);
        }
    }
}

async function editKeywordResponse(message: string) {
    const parts = message.split(' ');
    if (parts.length < 3) {
        console.error('Invalid format for !editResponse command.');
        return;
    }
    const id = parts[1];
    const newResponse = parts.slice(2).join(' ');

    const updateQuery = 'UPDATE keywords SET keywordResponse = ? WHERE id = ?';
    try {
        await dbConnection!.execute(updateQuery, [newResponse, id]);
        console.log('Keyword response updated successfully.');
    } catch (error) {
        if (error instanceof Error) {
            console.error('Error updating keyword response:', error.message);
        }
    }
}

async function removeKeyword(message: string) {
    const parts = message.split(' ');
    if (parts.length < 2) {
        console.error('Invalid format for !remove command.');
        return;
    }
    const id = parts[1];
    const keywordToRemove = parts.slice(2).join(' ');

    if (keywordToRemove) {
        try {
            const selectQuery = 'SELECT keyword FROM keywords WHERE id = ?';
            const [rows]: any = await dbConnection!.execute<mysql.RowDataPacket[]>(selectQuery, [id]);

            if (rows.length === 0) {
                console.error('No entry found for the given ID.');
                return;
            }

            const keywords = rows[0].keyword.split(',');
            const filteredKeywords = keywords.filter((kw: string) => kw !== keywordToRemove);
            const updatedKeywords = filteredKeywords.join(',');

            const updateQuery = 'UPDATE keywords SET keyword = ? WHERE id = ?';
            await dbConnection!.execute(updateQuery, [updatedKeywords, id]);
            console.log('Keyword removed successfully.');
        } catch (error) {
            if (error instanceof Error) {
                console.error('Error removing keyword:', error.message);
            }
        }
    } else {
        try {
            const deleteQuery = 'DELETE FROM keywords WHERE id = ?';
            await dbConnection!.execute(deleteQuery, [id]);
            console.log('Keyword removed successfully.');
        } catch (error) {
            if (error instanceof Error) {
                console.error('Error removing keyword:', error.message);
            }
        }
    }
}

const bot = WechatyBuilder.build({
    name: 'bot',
    puppet: 'wechaty-puppet-wechat4u',
})

bot.on('scan', onScan)
bot.on('login', onLogin)
bot.on('logout', onLogout)
bot.on('message', onMessage)

bot.start()
    .then(async () => {
        log.info('Bot', 'Bot Started.')
        await initializeDatabase();
    })
    .catch(e => log.error('Bot', e))
