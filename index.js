var url = require('url')
var qs = require('querystring')
var StringMap = require('stringmap')
var Butler = require('noddity-butler')
var Rss = require('rss')
var level = require('level')
var sanitize = require("sanitize-filename")
var safeConverter = require('pagedown').getSanitizingConverter()
var markdownToHtml = safeConverter.makeHtml.bind(safeConverter)
var joinPath = require('path').join
var Linkifier = require('noddity-linkifier')

function dumbResolve(firstThingy, secondThingy) {
	var separator = '/'
	if (firstThingy[firstThingy.length - 1] === '/') {
		separator = ''
	}
	return firstThingy + separator + secondThingy
}

function getRssFeedXml(butler, feedUrl, postUrlRoot, blogTitle, blogAuthor, cb) {
	butler.getPosts({ mostRecent: 7 }, function(err, posts) {
		if (err) {
			cb(err)
		} else {
			var siteRootUrl = url.resolve(postUrlRoot, '')
			var rss = new Rss({
				title: blogTitle || siteRootUrl,
				feed_url: feedUrl,
				site_url: siteRootUrl,
				ttl: 12 * 60
			})

			var addToFeed = rss.item.bind(rss)

			posts.reverse()

			var linkify = new Linkifier(postUrlRoot)

			posts.map(function turnPostIntoRssItem(post) {
				var postUrl = dumbResolve(postUrlRoot, post.filename)
				return {
					title: post.metadata.title || post.filename,
					description: linkify(markdownToHtml(post.content)),
					url: postUrl,
					// Post URLs must be unique!
					// guid: '',
					author: post.metadata.author || blogAuthor,
					date: post.metadata.date
				}
			}).forEach(addToFeed)
			cb(err, rss.xml())
		}
	})
}

function allNecessaryParametersExist(parameters) {
	return typeof parameters.noddityRoot !== 'undefined'
		&& typeof parameters.postUrlRoot !== 'undefined'
		&& typeof parameters.title !== 'undefined'
		&& typeof parameters.author !== 'undefined'
}

module.exports = function Rssaas() {

	var butlers = new StringMap()

	function getAppropriateButler(rootUrl) {
		if (!butlers.has(rootUrl)) {
			var db = level(joinPath('/tmp', sanitize(rootUrl)))
			var butler = new Butler(rootUrl, db)
			butlers.set(rootUrl, butler)
		}

		return butlers.get(rootUrl)
	}

	var server = require('http').createServer(function(req, res) {
		var parameters = qs.parse(url.parse(req.url).query)
		if (allNecessaryParametersExist(parameters)) {
			var butler = getAppropriateButler(parameters.noddityRoot)

			getRssFeedXml(butler,
					req.url,
					parameters.postUrlRoot,
					parameters.title,
					parameters.author,
					function (err, xml) { res.end(err || xml) })
		} else {
			res.end("Need to supply noddityRoot, postUrlRoot, and title")
		}
	})

	var closeServer = server.close.bind(server)

	server.close = function closeRssaasServer() {
		Object.keys(butlers.obj).forEach(function(key) {
			var butler = butlers.get(key)
			butler.stop()
		})
		closeServer()
	}

	return server
}
