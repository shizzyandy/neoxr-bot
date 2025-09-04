# Implementation Guide

This guide provides step-by-step instructions for implementing the multi-user bot logic in your WhatsApp bot project.

## 📋 Prerequisites

- Node.js 20.x or higher
- WhatsApp bot project using @neoxr/wb library
- Database system (SQLite, MongoDB, or PostgreSQL)
- Basic understanding of JavaScript and WhatsApp bot development

## 🚀 Step 1: Environment Setup

### 1.1 Copy Environment Configuration
```bash
cp multi-user-bot-logic/config/environment.example.env .env
```

### 1.2 Configure Environment Variables
Edit `.env` file with your specific values:

```env
BOT_OWNER="YOUR_WHATSAPP_NUMBER"
BOT_HOSTING_ENABLED=true
BOT_HOSTING_SLOT=10
DATABASE_URL="sqlite:///database.db"
DOMAIN="https://yourdomain.com"
```

### 1.3 Install Dependencies
```bash
npm install @neoxr/wb qrcode @cacheable/node-cache
```

## 🗄️ Step 2: Database Setup

### 2.1 Add Bots Array to Database Schema
In your main client file, ensure the database includes the `bots` array:

```javascript
global.db = {
  users: [],
  chats: [],
  groups: [],
  statistic: {},
  sticker: {},
  setting: {},
  bots: [], // Add this line
  ...
}
```

### 2.2 Reset Connected Bots on Startup
Add this code to reset bot connection status on restart:

```javascript
// Reset all connect bots
if (global.db.bots.length > 0) {
   for (let v of global.db.bots) {
      v.is_connected = false
   }
}
```

## 📁 Step 3: Copy Core Files

### 3.1 Copy Core Bot Logic
```bash
# Copy core files to your plugins/connect directory
cp multi-user-bot-logic/core/jadibot.js plugins/connect/
cp multi-user-bot-logic/core/bot-manager.js plugins/connect/
cp multi-user-bot-logic/core/connector.js lib/connector/

# Copy library files
cp multi-user-bot-logic/lib/listener-wrapper.js lib/system/
cp multi-user-bot-logic/lib/schema.js lib/system/
cp multi-user-bot-logic/lib/models.js lib/system/
```

### 3.2 Copy Additional Plugins (Optional)
```bash
cp multi-user-bot-logic/plugins/terminate.js plugins/connect/
cp multi-user-bot-logic/plugins/broadcast-bot.js plugins/connect/
```

## 🔧 Step 4: Modify Handler.js

### 4.1 Update Owner Check
Find this line in your `handler.js`:
```javascript
const isOwner = [client.decodeJid(client.user.id).replace(/@.+/, ''), env.owner, ...setting.owners].map(v => v + '@s.whatsapp.net').includes(m.sender)
```

Replace with:
```javascript
const isOwner = [env.owner, ...setting.owners].map(v => v + '@s.whatsapp.net').includes(m.sender)
```

### 4.2 Add Group Isolation Logic
Add this code after spam protector in `handler.js`:

```javascript
// Prevent sub-bots from being in same groups as main bot
if (m.isGroup && global.db.bots.length > 0) {
   let member = participants.map(v => client.decodeJid(v.id))
   let bot = global.db.bots.some(v => v.jid === client.decodeJid(m.sender))
   
   if (!m.fromMe && member.includes(env.pairing.number + '@s.whatsapp.net') && member.includes(env.owner + '@s.whatsapp.net') && bot) {
      if (isBotAdmin) return m.reply(Func.texted('bold', `🚩 Client bots cannot be in the same group as the main bot.`)).then(async () => await client.groupParticipantsUpdate(m.chat, [m.sender], 'remove'))
      if (!isBotAdmin) return m.reply(Func.texted('bold', `🚩 Client bots cannot be in the same group as the main bot.`))
   }
}
```

## 🌐 Step 5: Web Interface Setup (Optional)

