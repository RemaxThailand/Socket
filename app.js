var express = require('express')
	, http = require('http')
	, path = require('path')
	, cookieParser = require('cookie-parser')
	, bodyParser = require('body-parser') // POST Parameter Data
	, fs = require('fs')

global.config = require('./config.js');
global.util = require('./objects/util');
global.colors = require('colors/safe');
global.bluebird = require("bluebird");
global.clientSocket = {};
global.memory = {};


//## - - - - Initial Application - - - - ##//
var app = express();
app.set('port', config.port);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public'), { maxAge: config.maxAge1Y }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


memory.status = {
	loadedSystemData: false,
	loadedSystemAccessData: false,
	loadedMemberData: false,
	loadedi18nData: false,
	loadedScreenMapping: false
}

//## - - - - HTTP GET - - - - ##//
app.get('*', function(req, res) {
	var url = req.url.split('/');
	url = url.filter(function(n){ return n !== ''; });
	if (url.length == 0) url[0] = '';

	if (url[0] == 'database') {
		if (url[1] == 'update') {
			if (url[2] == 'i18n') {
				var translate = require('google-translate-api');

				translate('Welcome', {from: 'en', to: 'zh-CN'}).then(data => {
					res.send(data.text);
				}).catch(err => {
					console.error(err);
				});
			}
		}
	}
	else {
		i18n.setLocale('th');
		res.send(i18n.__('Hello'));
	}
});



//## - - - - HTTP POST - - - - ##//
app.post('*', function(req, res) {
	var data = req.body; // รับค่าที่มีการ Post มา

	// แยก Url ที่เรียกมา
	var url = req.url.split('/');
	url = url.filter(function(n){ return n !== ''; });

	if(url.length >= 2) {
		/* - - - ตรวจสอบ URL (โดยต้องกรอก Url มาอย่างน้อย 2 ชั้น เช่น /module/action ) - - - */
		data.module = url[0];
		data.action = url[1];
		delete url[0];
		delete url[1];
		data.url = url.filter(function(n){ return n !== ''; });
		delete url;
		/* - - - ตรวจสอบ URL - - - */

		/* - - - ค้นหา ID ของระบบที่เรียกมา - - - */
		var systemId = null;
		if ( req.body.apiKey == undefined ) {
			if ( req.headers.referer != undefined ) { // ถ้าเข้าระบบโดยใช้ Browser
				try { systemId = memory.system.origin[req.headers.referer].id } 
				catch(err) {
					res.json({ success: false, module: data.module, action: data.action, 
						error: 'APP0001', errorMessage: i18n.__('This operation is not allowed for')+' origin '+req.headers.referer,
						info: { ip: req.headers['x-real-ip'],userAgent: req.headers.user-agent,referer: req.headers.referer }
					});
				}
			}
		}
		else {
			try { systemId = memory.system.key[req.body.apiKey].id }
			catch(err) {
				res.json({ success: false, module: data.module, action: data.action, 
					error: 'APP0002', errorMessage: i18n.__('This operation is not allowed for')+' API Key '+req.body.apiKey,
					info: {ip: req.headers['x-real-ip']}
				});
			}
		}
		/* - - - ค้นหา ID ของระบบที่เรียกมา - - - */

		/* - - - ตรวจสอบสิทธิ์การเรียกใช้ Module ต่างๆ ใน API - - - */
		if ( systemId != null ) {
			data.systemId = systemId;
			data.command = 'sp_SystemAccessCallCount \''+systemId+'\', \''+data.module+'\', \''+data.action+'\'';
			util.execute(data);
			var allow = false;
			try { allow = memory.systemAccess[systemId+'-'+data.module+'-'+data.action].allow } catch(err) {}
			if ( allow ) {
				fs.exists('./objects/'+data.module+'.js', function (exists) {
					if (!exists) {
						res.json({ success: false, error: 'APP0003', errorMessage: 'Module "'+data.module+ '" ' + i18n.__('is not implemented')});
					}
					else {
						data.req = req;
						data.res = res;
						delete req;
						delete res;
						require('./objects/' + data.module).action(data);
					}
				});
			}
			else {
				res.json({ success: false, error: 'APP0004', errorMessage: 'Module "'+data.module+'" and Action "'+data.action+'" of '+memory.system[systemId].name + ' ' + i18n.__('is not allow')});
			}
		}
		else {
			res.json({ success: false, error: 'APP0005', errorMessage: i18n.__('Out of Service')});
		}
		/* - - - ตรวจสอบสิทธิ์การเรียกใช้ Module ต่างๆ ใน API - - - */
	}
	else {
		res.json({ success: false, error: 'APP0006', errorMessage: i18n.__('Module and Action is blank')});
	}
});



//## - - - - Start Application - - - - ##//
var server = http.createServer(app);
server.listen(app.get('port'), function(){
	console.log(colors.bold.magenta(config.systemName)+colors.green(' System Start (on port ') + colors.red.bold(app.get('port')) + colors.green(')'));
});


//## - - - - Socket.IO - - - - ##//

