import 'dotenv/config.js'
import connectToDatabase from './db'
import mysql, { Connection, MysqlError } from 'mysql'
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
    let toReplyTo = await bot.Room.find({topic: "Test Chat"}) // replace with any temp value
    let message = msg.text()
    let respondCommand = "!respond "

    if (room) {
        topic = await room.topic()
    }

    if (dbConnection && messageText) {
        dbConnection.query(
            'INSERT INTO messages (messageText, messageSender, roomTopic) VALUES (?, ?, ?)',
            [messageText, senderName, topic],
            (error: MysqlError | null, results) => {
                if (error) {
                    console.error('DB Error:', error.message);
                    return;
                }
                console.log('Message Logged to DB:', results.insertId);
            }
        );
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
    }

    if (message.includes('?')) {
        await msg.say('抱歉 ' + sender?.name() + ', 我回答不了这个问题，给行政人员转发了。')
        const forwardRecipient = await bot.Room.find({topic: 'Test Chat'}) // replace with admin id or room topic - room id changes every instance so does not work

        if (forwardRecipient) {
            log.info(forwardRecipient.id)
            await forwardRecipient.say(sender?.name() + " 提出了以下问题：" + message)
            log.info('forwarded', message, 'to', forwardRecipient?.topic())
        }
    }

    if (msg.text().startsWith(respondCommand)) {
        const sender = msg.talker()
        let admin = await bot.Contact.find({name: "Jun He Cui"}) // replace with admin name
        if (admin && sender.name() === admin.name()) {
            await toReplyTo?.say(toReplyTo?.topic() + ", " + message + " - " + sender?.name())
        }
    }
}

async function addKeyword(message: string) {
    const [command, keyword, keywordResponse] = message.split(' ');

    if (!keyword || !keywordResponse) {
        console.error('Invalid format for !add command.');
        return;
    }

    const query = 'INSERT INTO keywords (keyword, keywordResponse) VALUES (?, ?)';
    await dbConnection!.query(query, [keyword, keywordResponse]);
    console.log('Keyword added successfully.');
}

async function editKeyword(message: string) {
    const [command, id, keyword] = message.split(' ');

    if (!id || !keyword) {
        console.error('Invalid format for !edit command.');
        return;
    }

    const selectQuery = 'SELECT keyword FROM keywords WHERE id = ?';
    const [rows]: any = await dbConnection!.query(selectQuery, [id]);

    if (rows.length === 0) {
        console.error('No entry found for the given ID.');
        return;
    }

    const existingKeyword = rows[0].keyword;
    const newKeyword = `${existingKeyword},${keyword}`;

    const updateQuery = 'UPDATE keywords SET keyword = ? WHERE id = ?';
    await dbConnection!.query(updateQuery, [newKeyword, id]);
    console.log('Keyword updated successfully.');
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
    dbConnection!.query(updateQuery, [newResponse, id], (updateError) => {
        if (updateError) {
            console.error('Error updating keyword response:', updateError.message);
            return;
        }
        console.log('Keyword response updated successfully.');
    });
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
        const [command, id, keyword] = message.split(' ');

        if (!id || !keyword) {
            console.error('Invalid format for !edit command.');
            return;
        }

        const selectQuery = 'SELECT keyword FROM keywords WHERE id = ?';
        const [rows]: any = await dbConnection!.query(selectQuery, [id]);

        if (rows.length === 0) {
            console.error('No entry found for the given ID.');
            return;
        }

        const keywords = rows[0].keyword.split(',');
        const filteredKeywords = keywords.filter((kw: string) => kw !== keywordToRemove);
        const updatedKeywords = filteredKeywords.join(',');

        const updateQuery = 'UPDATE keywords SET keyword = ? WHERE id = ?';
        await dbConnection!.query(updateQuery, [updatedKeywords, id]);
        console.log('Keyword removed successfully.');
    } else {
        const deleteQuery = 'DELETE FROM keywords WHERE id = ?';
        dbConnection!.query(deleteQuery, [id], (deleteError) => {
            if (deleteError) {
                console.error('Error removing keyword:', deleteError.message);
                return;
            }
            console.log('Keyword removed successfully.');
        });
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
