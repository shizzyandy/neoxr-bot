/*
 * LISTENER-WRAPPER.JS - Event Handling for Sub-Bots
 * 
 * This file provides a comprehensive event handling system for sub-bot instances.
 * It registers various WhatsApp events and manages them appropriately for each bot.
 * 
 * KEY FEATURES:
 * - Message deletion detection (anti-delete)
 * - Stories reaction automation
 * - AFK (Away From Keyboard) detection
 * - Group member management (welcome/leave)
 * - Captcha verification for new members
 * - Call blocking functionality
 * - Task scheduling integration
 * 
 * EVENTS HANDLED:
 * - message.delete: Anti-delete functionality
 * - stories: Automatic story reactions
 * - presence.update: AFK detection
 * - message: Main message processing
 * - group.add: Welcome new members
 * - group.remove: Handle member leaving
 * - caller: Block incoming calls
 * 
 * DATA ISOLATION:
 * Each sub-bot has its own data context, ensuring that user data, group settings,
 * and other information don't interfere between different bot instances.
 */

const { Component } = require('@neoxr/wb')
const { Function: Func, Config: env, JID } = new Component
const { greater, captcha } = require('../canvas')
const { NodeCache } = require('@cacheable/node-cache')
const cache = new NodeCache({
   stdTTL: env.cooldown
})
const fs = require('fs')
const { models } = require('./models')

// Default assets for welcome/leave messages
const defaults = Object.freeze({
   profile: fs.readFileSync('./media/image/default.jpg'), // default profile picture
   background: fs.readFileSync('./media/image/bg.jpg') // default background image
})

/**
 * Listener wrapper function to attach event handlers to bot instances
 * @param {object} client - Bot client instance
 * @param {object} database - Database instance
 * @param {object} config - Configuration object
 */
