var url = require('url')
var qs = require('querystring')
var request = require('request')
var async = require('async')
var tmp = require('text-metadata-parser')

var downloadAllFiles = function(root, file_names, cb) {
	async.map(file_names, function(name, mapResult) {
		var path = url.resolve(root, name)
		request(path, function(err, res, body) {
			mapResult(err, err || tmp(body))
		})
	}, cb)
}

var start = function(port) {
	var controls = {}
	require('http').createServer(function(req, res) {
		var parameters = qs.parse(url.parse(req.url).query)
		if (typeof parameters.index !== 'undefined'
				&& typeof parameters.root !== 'undefined') {
			console.log("Looking up " + parameters.index)
			request(parameters.index, function(error, response, body) {
				if (error) {
					console.log(error)
				} else {
					var post_files = JSON.parse(body)
					downloadAllFiles(parameters.root, post_files, function(err, results) {
						if (!err) {
							res.end(JSON.stringify(results))
						} else {
							res.end(err.message)
						}
					})
				}
			})
		}
	}).listen(port)
	return controls
}

module.exports = start