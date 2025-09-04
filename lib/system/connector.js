/*
 * CONNECTOR.JS - Auto-Reconnection Logic
 * 
 * This file handles automatic reconnection of existing bot instances when the system restarts.
 * It iterates through all bots in the database and attempts to reconnect them using their
 * stored session data.
 */

"use strict"
const { Component } = require('@neoxr/wb')
const { Baileys, Function: Func, Config: env } = new Component
const chalk = require('@colors/colors')
const colors = require('@colors/colors')
const fs = require('fs')
const { NodeCache } = require('@cacheable/node-cache')

const retryCache = new NodeCache({
   stdTTL: 0
})

module.exports = async (jid, client, session, database) => {
   try {
      const main = jid.split('@')[0]
      const { Instance } = require('@neoxr/wb').Component
      const bot = Array.isArray(global.db?.bots) ? global.db.bots : (global.db.bots = [])
      
      // Find bot data in database
      let fn = bot?.find(v => v.jid === main)
      const instance = Instance.getData(fn?.jid)
      const creds = bot.find(v => v.jid === main && !v.is_connected)
      let connect = {}

      // Only proceed if bot has stored credentials
      if (creds) {
         console.log(chalk.black(chalk.bgGreen(` Connector v2 `)), ':', colors.gray(`Reconnecting ${main}...`))
         
         // Create new Baileys client for reconnection
         connect[main] = new Baileys({
            type: '--neoxr-v1',
            plugsdir: 'plugins',
            session: session.isExternal ? session.execute(session.config, main) : `${env.bot_hosting.session_dir}/${main}`,
            presence: true,
            bypass_disappearing: true,
            bot: Func.isBot,
            server: env.bot_hosting.server,
            version: env.pairing.version
         }, {
            ...(env.pairing?.browser ? { browser: env.pairing.browser } : {}),
            // Use QR method for reconnection if method was QR
            ...(/qr/.test(fn?.method || '') ? {
               pairing: {
                  state: false
               }
            } : {}),
            setup: env.setup,
            shouldIgnoreJid: jid => {
               return /(newsletter|bot)/.test(jid)
            }
         })

         // Handle connection errors
         connect[main].on('error', async error => {
            await Func.delay(1000)
            
            // Skip bad session file errors as they're handled elsewhere
            if (error.message === 'Bad session file') return
            
            // Handle critical errors that require session cleanup
            if ( 
               error.message === 'Device logged out' ||
               error.message === 'Multi device mismatch' ||
               error.message === 'Method not allowed'
            ) {
               // Notify user about the error
               client.reply(main, error.message).then(() => {
                  // End the connection
                  connect[main].sock.end()
                  
                  // Remove from Instance manager
                  if (instance) Instance.delBot(main)
                  
                  // Remove from database
                  Func.removeItem(global.db.bots, fn)
               })
            }
         })

         // Handle connection attempts
         connect[main].on('connect', async json => {
            let retry = retryCache.get(jid) || 0
            retry++

            retryCache.set(jid, retry)

            // Handle pairing code scenarios
            if (json.constructor.name === 'Object' && json.code) {
               // Wait before retrying
               await Func.delay(60_000)

               // If retry limit exceeded, cleanup
               if (retry >= 1) {
                  if (bot.find(v => v.jid === main && v.is_connected)) return
                  await Func.delay(1500)
                  connect[main].sock.end()
                  if (fn) Func.removeItem(global.db.bots, fn)
                  retryCache.del(jid)
               }
            }
         })

         // Handle successful connection
         connect[main].on('ready', async () => {
            // Register bot in Instance manager
            Instance.setBot(main, connect[main])

            // Update existing bot credentials
            if (creds) {
               creds.is_connected = true
               creds.last_connect = Date.now()
            }

            // Exit if retry cache doesn't contain this connection
            if (!retryCache.has(main)) return

            // Clean up retry cache
            retryCache.del(main)

            // Update bot status in database
            if (fn) {
               fn.is_connected = true
               fn.last_connect = Date.now()
            } else {
               // Create new bot entry if not found
               global.db.bots.push({
                  jid: main,
                  sender: main,
                  last_connect: Date.now(),
                  is_connected: true,
                  data: {}
               })
            }

            console.log(chalk.black(chalk.bgGreen(` Connector v2 `)), ':', colors.gray(`${main} reconnected successfully`))

            // Attach event listeners to the reconnected bot
            require('./listener-wrapper')(connect[main], database, session)
         })
      }
   } catch (e) {
      console.log(chalk.black(chalk.bgRed(` Connector v2 `)), ':', colors.gray(e))
   }
}