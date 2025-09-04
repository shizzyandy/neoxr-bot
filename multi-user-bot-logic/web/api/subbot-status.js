/*
 * SUBBOT-STATUS.JS - Web API for Bot Status
 * 
 * This API endpoint provides status information for bot instances.
 * It allows the web interface to check connection status and get bot info.
 * 
 * ENDPOINTS:
 * GET /api/subbot/status/:sessionId
 * GET /api/subbot/list
 * 
 * RESPONSE FORMATS:
 * Status: { status: true, data: { connected: boolean, botInfo: object } }
 * List: { status: true, data: [{ jid, name, lastConnect, isConnected }] }
 */

exports.routes = {
  category: 'subbot',
  path: '/api/subbot/status',
  method: 'get',
  execution: async (req, res, next) => {
    try {
      const { sessionId, action } = req.query
      
      if (action === 'list') {
        // Return list of all connected bots
        const bots = global.db?.bots || []
        const botList = bots.map(bot => ({
          jid: bot.jid.replace(/@.+/, ''),
          name: global.db.users?.find(u => u.jid === bot.jid)?.name || 'Unknown',
          lastConnect: bot.last_connect,
          isConnected: bot.is_connected,
          token: bot._id
        }))
        
        return res.json({
          status: true,
          data: botList
        })
      }
      
      if (!sessionId) {
        return res.status(400).json({
          status: false,
          message: 'Session ID is required'
        })
      }
      
      // Check specific session status
      const bot = global.db?.bots?.find(b => b._id === sessionId)
      
      if (!bot) {
        return res.json({
          status: true,
          data: {
            connected: false,
            message: 'Session not found or not connected'
          }
        })
      }
      
      res.json({
        status: true,
        data: {
          connected: bot.is_connected,
          botInfo: {
            jid: bot.jid.replace(/@.+/, ''),
            name: global.db.users?.find(u => u.jid === bot.jid)?.name || 'Unknown',
            lastConnect: bot.last_connect,
            method: bot.method
          }
        }
      })
      
    } catch (e) {
      res.status(500).json({
        status: false,
        message: e.message
      })
    }
  },
  error: false
}