var express = require('express')
	, http = require('http')
	, path = require('path')
	, cookieParser = require('cookie-parser')
	, bodyParser = require('body-parser')
	, fs = require('fs')
	, os = require('os')

global.config = require('./config.js');
global.util = require('./objects/util');
global.colors = require('colors/safe');
global.bluebird = require('bluebird');
global.debug = require('debug')('debug');
global.clientSocket = {};
global.memory = {};

var memoryStart = os.freemem();

//## - - - - Initial Application - - - - ##//
var app = express();
app.set('port', config.port);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public'), { maxAge: config.maxAge1Y }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

memory.loaded = {
	systemData: false,
	systemAccessData: false,
	memberData: false,
	i18nData: false,
	screenMapping: false,
	companyData: false
} // เมื่อโหลดข้อมูลต่างๆ เสร็จ ตัวแปรนี้จะโดนลบออก
memory.ready = false; // เมื่อโหลดข้อมูลต่างๆ เสร็จ ตัวแปรนี้จะโดนลบออก

var initial = require('./objects/initial');
initial.loadMemberData();
initial.loadSystemData();
initial.loadSystemAccessData();
initial.loadi18nData();
initial.loadScreenMappingData();
initial.loadCompanyData();
checkDataReady(); // ตรวจสอบว่าทำการโหลดข้อมูลจากฐานข้อมูลทั้งหมดว่าเสร็จหรือยัง

//## - - - - Start Application - - - - ##//
var server = http.createServer(app);
server.listen(app.get('port'), function(){
	console.log(util.dateFormat('DDMMYY hh:mm:ss')+' : '+colors.bold.magenta(config.systemName)+colors.green(' System Start (on port ') + colors.red.bold(app.get('port')) + colors.green(')'));
});