var initial = require('./objects/initial');
bluebird.bind({}).then(function() {
	initial.loadMemberData();
}).then(function() {
	initial.loadSystemData();
}).then(function() {
	initial.loadSystemAccessData();
}).then(function() {
	initial.loadi18nData();
}).then(function() {
	initial.loadScreenMappingData();
}).then(function() {

	global.io = require('socket.io').listen(server);

	io.on('connection', function(socket) {

		if ( memory.online == undefined ) memory.online = {}
		if ( memory.online.server == undefined ) memory.online.server = 0;
		if ( memory.online.user == undefined ) memory.online.user = 0;

		// ถ้า Client Connect มาใหม่
		util.responseToAllClient('online', {
			count: Object.keys(io.sockets.connected).length
		});
		if (config.devMode) console.log(colors.green('Online : ') + colors.red.bold(Object.keys(io.sockets.connected).length));
		if (memory.status.loadedMemberData) util.responseToSender(socket, 'requestToken', {});
		else {
			setTimeout(function(){ util.responseToSender(socket, 'requestToken', {}); }, 5000);
		}
		util.responseToAllClient('reload-io', {});
		initial.addUser(socket);

		socket.on('connect', function() {
		});

		// ถ้า Client Disconnect ออกไป
		socket.on('disconnect', function() {
			util.responseToAllClient('online', {
				count: Object.keys(io.sockets.connected).length
			});
			if (config.devMode) console.log(colors.green('disconnected - online : ') + colors.red.bold(Object.keys(io.sockets.connected).length));
			if (clientSocket[socket.id].isServer) {
				util.responseToAllClient('server-down-'+clientSocket[socket.id].systemId, {});
			}
			else {
				if (clientSocket[socket.id].id != undefined) {
					memory.member.id[clientSocket[socket.id].id].sessionList = util.removeArray(memory.member.id[clientSocket[socket.id].id].sessionList, socket.id);
				}
			}
			delete clientSocket[socket.id];
		});

		socket.on('setLocale', function(data) {
			initial.setLocale(socket, data.local);
		});

		socket.on('registerServer', function(data) {
			try {
				clientSocket[socket.id].systemId = memory.system.key[data.apiKey].id;
				clientSocket[socket.id].isServer = true;
				if ( memory.online.server == undefined ) memory.online.server = 0;
				memory.online.server++;
				util.responseToAllClient('reload-'+memory.system.key[data.apiKey].id, { success: true });
			}
			catch(err) {
				console.log(err);
			}
		});

		socket.on('checkToken', function(data) {
			var name = 'checkToken';
			try {
				var token = require('jsonwebtoken').verify(data.token, config.crypto.password);
				var success = token.userAgent == socket.handshake.headers['user-agent'];
				util.responseToSender(socket, name, { success: success });
				if (success) {
					clientSocket[socket.id].id = token.id;
					if (memory.member.id[token.id].sessionList == undefined) memory.member.id[token.id].sessionList = [];
					memory.member.id[token.id].sessionList.push(socket.id);
					util.alertMultipleLogin(token.id, socket.id);
				}
				else {
					if(memory.status.loadedMemberData) util.responseToSender(socket, 'logout', { access: false });
					else util.responseToSender(socket, 'requestToken', {});
				}
			} catch (err) {
				util.responseToSender(socket, name, { success: false });
				if(memory.status.loadedMemberData) util.responseToSender(socket, 'logout', { access: false });
				else util.responseToSender(socket, 'requestToken', {});
			}
			//initial.setLocale(redisClient, socket, data.local);
		});

		socket.on('api', function(data) {
			var name = 'api-'+data.module+'-'+data.action;
			var systemId = null;

			if ( data.apiKey == undefined ) {
				if ( socket.handshake.headers['origin'] != undefined ) { // ถ้าเข้าระบบโดยใช้ Browser
					try { systemId = memory.system.origin[socket.handshake.headers['origin']].id } 
					catch(err) {
						util.responseError(socket, name, {action: name, error: 'APP0001', errorMessage: clientSocket[socket.id].i18n.__('This operation is not allowed for')+' origin '+socket.handshake.headers['origin'],
								info: {ip: socket.handshake.headers['x-real-ip'],userAgent: socket.handshake.headers['user-agent'],referer: socket.handshake.headers['referer']}
						});
					}
				}
			}
			else {
				try { systemId = memory.system.key[data.apiKey].id }
				catch(err) {
					util.responseError(socket, name, {action: name, error: 'APP0002', errorMessage: clientSocket[socket.id].i18n.__('This operation is not allowed for')+' API Key '+data.apiKey,
							info: {ip: socket.handshake.headers['x-real-ip']}
					});
				}
			}

			if ( systemId != null ) {
				data.systemId = systemId;
				data.command = 'sp_SystemAccessCallCount \''+systemId+'\', \''+data.module+'\', \''+data.action+'\'';
				util.execute(data);
				var allow = false;
				try { allow = memory.systemAccess[systemId+'-'+data.module+'-'+data.action].allow } catch(err) {}
				if ( allow ) {
					fs.exists('./objects/'+data.module+'.js', function (exists) {
						if (!exists) {
							util.responseError(socket, name, {action: name, error: 'APP0003', errorMessage: 'Module "'+data.module+ '" ' + util.i18n(clientSocket[socket.id].local, 'is not implemented'),
									info: {ip: socket.handshake.headers['x-real-ip']}
							});
						}
						else {
							data.socket = socket;
							data.socketName = name;
							data.session = clientSocket[socket.id];
							delete socket;
							delete name;
							require('./objects/' + data.module).action(data);
						}
					});
				}
				else {
					util.responseError(socket, name, {action: name, error: 'APP0004', errorMessage: 'Module "'+data.module+'" '+util.i18n(clientSocket[socket.id].local, 'and')+' Action "'+data.action
							+'" '+util.i18n(clientSocket[socket.id].local, 'of')+' '+memory.system[systemId].name + ' ' + util.i18n(clientSocket[socket.id].local, 'is not allow'),
							info: {ip: socket.handshake.headers['x-real-ip']}
					});
				}
			}
			else {
				util.responseError(socket, name, {action: name, error: 'APP0005', errorMessage: i18n.__('Out of Service'),
						info: {ip: socket.handshake.headers['x-real-ip']}
				});
			}

		});

	});

});
