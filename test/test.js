var test = require('tape')
var url = require('url')
var send = require('send')
var http = require('http')
var fs = require('fs')
var rssaas = require('../index.js')
var Butler = require('noddity-butler')
var Linkifier = require('noddity-linkifier')
var Level = require('level-mem')

var blogServer = http.createServer(function(req, res) {
	send(req, url.parse(req.url).pathname)
		.root(__dirname + '/content')
		.pipe(res)
})
blogServer.listen(8888)

var blogUrl = 'http://localhost:8888/'

test(function (t) {
	t.plan(2)

	var context = {
		butler: new Butler(blogUrl, new Level()),
		linkify: new Linkifier('/').linkify,
		url: 'http://example.com/feed.xml',
		resolvePost: function (x) { return 'http://example.com/blog/' + x },
		parameters: {
			title: 'Blog Title',
			author: 'Author',
			postUrlRoot: 'http://example.com/'
		}
	}
	rssaas(context, function (err, xml) {
		t.notOk(err)

		var expected = normalizeRssXml(fs.readFileSync(__dirname + '/expected.xml', 'utf-8'))
		var actual = normalizeRssXml(xml)
		t.equal(actual, expected)

		blogServer.close()
		t.end()
	})
})

function normalizeRssXml(str) {
	return str.replace(/[\r\n\t]+/g, '').replace(/<lastBuildDate>[^<]+<\/lastBuildDate>/, '')
}
