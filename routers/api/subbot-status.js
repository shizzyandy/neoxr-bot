/*
 * SUBBOT-STATUS.JS - Web API for Bot Status
 * 
 * This API endpoint handles bot status requests and provides information
 * about connected bots.
 */

exports.routes = {
  category: 'subbot',
  path: '/api/subbot/status',
  method: 'get',
  execution: async (req, res, next) => {
    try {
      const { sessionId, action } = req.query

      // Handle list action - return all bots
      if (action === 'list') {
        const bots = global.db.bots || []
        const botList = bots.map(bot => ({
          jid: bot.jid,
          name: `Bot ${bot.jid}`,
          lastConnect: bot.last_connect || Date.now(),
          isConnected: bot.is_connected || false,
          method: bot.method || 'unknown'
        }))

        return res.json({
          status: true,
          data: botList
        })
      }

      // Handle specific session status
      if (sessionId) {
        const bot = global.db.bots ? global.db.bots.find(v => v.jid === sessionId) : null
        
        if (!bot) {
          return res.status(404).json({
            status: false,
            message: 'Bot session not found'
          })
        }

        return res.json({
          status: true,
          data: {
            sessionId: bot.jid,
            connected: bot.is_connected || false,
            lastConnect: bot.last_connect || null,
            method: bot.method || 'unknown'
          }
        })
      }

      // Default response - general status
      const botCount = global.db.bots ? global.db.bots.length : 0
      const connectedCount = global.db.bots ? global.db.bots.filter(v => v.is_connected).length : 0
      const { Component } = require('@neoxr/wb')
      const { Config: env } = new Component

      res.json({
        status: true,
        data: {
          totalBots: botCount,
          connectedBots: connectedCount,
          maxSlots: env.bot_hosting.slot,
          availableSlots: env.bot_hosting.slot - botCount
        }
      })

    } catch (e) {
      console.error('Status API Error:', e)
      res.status(500).json({
        status: false,
        message: 'Internal server error'
      })
    }
  },
  error: false
}