module.exports = (client, database, config) => {
   try {
      /* Initialize task scheduler for this bot instance */
      const TaskScheduler = require('./scheduler')
      const schedule = new TaskScheduler(client.sock, JID(client.sock))
      schedule.start(15) // check every 15 seconds

      /* ANTI-DELETE: Print deleted message object */
      client.register('message.delete', ctx => {
         const sock = client.sock
         const { hostJid, clientJid, findJid } = JID(sock)
         
         if (!global.db) return
         
         // Get the appropriate groups data for this bot instance
         let groups = hostJid ? global.db.groups : findJid.bot(clientJid) ? findJid.bot(clientJid)?.data?.groups : global.db.groups
         
         if (!ctx || ctx.message?.key?.fromMe || ctx.message?.isBot || !ctx.message?.sender || !groups) return
         
         // Prevent spam with cache
         if (cache.has(ctx.message.sender) && cache.get(ctx.message.sender) === 1) return
         cache.set(ctx.message.sender, 1)
         
         if (Object.keys(ctx.message) < 1) return
         
         // Forward deleted message if antidelete is enabled in group
         if (ctx.message.isGroup && groups?.some(v => v.jid == ctx.message.chat) && groups?.find(v => v.jid == ctx.message.chat).antidelete) {
            return sock.copyNForward(ctx.message.chat, ctx.message)
         }
      })

      /* STORIES REACTION: Automatically react to stories */
      client.register('stories', async ctx => {
         const sock = client.sock
         const { hostJid, clientJid, findJid } = JID(sock)
         
         if (!global.db) return
         
         // Get bot data context
         const data = (hostJid ? global.db : findJid.bot(clientJid) ? findJid.bot(clientJid)?.data : global.db)
         
         // React to stories if online and not from self
         if (ctx.message.key && ctx.sender !== client.sock.decodeJid(client.sock.user.id) && data?.setting?.online) {
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

      /* AFK DETECTOR: Detect when users become active after being AFK */
      client.register('presence.update', update => {
         if (!update) return
         
         const sock = client.sock
         const { hostJid, clientJid, findJid } = JID(sock)
         
         if (!global.db) return
         
         const { id, presences } = update
         
         // Only handle group presence updates
         if (id.endsWith('g.us')) {
            // Get data context for this bot
            const data = (hostJid ? global.db : findJid.bot(clientJid) ? findJid.bot(clientJid)?.data : global.db)
            let groupSet = data?.groups?.find(v => v.jid === id)
            
            // Check each user's presence
            for (let sender in presences) {
               let user = data?.users?.find(v =>
                  v.jid === sender || v.lid === sender
               )
               const presence = presences[user?.jid] || presences[user?.lid]
               
               if (!presence || user?.lid === sock.decodeJid(sock.user.lid)) continue
               
               // Detect activity after AFK
               if ((presence.lastKnownPresence === 'composing' || presence.lastKnownPresence === 'recording') && groupSet?.member?.[user.jid]?.afk > -1) {
                  let member = groupSet?.member?.[user.jid]
                  sock.reply(id, `System detects activity from @${user.jid.replace(/@.+/, '')} after being offline for : ${Func.texted('bold', Func.toTime(new Date - (member?.afk || 0)))}\n\n➠ ${Func.texted('bold', 'Reason')} : ${member?.afkReason || '-'}`, member?.afkObj)
                  
                  // Reset AFK status
                  member.afk = -1
                  member.afkReason = ''
                  member.afkObj = {}
               }
            }
         }
      })

      /* MESSAGE HANDLER: Process all incoming messages */
      client.register('message', async ctx => {
         require('./baileys')(client.sock)
         await require('../../handler')(client.sock, { ...ctx, schedule }, database, config)
      })

      /* GROUP ADD: Welcome new members */
      client.register('group.add', async ctx => {
         const sock = client.sock
         const text = `Thanks +tag for joining into +grup group.`
         const { hostJid, clientJid, findJid } = JID(sock)
         
         if (!global.db || !ctx.member) return
         
         // Get data context for this bot instance
         let users = hostJid ? global.db.users : findJid.bot(clientJid) ? findJid.bot(clientJid)?.data?.users : global.db.users
         let groups = hostJid ? global.db.groups : findJid.bot(clientJid) ? findJid.bot(clientJid)?.data?.groups : global.db.groups
         
         const groupSet = groups.find(v => v.jid == ctx.jid)
         if (!groupSet) return
         
         // Handle previously left members
         if (groupSet.member?.[ctx.member]?.left && ctx.groupMetadata?.participants.find(v => v.id === sock.decodeJid(sock.user.id))?.admin) {
            sock.groupParticipantsUpdate(ctx.jid, [ctx.member], 'remove')
            delete groupSet.member[ctx.member]
            return
         }
         
         // Initialize member data
         if (!groupSet.member?.[ctx.member]) {
            groupSet.member[ctx.member] = {}
            groupSet.member[ctx.member] = { ...models.member }
         }
         
         // Get member profile picture
         try {
            var pic = await sock.profilePictureUrl(ctx.member, 'image')
            if (!pic) {
               var pic = defaults.profile
            }
         } catch {
            var pic = defaults.profile
         }

         /* LOCAL ONLY: Remove non-Indonesian members if enabled */
         if (groupSet?.localonly) {
            if (users.some(v => v.jid == ctx.member) && !users?.find(v => v.jid == ctx.member)?.whitelist && !ctx.member.startsWith('62') || !ctx.member.startsWith('62')) {
               sock.reply(ctx.jid, Func.texted('bold', `Sorry @${ctx.member.split\`@\`[0]}, this group is only for indonesian people and you will removed automatically.`))
               sock.updateBlockStatus(member, 'block')
               return await Func.delay(2000).then(() => sock.groupParticipantsUpdate(ctx.jid, [ctx.member], 'remove'))
            }
         }

         /* CAPTCHA VERIFICATION: Verify new members with captcha */
         if (groupSet?.captcha) {
            sock.captcha = sock?.captcha || {}
            const member = `@${ctx.member.replace(/@.+/, '')}`
            const code = captcha()
            
            let caption = `Hi ${member} 👋🏻\n`
            caption += `Welcome to the group *${ctx.subject}*. Before participating in the group, please complete *VERIFICATION* by sending the *CAPTCHA CODE* shown in the image above.\n\n`
            caption += `*Timeout* : [ 1 minute ]`
            
            sock.captcha[ctx.member] = {
               chat: await sock.sendMessageModify(ctx.jid, caption, null, {
                  largeThumb: true,
                  thumbnail: code.image,
               }, { disappear: 8400 }),
               to: ctx.member,
               groupId: ctx.jid,
               code: code.text,
               wrong: 0,
               timeout: setTimeout(() => {
                  if (sock.captcha[ctx.member]) return sock.reply(ctx.jid, Func.texted('bold', `⚠ Sorry ${member}, it seems you ignored the verification process. You have been removed to maintain the integrity of this group.`), null, { disappear: 8400 }).then(async () => {
                     sock.groupParticipantsUpdate(ctx.jid, [ctx.member], 'remove')
                     delete sock.captcha[ctx.member]
                  })
               }, 60_000)
            }
         }

         // Generate welcome image and send welcome message
         const welcome = await greater(defaults.background, pic, `Welcome to ${ctx.subject}`, `Let's enjoy with us!`)
         if (!welcome) return
         
         const txt = (groupSet && groupSet.text_welcome ? groupSet.text_welcome : text).replace('+tag', `@${ctx.member.split\`@\`[0]}`).replace('+grup', `${ctx.subject}`)
         
         if (groupSet && groupSet.welcome && !groupSet.captcha) {
            sock.sendMessageModify(ctx.jid, txt, null, {
               largeThumb: true,
               thumbnail: welcome,
               url: global.db.setting.link
            }, { disappear: 8400 })
         }
      })

      /* GROUP REMOVE: Handle member leaving */
      client.register('group.remove', async ctx => {
         const sock = client.sock
         const text = `Good bye +tag :)`
         const { hostJid, clientJid, findJid } = JID(sock)
         
         if (!global.db || !ctx.member) return
         
         let groups = hostJid ? global.db.groups : findJid.bot(clientJid) ? findJid.bot(clientJid)?.data?.groups : global.db.groups
         const groupSet = groups.find(v => v.jid == ctx.jid)
         if (!groupSet) return
         
         // Mark member as left
         if (groupSet.member?.[ctx.member]) {
            groupSet.member[ctx.member].left = true
         }
         
         // Get member profile picture
         try {
            var pic = await sock.profilePictureUrl(ctx.member, 'image')
            if (!pic) {
               var pic = defaults.profile
            }
         } catch {
            var pic = defaults.profile
         }

         // Clean up captcha if member was in verification process
         sock.captcha = sock?.captcha || {}
         if (sock?.captcha?.[ctx.member]) {
            clearTimeout(sock.captcha[ctx.member]?.timeout)
            delete sock.captcha[ctx.member]
         }

         // Generate leave image and send leave message
         const leave = await greater(defaults.background, pic, `Leaving Group`, `Good bye and see you ...`)
         if (!leave) return
         
         const txt = (groupSet && groupSet.text_left ? groupSet.text_left : text).replace('+tag', `@${ctx.member.split\`@\`[0]}`).replace('+grup', `${ctx.subject}`)
         
         if (groupSet && groupSet.left) {
            sock.sendMessageModify(ctx.jid, txt, null, {
               largeThumb: true,
               thumbnail: leave,
               url: global.db.setting.link
            }, { disappear: 8400 })
         }
      })

      /* CALL BLOCKER: Automatically block incoming calls */
      client.register('caller', ctx => {
         if (typeof ctx === 'boolean') return
         client.sock.updateBlockStatus(ctx.jid, 'block')
      })

      // Additional events can be registered here:
      // client.on('group.promote', ctx => console.log(ctx))
      // client.on('group.demote', ctx => console.log(ctx))
      
   } catch (e) {
      console.log(e)
   }
}