var url = require('url')
var Rss = require('rss')
var render = require('noddity-render-static')
var async = require('async')

var templatePost = {
	name: 'template',
	metadata: {
		title: 'RSS Template',
		markdown: false
	},
	content: '{{>current}}'
}

module.exports = function getRssFeedXml(context, cb) {
	if (typeof context.parameters.title === 'undefined') {
		cb(new Error("'title' must be provided"))
	} else if (typeof context.parameters.author === 'undefined') {
		cb(new Error("'author' must be provided"))
	} else {
		var butler = context.butler
		var postUrlRoot = context.parameters.postUrlRoot
		var dumbResolve = context.resolvePost
		var blogTitle = context.parameters.title
		var blogAuthor = context.parameters.author
		var feedUrl = context.url

		var options = {
			butler: context.butler,
			linkifier: context.linkify,
			data: {}
		}

		function turnPostIntoRssItem(post) {
			var postUrl = dumbResolve(post.filename)
			return {
				title: post.metadata.title || post.filename,
				description: post.html,
				url: postUrl,
				// Because we're using an empty guid, post URLs must be unique!
				// guid: '',
				author: post.metadata.author || blogAuthor,
				date: post.metadata.date
			}
		}

		butler.getPosts({ mostRecent: 7 }, function(err, posts) {
			if (err) {
				cb(err)
			} else {
				var siteRootUrl = url.resolve(postUrlRoot, '')
				var rss = new Rss({
					title: blogTitle,
					feed_url: feedUrl,
					site_url: siteRootUrl,
					ttl: 12 * 60
				})

				var addToFeed = rss.item.bind(rss)

				posts.reverse()

				async.map(posts, function(post, cb) {
					render(templatePost, post, options, function(err, html) {
						if (!err) {
							post.html = html
							cb(null, post)
						} else {
							cb(err)
						}
					})
				}, function(err, posts) {
					if (err) {
						cb(err)
					} else {
						posts.map(turnPostIntoRssItem).forEach(addToFeed)
						cb(null, rss.xml())
					}
				})
			}
		})
	}
}