//## - - - - HTTP GET - - - - ##//
app.get('*', function(req, res) {
	//res.setHeader('Node', 'Panache');
	//res.send(req.url);
	res.redirect('https://github.com/RemaxThailand/Socket/wiki');
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
				try { systemId = memory.system.origin[req.headers.referer] } 
				catch(err) {
					res.json({ success: false, module: data.module, action: data.action, 
						error: 'APP0001', errorMessage: util.i18n('en', 'This operation is not allowed for')+' origin '+req.headers.referer,
						info: { ip: req.headers['x-real-ip'],userAgent: req.headers.user-agent,referer: req.headers.referer }
					});
				}
			}
		}
		else {
			try { systemId = memory.system.key[req.body.apiKey] }
			catch(err) {
				res.json({ success: false, module: data.module, action: data.action, 
					error: 'APP0002', errorMessage: util.i18n('en', 'This operation is not allowed for')+' API Key '+req.body.apiKey,
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
			try { allow = memory.systemAccess[systemId+'-'+data.module+'-'+data.action] } catch(err) {}
			if ( allow ) {
				fs.exists('./objects/'+data.module+'.js', function (exists) {
					if (!exists) {
						res.json({ success: false, error: 'APP0003', errorMessage: 'Module "'+data.module+ '" ' + util.i18n('en', 'is not implemented')});
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
				res.json({ success: false, error: 'APP0004', errorMessage: 'Module "'+data.module+'" and Action "'+data.action+'" of '+memory.system[systemId].name + ' ' + util.i18n('en', 'is not allow')});
			}
		}
		else {
			res.json({ success: false, error: 'APP0005', errorMessage: util.i18n('en', 'Out of Service')});
		}
		/* - - - ตรวจสอบสิทธิ์การเรียกใช้ Module ต่างๆ ใน API - - - */
	}
	else {
		res.json({ success: false, error: 'APP0006', errorMessage: util.i18n('en', 'Module and Action is blank')});
	}
});

function checkDataReady(){
	if (!memory.ready)
	{
		setTimeout(function(){
			checkDataReady();
		}, 500);
	}
	else {
		console.log(util.dateFormat('DDMMYY hh:mm:ss')+' : '+colors.bold.magenta('Memory Used ')+colors.green(((memoryStart-os.freemem())/1048576).toFixed(2))+' Mb');
		delete memoryStart;
		delete memory.ready;
		startSocketServer();
	}
}

//## - - - - Socket.IO - - - - ##//
function startSocketServer(){
	debug(colors.bold.magenta('Socket.IO')+colors.green(' Start'));

	global.io = require('socket.io').listen(server);
	io.on('connection', function(socket) {

		// ถ้า Client Connect มาใหม่
		util.responseToAllClient('online', {
			count: Object.keys(io.sockets.connected).length
		});
		debug(colors.green('Online : ') + colors.red.bold(Object.keys(io.sockets.connected).length));
		util.responseToSender(socket, 'requestToken', {});
		initial.addUser(socket);

		// ถ้า Client Disconnect ออกไป
		socket.on('disconnect', function() {
			util.responseToAllClient('online', {
				count: Object.keys(io.sockets.connected).length
			});
			debug(colors.yellow('disconnected') + colors.green(' - online : ') + colors.red.bold(Object.keys(io.sockets.connected).length));
			if (clientSocket[socket.id].isServer) {
				util.responseToAllClientInRoom('client-system-'+clientSocket[socket.id].systemId, 'server-down', {});
			}
			else {
				/*if (clientSocket[socket.id].id != undefined) {
					memory.member[data.session.companyId][clientSocket[socket.id].id].sessionList = util.removeArray(memory.member[data.session.companyId][clientSocket[socket.id].id].sessionList, socket.id);
				}*/
			}
			delete clientSocket[socket.id];
		});

		socket.on('setLocale', function(data) {
			initial.setLocale(socket, data.local);
		});

		socket.on('registerServer', function(data) {
			try {
				clientSocket[socket.id].systemId = memory.system.key[data.apiKey];
				clientSocket[socket.id].isServer = true;
				util.responseToAllClientInRoom('client-system-'+clientSocket[socket.id].systemId, 'server-reload', {});
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
					clientSocket[socket.id].companyId = token.companyId;
							
					// Company
					socket.join('company-'+token.companyId);
					// Member
					var memberRoom = 'company-'+token.companyId+'-member-'+token.id;
					socket.join(memberRoom);

					var room = io.sockets.adapter.rooms[memberRoom];
					if (room.length > 1) {
						util.responseToAllClientInRoomExceptSender(socket, memberRoom, 'alert-login', {});
					}

					//if (memory.member[data.session.companyId][token.id].sessionList == undefined) memory.member[data.session.companyId][token.id].sessionList = [];
					//memory.member[data.session.companyId][token.id].sessionList.push(socket.id);
					//util.alertMultipleLogin(token.id, socket.id);
				}
				else {
					util.responseToSender(socket, name, { success: false });
					util.responseToSender(socket, 'logout', {});
				}
			} catch (err) {
				console.log(err);
				util.responseToSender(socket, name, { success: false });
				util.responseToSender(socket, 'logout', {});
			}
		});

		socket.on('api', function(data) {
			var name = 'api-'+data.module+'-'+data.action;
			var systemId = null;

			if ( data.apiKey == undefined ) {
				if ( socket.handshake.headers['origin'] != undefined ) { // ถ้าเข้าระบบโดยใช้ Browser
					try { systemId = memory.system.origin[socket.handshake.headers['origin']] } 
					catch(err) {
						util.responseError(socket, name, {action: name, error: 'APP0001', errorMessage: util.i18n(clientSocket[socket.id].local, 'This operation is not allowed for')+' origin '+socket.handshake.headers['origin'],
								info: {ip: socket.handshake.headers['x-real-ip'],userAgent: socket.handshake.headers['user-agent'],referer: socket.handshake.headers['referer']}
						});
					}
				}
			}
			else {
				try { systemId = memory.system.key[data.apiKey] }
				catch(err) {
					util.responseError(socket, name, {action: name, error: 'APP0002', errorMessage: util.i18n(clientSocket[socket.id].local, 'This operation is not allowed for')+' API Key '+data.apiKey,
							info: {ip: socket.handshake.headers['x-real-ip']}
					});
				}
			}

			if ( systemId != null ) {
				data.systemId = systemId;
				
				// System
				socket.join('system-'+data.systemId);
				// Client's System
				socket.join('client-system-'+data.systemId);

				if (clientSocket[socket.id].companyId == undefined) clientSocket[socket.id].companyId = memory.system[systemId].company;
				data.command = 'sp_SystemAccessCallCount \''+systemId+'\', \''+data.module+'\', \''+data.action+'\'';
				util.execute(data);
				var allow = false;
				try { allow = memory.systemAccess[systemId+'-'+data.module+'-'+data.action] } catch(err) {}
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
				util.responseError(socket, name, {action: name, error: 'APP0005', errorMessage: util.i18n(clientSocket[socket.id].local, 'Out of Service'),
						info: {ip: socket.handshake.headers['x-real-ip']}
				});
			}

		});

	});
}
