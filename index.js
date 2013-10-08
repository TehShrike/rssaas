var url = require('url')
var qs = require('querystring')
var async = require('async')
var rss = require('rss')
var tmp = require('text-metadata-parser')
var cacheGet = require('./cache.js')()

var downloadAllFiles = function(root, file_names, cb) {
	async.map(file_names, function(name, mapResult) {
		var path = url.resolve(root, name)
		cacheGet(path, function(err, body) {
			mapResult(err, err || tmp(body))
		})
	}, cb)
}

var buildRSSFeed = function(indexPath, results) {
	console.log(indexPath)
	console.log(results)
	// insert https://npmjs.org/package/rss here
	return results
}

var getRSSFeed = function(indexJsonPath, cb) {
	cacheGet(indexJsonPath, function(error, body) {
		if (error) {
			console.log(error)
		} else {
			var post_files = JSON.parse(body)
			downloadAllFiles(parameters.root, post_files, function(err, results) {
				if (!err) {
					results = buildRSSFeed(JSON.stringify(results))
				}

				cb(err, results)
			})
		}
	})
}

var start = function(port) {
	var controls = {}
	require('http').createServer(function(req, res) {
		var parameters = qs.parse(url.parse(req.url).query)
		if (typeof parameters.index !== 'undefined'
				&& typeof parameters.root !== 'undefined') {
			console.log("Looking up " + parameters.index)
			getRSSFeed(parameters.index, function(err, xml) {
				res.end(err || xml)
			})
		}
	}).listen(port)
	return controls
}

module.exports = start