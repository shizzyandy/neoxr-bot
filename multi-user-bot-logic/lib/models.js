/*
 * MODELS.JS - Data Models and Structures
 * 
 * This file defines the data models and default structures used throughout
 * the multi-user bot system. It ensures consistency in data storage and
 * provides default values for all database entities.
 * 
 * KEY MODELS:
 * - users: Individual user data and preferences
 * - groups: Group settings and configurations
 * - chats: Chat-specific data and settings
 * - setting: Bot instance settings
 * - setup: Global setup configuration
 * - member: Group member data
 * - def_props: Default properties for new bot instances
 * 
 * USAGE:
 * These models are used by the schema initialization system to ensure
 * all database objects have the required properties with appropriate
 * default values.
 */

// Default properties for new bot instances
const def_props = {
   users: [],      // Array to store user data
   chats: [],      // Array to store chat data  
   groups: [],     // Array to store group data
   statistic: {    // Bot usage statistics
      outbound: 0,    // Outbound data usage
      inbound: 0,     // Inbound data usage
      sent: 0,        // Messages sent
      received: 0     // Messages received
   },
   sticker: {},    // Sticker pack storage
   setting: {      // Bot instance settings
      online: true,        // Online status
      self: false,         // Self mode (only respond to owner)
      autoread: true,      // Auto read messages
      debug: false,        // Debug mode
      error: [],          // Error log
      antidelete: false,   // Anti-delete messages
      antilink: false,     // Anti-link protection
      antivirtex: false,   // Anti-virtex protection
      filter: false,       // Message filtering
      game_limit: 25,      // Game usage limit
      lastReset: new Date * 1, // Last limit reset time
      link: 'https://api.neoxr.my.id/api',
      msg: '♡ @user is not responding after several minutes, sorry for the inconvenience, and please try again after 5 minutes.',
      owners: [],          // Additional owners
      toxic: ['dog', 'gay', 'fuck', 'shit', 'asshole'], // Toxic words list
      verify: false,       // User verification system
      welcome: '♡ @user joined @subject.',
      left: '♡ @user left @subject.'
   }
}

// User data model
const users = {
   jid: '',              // WhatsApp JID
   name: '',             // Display name
   banned: false,        // Ban status
   limit: 50,            // Usage limit
   hit: 0,              // Command usage count
   spam: 0,             // Spam count
   warning: 0,          // Warning count
   balance: 10000,      // Virtual balance
   level: 1,            // User level
   exp: 0,              // Experience points
   age: 0,              // User age
   regTime: 0,          // Registration time
   afk: -1,             // AFK status (-1 = not AFK)
   afkReason: '',       // AFK reason
   premium: false,      // Premium status
   premiumTime: 0,      // Premium expiry time
   verified: false,     // Verification status
   email: '',           // Email address
   code: '',            // Verification code
   codeExpire: 0,       // Code expiry time
   attempt: 0,          // Verification attempts
   ban_temporary: 0,    // Temporary ban time
   ban_times: 0,        // Number of bans
   whitelist: false     // Whitelist status
}

// Group data model  
const groups = {
   jid: '',             // Group JID
   subject: '',         // Group name
   welcome: true,       // Welcome message enabled
   left: true,          // Leave message enabled
   member: {},          // Member data object
   text_welcome: '',    // Custom welcome text
   text_left: '',       // Custom leave text
   antidelete: false,   // Anti-delete enabled
   antilink: false,     // Anti-link enabled
   antivirtex: false,   // Anti-virtex enabled
   filter: false,       // Message filter enabled
   game: true,          // Games enabled
   nsfw: false,         // NSFW content allowed
   notify: true,        // Notifications enabled
   viewonce: true,      // View once messages enabled
   autosticker: false,  // Auto sticker conversion
   localonly: false,    // Local only (specific country)
   captcha: false,      // Captcha verification for new members
   admin: {},          // Admin-specific settings
   expired: 0,         // Group expiry time
   stay: false         // Bot stay permanently
}

// Chat data model
const chats = {
   jid: '',            // Chat JID
   command: 0,         // Command usage count
   chat: 0,            // Message count
   lastchat: 0,        // Last message time
   banned: false       // Chat ban status
}

// Global setting model
const setting = {
   autobackup: false,   // Auto backup enabled
   debug: false,        // Debug mode
   error: [],          // Error log
   hidden: [],         // Hidden commands
   sk_pack: 'Sticker', // Sticker pack name
   sk_author: '© neoxr-bot', // Sticker author
   self: false,        // Self mode
   mimic: [],          // Mimic users
   noprefix: false,    // No prefix mode
   multiprefix: true,  // Multiple prefix support
   prefixes: ['.', '#', '!', '/'], // Available prefixes
   toxic: ['ajg', 'ajig', 'anjas', 'anjg', 'anjim', 'anjing', 'anjrot', 'anying', 'asw', 'autis', 'babi', 'bacod', 'bacot', 'bagong', 'bajingan', 'bangsad', 'bangsat', 'bani', 'bangke', 'bastard', 'bego', 'bgsd', 'biadab', 'biadap', 'bitch', 'bngst', 'bodoh', 'bokep', 'cocote', 'coli', 'colmek', 'comli', 'dajjal', 'dancok', 'dongo', 'fuck', 'gelay', 'goblog', 'goblok', 'guoblog', 'guoblok', 'hairul', 'henceut', 'idiot', 'itil', 'jamet', 'jancok', 'jembut', 'jingan', 'kafir', 'kanjut', 'kanyut', 'keparat', 'kntl', 'kontol', 'lana', 'loli', 'lont', 'lonte', 'mancing', 'meki', 'memek', 'ngentot', 'njeng', 'njing', 'njinx', 'oppai', 'pantek', 'pantek', 'peler', 'pepek', 'pilat', 'perek', 'puki', 'pukimak', 'redhub', 'sange', 'setan', 'silit', 'telaso', 'tempek', 'tete', 'titit', 'toket', 'tolol', 'tomlol', 'tytyd', 'wildan', 'xnxx'],
   online: true,       // Online status
   onlyprefix: '+',    // Only prefix character
   owners: ['6285157336614'], // Bot owners
   msg: '♡  @user @text not responding after several minutes, sorry for the inconvenience, and please try again after 5 minutes.'
}

// Global setup model
const setup = {
   session: 'neoxr-bot',  // Session name
   groupmode: false,      // Group mode only
   anticall: true,        // Anti-call enabled
   autoread: true,        // Auto read messages
   restriction: false,    // Restriction mode
   restartDB: 0,         // Last database restart
   cooldown: 3,          // Command cooldown (seconds)
   conn: {               // Connection info
      ip: null,             // Server IP
      isp: null,            // ISP name
      country: null,        // Country
      lang: null,           // Language
      timezone: null        // Timezone
   },
   msg: {               // System messages
      owner: '♡  This command is only for my owner.',
      group: '♡  This command is only used in groups.',
      private: '♡  This command is only used in private chat.',
      admin: '♡  This command is only for group admins.',
      botAdmin: '♡  This command can be used when I become admin.',
      premium: '♡  This command is only for premium users.',
      restrict: '♡  This feature is disabled.'
   }
}

// Group member model
const member = {
   warning: 0,         // Warning count
   banned: false,      // Ban status
   level: 1,           // Member level
   exp: 0,             // Experience points
   lastseen: 0,        // Last seen time
   afk: -1,            // AFK status
   afkReason: '',      // AFK reason
   afkObj: {},         // AFK message object
   left: false         // Has left group
}

module.exports = {
   def_props,
   users,
   groups, 
   chats,
   setting,
   setup,
   member
}