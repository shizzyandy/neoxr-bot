/*
 * JADIBOT.JS - Main Bot Creation Logic
 * 
 * This file handles the creation of new WhatsApp bot instances (sub-bots) for users.
 * It supports both QR code and pairing code authentication methods.
 * 
 * KEY FEATURES:
 * - User bot instance creation
 * - QR code and pairing code authentication
 * - Session management and storage
 * - Retry logic and error handling
 * - Database integration for bot tracking
 * 
 * DEPENDENCIES:
 * - @neoxr/wb: Core WhatsApp bot library
 * - qrcode: QR code generation
 * - @cacheable/node-cache: Caching for retry logic
 * 
 * USAGE:
 * Users can create their own bot by sending: !jadibot [phone_number] [--qr|--pairing]
 * 
 * DATABASE STRUCTURE:
 * global.db.bots = [
 *   {
 *     _id: string,           // Encrypted key
 *     jid: string,           // WhatsApp JID of the bot
 *     sender: string,        // JID of the user who created the bot
 *     last_connect: number,  // Timestamp of last connection
 *     is_connected: boolean, // Current connection status
 *     stop: boolean,         // If bot is manually stopped
 *     is_new: boolean,       // If this is a new bot instance
 *     method: string,        // Connection method (--qr or --pairing)
 *     data: object          // Bot-specific data storage
 *   }
 * ]
 */

const { Component } = require('@neoxr/wb')
const { Client: Baileys, Chiper, Instance } = new Component
const fs = require('fs')
const qrcode = require('qrcode')
const { encrypt } = new Chiper
const { models } = require('../../lib/system/models')
const { NodeCache } = require('@cacheable/node-cache')

// Retry cache to prevent duplicate requests
const retryCache = new NodeCache({
   stdTTL: 60,
   checkperiod: 60
})

const colors = require('colors')
const chalk = require('chalk')
const moment = require('moment-timezone')

