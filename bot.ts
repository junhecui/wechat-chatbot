import 'dotenv/config.js'

import {
    Contact,
    Message,
    ScanStatus,
    WechatyBuilder,
    log,
} from 'wechaty'

import qrcodeTerminal from 'qrcode-terminal'

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
    let toReplyTo = await bot.Contact.find({name: "Roy Cui 贷款专家 6043365777"}) // replace with any temp value
    if (msg.text().startsWith(command)) { // acts as a command '!bot help'
        let message = msg.text().substring(command.length + 1)
        log.info('Bot', message.toString())

        const sender = msg.talker()
        log.info('Contact Id:', sender?.id, 'Name:', sender?.name())

        if (message.toLowerCase().includes("hi") || message.toLowerCase().includes("hello")) {
            await msg.say('Hello ' + sender?.name() + "!")
        }
        else if (message.toLowerCase().includes("help")) {
            await msg.say('What do you need help with?') // list out common options
        }
        else {
            await msg.say('抱歉 ' + sender?.name() + ', 我回答不了这个问题，给行政人员转发了。')
            const forwardRecipient = await bot.Room.find({id: '@@56e64cf367d97ec508bd2c6124da185a9e92d18954a5ff41e04c514cba3721dc'}) // replace with admin or room id   

            if (forwardRecipient) {
                await forwardRecipient.say(sender?.name() + " 提出了以下问题：" + message)
                log.info('forwarded', message, 'to', forwardRecipient?.topic())
                let toReplyTo = sender
            }
        }
    } else if (msg.text().startsWith(respondCommand)) {
        let message = msg.text().substring(respondCommand.length + 1)
        const sender = msg.talker()
        let admin = await bot.Contact.find({id: "@36e1e6a6ad11f3b709125b8e4168491cb32ad50fc132cd8a3d8951142231187b"}) // replace with admin id
        if (admin && sender.id === admin.id) {
            await toReplyTo?.say(toReplyTo?.name() + ", " + message + " - " + sender?.name())
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
    .then(() => log.info('Bot', 'Bot Started.'))
    .catch(e => log.error('Bot', e))
