/*
 * BROADCAST-BOT.JS - Broadcasting Functionality
 * 
 * This file provides broadcasting functionality for multi-user bot instances.
 * It allows bot owners to send messages to all their bot's contacts or groups.
 * 
 * KEY FEATURES:
 * - Broadcast to all chats
 * - Broadcast to groups only
 * - Broadcast to private chats only
 * - Owner-only access for each bot instance
 * - Progress tracking for large broadcasts
 */

exports.run = {
   usage: ['bcbot', 'bcgrupbot', 'bcprivbot'],
   use: 'text',
   category: 'bot hosting',
   async: async (m, {
      client,
      command,
      text,
      env,
      Func
   }) => {
      try {
         // Check if user is bot owner
         const botData = global.db.bots?.find(v => v.jid === client.decodeJid(client.user.id))
         if (!botData || botData.sender !== m.sender) {
            return client.reply(m.chat, Func.texted('bold', `🚩 Only the bot owner can use this feature.`), m)
         }
         
         if (!text) return client.reply(m.chat, Func.texted('bold', `🚩 Please provide a message to broadcast.`), m)
         
         // Get appropriate data context for this bot
         const { JID } = require('@neoxr/wb').Component
         const { hostJid, clientJid, findJid } = JID(client)
         const data = !hostJid && findJid.bot(clientJid) ? findJid.bot(clientJid).data : global.db
         
         let chats = []
         
         if (command === 'bcbot') {
            // Broadcast to all chats
            chats = data.chats.filter(v => v.jid !== 'status@broadcast')
         } else if (command === 'bcgrupbot') {
            // Broadcast to groups only
            chats = data.chats.filter(v => v.jid.endsWith('@g.us'))
         } else if (command === 'bcprivbot') {
            // Broadcast to private chats only
            chats = data.chats.filter(v => v.jid.endsWith('@s.whatsapp.net'))
         }
         
         if (chats.length === 0) {
            return client.reply(m.chat, Func.texted('bold', `🚩 No chats found to broadcast to.`), m)
         }
         
         client.reply(m.chat, Func.texted('bold', `🕒 Broadcasting to ${chats.length} chats...`), m)
         
         let success = 0
         let failed = 0
         
         for (let chat of chats) {
            try {
               await client.sendMessage(chat.jid, { text: text + '\n\n' + global.footer })
               success++
               await Func.delay(1500) // Delay to prevent spam
            } catch (e) {
               failed++
            }
         }
         
         client.reply(m.chat, Func.texted('bold', `✅ Broadcast completed!\n• Success: ${success}\n• Failed: ${failed}`), m)
         
      } catch (e) {
         client.reply(m.chat, Func.texted('bold', `🚩 ${e.message}`), m)
      }
   },
   error: false,
   cache: true,
   location: __filename
}