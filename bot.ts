import 'dotenv/config.js'
import connectToDatabase from './db'
import mysql from 'mysql2/promise'
import { Contact, Message, ScanStatus, WechatyBuilder, log } from 'wechaty'
import qrcodeTerminal from 'qrcode-terminal'
import axios from 'axios'

let dbConnection: mysql.Connection | null = null

async function initializeDatabase() {
    try {
        dbConnection = await connectToDatabase();
        log.info('Database', 'Connected successfully');
    } catch (error) {
        handleError('Database', 'Failed to connect', error);
        dbConnection = null;
    }
}

function onScan(qrcode: string, status: ScanStatus) {
    if (status === ScanStatus.Waiting || status === ScanStatus.Timeout) {
        const qrcodeImageUrl = `https://wechaty.js.org/qrcode/${encodeURIComponent(qrcode)}`;
        log.info('Bot', 'onScan: %s(%s) - %s', ScanStatus[status], status, qrcodeImageUrl);
        qrcodeTerminal.generate(qrcode, { small: true });
    } else {
        log.info('Bot', 'onScan: %s(%s)', ScanStatus[status], status);
    }
}

function onLogin(user: Contact) {
    log.info('Bot', 'Logged into %s', user.name());
}

function onLogout(user: Contact) {
    log.info('Bot', 'Logged out of %s', user.name());
}

async function onMessage(msg: Message) {
    const messageText = msg.text();
    const sender = msg.talker();
    const senderName = sender.name();
    const room = msg.room();
    const topic = room ? await room.topic() : 'No Room';
    const adminRoomTopic = process.env.ADMIN_ROOM_TOPIC || '';
    const respondCommand = '!respond ';

    if (dbConnection && messageText && topic === adminRoomTopic) {
        logMessageToDatabase(messageText, senderName, topic);
    }

    if (msg.self()) {
        handleBotCommand(messageText);
    } else {
        await handleIncomingMessage(msg, messageText, senderName);
    }

    if (messageText.startsWith(respondCommand)) {
        await handleRespondCommand(msg, messageText);
    }
}

async function logMessageToDatabase(messageText: string, senderName: string, topic: string) {
    try {
        const [results] = await dbConnection!.execute<mysql.ResultSetHeader>(
            'INSERT INTO messages (messageText, messageSender, roomTopic) VALUES (?, ?, ?)',
            [messageText, senderName, topic]
        );
        console.log('Message Logged to DB:', results.insertId);
    } catch (error) {
        handleError('DB', 'Error logging message to database', error);
    }
}

function handleBotCommand(message: string) {
    if (message.startsWith('!add ')) {
        addKeyword(message);
    } else if (message.startsWith('!editKeyword ')) {
        editKeyword(message);
    } else if (message.startsWith('!editResponse ')) {
        editKeywordResponse(message);
    } else if (message.startsWith('!remove ')) {
        removeKeyword(message);
    }
}

async function handleIncomingMessage(msg: Message, messageText: string, senderName: string) {
    const foundResponse = await searchKeywordResponse(messageText);

    if (foundResponse) {
        msg.say(foundResponse);
    } else {
        console.log('No matching keyword found.');
    }

    if (messageText.includes('?')) {
        await forwardMessageToAdminRoom(senderName, messageText);
    }
}

async function searchKeywordResponse(messageText: string): Promise<string | null> {
    const searchQuery = 'SELECT keyword, keywordResponse FROM keywords';

    try {
        const [results] = await dbConnection!.query<mysql.RowDataPacket[]>(searchQuery);
        for (const result of results) {
            const { keyword, keywordResponse } = result as { keyword: string, keywordResponse: string };
            const keywords = keyword.split(',').map(k => k.trim());
            if (keywords.some(k => messageText.includes(k))) {
                return keywordResponse;
            }
        }
    } catch (error) {
        handleError('DB', 'Error searching for keyword', error);
    }

    return null;
}

async function forwardMessageToAdminRoom(senderName: string, message: string) {
    const adminRoomTopic = process.env.ADMIN_ROOM_TOPIC || '';
    const forwardRecipient = await bot.Room.find({ topic: adminRoomTopic });

    if (forwardRecipient) {
        await forwardRecipient.say(`${senderName} 提出了以下问题：${message}`);
        log.info('forwarded', message, 'to', forwardRecipient.topic());
    }
}

async function handleRespondCommand(msg: Message, message: string) {
    const sender = msg.talker();
    const adminName = process.env.ADMIN_NAME || '';
    const admin = await bot.Contact.find({ name: adminName });

    if (admin && sender.name() === admin.name()) {
        const toReplyTo = await bot.Room.find({ topic: process.env.ADMIN_ROOM_TOPIC || '' });
        if (toReplyTo) {
            await toReplyTo.say(`${toReplyTo.topic()}, ${message} - ${sender.name()}`);
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
        handleError('DB', 'Error adding keyword', error);
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
        const [rows] = await dbConnection!.execute<mysql.RowDataPacket[]>(selectQuery, [id]);

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
        handleError('DB', 'Error editing keyword', error);
    }
}

async function editKeywordResponse(message: string) {
    const parts = message.split(' ');
    const id = parts[1];
    const newResponse = parts.slice(2).join(' ');

    if (!id || !newResponse) {
        console.error('Invalid format for !editResponse command.');
        return;
    }

    const updateQuery = 'UPDATE keywords SET keywordResponse = ? WHERE id = ?';
    try {
        await dbConnection!.execute(updateQuery, [newResponse, id]);
        console.log('Keyword response updated successfully.');
    } catch (error) {
        handleError('DB', 'Error updating keyword response', error);
    }
}

async function removeKeyword(message: string) {
    const parts = message.split(' ');
    const id = parts[1];
    const keywordToRemove = parts.slice(2).join(' ');

    if (keywordToRemove) {
        try {
            const selectQuery = 'SELECT keyword FROM keywords WHERE id = ?';
            const [rows] = await dbConnection!.execute<mysql.RowDataPacket[]>(selectQuery, [id]);

            if (rows.length === 0) {
                console.error('No entry found for the given ID.');
                return;
            }

            const keywords = rows[0].keyword.split(',').filter((keyword: string) => keyword !== keywordToRemove);
            const updatedKeywords = keywords.join(',');

            const updateQuery = 'UPDATE keywords SET keyword = ? WHERE id = ?';
            await dbConnection!.execute(updateQuery, [updatedKeywords, id]);
            console.log('Keyword removed successfully.');
        } catch (error) {
            handleError('DB', 'Error removing keyword', error);
        }
    } else {
        try {
            const deleteQuery = 'DELETE FROM keywords WHERE id = ?';
            await dbConnection!.execute(deleteQuery, [id]);
            console.log('Keyword removed successfully.');
        } catch (error) {
            handleError('DB', 'Error removing keyword', error);
        }
    }
}

function handleError(context: string, message: string, error: unknown) {
    if (error instanceof Error) {
        console.error(`${context} - ${message}: ${error.message}`);
    } else {
        console.error(`${context} - ${message}: Non-standard error type.`);
    }
}

const bot = WechatyBuilder.build({
    name: 'bot',
    puppet: 'wechaty-puppet-wechat4u',
});

bot.on('scan', onScan);
bot.on('login', onLogin);
bot.on('logout', onLogout);
bot.on('message', onMessage);

bot.start()
    .then(async () => {
        log.info('Bot', 'Bot Started.');
        await initializeDatabase();
    })
    .catch(e => log.error('Bot', e));
