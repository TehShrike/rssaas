var rssaas = require('./index.js')
var request = require('request')
var url = require('url')
var send = require('send')



require('http').createServer(function(req, res) {
	send(req, url.parse(req.url).pathname)
		.root('./test1')
		.pipe(res)
}).listen(8080)

rssaas(9000)

request({ 
	url: 'http://localhost:9000/posts',
	qs: {
		index: 'http://localhost:8080/index.json',
		root: 'http://localhost:8080/'
	}
}, function (error, response, body) {
	if (error) {
		console.log("Error")
		console.log(error)
	} else {
		console.log(body)
	}
})