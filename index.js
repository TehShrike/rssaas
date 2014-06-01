var url = require('url')
var Rss = require('rss')
var getPostHtml = require('noddity-renderer').makeHtmlFromPost
var async = require('async')

module.exports = function getRssFeedXml(context, cb) {
	if (typeof context.parameters.title === 'undefined') {
		cb(new Error("'title' must be provided"))
	} else if (typeof context.parameters.author === 'undefined') {
		cb(new Error("'author' must be provided"))
	} else {
		var butler = context.butler
		var postUrlRoot = context.postUrlRoot
		var dumbResolve = context.resolvePost
		var blogTitle = context.parameters.title
		var blogAuthor = context.parameters.author
		var feedUrl = context.url
		var linkify = context.linkify

		function turnPostIntoRssItem(post) {
			var postUrl = dumbResolve(post.filename)
			return {
				title: post.metadata.title || post.filename,
				description: post.html,
				url: postUrl,
				// Post URLs must be unique!
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
					getPostHtml(butler.getPost, linkify, post, {
						pathPrefix: context.parameters.postUrlRoot,
						title: post.metadata.title
					}, function(err, html) {
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
