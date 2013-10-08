var request = require('request')

var httpGet = function(path, cb) {
	request(path, function(err, response, body) {
		cb(err, body)
	})
}

var cacheLookupFactory = function(interval, expiration) {
	var cache = {}

	var clearCache = function(path) {
		if (cache[path]) {
			clearTimeout(cache[path].timeoutId)
			delete cache[path]
		}
	}

	var refreshCache = function(path) {
		if (cache[path].expiration < Date.now()) {
			httpGet(path, function(err, body) {
				if (!err) {
					cache[path].body = body
				}
			})
		} else {
			clearCache(path)
		}
	}

	var setCache = function(path, body) {
		clearCache(path)
		cache[path] = {
			body: body,
			expiration: Date.now() + expiration,
			timeoutId: setInterval(refreshCache, interval, path)
		}
	}

	var touch = function(path) {
		cache[path].expiration = Date.now() + expiration
	}

	var getFromCache = function(path) {
		if (cache[path]) {
			touch(path)
			return cache[path].body
		}
	}

	return function lookup(path, cb) {
		var fromCache = getFromCache(path)
		if (fromCache) {
			cb(fromCache)
		} else {
			httpGet(path, function(err, body) {
				if (!err) {
					setCache(path, body)
				}

				cb(err, body)
			})				
		}
	}
}

module.exports = function createCache(refreshMinutes, expirationMinutes) {
	var multiplier = 60 * 1000;
	return cacheLookupFactory((refreshMinutes || 60) * multiplier, 
		(expirationMinutes || 6 * 60) * multiplier)
}
