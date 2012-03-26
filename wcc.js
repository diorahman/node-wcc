/**
 * Wcc
 * Copyright (c) 2012 Dhi Aurrahman
 *
 * Wcc is freely distributable under the MIT license.
 *
 */

(function (exports) {
	
	var config = require('konphyg')(__dirname + '/config');
	var nimble = require('./lib/nimble');
	var req = require('./lib/req');
	var nokiaConfig = config('nokia');
	var _ = require('underscore');
	var fs = require('fs');
	var down = require('./lib/down');
	
	var stdGetOpt = {
		headers : {
			"Accept-Encoding":"gzip, deflate"
		}
	}
	
	var stdPostOpt = {
		method: 'POST',
		headers :{
			'Content-Type' : 'application/x-www-form-urlencoded'
		}
	}
	
	
	var WccError = function(msg){
		Error.call(this);
		Error.captureStackTrace(this, arguments.callee);
		this.message = msg;
		this.name = 'WccError';
	}
	
	WccError.prototype.__proto__ = Error.prototype;
		
	var parseFormSpecialId = function (content) {
        var fromStr = "name=\"lt\" type=\"hidden\" value=\"";
		var from = content.indexOf(fromStr) + fromStr.length;
		var length = content.indexOf("\"", from) - from;
		return content.substr(from, length);
    };

	var query = function(options){
		// should return query string based on build options, e.g. harmattan, symbian belle, etc
		return 0;
	}
	
	var setDefaultUserAgent = function(){
		_.extend(stdGetOpt.headers, {"User-Agent": "Mozilla/5.0 (AegisLabs; AegisLabs OS 1.0) AegisLabs/1.0"});
		_.extend(stdPostOpt.headers, {"User-Agent": "Mozilla/5.0 (AegisLabs; AegisLabs OS 1.0) AegisLabs/1.0"});
		_.extend(stdPostOpt, {nonBinary : true});
		
	}
	
	var blessWithSession = function(sessionId, opt){
		var _opt = opt;
		var blessings = {
			'Cookie' : 'qt-remote-tools-session-id='+ sessionId +';',
			'User-Agent' : 'Qt-Creator (Mac;2.4.0)'
		} 
		_.extend(_opt.headers, blessings);
		_.extend(_opt, {nonBinary : true})
		return _opt;
	}

	exports.ssoLogin = function(username, password, callback){
		
		var url = nokiaConfig.ssoUrl + nokiaConfig.ssoLoginEndpoint;
		
		setDefaultUserAgent();
		
		nimble.series([
			function(last, cb){
				req(url, function(err, data){
					if(err)
					return callback(new WccError('Failed to get valid qt-remote-tools-session-id, at first-step'))
					
					cb(null, data);
				})
			},
			function(last, cb){							
				stdPostOpt.body = 'username=' +   username + '&password=' + password + '&_rememberMe=off'
				stdPostOpt.headers['Cookie'] = last.cookie;
				req(url + '&lt=' + parseFormSpecialId(last.data), stdPostOpt, function(err, data){
					if(err)
					return callback(new WccError('Failed to get valid qt-remote-tools-session-id, at login-step'))
					
					cb(null, data)
				})
			},
			function(last, cb){
				stdGetOpt.headers['Cookie'] = last.cookie;
				req(last.data, stdGetOpt, function(err, data){
					if(err || !data.data) 
					return callback(new WccError('Failed to get valid qt-remote-tools-session-id, at last-step'))
					
					callback(null, {session : {id : data.cookie[0].split('=')[1].split(';')[0]}});
				})
			}
		]); 	
	}
	
	var prepareZip = function(){
		
	}
	
	var readZip = function(file, callback){
		var obj = {};
		fs.readFile(file, function(err, data){
			if(!err)
				_.extend(obj, {data : data, length: data.length});
				
			callback(err, obj)
		})
	}
	
	exports.build = function(options, callback){
		
		// TODO: additional options - fromZipFile, fromFolder, fromGist, fromGit
		
		nimble.series([
			function(last, cb){
				readZip(options.zipFile, function(err, obj){
					if(err) return callback(new WccError('Failed to read file (.zip)'));
					cb(null, obj);
				});
			},
			function(last, cb){
				
				var opt = blessWithSession(options.sessionId, stdPostOpt);
				
				_.extend(opt.headers, {
					'Content-type' : 'application/zip',
					'Content-length' : last.length,
					'Content-disposition' : 'attachment; filename=' + options.zipFile,
				});
				
				_.extend(opt,{
					body : last.data,
					nonBinary : false
				});

				var url = nokiaConfig.apiUrl + '/async-build.txt'
				
				// TODO: create a function to build query based on params
				url += '?';
				url = options.flag ? url + 'pSet[flag][0]=' + options.flag + '&' : url;
				url += 'pSet[os]='+ options.os + '&pSet[qt]='+ options.qt;
				
				req(url, opt, function(err, data){
					callback(err, {project : {id : data.data}});
				});
			}
		]);
	}
	
	exports.checkStatus = function(options, callback){
		
		var opt = blessWithSession(options.sessionId, stdGetOpt);
		
		var url = nokiaConfig.apiUrl + '/result?';
			url = options.flag ? url + 'pSet[flag][0]=' + options.flag + '&' : url;

			url += 'pSet[os]='+ options.os + '&pSet[qt]='+ options.qt;
			url += '&project=' + options.projectId;

			req(url, opt, function(err, data){
				callback(err, {buildStatus : JSON.parse(data.data)[0]});
			});
	}
	
	exports.download = function(options, callback){
		options.opt = blessWithSession(options.sessionId, stdGetOpt);
		down.download(options, callback);
	}
	
	exports.availableTargets = function(options, callback){
		var url = nokiaConfig.apiUrl + '/properties'
		req(url, blessWithSession(options.sessionId, stdGetOpt), function(err, data){
			if(err) return callback(new WccError('Failed to get available targets'))
			callback(null, JSON.parse(data.data));
		});
	}
	
}(typeof exports === 'undefined' ? this._ = {}: exports));