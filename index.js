const url = require('url')
const Rss = require('rss')
const promiseMap = require('p-map')
const denodeify = require('then-denodeify')
const render = denodeify(require('noddity-render-static'))

const templatePost = {
	name: 'template',
	metadata: {
		title: 'RSS Template',
		markdown: false
	},
	content: '{{>current}}'
}

module.exports = function getRssFeedXml(context, cb) {
	if (typeof context.parameters.title === 'undefined') {
		cb(new Error(`'title' must be provided`))
	} else if (typeof context.parameters.author === 'undefined') {
		cb(new Error(`'author' must be provided`))
	} else {
		const {
			butler,
			parameters,
			resolvePost,
			url: feedUrl,
			linkify
		} = context

		const {
			postUrlRoot,
			title: blogTitle,
			author: blogAuthor
		} = parameters

		const options = {
			butler,
			linkifier: linkify,
			data: {}
		}

		const getPosts = denodeify(butler.getPosts)

		function turnPostIntoRssItem(post) {
			const postUrl = resolvePost(post.filename)
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

		getPosts({ mostRecent: 7 }).then(posts => {
			const siteRootUrl = url.resolve(postUrlRoot, '')
			const rss = new Rss({
				title: blogTitle,
				feed_url: feedUrl,
				site_url: siteRootUrl,
				ttl: 12 * 60
			})

			const addToFeed = rss.item.bind(rss)

			posts.reverse()

			promiseMap(posts, post => {
				return render(templatePost, post, options).then(html => {
					post.html = html
					return post
				})
			}).then(posts => {
				posts.map(turnPostIntoRssItem).forEach(addToFeed)
				cb(null, rss.xml())
			}).catch(err => {
				cb(err)
			})
		})

	}
}
