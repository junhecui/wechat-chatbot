import 'dotenv/config';
import connectToDatabase from './db';
import mysql from 'mysql2/promise';
import { Contact, Message, ScanStatus, WechatyBuilder, log } from 'wechaty';
import qrcodeTerminal from 'qrcode-terminal';
import axios from 'axios';
import { ResultSetHeader } from 'mysql2';

let dbConnection: mysql.Connection | null = null;
let lastMessageId: number | null = null;

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
    const userName = process.env.USER_NAME || '';

    const lang = /[\u4e00-\u9fa5]/.test(messageText) ? 'zh' : 'en';

    if (msg.self()) {
        handleBotCommand(messageText);
        await updateMessageResponse(messageText);
    } else {
        if (dbConnection && messageText && topic === adminRoomTopic) {
            await logMessageToDatabase(messageText, senderName, topic, lang);
        }

        const keywordResponse = await checkKeywords(messageText);
        if (keywordResponse) {
            await msg.say(keywordResponse);
            return;  // Don't forward if keyword response is found
        } else {
            const foundResponse = await handleIncomingMessage(msg, messageText, senderName, lang);
            if (foundResponse) {
                return;  // Don't forward if similarity response is found
            }
        }
    }

    if (messageText.startsWith(respondCommand)) {
        await handleRespondCommand(msg, messageText);
    }

    if (messageText.includes(`@${userName}`)) {
        await forwardMessageToAdminRoom(senderName, messageText);
    }
}

async function checkKeywords(messageText: string): Promise<string | null> {
    try {
        const query = 'SELECT keyword, keywordResponse FROM keywords';
        const [results] = await dbConnection!.query<mysql.RowDataPacket[]>(query);

        for (const row of results) {
            const keywords = row.keyword.split(',').map((k: string) => k.trim());
            const allKeywordsPresent = keywords.every((keyword: string) => 
                new RegExp(`\\b${keyword}\\b`, 'i').test(messageText)
            );

            if (allKeywordsPresent) {
                return row.keywordResponse;
            }
        }
    } catch (error) {
        handleError('DB', 'Error checking keywords in database', error);
    }
    return null;
}

async function logMessageToDatabase(messageText: string, senderName: string, topic: string, lang: string) {
    try {
        console.log('Attempting to get embedding for:', messageText);
        const response = await axios.post('http://localhost:4999/embedding', { text: messageText, lang });
        const embedding = response.data.embedding;

        if (!Array.isArray(embedding) || (embedding.length !== 384 && embedding.length !== 768)) {
            throw new Error('Invalid embedding format or dimension');
        }

        console.log('Generated embedding dimension:', embedding.length);

        const buffer = Buffer.alloc(embedding.length * 4);
        for (let i = 0; i < embedding.length; i++) {
            buffer.writeFloatBE(embedding[i], i * 4);
        }
        console.log('Embedding buffer:', buffer);

        const [results] = await dbConnection!.execute<ResultSetHeader>(
            'INSERT INTO messages (messageText, embedding, messageSender, roomTopic, response) VALUES (?, ?, ?, ?, ?)',
            [messageText, buffer, senderName, topic, '']
        );
        lastMessageId = results.insertId;
        console.log('Message logged to DB with ID:', lastMessageId);
    } catch (error) {
        handleError('DB', 'Error logging message to database', error);
    }
}

