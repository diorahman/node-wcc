/**
 * Down is part of Wcc
 * Copyright (c) 2012 Dhi Aurrahman
 *
 * Wcc is freely distributable under the MIT license.
 *
 */

(function (exports) {
	
	var _ = require('underscore');
	var Buffers = require('buffers');
	var fs = require('fs');
	var https = require('https');
	var querystring = require('querystring');
	var config = require('konphyg')(__dirname + '/../config');
	
	var nokiaConfig = config('nokia');
	
	exports.download = function(options, callback){
		
		var params = {
			project : options.projectId,
			"pSet[os]=" : options.os,
			"pSet[qt]=" : options.qt,
		}
		
		var downloadPath = "/api/download" + "?" + querystring.stringify(params)
		
		var reqOpt = {
			host: nokiaConfig.apiUrl.split('/')[2],
			port: nokiaConfig.apiUrl.split('/')[0].indexOf('https') > -1 ? 443 : 80,
			path: downloadPath,
			method: 'GET',

			headers : {
				cookie : "qt-remote-tools-session-id=" + options.sessionId + "; path=/",
				'user-agent' : 'Mozilla/5.0'
			}
		}
		
		var req = https.request(reqOpt, function(res){

			if(res.statusCode == 200){

				var temp = res.headers['content-disposition'];
				var filename = temp.split("=")[1].substring(1, temp.split("=")[1].length - 1);
				
				var dest = options.destinationPath ? options.destinationPath : filename;
				
				var buff = new Buffers();

				res.on('data', function(d) {
				    buff.push(d);
				});

				res.on('end', function(){
					fs.writeFileSync(dest, buff.toBuffer(), 'binary');
					callback(null, filename)
				})

			}else{
				callback(new Error());
			}
		});

		req.end();

		req.on('error', function(e) {
		  callback(e);
		});
	}

}(typeof exports === 'undefined' ? this._ = {}: exports));