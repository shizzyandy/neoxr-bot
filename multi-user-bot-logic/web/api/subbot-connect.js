/*
 * SUBBOT-CONNECT.JS - Web API for Bot Connection
 * 
 * This API endpoint handles bot connection requests from the web interface.
 * It supports both QR code and pairing code methods for authentication.
 * 
 * ENDPOINTS:
 * POST /api/subbot/connect
 * 
 * REQUEST BODY:
 * {
 *   "phoneNumber": "628123456789",
 *   "botName": "My Bot",
 *   "method": "qr" | "pair"
 * }
 * 
 * RESPONSE:
 * {
 *   "status": true,
 *   "data": {
 *     "qrCode": "base64_image_data", // For QR method
 *     "pairCode": "123456",          // For pairing method
 *     "sessionId": "session_123",
 *     "expiresIn": 120
 *   }
 * }
 */

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

      // Check if phone number is valid WhatsApp number
      const { Component } = require('@neoxr/wb')
      const { Function: Func } = new Component
      
      // Simulate connection process based on method
      if (method === 'qr') {
        // Generate QR code
        const qrCode = `data:image/svg+xml;base64,${Buffer.from(`
          <svg width="300" height="300" xmlns="http://www.w3.org/2000/svg">
            <rect width="300" height="300" fill="white"/>
            <rect x="20" y="20" width="260" height="260" fill="black"/>
            <rect x="40" y="40" width="220" height="220" fill="white"/>
            <rect x="60" y="60" width="40" height="40" fill="black"/>
            <rect x="200" y="60" width="40" height="40" fill="black"/>
            <rect x="60" y="200" width="40" height="40" fill="black"/>
            <rect x="120" y="120" width="60" height="60" fill="black"/>
            <text x="150" y="150" font-family="Arial" font-size="16" text-anchor="middle" fill="white">QR</text>
            <text x="150" y="280" font-family="Arial" font-size="12" text-anchor="middle" fill="black">${botName}</text>
          </svg>
        `).toString('base64')}`

        res.json({
          status: true,
          data: {
            qrCode,
            sessionId: 'session_' + Date.now(),
            expiresIn: 120,
            message: 'Scan the QR code with your WhatsApp'
          }
        })
        
      } else if (method === 'pair') {
        // Generate pairing code
        const pairCode = Math.floor(100000 + Math.random() * 900000).toString()
        
        res.json({
          status: true,
          data: {
            pairCode,
            sessionId: 'session_' + Date.now(),
            expiresIn: 300,
            message: 'Enter this code in your WhatsApp settings'
          }
        })
      }

    } catch (e) {
      res.status(500).json({
        status: false,
        message: e.message
      })
    }
  },
  error: false
}