/*
 * INDEX ROUTE - Main Web Interface
 * 
 * This route serves the main web interface for bot creation.
 * It automatically displays when users visit the base URL.
 */

const fs = require('fs')
const path = require('path')

exports.routes = {
  category: 'main',
  path: '/',
  method: 'get',
  execution: async (req, res, next) => {
    try {
      const indexPath = path.join(__dirname, '../../public/index.html')
      
      if (fs.existsSync(indexPath)) {
        const html = fs.readFileSync(indexPath, 'utf8')
        res.setHeader('Content-Type', 'text/html')
        res.send(html)
      } else {
        res.status(404).json({
          status: false,
          message: 'Interface not found'
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