/*
 * SERVER.JS - Web Server for Multi-User Bot Management
 * 
 * This module sets up an Express server to handle web requests for
 * bot creation and management.
 */

const express = require('express')
const path = require('path')
const fs = require('fs')
const { Component } = require('@neoxr/wb')
const { Config: env } = new Component

// Initialize Express app
const app = express()

// Middleware
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(express.static('public'))

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization')
  if (req.method === 'OPTIONS') {
    res.sendStatus(200)
  } else {
    next()
  }
})

// Add global context to requests
app.use((req, res, next) => {
  req.database = global.database
  req.session = global.session  
  req.client = global.client
  next()
})

// Load API routes
const loadApiRoutes = () => {
  try {
    const apiDir = path.join(__dirname, '../routers/api')
    if (fs.existsSync(apiDir)) {
      const files = fs.readdirSync(apiDir)
      files.forEach(file => {
        if (file.endsWith('.js')) {
          try {
            const route = require(path.join(apiDir, file))
            if (route.routes && route.routes.path && route.routes.method) {
              const { path: routePath, method, execution } = route.routes
              app[method.toLowerCase()](routePath, execution)
              console.log(`✓ Loaded API route: ${method.toUpperCase()} ${routePath}`)
            }
          } catch (e) {
            console.error(`Failed to load route ${file}:`, e.message)
          }
        }
      })
    }
  } catch (e) {
    console.error('Failed to load API routes:', e)
  }
}

// Main page route
app.get('/', (req, res) => {
  const htmlPath = path.join(__dirname, '../public/index.html')
  if (fs.existsSync(htmlPath)) {
    res.sendFile(htmlPath)
  } else {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Multi-User Bot Manager</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          h1 { color: #333; margin-bottom: 20px; }
          p { color: #666; line-height: 1.6; }
          .status { background: #e8f5e8; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .endpoint { background: #f0f0f0; padding: 10px; font-family: monospace; border-radius: 3px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🤖 Multi-User Bot Manager</h1>
          <div class="status">
            <strong>✅ Server is running!</strong>
          </div>
          <p>Your multi-user WhatsApp bot system is now active. Users can create their own bot instances using the API endpoints below:</p>
          
          <h3>API Endpoints:</h3>
          <div class="endpoint">POST /api/subbot/connect</div>
          <div class="endpoint">GET /api/subbot/status</div>
          
          <p><strong>Bot Statistics:</strong></p>
          <p>Total Bots: ${global.db?.bots?.length || 0}</p>
          <p>Connected: ${global.db?.bots?.filter(v => v.is_connected)?.length || 0}</p>
          <p>Max Slots: ${env.bot_hosting?.slot || 10}</p>
          
          <p style="margin-top: 30px; font-size: 14px; color: #888;">
            To create a bot, send a POST request to /api/subbot/connect with phoneNumber, botName, and method (qr/pair).
          </p>
        </div>
      </body>
      </html>
    `)
  }
})

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    bots: {
      total: global.db?.bots?.length || 0,
      connected: global.db?.bots?.filter(v => v.is_connected)?.length || 0
    }
  })
})

// Start server function
const startServer = (client) => {
  return new Promise((resolve, reject) => {
    try {
      const port = env.bot_hosting?.port || 3001
      const host = env.bot_hosting?.host || '0.0.0.0'
      
      // Store global references
      global.client = client
      
      // Load API routes
      loadApiRoutes()
      
      const server = app.listen(port, host, () => {
        console.log(`🌐 Multi-User Bot Server running on http://${host}:${port}`)
        console.log(`📱 Users can create bots at: http://${host}:${port}/api/subbot/connect`)
        resolve(server)
      })
      
      server.on('error', (error) => {
        if (error.code === 'EADDRINUSE') {
          console.log(`Port ${port} is already in use, trying port ${port + 1}`)
          server.listen(port + 1, host)
        } else {
          reject(error)
        }
      })
      
    } catch (e) {
      reject(e)
    }
  })
}

module.exports = startServer