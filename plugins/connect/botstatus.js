const { Component } = require('@neoxr/wb')
const { Config: env } = new Component

exports.run = {
   usage: ['botstatus', 'mystatus'],
   category: 'connect',
   async: async (m, {
      client,
      isOwner,
      Func
   }) => {
      try {
         const currentBotId = client.decodeJid(client.user.id).replace(/@.+/, '')
         const isMainBot = currentBotId === env.pairing.number.toString()
         
         let caption = `乂  *B O T   S T A T U S*\n\n`
         
         if (isMainBot) {
            // Main bot status
            caption += `┌  ◦  Type : Main Bot\n`
            caption += `│  ◦  Owner : ${env.owner_name}\n`
            caption += `│  ◦  Number : +${env.pairing.number}\n`
            
            // Show multi-user stats if owner
            if (isOwner) {
               const totalBots = global.db.bots ? global.db.bots.length : 0
               const connectedBots = global.db.bots ? global.db.bots.filter(v => v.is_connected).length : 0
               caption += `│  ◦  Sub-bots : ${connectedBots}/${totalBots} (${env.bot_hosting.slot} max)\n`
               caption += `│  ◦  Server : ${env.bot_hosting.server ? 'Active' : 'Inactive'}\n`
            }
         } else {
            // Sub-bot status
            const botData = global.db.bots.find(v => v.jid === currentBotId)
            caption += `┌  ◦  Type : Personal Bot\n`
            caption += `│  ◦  Owner : +${currentBotId}\n`
            caption += `│  ◦  Connected : ${botData ? new Date(botData.last_connect).toLocaleString() : 'Unknown'}\n`
            caption += `│  ◦  Method : ${botData?.method || 'Unknown'}\n`
         }
         
         caption += `│  ◦  Status : Connected\n`
         caption += `└  ◦  Uptime : ${Func.toTime(process.uptime() * 1000)}\n\n`
         caption += global.footer
         
         client.reply(m.chat, caption, m)
      } catch (e) {
         client.reply(m.chat, Func.jsonFormat(e), m)
      }
   },
   error: false,
   cache: true,
   location: __filename
}