import { makeWASocket, useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys'
import express from 'express'
// import { Boom } from '@hapi/boom'
const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys')

import { Boom } from '@hapi/boom'

async function connectToWhatsApp () {
    const sock = makeWASocket({
        // can provide additional config here
        printQRInTerminal: true,
        auth: state
    })
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update
        if(connection === 'close') {
            const shouldReconnect = lastDisconnect.error instanceof Boom && lastDisconnect.error.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('connection closed due to ', lastDisconnect.error, ', reconnecting ', shouldReconnect)
            // reconnect if not logged out
            if(shouldReconnect) {
                connectToWhatsApp()
            }
        } else if(connection === 'open') {
            console.log('opened connection')
        }
    })
    sock.ev.on('messages.upsert', m => {
        console.log(JSON.stringify(m, undefined, 2))

        console.log('replying to', m.messages[0].key.remoteJid)
        // await sock.sendMessage(m.messages[0].key.remoteJid!, { text: 'Hello there!' })
    })
    // save saveCreds
    sock.ev.on ('creds.update', saveCreds)

    return sock
}
const sock = connectToWhatsApp()


const PORT = process.env.PORT || 3000
const app = express()


app.get('/', (req, res) => {
    res.send('Hallo Nana!')
})

// make send message
app.get('/send', async (req, res) => {
    const jid = req.query.jid;
    const message = req.query.message;
    await (await sock).sendMessage(jid+"@s.whatsapp.net", { text: message })
    res.send('Message sent!');
})

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})
