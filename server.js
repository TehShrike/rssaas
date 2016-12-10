const noddityServer = require('noddity-service-server')
const thisParticularImplementation = require('./index.js')
noddityServer(thisParticularImplementation).listen(process.env.PORT || 8888)
