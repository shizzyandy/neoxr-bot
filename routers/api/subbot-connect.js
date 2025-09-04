/*
 * SUBBOT-CONNECT.JS - Web API for Bot Connection
 * 
 * This API endpoint handles bot connection requests from the web interface.
 * It supports both QR code and pairing code methods for authentication.
 */

const { createBotInstance } = require('../../lib/system/jadibot')

exports.routes = {
  category: 'subbot',
  path: '/api/subbot/connect',
  method: 'post',
  execution: async (req, res, next) => {
    try {
      const { phoneNumber, botName, method } = req.body
      
      // Validate required fields
      if (!phoneNumber || !botName) {
        return res.status(400).json({
          status: false,
          message: 'Phone number and bot name are required'
        })
      }

      // Validate method
      if (!['qr', 'pair'].includes(method)) {
        return res.status(400).json({
          status: false,
          message: 'Invalid connection method. Use "qr" or "pair"'
        })
      }

      // Clean phone number
      const cleanNumber = phoneNumber.replace(/\D/g, '')
      if (cleanNumber.length < 10) {
        return res.status(400).json({
          status: false,
          message: 'Invalid phone number format'
        })
      }

      // Get global context
      const { Component } = require('@neoxr/wb')
      const { Config: env } = new Component
      
      // Check bot limit
      const botCount = global.db.bots ? global.db.bots.length : 0
      if (botCount >= env.bot_hosting.slot) {
        return res.status(429).json({
          status: false,
          message: 'Bot slot limit reached. Please try again later.'
        })
      }

      // Check if bot already exists
      if (global.db.bots && global.db.bots.some(v => v.jid === cleanNumber && v.is_connected)) {
        return res.status(409).json({
          status: false,
          message: 'Bot already connected for this number'
        })
      }

      // Get database and session from global context
      const database = req.database || global.database
      const session = req.session || global.session
      const client = req.client || global.client

      try {
        // Create bot instance
        const result = await createBotInstance(cleanNumber, method, client, database, session)
        
        if (result.success) {
          res.json({
            status: true,
            data: {
              sessionId: result.sessionId,
              method: result.method,
              message: result.message,
              expiresIn: method === 'qr' ? 120 : 300,
              ...(result.qrCode && { qrCode: result.qrCode }),
              ...(result.code && { pairCode: result.code })
            }
          })
        } else {
          res.status(500).json({
            status: false,
            message: 'Failed to create bot instance'
          })
        }
      } catch (createError) {
        console.error('Bot creation error:', createError)
        res.status(500).json({
          status: false,
          message: createError.message || 'Failed to create bot'
        })
      }

    } catch (e) {
      console.error('API Error:', e)
      res.status(500).json({
        status: false,
        message: 'Internal server error'
      })
    }
  },
  error: false
}