exports.run = {
   usage: ['jadibot'],
   use: 'number',
   category: 'bot hosting',
   hidden: ['on', 'scan', 'host'], // Alternative command names
   async: async (m, {
      client: parent,
      args,
      isPrefix,
      command,
      env,
      database,
      config: { session },
      Func
   }) => {
      try {
         // Initialize bots array if not exists
         global.db.bots = Array.isArray(global.db?.bots) ? global.db.bots : (global.db.bots = [])

         const [number, method] = args
         if (!number) return parent.reply(m.chat, Func.example(isPrefix, command, '62858111111'), m)

         // Validate WhatsApp number
         const result = await parent.onWhatsApp(number)
         const { jid: main, exists } = result?.[0] || {}
         if (!exists) return parent.reply(m.chat, Func.texted('bold', '🚩 Number not registered on WhatsApp.'), m)

         const bot = global.db.bots

         // Check if command is for creating new bot
         if (/on|jadibot|scan|host/.test(command)) {
            if (bot.some(v => v.sender === main && v.is_connected)) return m.reply(`✅ Your bot is connected.`)
            
            // Ensure only main bot can create sub-bots
            if (parent.decodeJid(parent.user.id) !== `${env.pairing.number}@s.whatsapp.net`) {
               return m.reply(`🪸 Chat the main bot here : https://wa.me/${env.pairing.number}?text=${isPrefix + command}`)
            }
         }

         // Check if bot already exists for this user
         let fn = bot.find(v => {
            const vJid = parent.decodeJid(v.jid)
            const vSender = parent.decodeJid(v.sender)
            return (
               (vJid && (vJid === main || vJid === m.sender)) ||
               (vSender && (vSender === main || vSender === m.sender))
            )
         })

         if (fn) {
            let pr = `Number is already hosted : \n\n`
            pr += `◦ *Bot* : @${fn.jid.replace(/@.+/, '')}\n`
            pr += `◦ *Last Connect* : ${Func.timeAgo(fn.last_connect)}\n`
            pr += `◦ *Connected* : ${fn.is_connected ? '✅' : '❌'}\n`
            pr += `◦ *Owner* : @${fn.sender.replace(/@.+/, '')}\n`
            pr += `◦ *Token* : ${fn._id}`
            return m.reply(pr.trim())
         }

         // Check available slots
         if (bot.length >= env.bot_hosting.slot) {
            return m.reply(Func.texted('bold', `🚩 Sorry, slots are full.`))
         }

         // Request connection method if not provided
         if (!method || !['--pairing', '--qr'].includes(method)) {
            return parent.replyButton(m.chat, [
               { text: 'Scan QR', command: `${isPrefix + command} ${number} --qr` },
               { text: 'Pairing Code', command: `${isPrefix + command} ${number} --pairing` }
            ], m, {
               text: 'Please select how you\'d like to connect your device'
            })
         }

         m.react('🕒')

         // Prevent duplicate requests
         if (retryCache.has(m.sender)) {
            return m.reply(`❌ Previous request has not been completed.`)
         }

         retryCache.set(m.sender, true)

         // Generate encryption key for bot identification
         const key = encrypt(main)
         const creds = bot.find(v => v.sender === main && !v.is_connected)
         const id = creds ? String(creds.sender.replace(/@.+/, '')) : String(main.replace(/@.+/, ''))

         // Create session directory if using local sessions
         if (!session.isExternal && creds && !fs.existsSync(`./${env.bot_hosting.session_dir}/${id}`)) {
            fs.mkdirSync(`./${env.bot_hosting.session_dir}/${id}`)
         }

         // Create new Baileys client instance for the sub-bot
         let client = {}
         client[main] = new Baileys({
            type: '--neoxr-v1',
            plugsdir: 'plugins',
            session: session.isExternal ? session.execute(session.config, id) : `${env.bot_hosting.session_dir}/${id}`,
            presence: true,
            bypass_disappearing: true,
            bot: Func.isBot,
            server: env.bot_hosting.server,
            online: true,
            code: env.pairing.code || '',
            version: env.pairing.version
         }, {
            ...(env.pairing?.browser ? { browser: env.pairing.browser } : {}),
            pairing: method === '--pairing' ? { state: true, number: id } : { state: false },
            shouldIgnoreJid: jid => /(newsletter|bot)/.test(jid)
         })

         // Handle connection events (QR code or pairing code)
         client[main].on('connect', async (json) => {
            const isObject = json.constructor.name === 'Object'

            if (!retryCache.has(m.sender)) return

            // Handle pairing code method
            if (isObject && json.code) {
               let text = `乂  *L O G I N*\n\n`
               text += `1. On the WhatsApp home screen, tap *( ⋮ )* and select *Linked Devices*\n`
               text += `2. Tap "Link with phone number instead"\n`
               text += `3. Enter this code: *${json.code}*\n`
               text += `4. This code will expire in 60 seconds\n\n`
               text += global.footer

               return parent.reply(m.chat, text, m).then(async () => {
                  await Func.delay(59_000)

                  if (retryCache.has(m.sender) && !bot.find(v => v.jid === main && v.is_connected)) {
                     m.reply(`❌ Pairing code expired.`)
                     clearTimeout(json.timeout)
                     client[main].sock.end()
                     retryCache.del(m.sender)
                     if (!session.isExternal) {
                        fs.rmSync(`./${env.bot_hosting.session_dir}/${id}`, { recursive: true, force: true })
                     }
                  }
               })
            }

            // Handle QR code method
            if (isObject && json.qr) {
               let text = `乂  *L O G I N*\n\n`
               text += `1. On the WhatsApp home screen, tap *( ⋮ )* and select *Linked Devices*\n`
               text += `2. Scan the QR code below\n`
               text += `3. This QR code will expire in 60 seconds\n\n`
               text += global.footer

               const buffer = await qrcode.toBuffer(json.qr, { type: 'png' })

               return parent.sendFile(m.chat, buffer, '', text, m).then(async () => {
                  await Func.delay(59_000)
                  if (retryCache.has(m.sender) && !bot.find(v => v.jid === main && v.is_connected)) {
                     m.reply(`❌ QR code expired.`)
                     clearTimeout(json.timeout)
                     client[main].sock.end()
                     retryCache.del(m.sender)
                     if (!session.isExternal) {
                        fs.rmSync(`./${env.bot_hosting.session_dir}/${id}`, { recursive: true, force: true })
                     }
                  }
               })
            }
         })

         // Handle connection errors
         client[main].on('error', async error => {
            retryCache.del(m.sender)
            if (
               error.message === 'Device logged out' ||
               error.message === 'Multi device mismatch' ||
               error.message === 'Method not allowed' ||
               error.message === 'Bad session file'
            ) {
               parent.reply(m.chat, error.message).then(() => {
                  client[main].sock.end()
                  Func.removeItem(bot, bot.find(v => v.jid === main))
                  if (!session.isExternal && fs.existsSync(`./${env.bot_hosting.session_dir}/${id}`)) {
                     fs.rmSync(`./${env.bot_hosting.session_dir}/${id}`, { recursive: true, force: true })
                  }
               })
            }
         })

         // Handle successful connection
         client[main].on('ready', async ({ user }) => {
            // Validate that the connected number matches the requested number
            if (parent.decodeJid(user.id) !== main) {
               retryCache.del(m.sender)
               return parent.reply(m.sender, `❌ Number you provided does not match the expected number.`, m).then(async () => {
                  await Func.delay(3000)
                  client[main].sock.logout()
               })
            }

            // Register bot instance in the Instance manager
            Instance.setBot(main, client[main])

            // Update existing bot or create new bot entry
            if (fn) {
               fn.is_connected = true
               fn.last_connect = Date.now()
            } else {
               global.db.bots.push({
                  _id: key,
                  jid: main,
                  sender: m.sender,
                  last_connect: Date.now(),
                  is_connected: true,
                  stop: false,
                  is_new: true,
                  method,
                  data: { ...models.def_props }
               })
            }

            // Send success notification
            await parent.reply(m.sender, '✅ Your WhatsApp account has successfully connected.', m).then(async () => {
               await parent.reply(`${env.owner}@c.us`, `📩 New bot connected : @${id}`)
               if (creds) {
                  creds.is_connected = true
                  creds.last_connect = Date.now()
               }
               await Func.delay(1000)
               
               // Send web dashboard token if available
               const token = Instance.getData(main)
               if (token?.hash && process.env.DOMAIN) {
                  let pr = '⚠ This token is used for authorizing the WhatsApp Gateway via the *x-neoxr-token* header.\nTreat this token like a password.\n\n'
                  pr += `${token.hash}\n\n`
                  pr += `> Login here to manage your bot : ${process.env.DOMAIN}`
                  parent.reply(m.sender, pr, m)
               }
               retryCache.del(m.sender)

               // Save database and restart to prevent data conflicts
               await database.save(global.db)
               const date = moment(Date.now()).format('DD/MM/YY HH:mm:ss')
               console.log(chalk.black(chalk.bgGreen(` Notification `)), chalk.black(chalk.bgYellow(` ${date} `)), ':', colors.gray('Restart the connection to prevent duplicate data when a new sub-bot is connected'))
               setTimeout(async () => {
                  process.send('reset')
               }, 5000)
            })

            // Attach event listeners to the new bot instance
            require('../../lib/system/listener-wrapper')(client[main], database, session)
         })
      } catch (e) {
         retryCache.del(m.sender)
         parent.reply(m.chat, Func.jsonFormat(e), m)
      }
   },
   error: false,
   limit: true
}