async function updateMessageResponse(responseText: string) {
    if (lastMessageId === null) {
        console.error('No message to update with response');
        return;
    }

    try {
        const [results] = await dbConnection!.execute<ResultSetHeader>(
            'UPDATE messages SET response = ? WHERE id = ?',
            [responseText, lastMessageId]
        );
        console.log('Updated message response in DB with ID:', lastMessageId);
        lastMessageId = null;  // Reset lastMessageId after updating
    } catch (error) {
        handleError('DB', 'Error updating message response in database', error);
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

async function handleIncomingMessage(msg: Message, messageText: string, senderName: string, lang: string): Promise<string | null> {
    console.log('Handling incoming message:', messageText);
    const foundResponse = await searchSimilarMessageResponse(messageText, lang);

    if (foundResponse) {
        console.log('Found response:', foundResponse);
        await msg.say(foundResponse);
        return foundResponse;
    } else {
        console.log('No matching keyword found.');
    }

    return null;
}

async function searchSimilarMessageResponse(messageText: string, lang: string): Promise<string | null> {
    try {
        console.log('Generating embedding for:', messageText);
        const response = await axios.post('http://localhost:4999/embedding', { text: messageText, lang });
        const inputEmbedding = response.data.embedding;

        console.log('Input embedding dimension:', inputEmbedding.length);
        console.log('Input embedding vector:', inputEmbedding);

        const [results] = await dbConnection!.query<mysql.RowDataPacket[]>('SELECT id, messageText, embedding, response FROM messages');

        if (results.length === 0) {
            console.log('No entries found in the database.');
            return null;
        }

        // Set maxSimilarity based on language
        let maxSimilarity = lang === 'zh' ? 0.625 : 0.65;
        let bestMatchResponse: string | null = null;

        for (const row of results) {
            const { id, messageText: storedMessageText, embedding, response } = row;

            // Skip the current message and entries with empty responses
            if (id === lastMessageId || !response) continue;

            const storedBuffer = Buffer.from(embedding);
            const storedEmbedding = new Float32Array(storedBuffer.length / 4);
            for (let i = 0; i < storedEmbedding.length; i++) {
                storedEmbedding[i] = storedBuffer.readFloatBE(i * 4);
            }

            // Skip embeddings with non-matching dimensions
            if (storedEmbedding.length !== inputEmbedding.length) continue;

            console.log('Stored message text:', storedMessageText);
            console.log('Stored embedding dimension:', storedEmbedding.length);
            console.log('Stored embedding vector:', Array.from(storedEmbedding));

            const similarityResponse = await axios.post('http://localhost:4999/similarity', {
                embedding1: inputEmbedding,
                embedding2: Array.from(storedEmbedding)
            });
            const similarity = similarityResponse.data.similarity;

            console.log(`Similarity with "${storedMessageText}":`, similarity);

            if (similarity > maxSimilarity) {
                maxSimilarity = similarity;
                bestMatchResponse = response;
            }
        }

        console.log('Best match response:', bestMatchResponse);
        console.log('Maximum similarity:', maxSimilarity);

        return bestMatchResponse;
    } catch (error) {
        handleError('DB', 'Error searching for similar message', error);
    }

    return null;
}

async function forwardMessageToAdminRoom(senderName: string, message: string) {
    const adminRoomTopic = process.env.RESPONSE_ROOM_TOPIC || '';
    const forwardRecipient = await bot.Room.find({ topic: adminRoomTopic });

    if (forwardRecipient) {
        await forwardRecipient.say(`${senderName}: ${message}`);
        log.info('forwarded', message, 'to', forwardRecipient.topic());
    }
}

async function handleRespondCommand(msg: Message, message: string) {
    const sender = msg.talker();
    const adminName = process.env.USER_NAME || '';
    const admin = await bot.Contact.find({ name: adminName });

    if (admin && sender.name() === admin.name()) {
        const toReplyTo = await bot.Room.find({ topic: process.env.ADMIN_ROOM_TOPIC || '' });
        if (toReplyTo) {
            message = message.substring(9)
            await toReplyTo.say(`${message} - ${sender.name()}`);
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

type AggregateError = {
    errors: any[];
};

function isAggregateError(error: unknown): error is AggregateError {
    return typeof error === 'object' && error !== null && 'errors' in error && Array.isArray((error as any).errors);
}

function handleError(context: string, message: string, error: unknown) {
    if (error instanceof Error) {
        console.error(`${context} - ${message}: ${error.message}`);
        if (error.stack) {
            console.error('Stack trace:', error.stack);
        }
        // Specific logging for Axios errors
        if (axios.isAxiosError(error)) {
            console.error('Axios error details:', {
                url: error.config?.url,
                method: error.config?.method,
                data: error.config?.data,
                headers: error.config?.headers,
                response: error.response ? {
                    status: error.response.status,
                    data: error.response.data,
                } : 'No response'
            });
        }
    } else if (typeof error === 'object' && error !== null && 'response' in error) {
        const errResponse = (error as any).response;
        console.error(`${context} - ${message}:`, errResponse.data);
        console.error('Error response status:', errResponse.status);
    } else if (isAggregateError(error)) {
        console.error(`${context} - ${message}: Multiple errors`);
        for (const e of error.errors) {
            console.error(e);
        }
    } else {
        console.error(`${context} - ${message}:`, error);
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
