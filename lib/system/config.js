const { Component } = require('@neoxr/wb')
const { Function: Func, NeoxrApi } = new Component
global.Api = new NeoxrApi('https://api.neoxr.my.id/api', process.env.API_KEY)
global.header = `© Mr Stanley bot v${require('package.json').version} (Beta)`
global.footer = `ʟɪɢʜᴛᴡᴇɪɢʜᴛ ᴡᴀʙᴏᴛ ᴍᴀᴅᴇ ʙʏ ᴍʀ sᴛᴀɴʟᴇʏ ッ`

// Bot hosting configuration
global.env = {
   ...global.env,
   bot_hosting: {
      server: process.env.BOT_HOSTING_SERVER === 'true',
      host: process.env.BOT_HOSTING_HOST || '0.0.0.0',
      port: process.env.BOT_HOSTING_PORT || 3001,
      session_dir: process.env.BOT_HOSTING_SESSION_DIR || 'sessions',
      slot: parseInt(process.env.BOT_HOSTING_SLOT) || 10,
      enabled: process.env.BOT_HOSTING_ENABLED === 'true',
      batch: 50,
      delay: 1500,
      interval: 2500
   }
}

global.status = Object.freeze({
   invalid: Func.Styles('Invalid url'),
   wrong: Func.Styles('Wrong format.'),
   fail: Func.Styles('Can\'t get metadata'),
   error: Func.Styles('Error occurred'),
   errorF: Func.Styles('Sorry this feature is in error.'),
   premium: Func.Styles('This feature only for premium user.'),
   auth: Func.Styles('You do not have permission to use this feature, ask the owner first.'),
   owner: Func.Styles('This command only for owner.'),
   group: Func.Styles('This command will only work in groups.'),
   botAdmin: Func.Styles('This command will work when I become an admin.'),
   admin: Func.Styles('This command only for group admin.'),
   private: Func.Styles('Use this command in private chat.'),
   gameSystem: Func.Styles('Game features have been disabled.'),
   gameInGroup: Func.Styles('Game features have not been activated for this group.'),
   gameLevel: Func.Styles('You cannot play the game because your level has reached the maximum limit.')
})