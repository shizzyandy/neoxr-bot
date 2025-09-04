/*
 * BOT-MANAGER.JS - Bot Management Commands
 * 
 * This file provides management commands for the multi-user bot system.
 * It allows users to view bot lists, get bot information, and logout their bots.
 * 
 * KEY FEATURES:
 * - List all connected bots (listbot)
 * - Show specific bot information (botinfo)
 * - Logout/disconnect bots (logout)
 * - Security checks to prevent unauthorized access
 * 
 * COMMANDS:
 * - !listbot: Shows all connected bots with their status
 * - !botinfo: Shows information about the current bot instance
 * - !logout: Disconnects and removes the bot instance
 * 
 * SECURITY:
 * - Only bot owners can logout their own bots
 * - Bot information is masked for privacy
 * - Session cleanup on logout
 */

const { Component } = require('@neoxr/wb')
const { Instance } = new Component
const fs = require('fs')

exports.run = {
   usage: ['listbot', 'botinfo', 'logout'],
   category: 'bot hosting',
   async: async (m, {
      client,
      command,
      env,
      Func
   }) => {
      try {
         if (command === 'listbot') {
            // Initialize bots array if not exists
            global.db.bots = global.db.bots ? global.db.bots : []
            
            if (!global.db.bots.length) return client.reply(m.chat, Func.texted('bold', `🚩 No bots connected.`), m)
            
            let pr = `乂  *L I S T B O T*\n\n`
            global.db.bots.map((v, i) => {
               // Mask phone number for privacy
               pr += `*${i + 1}. ${Func.maskNumber(client.decodeJid(v.jid).replace(/@.+/, ''))}*\n`
               
               // Get user name from database or show "No Name"
               pr += `◦ *Name* : ${global.db.users.find(x => x.jid === v.jid) ? global.db.users.find(x => x.jid === v.jid).name : 'No Name'}\n`
               
               // Show last connection time
               pr += `◦ *Last Connect* : ${Func.timeAgo(v.last_connect)}\n`
               
               // Show connection status
               pr += `◦ *Connected* : ${v.is_connected ? '✅' : '❌'}\n`
               
               // Show bot token for identification
               pr += `◦ *Token* : ${v._id}\n\n`
            }).join('\n\n')
            
            pr += global.footer
            client.reply(m.chat, pr, m)
            
         } else if (command === 'botinfo') {
            // Check if any bots exist
            if (!global.db.bots.length) return client.reply(m.chat, Func.texted('bold', `🚩 No bots connected.`), m)
            
            // Find bot information for current client
            const fn = global.db.bots.find(v => v.jid === client.decodeJid(client.user.id))
            if (!fn) return client.reply(m.chat, Func.texted('bold', `🚩 No information for this bot.`), m)
            
            let pr = `乂  *B O T I N F O*\n\n`
            pr += `   ◦ *JID* : @${fn.jid.replace(/@.+/, '')}\n`
            pr += `   ◦ *Name* : ${global.db.users.find(x => x.jid === fn.jid) ? global.db.users.find(x => x.jid === fn.jid).name : 'No Name'}\n`
            pr += `   ◦ *Last Connect* : ${Func.timeAgo(fn.last_connect)}\n\n`
            pr += global.footer
            
            client.reply(m.chat, pr, m)
            
         } else if (command === 'logout') {
            // Security checks
            if (!global.db?.bots || !Array.isArray(global.db.bots)) return client.reply(m.chat, Func.texted('bold', `🚩 Bot database not available.`))
            if (!global.db.bots.length) return client.reply(m.chat, Func.texted('bold', `🚩 No bots connected.`), m)
            
            // Find the bot instance for current user
            const fn = global.db.bots.find(v => v.jid === client.decodeJid(client.user.id) || v.sender === m.sender)
            
            // Verify ownership - only bot owner can logout
            if (!fn || (fn?.sender !== m.sender && fn?.jid !== m?.sender)) return client.reply(m.chat, Func.texted('bold', `🚩 You can't access this feature.`), m)
            
            // Get bot instance from Instance manager
            const instance = Instance.getBot(fn.jid)?.sock
            if (!instance) return client.reply(m.chat, Func.texted('bold', `🚩 Bot instance not found.`), m)
            
            // Remove bot from database
            Func.removeItem(global.db.bots, fn)
            
            // Send confirmation and logout
            client.reply(m.chat, Func.texted('bold', `✅ Bot disconnected (Logout).`), m).then(() => {
               // Logout the WhatsApp session
               instance.logout('Logout')
               
               // Clean up session files
               if (fs.existsSync(`./${env.bot_hosting.session_dir}/${fn.jid.replace(/@.+/, '')}`)) {
                  fs.rmSync(`./${env.bot_hosting.session_dir}/${fn.jid.replace(/@.+/, '')}`, {
                     recursive: true,
                     force: true
                  })
               }
            })
         }
      } catch (e) {
         client.reply(m.chat, Func.texted('bold', `🚩 ${e.message}.`), m)
      }
   },
   error: false,
   cache: true,
   location: __filename
}