### 5.1 Copy Web API Files
```bash
mkdir -p routers/api
cp multi-user-bot-logic/web/api/subbot-connect.js routers/api/
cp multi-user-bot-logic/web/api/subbot-status.js routers/api/
```

### 5.2 Enable Web Server
In your main bot file, add the server argument:

```bash
node . --server
```

Or programmatically:
```javascript
if (process.argv.includes('--server')) {
   env.bot_hosting.server = true
   const isOn = await Func.isPortInUse(env.bot_hosting.host)
   if (!isOn) server(client.sock).catch(() => server(client.sock))
}
```

## 🔄 Step 6: Auto-Reconnection Setup

### 6.1 Add Connector to Client.js
In your `client.js`, add the Connector import:

```javascript
const { Baileys, MongoDB, PostgreSQL, Connector, Function: Func } = new(require('@neoxr/wb'))
```

### 6.2 Add Reconnection Logic
After bot ready event:

```javascript
client.once('ready', async () => {
   // ... existing code ...
   
   // Reconnect existing bots
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
})
```

## 🎛️ Step 7: Configuration

### 7.1 Bot Hosting Configuration
Add to your environment config:

```javascript
module.exports = {
   // ... existing config ...
   bot_hosting: {
      server: process.env.BOT_HOSTING_SERVER === 'true',
      host: process.env.BOT_HOSTING_HOST || '0.0.0.0',
      port: process.env.BOT_HOSTING_PORT || 3001,
      session_dir: process.env.BOT_HOSTING_SESSION_DIR || 'sessions',
      slot: parseInt(process.env.BOT_HOSTING_SLOT) || 10,
      bacth: 50,
      delay: 1500,
      interval: 2500
   }
}
```

## 🧪 Step 8: Testing

### 8.1 Test Bot Creation
1. Start your bot: `npm start`
2. Send message: `!jadibot 6281234567890`
3. Choose connection method (QR or Pairing)
4. Complete authentication process

### 8.2 Test Bot Management
```bash
!listbot          # List all connected bots
!botinfo          # Show current bot info
!logout           # Disconnect current bot
```

### 8.3 Test Web Interface (if enabled)
1. Open browser: `http://localhost:3001`
2. Navigate to bot connection page
3. Test QR code and pairing methods

## 🔍 Step 9: Verification

### 9.1 Check Database
Verify that `global.db.bots` contains bot entries:
```javascript
console.log(global.db.bots)
```

### 9.2 Check Instance Manager
Verify bot instances are registered:
```javascript
const { Instance } = require('@neoxr/wb').Component
console.log(Instance.getData('bot_jid_here'))
```

### 9.3 Check Session Files
Verify session files are created in the specified directory:
```bash
ls -la sessions/
```

## 🛠️ Step 10: Customization

### 10.1 Modify Bot Limits
Change the slot limit in your environment:
```env
BOT_HOSTING_SLOT=20
```

### 10.2 Custom Connection Methods
Modify `jadibot.js` to add custom authentication flows or restrictions.

### 10.3 Add Custom Commands
Create new commands in the `plugins/connect/` directory for additional bot management features.

## ✅ Final Checklist

- [ ] Environment variables configured
- [ ] Database includes `bots` array
- [ ] Core files copied to correct locations
- [ ] Handler.js updated with owner check and group isolation
- [ ] Web interface set up (if desired)
- [ ] Auto-reconnection logic implemented
- [ ] Configuration properly set
- [ ] Testing completed successfully
- [ ] Bot creation and management working
- [ ] Session files being created and managed

## 🔧 Troubleshooting

If you encounter issues, refer to [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for common problems and solutions.

## 📞 Support

For additional help:
1. Check the documentation in the `docs/` folder
2. Review the code comments in each file
3. Create an issue in the main repository
4. Check existing bot implementations for reference

## 🚀 Next Steps

After successful implementation:
1. Set up monitoring for bot instances
2. Implement backup strategies for session data
3. Configure logging for multi-user activities
4. Set up alerts for bot disconnections
5. Consider implementing premium features for bot users