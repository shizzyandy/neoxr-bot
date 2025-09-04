# Multi-User Bot Setup Guide

This bot has been transformed into a multi-user system that allows users to create their own WhatsApp bot instances.

## 🚀 Quick Start

When you deploy this bot, it will automatically:
1. Start the main WhatsApp bot
2. Launch a web server on port 3001
3. Provide a user-friendly interface for bot creation

## 🌐 Web Interface

Users can access the bot creation interface at:
```
http://your-server:3001/
```

### Features:
- **Simple Registration**: Users enter their phone number and bot name
- **Two Connection Methods**: QR Code or Pairing Code
- **Real-time Status**: Shows connection status and active bots
- **Auto-notifications**: Users receive welcome messages when connected

## 📱 How Users Connect

1. **Visit the web interface**
2. **Enter WhatsApp number** (with country code, no + symbol)
3. **Choose bot name** (e.g., "My Personal Bot")
4. **Select connection method**:
   - **QR Code**: Scan with WhatsApp mobile app
   - **Pairing Code**: Enter 6-digit code in WhatsApp settings
5. **Follow WhatsApp linking process**
6. **Receive welcome message** when connected

## 🔧 Configuration

The system uses these key settings in `config.json`:

```json
{
  "bot_hosting": {
    "server": true,
    "host": "0.0.0.0", 
    "port": 3001,
    "session_dir": "sessions",
    "slot": 10,
    "batch": 50,
    "delay": 1500,
    "interval": 2500
  }
}
```

## 🗄️ Database Structure

Each user bot gets:
- **Isolated sessions** (stored in `sessions/` directory)
- **Separate database entry** in `global.db.bots[]`
- **Auto-reconnection** on server restart
- **Own message handling** with proper permissions

## 🚦 Bot Status Commands

Users can check their bot status with:
- `.botstatus` - Shows current bot information
- `.mystatus` - Displays connection details

## 🛡️ Security Features

- **Owner isolation**: Sub-bot owners only control their own bot
- **Group protection**: Prevents conflicts between main and sub-bots
- **Session security**: Each bot has isolated session storage
- **Permission system**: Proper owner privilege management

## 🔄 Auto-Reconnection

The system automatically:
- Reconnects existing bots on server restart
- Restores session data from storage
- Updates connection status in database
- Sends notifications on successful reconnection

## 📊 Monitoring

Admins can monitor:
- Total number of connected bots
- Server resource usage
- Connection success rates
- Active bot sessions

## 🌍 Deployment

For Heroku/Render deployment:
1. Set environment variables from `.env`
2. Ensure port configuration is correct
3. Configure session storage (database recommended)
4. Set up proper domain for web interface

## 🆘 Troubleshooting

**Common Issues:**
- **Port conflicts**: Change port in config if 3001 is occupied
- **Session errors**: Clear sessions directory and reconnect
- **Database issues**: Ensure bots array exists in database schema
- **Connection timeouts**: Check network and WhatsApp service status

## 📈 Scaling

The system supports:
- Up to 10 concurrent bots (configurable via `slot` setting)
- Horizontal scaling with external session storage
- Load balancing with proper session management
- Database clustering for high availability