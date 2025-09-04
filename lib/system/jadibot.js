/*
 * JADIBOT.JS - Multi-User Bot Creation Logic
 * 
 * This module handles the creation of new sub-bot instances for users.
 * It supports both QR code and pairing code authentication methods.
 */

const { Component } = require('@neoxr/wb')
const { Baileys, Function: Func, Config: env } = new Component
const qrcode = require('qrcode')
const fs = require('fs')
const chalk = require('@colors/colors')
const colors = require('@colors/colors')
const { NodeCache } = require('@cacheable/node-cache')

const retryCache = new NodeCache({
   stdTTL: 0
})

// Function to create a new bot instance
const createBotInstance = async (phoneNumber, method = 'qr', client, database, session) => {
   return new Promise(async (resolve, reject) => {
      try {
         const main = phoneNumber.replace(/\D/g, '')
         const id = main
         const bot = global.db.bots || []

         // Check bot limit
         if (bot.length >= env.bot_hosting.slot) {
            return reject(new Error('Bot slot limit reached'))
         }

         // Check if bot already exists
         if (bot.some(v => v.jid === main && v.is_connected)) {
            return reject(new Error('Bot already connected'))
         }

         // Create session directory if needed
         if (!session.isExternal) {
            if (!fs.existsSync(`./${env.bot_hosting.session_dir}/${id}`)) {
               fs.mkdirSync(`./${env.bot_hosting.session_dir}/${id}`, { recursive: true })
            }
         }

         // Create new Baileys client instance for the sub-bot
         let botClient = {}
         botClient[main] = new Baileys({
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
            pairing: method === 'pair' ? { state: true, number: id } : { state: false },
            shouldIgnoreJid: jid => /(newsletter|bot)/.test(jid)
         })

         // Store retry information
         retryCache.set(main, 0)

         // Handle connection events
         botClient[main].on('connect', async json => {
            const isObject = typeof json === 'object'

            // Handle pairing code method
            if (isObject && json.code && method === 'pair') {
               resolve({
                  success: true,
                  method: 'pair',
                  code: json.code,
                  sessionId: main,
                  message: 'Enter this pairing code in WhatsApp settings'
               })
            }

            // Handle QR code method
            if (isObject && json.qr && method === 'qr') {
               try {
                  const buffer = await qrcode.toBuffer(json.qr, { type: 'png' })
                  const qrBase64 = `data:image/png;base64,${buffer.toString('base64')}`
                  
                  resolve({
                     success: true,
                     method: 'qr',
                     qrCode: qrBase64,
                     sessionId: main,
                     message: 'Scan the QR code with WhatsApp'
                  })
               } catch (qrError) {
                  reject(new Error('Failed to generate QR code'))
               }
            }
         })

         // Handle successful connection
         botClient[main].on('ready', async () => {
            const { Instance } = require('@neoxr/wb').Component
            
            try {
               // Register bot in Instance manager
               Instance.setBot(main, botClient[main])

               // Add to database
               const existingBot = global.db.bots.find(v => v.jid === main)
               if (existingBot) {
                  existingBot.is_connected = true
                  existingBot.last_connect = Date.now()
                  existingBot.method = method
               } else {
                  global.db.bots.push({
                     jid: main,
                     sender: main,
                     method: method,
                     last_connect: Date.now(),
                     is_connected: true,
                     data: {}
                  })
               }

               // Clean up retry cache
               retryCache.del(main)

               // Save database
               await database.save(global.db)

               console.log(chalk.black(chalk.bgGreen(` Bot Created `)), ':', colors.gray(`${main} connected successfully`))

               // Send welcome message to the new bot user
               try {
                  await botClient[main].sock.sendMessage(`${main}@s.whatsapp.net`, {
                     text: `🤖 *Bot Connected Successfully!*\n\n` +
                           `✅ Your personal WhatsApp bot is now active\n` +
                           `📱 Phone: +${main}\n` +
                           `🕐 Connected: ${new Date().toLocaleString()}\n\n` +
                           `Your bot is ready to use! Send any command to get started.`
                  })
               } catch (msgError) {
                  console.log('Failed to send welcome message:', msgError.message)
               }

               // Attach event listeners to the new bot instance
               require('../../lib/system/listener-wrapper')(botClient[main], database, session)

            } catch (e) {
               console.error('Error in bot ready handler:', e)
            }
         })

         // Handle errors
         botClient[main].on('error', async error => {
            console.log('Bot creation error:', error.message)
            
            if (error.message === 'Bad session file' || 
                error.message === 'Device logged out' ||
                error.message === 'Multi device mismatch') {
               
               // Clean up failed session
               if (!session.isExternal && fs.existsSync(`./${env.bot_hosting.session_dir}/${id}`)) {
                  fs.rmSync(`./${env.bot_hosting.session_dir}/${id}`, { recursive: true, force: true })
               }
               
               // Remove from database if exists
               const existingBot = global.db.bots.find(v => v.jid === main)
               if (existingBot) {
                  global.db.bots = global.db.bots.filter(v => v.jid !== main)
               }
               
               retryCache.del(main)
               reject(new Error('Session initialization failed'))
            }
         })

         // Set timeout for connection
         setTimeout(() => {
            if (retryCache.has(main)) {
               retryCache.del(main)
               reject(new Error('Connection timeout'))
            }
         }, 120000) // 2 minutes timeout

      } catch (e) {
         reject(e)
      }
   })
}

module.exports = { createBotInstance }