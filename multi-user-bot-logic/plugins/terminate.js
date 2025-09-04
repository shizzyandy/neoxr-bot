/*
 * TERMINATE.JS - Bot Termination Logic
 * 
 * This file provides functionality to terminate and clean up bot instances.
 * It handles safe shutdown of sub-bots and cleanup of associated resources.
 * 
 * KEY FEATURES:
 * - Safe bot termination
 * - Session cleanup
 * - Database cleanup
 * - Instance management cleanup
 * - Owner-only access control
 * 
 * SECURITY:
 * Only the main bot owner can terminate sub-bot instances to prevent abuse.
 */

exports.run = {
   usage: ['terminate'],
   use: 'jid',
   category: 'bot hosting',
   async: async (m, {
      client,
      args,
      isOwner,
      env,
      Func
   }) => {
      try {
         // Only owner can terminate bots
         if (!isOwner) return client.reply(m.chat, Func.texted('bold', `🚩 This feature is only for the owner.`), m)
         
         if (!args || !args[0]) return client.reply(m.chat, Func.texted('bold', `🚩 Provide the bot JID to terminate.`), m)
         
         global.db.bots = global.db.bots ? global.db.bots : []
         
         const jid = args[0].includes('@') ? args[0] : args[0] + '@s.whatsapp.net'
         const bot = global.db.bots.find(v => v.jid === jid)
         
         if (!bot) return client.reply(m.chat, Func.texted('bold', `🚩 Bot not found in database.`), m)
         
         // Get bot instance
         const { Instance } = require('@neoxr/wb').Component
         const instance = Instance.getBot(jid)
         
         if (instance) {
            // Logout the bot
            instance.sock.logout('Terminated by owner')
            
            // Remove from instance manager
            Instance.delBot(jid)
         }
         
         // Remove from database
         Func.removeItem(global.db.bots, bot)
         
         // Clean up session files
         const fs = require('fs')
         const sessionPath = `./${env.bot_hosting.session_dir}/${jid.replace(/@.+/, '')}`
         if (fs.existsSync(sessionPath)) {
            fs.rmSync(sessionPath, { recursive: true, force: true })
         }
         
         client.reply(m.chat, Func.texted('bold', `✅ Bot ${jid.replace(/@.+/, '')} has been terminated and cleaned up.`), m)
         
      } catch (e) {
         client.reply(m.chat, Func.texted('bold', `🚩 ${e.message}`), m)
      }
   },
   error: false,
   cache: true,
   location: __filename
}