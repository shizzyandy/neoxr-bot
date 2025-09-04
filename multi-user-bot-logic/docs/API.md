# API Documentation

This document provides comprehensive API documentation for the multi-user bot system's web interface.

## 🌐 Base URL

```
http://localhost:3001/api
```

## 🔐 Authentication

Most endpoints require authentication via headers:

```javascript
headers: {
  'x-neoxr-token': 'your_bot_token_here'
}
```

## 📡 Endpoints

### 1. Bot Connection

#### POST `/subbot/connect`

Create a new bot instance with specified connection method.

**Request Body:**
```json
{
  "phoneNumber": "6281234567890",
  "botName": "My Personal Bot",
  "method": "qr"
}
```

**Parameters:**
- `phoneNumber` (string, required): WhatsApp phone number without '+' or spaces
- `botName` (string, required): Display name for the bot
- `method` (string, required): Connection method - `"qr"` or `"pair"`

**Response (QR Method):**
```json
{
  "status": true,
  "data": {
    "qrCode": "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0i...",
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

**Error Response:**
```json
{
  "status": false,
  "message": "Phone number and bot name are required"
}
```

**Usage Example:**
```javascript
const response = await fetch('/api/subbot/connect', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    phoneNumber: '6281234567890',
    botName: 'My Bot',
    method: 'qr'
  })
})

const data = await response.json()
if (data.status) {
  console.log('QR Code:', data.data.qrCode)
  console.log('Session ID:', data.data.sessionId)
}
```

### 2. Bot Status

#### GET `/subbot/status`

Check the connection status of a bot instance or get list of all bots.

**Query Parameters:**
- `sessionId` (string, optional): Specific session to check
- `action` (string, optional): Set to `"list"` to get all bots

**Single Bot Status:**
```
GET /api/subbot/status?sessionId=session_1640995200000
```

**Response:**
```json
{
  "status": true,
  "data": {
    "connected": true,
    "botInfo": {
      "jid": "6281234567890",
      "name": "My Bot User",
      "lastConnect": 1640995200000,
      "method": "--qr"
    }
  }
}
```

**All Bots List:**
```
GET /api/subbot/status?action=list
```

**Response:**
```json
{
  "status": true,
  "data": [
    {
      "jid": "6281234567890",
      "name": "User One",
      "lastConnect": 1640995200000,
      "isConnected": true,
      "token": "encrypted_token_123"
    },
    {
      "jid": "6289876543210", 
      "name": "User Two",
      "lastConnect": 1640995100000,
      "isConnected": false,
      "token": "encrypted_token_456"
    }
  ]
}
```

**Usage Example:**
```javascript
// Check specific bot status
const checkStatus = async (sessionId) => {
  const response = await fetch(`/api/subbot/status?sessionId=${sessionId}`)
  const data = await response.json()
  return data.data.connected
}

// Get all bots
const getAllBots = async () => {
  const response = await fetch('/api/subbot/status?action=list')
  const data = await response.json()
  return data.data
}
```

### 3. Bot Management

#### POST `/subbot/logout`

Logout and disconnect a bot instance.

**Request Body:**
```json
{
  "sessionId": "session_1640995200000"
}
```

**Response:**
```json
{
  "status": true,
  "message": "Bot disconnected successfully"
}
```

**Headers Required:**
```javascript
headers: {
  'x-neoxr-token': 'bot_token_here'
}
```

### 4. Bot Statistics

#### GET `/subbot/stats/:jid`

Get detailed statistics for a specific bot.

**Response:**
```json
{
  "status": true,
  "data": {
    "messagesSent": 1250,
    "messagesReceived": 890,
    "activeChats": 45,
    "groupsJoined": 12,
    "uptime": 86400000,
    "lastActivity": 1640995200000,
    "dataUsage": {
      "inbound": 1048576,
      "outbound": 2097152
    }
  }
}
```

### 5. Bot Commands

#### POST `/subbot/command`

Send a command to a specific bot instance.

**Request Body:**
```json
{
  "botJid": "6281234567890@s.whatsapp.net",
  "command": "listbot",
  "parameters": []
}
```

**Response:**
```json
{
  "status": true,
  "data": {
    "result": "Command executed successfully",
    "output": "Bot list retrieved"
  }
}
```

## 🔄 WebSocket Events

For real-time updates, the system supports WebSocket connections:

### Connection
```javascript
const ws = new WebSocket('ws://localhost:3001/ws/subbot')
```

### Events

#### Bot Connection Event
```json
{
  "event": "bot_connected",
  "data": {
    "jid": "6281234567890@s.whatsapp.net",
    "name": "User Name",
    "timestamp": 1640995200000
  }
}
```

#### Bot Disconnection Event
```json
{
  "event": "bot_disconnected",
  "data": {
    "jid": "6281234567890@s.whatsapp.net",
    "reason": "logout",
    "timestamp": 1640995200000
  }
}
```

#### Message Event
```json
{
  "event": "message_received",
  "data": {
    "botJid": "6281234567890@s.whatsapp.net",
    "from": "6289876543210@s.whatsapp.net",
    "message": "Hello bot!",
    "timestamp": 1640995200000
  }
}
```

## 🛡️ Error Handling

### Standard Error Response
```json
{
  "status": false,
  "message": "Error description",
  "code": "ERROR_CODE",
  "details": {}
}
```

### Common Error Codes
- `INVALID_PHONE_NUMBER`: Phone number format invalid
- `BOT_ALREADY_EXISTS`: Bot instance already exists for this number
- `SLOTS_FULL`: No available slots for new bots
- `SESSION_NOT_FOUND`: Session ID not found
- `UNAUTHORIZED`: Invalid or missing authentication token
- `CONNECTION_FAILED`: Failed to establish WhatsApp connection

## 📊 Rate Limiting

API endpoints are rate limited to prevent abuse:

- **Bot Creation**: 5 requests per hour per IP
- **Status Checks**: 60 requests per minute per IP
- **Command Execution**: 30 requests per minute per token

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 59
X-RateLimit-Reset: 1640995260
```

