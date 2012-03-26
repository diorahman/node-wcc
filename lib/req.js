/**
 * Req
 * Copyright (c) 2012 Dhi Aurrahman
 * 
 * Req is freely distributable under the MIT license. 
 *
 * Req is the ugliest request wrapper, ever!
 *
 */

var http = require('http'),
	https = require('https'),
	zlib = require('zlib'),
	Buffers = require('buffers'),
	_ = require('underscore');
	
function Req(url, cfg, cb){
	if(!cb && typeof cfg === "function"){
		cb = cfg;
		cfg = {};
	}
		
	var l0 = url.split(':/'); 
	var l1 = url.split('://');
	
	var host = l0[1].split('/')[1],
		port = l0[0] == 'http' ? 80 : 443,
		path = l1[1].substring(l1[1].indexOf('/'), l1[1].length),
		path = path == host ? "/" : path,
		method = cfg.method ? "POST" : "GET",
		protocol = port == 80 ? http : https,
		headers = cfg.headers ? cfg.headers : {
			"Accept-Language":"en-us,en;q=0.5",
			"Accept-Encoding":"gzip, deflate",
			"Accept-Charset":"ISO-8859-1,utf-8;q=0.7,* ;q=0.7",
			"Connection":"keep-alive",
			"User-Agent": "Mozilla/5.0 (AegisLabs; AegisLabs OS 1.0) AegisLabs/1.0"
		}
		
		if(cfg.nonBinary){
			if(method == "POST" || method == "PUT") headers['Content-length'] = Buffer.byteLength(cfg.body, 'utf8');
		}
		
		var opt = {host: host, port: port, path: path, method: method, headers: headers}
		
		var r = protocol.request(opt, function(res){
			
			var cookie = res.headers['set-cookie'] ? res.headers['set-cookie'] : headers["Cookie"];
			var results = {status: res.statusCode, cookie: cookie}
			
			if(Math.floor(res.statusCode/100) > 3) return cb(new Error('HTTP Error, with status code: ' + res.statusCode))
			
			if(res.headers.location) {
				var location = (res.headers.location.indexOf('http') == -1) ? l0[0] + '://' + host + res.headers.location : res.headers.location;
				
				results.data = location
				
				if(cfg.headers)
				_.extend(results, {cookie: cfg.headers["Cookie"]});
				
				return cb(null, results);
			}else{
				
				var gzipped = (res.headers['content-encoding'] == 'gzip');
				var buffers = new Buffers();
				var data = '';
				
				res.on('data', function(chunk){
					if(gzipped){
						buffers.push(chunk);
					}else{
						data += chunk;
					}
				});

				res.on('end', function(){
					if(gzipped)
					zlib.gunzip(buffers.toBuffer(), function(err, raw){
						results.data = raw.toString();
						return cb(null, results);
					});
					else{
						results.data = data;
						return cb(null, results);
					}
				});	
			}
		});
		
		if(cfg.body) r.write(cfg.body);
		
		r.end();
}

if (typeof module !== 'undefined' && "exports" in module) {
  module.exports = Req;
}


