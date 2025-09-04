# Multi-User WhatsApp Bot Implementation

This implementation converts the single-user WhatsApp bot into a multi-user system that automatically generates a web endpoint for bot creation.

## 🚀 Features

- **Automatic Web Interface**: No commands needed - just visit the URL
- **Multiple Connection Methods**: QR Code and Pairing Code support
- **User Isolation**: Each user gets their own bot instance with separate data
- **Auto-Reconnection**: Bots automatically reconnect on server restart
- **Session Management**: Independent sessions for each bot instance
- **Database Isolation**: Each bot has its own users, groups, and chats data

## 📋 Quick Start

1. **Set Environment Variables**: The bot hosting is automatically enabled via environment variables in `.env`:
   ```env
   BOT_HOSTING_ENABLED=true
   BOT_HOSTING_SERVER=true
   BOT_HOSTING_PORT=3001
   BOT_HOSTING_SLOT=10
   ```

2. **Start the Bot**: 
   ```bash
   npm start
   ```

3. **Access Web Interface**: Visit `http://localhost:3001` to create WhatsApp bots

## 🌐 Web Interface

The web interface automatically appears when you deploy the bot. Users can:

1. **Enter Phone Number**: Their WhatsApp number
2. **Choose Connection Method**: QR Code or Pairing Code
3. **Connect**: Follow the instructions to link their WhatsApp
4. **Get Confirmation**: Receive a message once connected

## 🏗️ Architecture

### Main Components

- **Client.js**: Modified to automatically start web server
- **Web Interface**: Beautiful HTML form at `/` endpoint
- **API Endpoints**: RESTful API for bot creation
- **Handler.js**: Updated with multi-user owner checks and data isolation
- **Auto-Reconnection**: Automatic bot reconnection on startup

### Data Structure

```javascript
global.db = {
  users: [],      // Main bot users
  groups: [],     // Main bot groups  
  chats: [],      // Main bot chats
  bots: [         // Registry of all sub-bots
    {
      jid: "6281234567890@s.whatsapp.net",
      sender: "user@s.whatsapp.net", 
      last_connect: 1640995200000,
      is_connected: true,
      data: {
        users: [],   // Sub-bot specific users
        groups: [],  // Sub-bot specific groups
        chats: []    // Sub-bot specific chats
      }
    }
  ]
}
```

## 🔧 API Endpoints

### POST `/api/subbot/connect`

Create a new bot instance.

**Request:**
```json
{
  "phoneNumber": "628123456789",
  "botName": "My Personal Bot", 
  "method": "qr"
}
```

**Response (QR Method):**
```json
{
  "status": true,
  "data": {
    "qrCode": "data:image/svg+xml;base64,...",
    "sessionId": "session_1640995200000",
    "expiresIn": 120,
    "message": "Scan the QR code with your WhatsApp"
  }
}
```

**Response (Pairing Method):**
```json
{
  "status": true,
  "data": {
    "pairCode": "123456",
    "sessionId": "session_1640995200000", 
    "expiresIn": 300,
    "message": "Enter this code in your WhatsApp settings"
  }
}
```

## 🔒 Security Features

- **Owner Isolation**: Each sub-bot only recognizes its creator as owner
- **Data Isolation**: Separate databases for each bot instance
- **Session Security**: Independent WhatsApp sessions
- **Slot Limits**: Configurable maximum number of bots

## 🚀 Deployment

### Heroku
```bash
git push heroku main
```
The web interface will be available at your Heroku app URL.

### Render
```bash
# Deploy via GitHub integration
```
The web interface will be available at your Render app URL.

### VPS
```bash
npm start
```
Access via `http://your-server-ip:3001`

## 🛠️ Configuration

Environment variables in `.env`:

```env
# Bot Hosting Settings
BOT_HOSTING_ENABLED=true      # Enable multi-user hosting
BOT_HOSTING_SERVER=true       # Enable web server
BOT_HOSTING_HOST=0.0.0.0      # Server host
BOT_HOSTING_PORT=3001         # Server port
BOT_HOSTING_SLOT=10           # Maximum number of bots
BOT_HOSTING_SESSION_DIR=sessions # Session storage directory
```

## 📁 File Structure

```
├── client.js                    # Modified with web server and auto-reconnection
├── handler.js                   # Updated with multi-user support
├── plugins/connect/
│   ├── jadibot.js              # Bot creation logic
│   └── bot-manager.js          # Bot management commands
├── lib/
│   ├── connector/
│   │   └── connector.js        # Auto-reconnection logic
│   └── system/
│       ├── listener-wrapper.js # Event handler wrapper
│       ├── schema.js           # Multi-user schema
│       └── models.js           # Data models
├── routers/
│   ├── index.js                # Main page route
│   └── api/
│       ├── subbot-connect.js   # Bot creation API
│       └── subbot-status.js    # Bot status API
└── public/
    └── index.html              # Web interface
```

## 🔄 Auto-Reconnection

The system automatically:
1. Detects existing bots in database on startup
2. Filters bots that are not currently connected
3. Attempts to reconnect each bot using stored session data
4. Updates connection status in database
5. Registers event listeners for each reconnected bot

## 💡 Usage Examples

### Creating a Bot via Web Interface
1. Visit `http://localhost:3001`
2. Enter your WhatsApp number (e.g., `628123456789`)
3. Enter a bot name (e.g., `My Personal Assistant`)
4. Choose QR Code or Pairing Code method
5. Follow the connection instructions
6. Start using your personal bot!

### Managing Bots
Users can manage their bots using these commands:
- `!listbot` - View all connected bots
- `!botinfo` - Get current bot information  
- `!logout` - Disconnect and remove bot

## ⚠️ Important Notes

1. **First Run**: Ensure WhatsApp Web is logged out before creating the first bot
2. **Phone Numbers**: Use international format without '+' (e.g., 628123456789)
3. **Limits**: Respect the configured bot slot limits
4. **Sessions**: Each bot requires its own WhatsApp session
5. **Data Backup**: Bot data is automatically saved every 5 minutes

## 🐛 Troubleshooting

### Bot Won't Connect
- Check if phone number is valid WhatsApp number
- Ensure WhatsApp Web is logged out on the phone
- Try different connection method (QR vs Pairing)

### Web Interface Not Loading
- Check if port 3001 is accessible
- Verify BOT_HOSTING_SERVER=true in .env
- Check server logs for errors

### Auto-Reconnection Failed
- Check session files in `sessions/` directory
- Verify bot entries in database
- Look for connection errors in logs

## 📞 Support

The multi-user bot system is now ready for deployment! Users can create their own WhatsApp bots instantly through the web interface without any commands or technical knowledge required.