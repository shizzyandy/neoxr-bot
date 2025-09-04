/*
 * SCHEMA.JS - Database Schema Management
 * 
 * This file manages the database schema initialization for multi-user bot instances.
 * It ensures that each bot has its own isolated data context while maintaining
 * consistent data structure across all instances.
 * 
 * KEY FEATURES:
 * - Data isolation between bot instances
 * - Automatic schema initialization
 * - User, group, and chat data management
 * - Dynamic data context switching
 * - Model consistency enforcement
 * 
 * DATA ISOLATION:
 * - Main bot uses global.db directly
 * - Sub-bots use findJid.bot(clientJid).data
 * - Each bot maintains separate users, groups, chats arrays
 * - Shared settings and setup data when appropriate
 * 
 * INITIALIZATION PROCESS:
 * 1. Determine data context (main bot vs sub-bot)
 * 2. Initialize user data with defaults
 * 3. Initialize group data if message from group
 * 4. Initialize chat data for current conversation
 * 5. Ensure setting and setup objects exist
 */

const { models } = require('./models')
const init = new (require('./init'))
const { Component } = require('@neoxr/wb')
const { Function: Func } = new Component

/**
 * Schema initialization function
 * @param {object} m - Message object
 * @param {object} env - Environment configuration
 * @param {object} options - Options containing JID information
 */
module.exports = (m, env, options = {}) => {
   let { hostJid, clientJid, findJid } = options
   
   // Determine data context - main bot or sub-bot
   let data = !hostJid && findJid.bot(clientJid) ? findJid.bot(clientJid).data : global.db

   /* USER DATA INITIALIZATION */
   const user = data.users.find(v => v.jid === m.sender)
   if (user) {
      // Update existing user with any missing properties
      init.execute(user, models.users, {
         lid: m.sender?.endsWith('lid') ? m.sender : null,
         name: m.pushName,
         limit: env.limit,
         limit_game: env.limit_game,
         referrals: [],
         refcode: Func.makeId(7)
      })
   } else {
      // Create new user entry
      data.users.push({
         jid: m.sender,
         lid: m.sender?.endsWith('lid') ? m.sender : null,
         name: m.pushName,
         limit: env.limit,
         limit_game: env.limit_game,
         referrals: [],
         refcode: Func.makeId(7),
         ...(init.getModel(models?.users || {}))
      })
   }

   /* GROUP DATA INITIALIZATION */
   if (m.isGroup) {
      const group = data.groups.find(v => v.jid === m.chat)
      if (group) {
         // Update existing group with any missing properties
         init.execute(group, models.groups)
      } else {
         // Create new group entry
         data.groups.push({
            jid: m.chat,
            ...(init.getModel(models?.groups || {}))
         })
      }
   }

   /* CHAT DATA INITIALIZATION */
   const chat = data.chats.find(v => v.jid === m.chat)
   if (chat) {
      // Update existing chat with any missing properties
      init.execute(chat, models.chats)
   } else {
      // Create new chat entry
      data.chats.push({
         jid: m.chat,
         ...(init.getModel(models?.chats || {}))
      })
   }

   /* SETTING DATA INITIALIZATION */
   let setting = data.setting
   if (setting && Object.keys(setting).length < 1) {
      // Update existing empty setting object
      init.execute(setting, models.setting)
   } else {
      // Create new setting object
      setting = {
         ...(init.getModel(models?.setting || {}))
      }
   }

   /* SETUP DATA INITIALIZATION */
   // Note: Setup is shared across all bot instances
   let setup = global.db.setup
   if (setup && Object.keys(setup).length < 1) {
      // Update existing empty setup object
      init.execute(setup, models.setup)
   } else {
      // Create new setup object
      setup = {
         ...(init.getModel(models?.setup || {}))
      }
   }
}