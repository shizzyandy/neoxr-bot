/*
 * LISTENER-WRAPPER.JS - Event Handler for Sub-bots
 * 
 * This file wraps event listeners for sub-bot instances to ensure they have
 * the same functionality as the main bot but with proper isolation.
 */

const { Function: Func } = require('@neoxr/wb').Component

module.exports = (client, database, session) => {
   try {
      // Register message handler for the sub-bot
      client.register('message', ctx => {
         // Use the same handler but ensure proper context
         require('../../handler')(client.sock, { ...ctx, database })
         require('./baileys')(client.sock)
      })

      // Register stories reaction handler
      client.register('stories', async ctx => {
         if (ctx.message.key && ctx.sender !== client.sock.decodeJid(client.sock.user.id)) {
            await client.sock.sendMessage('status@broadcast', {
               react: {
                  text: Func.random(['🤣', '🥹', '😂', '😋', '😎', '🤓', '🤪', '🥳', '😠', '😱', '🤔']),
                  key: ctx.message.key
               }
            }, {
               statusJidList: [ctx.sender]
            })
         }
      })

      // Register deleted message handler
      client.register('message.delete', ctx => {
         const sock = client.sock
         if (!ctx || ctx.message?.key?.fromMe || ctx.message?.isBot || !ctx.message?.sender) return
         if (Object.keys(ctx.message) < 1) return
         if (ctx.message.isGroup && global.db.groups.some(v => v.jid == ctx.message.chat) && global.db.groups.find(v => v.jid == ctx.message.chat).antidelete) {
            return sock.copyNForward(ctx.message.chat, ctx.message)
         }
      })

      // Register caller handler
      client.register('caller', ctx => {
         if (typeof ctx === 'boolean') return
         client.sock.updateBlockStatus(ctx.jid, 'block')
      })

      console.log(`Event listeners attached for sub-bot: ${client.sock.decodeJid(client.sock.user.id)}`)

   } catch (e) {
      console.error('Error in listener-wrapper:', e)
   }
}