import 'dotenv/config.js'
import connectToDatabase from './db'
import mysql, { Connection, MysqlError } from 'mysql'


import {
    Contact,
    Message,
    ScanStatus,
    WechatyBuilder,
    log,
} from 'wechaty'

import qrcodeTerminal from 'qrcode-terminal'

let dbConnection: Connection | null = null


async function initializeDatabase() {
    try {
        dbConnection = await connectToDatabase();
        log.info('Database', 'Connected successfully');
    } catch (error) {
        if (error instanceof Error) { // Proper type checking
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
    const command = '!bot'
    const respondCommand = '!respond'
    const messageText = msg.text()
    const sender = msg.talker()
    const senderName = sender.name()
    const roomTopic = msg.room()?.topic()

    if (dbConnection) {
        dbConnection.query(
            'INSERT INTO messages (contact_name, contact_id, message_content) VALUES (?, ?, ?)',
            [messageText, senderName, roomTopic],
            (error: MysqlError | null, results) => {
                if (error) {
                    console.error('DB Error:', error.message);
                    return;
                }
                console.log('Message Logged to DB:', results.insertId);
            }
        );
    } else {
        console.log('Database connection not available.');
    }
    // let toReplyTo = await bot.Contact.find({name: "Roy Cui 贷款专家 6043365777"}) // replace with any temp value
    if (msg.text().startsWith(command)) { // acts as a command '!bot help'
        let message = msg.text().substring(command.length + 1)
        // log.info('Bot', message.toString())

        // log.info('Contact Id:', sender?.id, 'Name:', sender?.name())

        if (message.toLowerCase().includes("hi") || message.toLowerCase().includes("hello")) {
            await msg.say('Hello ' + sender?.name() + "!")
        }
        else if (message.toLowerCase().includes("help")) {
            await msg.say('What do you need help with?') // list out common options
        }
        else {
            await msg.say('抱歉 ' + sender?.name() + ', 我回答不了这个问题，给行政人员转发了。')
            // const forwardRecipient = await bot.Room.find({topic: 'Test Chat'}) // replace with admin id or room topic - room id changes every instance so does not work

            // if (forwardRecipient) {
            //     log.info(forwardRecipient.id)
            //     await forwardRecipient.say(sender?.name() + " 提出了以下问题：" + message)
            //     log.info('forwarded', message, 'to', forwardRecipient?.topic())
            //     let toReplyTo = sender
            // }
        }
    // } else if (msg.text().startsWith(respondCommand)) {
    //     let message = msg.text().substring(respondCommand.length + 1)
    //     const sender = msg.talker()
    //     let admin = await bot.Contact.find({name: "Jun He Cui"}) // replace with admin id
    //     if (admin && sender.name() === admin.name()) {
    //         await toReplyTo?.say(toReplyTo?.name() + ", " + message + " - " + sender?.name())
    //     } else {
    //         msg.say("hi")
    //     }
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


    
    