## 🔧 Integration Examples

### React Component Example
```jsx
import React, { useState, useEffect } from 'react'

const BotManager = () => {
  const [bots, setBots] = useState([])
  const [loading, setLoading] = useState(false)

  const createBot = async (phoneNumber, method) => {
    setLoading(true)
    try {
      const response = await fetch('/api/subbot/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber,
          botName: 'My Bot',
          method
        })
      })
      const data = await response.json()
      if (data.status) {
        // Handle QR code or pairing code
        console.log('Connection data:', data.data)
      }
    } catch (error) {
      console.error('Failed to create bot:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadBots = async () => {
    try {
      const response = await fetch('/api/subbot/status?action=list')
      const data = await response.json()
      if (data.status) {
        setBots(data.data)
      }
    } catch (error) {
      console.error('Failed to load bots:', error)
    }
  }

  useEffect(() => {
    loadBots()
  }, [])

  return (
    <div>
      <h2>Bot Manager</h2>
      {/* Bot creation form */}
      {/* Bot list display */}
    </div>
  )
}
```

### Node.js Client Example
```javascript
class SubBotClient {
  constructor(baseUrl, token) {
    this.baseUrl = baseUrl
    this.token = token
  }

  async createBot(phoneNumber, botName, method) {
    const response = await fetch(`${this.baseUrl}/subbot/connect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-neoxr-token': this.token
      },
      body: JSON.stringify({ phoneNumber, botName, method })
    })
    return response.json()
  }

  async getBotStatus(sessionId) {
    const response = await fetch(`${this.baseUrl}/subbot/status?sessionId=${sessionId}`)
    return response.json()
  }

  async getAllBots() {
    const response = await fetch(`${this.baseUrl}/subbot/status?action=list`)
    return response.json()
  }
}

// Usage
const client = new SubBotClient('http://localhost:3001/api', 'your_token')
const bots = await client.getAllBots()
console.log('All bots:', bots.data)
```

## 📝 Response Schema

### Bot Object
```typescript
interface Bot {
  jid: string              // WhatsApp JID (without @s.whatsapp.net)
  name: string             // Display name
  lastConnect: number      // Unix timestamp
  isConnected: boolean     // Connection status
  token: string            // Encrypted token for API access
}
```

### Connection Data
```typescript
interface ConnectionData {
  qrCode?: string          // Base64 encoded QR code (QR method)
  pairCode?: string        // 6-digit pairing code (pairing method)
  sessionId: string        // Unique session identifier
  expiresIn: number        // Seconds until expiration
  message: string          // Human-readable instruction
}
```

### Bot Statistics
```typescript
interface BotStats {
  messagesSent: number
  messagesReceived: number
  activeChats: number
  groupsJoined: number
  uptime: number           // Milliseconds
  lastActivity: number     // Unix timestamp
  dataUsage: {
    inbound: number        // Bytes
    outbound: number       // Bytes
  }
}
```

This API provides a comprehensive interface for managing multi-user bot instances through web applications and external integrations.