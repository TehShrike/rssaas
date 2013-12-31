var rssaas = require('./index.js')
var request = require('request')
var url = require('url')
var send = require('send')

var blogServer = require('http').createServer(function(req, res) {
	send(req, url.parse(req.url).pathname)
		.root('./test1')
		.pipe(res)
})

blogServer.listen(8888)

var rssServer = rssaas()
rssServer.listen(9000)

request({
	url: 'http://localhost:9000/posts',
	qs: {
		postUrlRoot: 'http://somesite.com/post/',
		noddityRoot: 'http://localhost:8888/',
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
