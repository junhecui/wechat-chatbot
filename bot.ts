import 'dotenv/config.js'

import {
  Contact,
  Message,
  ScanStatus,
  WechatyBuilder,
  log,
}                  from 'wechaty'

import qrcodeTerminal from 'qrcode-terminal'

function onScan (qrcode: string, status: ScanStatus) {
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

function onLogin (user: Contact) {
  log.info('Bot', '%s login', user)
}

function onLogout (user: Contact) {
  log.info('Bot', '%s logout', user)
}

async function onMessage (msg: Message) {
    if (msg.text().startsWith('@'.concat('temp '))) {
        let message = msg.text().substring(6)
        log.info('Bot', message.toString())
        
        const sender = msg.from();
        log.info('Contact Id:', sender?.id, 'Name:', sender?.name());

        if (message === 'ding') {
            await msg.say('Hi ' + sender?.name() + ', dong')
        }
        else {
            await msg.say('抱歉, ' + sender?.name())
        }
    }
}

const bot = WechatyBuilder.build({
  name: 'bot',
  puppet: 'wechaty-puppet-whatsapp',
})

bot.on('scan',    onScan)
bot.on('login',   onLogin)
bot.on('logout',  onLogout)
bot.on('message', onMessage)

bot.start()
  .then(() => log.info('Bot', 'Bot Started.'))
  .catch(e => log.error('Bot', e))
