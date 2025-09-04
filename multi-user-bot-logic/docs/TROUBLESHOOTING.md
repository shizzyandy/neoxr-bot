# Troubleshooting Guide

This guide helps you diagnose and resolve common issues with the multi-user bot system.

## 🚨 Common Issues

### 1. Bot Creation Failed

#### Issue: "🚩 Number not registered on WhatsApp"
**Cause:** The phone number is not registered with WhatsApp.
**Solution:**
```bash
# Verify the number format (without + or spaces)
# Correct: 6281234567890
# Incorrect: +62 812 3456 7890
```

#### Issue: "🚩 Sorry, slots are full"
**Cause:** Maximum bot limit reached.
**Solution:**
```javascript
// Increase slot limit in environment
BOT_HOSTING_SLOT=20

// Or in config
bot_hosting.slot = 20
```

#### Issue: "❌ Previous request has not been completed"
**Cause:** Duplicate request detected by retry cache.
**Solution:**
- Wait 60 seconds before retrying
- Or restart the bot to clear cache

### 2. Connection Problems

#### Issue: QR Code Expired
**Cause:** QR code timeout (60 seconds).
**Solution:**
```javascript
// Request new QR code
!jadibot 6281234567890 --qr
```

#### Issue: Pairing Code Expired
**Cause:** Pairing code timeout (60 seconds).
**Solution:**
```javascript
// Request new pairing code
!jadibot 6281234567890 --pairing
```

#### Issue: "❌ Number you provided does not match the expected number"
**Cause:** Scanned different WhatsApp account.
**Solution:**
- Ensure you scan with the correct WhatsApp account
- Use the exact number specified in the command

### 3. Database Issues

#### Issue: "🚩 Bot database not available"
**Cause:** Database connection or initialization problem.
**Solution:**
```javascript
// Check database initialization
if (!global.db.bots) {
  global.db.bots = []
}

// Verify database connection
console.log('Database status:', global.db ? 'Connected' : 'Not connected')
```

#### Issue: Bots not reconnecting after restart
**Cause:** Auto-reconnection logic not implemented.
**Solution:**
```javascript
// Add to client.js ready event
if (global.db.bots.length > 0) {
   const validBots = global.db.bots.filter(v => v.jid && !v.is_connected)
   for (let bot of validBots) {
      try {
         await require('./lib/connector/connector')(bot.jid, client, session, database)
      } catch (e) {
         console.log('Reconnection failed for:', bot.jid, e.message)
      }
   }
}
```

### 4. Session Management

#### Issue: "Bad session file"
**Cause:** Corrupted session data.
**Solution:**
```bash
# Remove corrupted session
rm -rf sessions/6281234567890

# Or remove from database
# The bot will be automatically cleaned up
```

#### Issue: Session directory not found
**Cause:** Session directory doesn't exist.
**Solution:**
```bash
# Create session directory
mkdir -p sessions

# Or set in environment
BOT_HOSTING_SESSION_DIR="bot_sessions"
```

#### Issue: Permission denied on session files
**Cause:** File system permissions.
**Solution:**
```bash
# Fix permissions
chmod -R 755 sessions/
chown -R $USER:$USER sessions/
```

### 5. Web Interface Issues

#### Issue: API endpoints not responding
**Cause:** Web server not started.
**Solution:**
```bash
# Start with server flag
node . --server

# Or set in environment
BOT_HOSTING_SERVER=true
```

#### Issue: "EADDRINUSE: address already in use"
**Cause:** Port already occupied.
**Solution:**
```bash
# Change port in environment
BOT_HOSTING_PORT=3002

# Or find and kill process using port
lsof -ti:3001 | xargs kill -9
```

#### Issue: CORS errors in browser
**Cause:** Cross-origin restrictions.
**Solution:**
```javascript
// Add CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'Content-Type')
  next()
})
```

### 6. Instance Management

#### Issue: "🚩 Bot instance not found"
**Cause:** Bot not registered in Instance manager.
**Solution:**
```javascript
// Re-register bot instance
const { Instance } = require('@neoxr/wb').Component
Instance.setBot(botJid, clientInstance)
```

#### Issue: Multiple instances of same bot
**Cause:** Duplicate registrations.
**Solution:**
```javascript
// Check before creating new instance
const existing = Instance.getBot(botJid)
if (existing) {
  console.log('Bot already exists')
  return
}
```

### 7. Group Isolation Issues

#### Issue: Sub-bots not being removed from main bot groups
**Cause:** Group isolation logic not implemented.
**Solution:**
```javascript
// Add to handler.js
if (m.isGroup && global.db.bots.length > 0) {
   let member = participants.map(v => client.decodeJid(v.id))
   let bot = global.db.bots.some(v => v.jid === client.decodeJid(m.sender))
   
   if (!m.fromMe && member.includes(env.pairing.number + '@s.whatsapp.net') && bot) {
      if (isBotAdmin) {
         return m.reply('🚩 Client bots cannot be in the same group as the main bot.')
           .then(() => client.groupParticipantsUpdate(m.chat, [m.sender], 'remove'))
      }
   }
}
```

### 8. Permission Issues

