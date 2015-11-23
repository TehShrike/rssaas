var rssaas = require('./index.js')
var request = require('request')
var url = require('url')
var send = require('send')
var noddityServer = require('noddity-service-server')

var blogServer = require('http').createServer(function(req, res) {
	send(req, url.parse(req.url).pathname)
		.root('./test1')
		.pipe(res)
})

blogServer.listen(8887)

var rssServer = noddityServer(rssaas)
rssServer.listen(8889)

request({
	url: 'http://localhost:8889/posts',
	qs: {
		postUrlRoot: 'http://somesite.com/post/',
		noddityRoot: 'http://localhost:8887/',
		title: "My awesome blog",
		author: "Mr. Fantastic"
	}
}, function (error, response, body) {
	if (error) {
		console.log("Error")
		console.log(error)
	} else {
		console.log(body)
	}
	rssServer.close()
	blogServer.close()
})
