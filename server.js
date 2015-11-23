var noddityServer = require('noddity-service-server')
var thisParticularImplementation = require('./index.js')
noddityServer(thisParticularImplementation).listen(process.env.PORT || 8888)
