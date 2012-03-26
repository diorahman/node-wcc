/*
	TODO:
		- test build symbian apps
			- symbianBelle
			- symbianAnna
			- self-signed
			- signed-with-custom-certificate
			- smart-installer 
				- self-signed
				- signed-with-custom-certificate

*/

var wcc = require('../wcc');
var should = require('should');

var sessionId = 'test';
var projectId = 'test';
var userName = 'replace-with-your-nokia-developer-user-name'; // join here: https://www.developer.nokia.com/Profile/Join.xhtml?locale=en
var password = 'replace-with-your-nokia-developer-user-password'

describe('Talking to service', function(){
	
	describe('#login()', function(){
		it('should login and return valid qt-remote-tools-session-id', function(done){
			wcc.ssoLogin(username, password, function(err, result){
				if(err) throw err
				sessionId = result.session.id;
				sessionId.length.should.equal(26);
				sessionId.should.not.equal('test');
				console.log('we received sessionId: ' + sessionId);
				done();
			});
		})
	});
	
	describe('#availableTargets()', function(){
		it('should return available targets', function(done){
			
			sessionId.should.not.equal('test');
			
			wcc.availableTargets({sessionId : sessionId}, function(err, result){
				if(err) throw err
				console.log(JSON.stringify(result));
				done();
			});
		})
	});
	
	describe('#buildHarmattan()', function(){
		it('should return valid project id', function(done){
			
			sessionId.should.not.equal('test');
			
			var options = {
				zipFile : __dirname + '/zipfiles/' + 'harmattan.zip',
				sessionId : sessionId,
				flag : 'debPkgUserDir',
				os : 'meego_1_2_harmattan',
				qt : '4_7_4'
			}
			
			wcc.build(options, function(err, result){
				if(err) throw err
				projectId = result.project.id;
				projectId.should.not.equal('test');
				console.log('we received projectId: ' + projectId);
				done();
			});
		})
	});
	
	describe('#checkStatusHarmattan()', function(){
		it('should return project\'s build status', function(done){
			
			projectId.should.not.equal('test');
			sessionId.should.not.equal('test');
			
			var options = {
				sessionId : sessionId,
				flag : 'debPkgUserDir',
				os : 'meego_1_2_harmattan',
				qt : '4_7_4',
				projectId : projectId
			}
			
			setTimeout(function(){
				wcc.checkStatus(options, function(err, result){
					if(err) throw err
					console.log('we received build status ('+ projectId +') : ' + result.buildStatus.status);
					console.log('pSet ('+ projectId +') : ' + JSON.stringify(result.buildStatus.pSet));
					console.log('log ('+ projectId +') : ' + JSON.stringify(result.buildStatus.log));
					
					done();
				});
			}, 5000);
			
		})
	});
	
	describe('#tryDownloadHarmattan()', function(){
		it('should return .deb filename', function(done){
			
			projectId.should.not.equal('test');
			sessionId.should.not.equal('test');
			
			var options = {
				// TODO: generate donwload path
				sessionId : sessionId,
				projectId : projectId,
				os : 'meego_1_2_harmattan',
				qt : '4_7_4'
			}
			
			wcc.download(options, function(err, result){
				if(err) throw err
				console.log('we received build status ('+ projectId +') : ' + result);
				done();
			});
			
		})
	});
	
	
})
