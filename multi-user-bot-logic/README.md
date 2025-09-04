# Multi-User Bot Logic System

This folder contains the complete multi-user bot logic extracted from the main bot system. It allows multiple users to create their own WhatsApp bot instances (sub-bots) that operate independently while sharing the same core infrastructure.

## 📁 Folder Structure

```
multi-user-bot-logic/
├── README.md                    # This file - overview and setup guide
├── core/                        # Core bot management files
│   ├── jadibot.js              # Main bot creation logic
│   ├── bot-manager.js          # Bot management commands
│   └── connector.js            # Auto-reconnection logic
├── lib/                         # System libraries
│   ├── listener-wrapper.js     # Event handling for sub-bots
│   ├── schema.js               # Database schema management
│   └── models.js               # Data models
├── plugins/                     # Additional plugin files
│   ├── terminate.js            # Bot termination logic
│   └── broadcast-bot.js        # Broadcasting functionality
├── web/                         # Web interface components
│   ├── api/                    # API endpoints
│   └── frontend/               # Web dashboard files
├── config/                      # Configuration examples
│   ├── bot-hosting.json        # Bot hosting configuration
│   └── environment.example.env # Environment variables
└── docs/                        # Documentation
    ├── IMPLEMENTATION.md        # Step-by-step implementation guide
    ├── ARCHITECTURE.md          # System architecture explanation
    ├── API.md                  # API documentation
    └── TROUBLESHOOTING.md      # Common issues and solutions
```

## 🚀 Quick Start

1. **Read the Documentation**: Start with `docs/IMPLEMENTATION.md` for step-by-step setup
2. **Configure Environment**: Copy `config/environment.example.env` to your project
3. **Integrate Core Files**: Copy files from `core/` and `lib/` to your bot
4. **Set Up Database**: Ensure your database includes the `bots` array
5. **Configure Web Interface**: Optional - set up the web dashboard

## 🔧 Key Features

- **Multi-Session Support**: Each user gets their own WhatsApp session
- **Data Isolation**: Separate data storage for each bot instance
- **Auto-Reconnection**: Bots automatically reconnect after restarts
- **Web Dashboard**: Users can manage bots via web interface
- **Permission System**: Sub-bot users don't get owner privileges
- **Group Isolation**: Prevents conflicts between main and sub-bots

## 📖 Documentation

- **[Implementation Guide](docs/IMPLEMENTATION.md)** - Complete setup instructions
- **[Architecture Overview](docs/ARCHITECTURE.md)** - How the system works
- **[API Reference](docs/API.md)** - Web API documentation
- **[Troubleshooting](docs/TROUBLESHOOTING.md)** - Common issues and fixes

## 🤝 Support

For questions or issues with implementation, refer to the documentation in the `docs/` folder or create an issue in the main repository.

## 📝 License

This multi-user bot logic is part of the main WhatsApp bot project. Please refer to the main project license for usage terms.