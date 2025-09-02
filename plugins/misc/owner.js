exports.run = {
   usage: ['owner'],
   category: 'miscs',
   async: async (m, {
      client,
      env,
      Func
   }) => {
      client.sendContact(m.chat, [{
         name: env.owner_name,
         number: env.owner,
         about: 'Owner & Creator'
      }], m, {
         org: 'Mr Stanley Network',
         website: 'https://github.com/shizzyandy/neoxr-bot',
         email: 'contact@mrstanley.my.id'
      })
   },
   error: false,
   cache: true,
   location: __filename
}