#### Issue: Sub-bot users getting owner privileges
**Cause:** Owner check includes bot JID.
**Solution:**
```javascript
// Fix owner check in handler.js
// Remove: client.decodeJid(client.user.id).replace(/@.+/, '')
const isOwner = [env.owner, ...setting.owners]
  .map(v => v + '@s.whatsapp.net')
  .includes(m.sender)
```

## 🔍 Debugging Tools

### 1. Enable Debug Mode
```javascript
// In environment
DEBUG=true
LOG_LEVEL="debug"

// In code
console.log('Bot data:', global.db.bots)
console.log('Instance data:', Instance.getData(botJid))
```

### 2. Monitor Bot Connections
```javascript
// Add connection monitoring
setInterval(() => {
  global.db.bots.forEach(bot => {
    const instance = Instance.getBot(bot.jid)
    console.log(`Bot ${bot.jid}: ${instance ? 'Connected' : 'Disconnected'}`)
  })
}, 30000)
```

### 3. Session File Analysis
```bash
# Check session files
ls -la sessions/
du -sh sessions/*

# Check session content (if using JSON sessions)
cat sessions/6281234567890/creds.json | jq .
```

### 4. Database Inspection
```javascript
// Check database structure
console.log('Database keys:', Object.keys(global.db))
console.log('Bots count:', global.db.bots?.length || 0)
console.log('Users count:', global.db.users?.length || 0)

// Find specific bot
const bot = global.db.bots?.find(b => b.jid.includes('6281234567890'))
console.log('Bot info:', bot)
```

## 📊 Performance Monitoring

### 1. Memory Usage
```javascript
// Monitor memory usage
setInterval(() => {
  const usage = process.memoryUsage()
  console.log('Memory usage:', {
    rss: Math.round(usage.rss / 1024 / 1024) + ' MB',
    heapTotal: Math.round(usage.heapTotal / 1024 / 1024) + ' MB',
    heapUsed: Math.round(usage.heapUsed / 1024 / 1024) + ' MB'
  })
}, 60000)
```

### 2. Connection Status
```javascript
// Check connection health
const healthCheck = () => {
  const total = global.db.bots?.length || 0
  const connected = global.db.bots?.filter(b => b.is_connected).length || 0
  console.log(`Bot health: ${connected}/${total} connected`)
}
```

### 3. Error Tracking
```javascript
// Track common errors
const errorCounts = {}

process.on('unhandledRejection', (error) => {
  const type = error.message || 'Unknown'
  errorCounts[type] = (errorCounts[type] || 0) + 1
  console.log('Error counts:', errorCounts)
})
```

## 🛠️ Recovery Procedures

### 1. Database Recovery
```javascript
// Backup current database
const fs = require('fs')
fs.writeFileSync(`database_backup_${Date.now()}.json`, 
  JSON.stringify(global.db, null, 2))

// Reset bots array if corrupted
global.db.bots = global.db.bots?.filter(bot => 
  bot.jid && typeof bot.is_connected === 'boolean'
) || []
```

### 2. Session Recovery
```bash
# Backup sessions before cleanup
tar -czf sessions_backup_$(date +%s).tar.gz sessions/

# Clean invalid sessions
for dir in sessions/*/; do
  if [ ! -f "$dir/creds.json" ]; then
    echo "Removing invalid session: $dir"
    rm -rf "$dir"
  fi
done
```

### 3. Instance Recovery
```javascript
// Re-register all active bots
global.db.bots?.filter(bot => bot.is_connected).forEach(bot => {
  const instance = Instance.getBot(bot.jid)
  if (!instance) {
    console.log(`Re-registering bot: ${bot.jid}`)
    // Trigger reconnection
    require('./lib/connector/connector')(bot.jid, client, session, database)
  }
})
```

## 📞 Getting Help

### 1. Enable Verbose Logging
```javascript
// Add detailed logging
const originalConsoleLog = console.log
console.log = (...args) => {
  const timestamp = new Date().toISOString()
  originalConsoleLog(`[${timestamp}]`, ...args)
}
```

### 2. Generate Debug Report
```javascript
const generateDebugReport = () => {
  return {
    timestamp: new Date().toISOString(),
    nodeVersion: process.version,
    platform: process.platform,
    memory: process.memoryUsage(),
    botCount: global.db.bots?.length || 0,
    connectedBots: global.db.bots?.filter(b => b.is_connected).length || 0,
    sessionFiles: fs.readdirSync('sessions/').length,
    lastError: global.lastError || null
  }
}

console.log('Debug report:', generateDebugReport())
```

### 3. Create Minimal Reproduction
```javascript
// Test basic bot creation
const testBotCreation = async () => {
  try {
    console.log('Testing bot creation...')
    // Minimal test code here
  } catch (error) {
    console.error('Test failed:', error)
  }
}
```

## 📋 Prevention Checklist

- [ ] Regular database backups enabled
- [ ] Session directory permissions correct
- [ ] Error handling implemented in all critical paths
- [ ] Memory usage monitoring active
- [ ] Connection health checks running
- [ ] Log rotation configured
- [ ] Recovery procedures documented
- [ ] Development environment mirrors production

Remember to check the logs and error messages carefully, as they often contain specific information about what went wrong and how to fix it.