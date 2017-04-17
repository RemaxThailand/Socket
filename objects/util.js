exports.responseToSocketId = function(id, name, data) {
	io.sockets.connected[id].emit(name, data);
}

exports.responseToSender = function(socket, name, data) {
	socket.emit(name, data);
}

exports.responseToSenderInRoom = function(socket, room, name, data) {
	socket.to(room).emit(name, data);
}

exports.responseToAllClient = function(name, data) {
	io.emit(name, data);
}

exports.responseToAllClientInRoom = function(room, name, data) {
	io.in(room).emit(name, data);
}

exports.responseToAllClientExceptSender = function(socket, name, data) {
	socket.broadcast.emit(name, data);
}

exports.responseToAllClientExceptSenderInRoom = function(socket, room, name, data) {
	socket.broadcast.to(room).emit(name, data);
}

exports.responseError = function(socket, name, data) {
	if (config.devMode) console.log('Action '+ colors.bold.magenta(data.action.toUpperCase()) + colors.red.bold(' : Error '+data.error) + colors.yellow.bold(' - '+data.errorMessage));
	exports.responseToSender(socket, name, { success: false, action: data.action, error: data.error, errorMessage: data.errorMessage });
	exports.responseToAllClientExceptSender(socket, 'systemError', { error: data.error, errorMessage: data.errorMessage, info: data.info });
}

/*
exports.getDataKey = function(callback, socket, name, data, key) {
	var client = require('redis').createClient(config.redis);
	client.on('error', function(err) {
		util.responseToAllClientExceptSender(socket, 'systemError', { error: 'Connect Database : redisHGetAll', errorMessage: err.message, info: err });
	});
	client.hgetall(key, function (err, obj) {
		client.end(true);
		if (!err) {
			callback(socket, name, data, obj);
		}
		else {
			util.responseToAllClientExceptSender(socket, 'systemError', { error: 'Get Data : redisHGetAll', errorMessage: err.message, info: err });
			callback(socket, name, null);
		}
	});
}*/

exports.jwtSign = function(callback, key, data) {
	callback(data, require('jsonwebtoken').sign(data.token, key));
}

/*exports.query = function(callback, socket, name, data){
    var sql = require('mssql');
    var connection = new sql.Connection(config.mssql, function(err) {
        var request = new sql.Request(connection);
        request.query(data.command, function(err, recordset, returnValue) {
            if (!err) {
				connection.close();
                callback(socket, name, data, recordset);
			}
			else {
				util.responseToAllClientExceptSender(socket, 'systemError', { error: 'MSSQL Query', errorMessage: err.message, info: err.stack });
			}
		});
	});
}*/

exports.query = function(callback, data){
    var sql = require('mssql');
    var connection = new sql.Connection(config.mssql, function(err) {
        var request = new sql.Request(connection);
        request.query(data.command, function(err, recordset, returnValue) {
            if (!err) {
				connection.close();
                callback(recordset, data);
			}
			else {
				if (data.socket != undefined) util.responseToAllClientExceptSender(data.socket, 'systemError', { error: 'MSSQL Query', errorMessage: err.message, info: err.stack });
				console.log(colors.yellow('Query ')+colors.cyan(data.command)+' : ' + colors.bold.red('Error '+err.message));
			}
		});
	});
}

exports.queryMultiple = function(callback, data){
	var sql = require('mssql');
    var connection = new sql.Connection(config.mssql, function(err) {
        var request = new sql.Request(connection);
		request.multiple = true;
        request.query(data.command, function(err, recordset, returnValue) {
            if (!err) {
				connection.close();
                callback(recordset, data);
			}
			else {
				if (data.socket != undefined) util.responseToAllClientExceptSender(data.socket, 'systemError', { error: 'MSSQL Query', errorMessage: err.message, info: err.stack });
				console.log(colors.yellow('Query ')+colors.cyan(data.command)+' : ' + colors.bold.red('Error '+err.message));
			}
		});
	});
}

exports.execute = function(data){
    var sql = require('mssql');
    var connection = new sql.Connection(config.mssql, function(err) {
        var request = new sql.Request(connection);
        request.query(data.command, function(err, recordset, returnValue) {
            if (!err) {
				connection.close();
			}
			else {
				if (data.socket != undefined) util.responseToAllClientExceptSender(data.socket, 'systemError', { error: 'MSSQL Query', errorMessage: err.message, info: err.stack });
				console.log(colors.yellow('Query ')+colors.cyan(data.command)+' : ' + colors.bold.red('Error '+err.message));
			}
		});
	});
}

exports.encrypt = function(text, password) {
	try {
		var crypto = require('crypto');
		var cipher = crypto.createCipher(config.crypto.algorithm, password);
		return cipher.update(text, 'utf8', 'hex') + cipher.final('hex');
	}
	catch(err) {
		return null;
	}
};

exports.decrypt = function(encrypted, password) {
	try {
		var crypto = require('crypto');
		var decipher = crypto.createDecipher(config.crypto.algorithm, password);
		return decipher.update(encrypted, 'hex', 'utf8') + decipher.final('utf8');
	}
	catch(err) {
		return null;
	}
};

exports.completeRequiredFields = function(data, fields) {
	var field = '';
	for(i=0; i<fields.length; i++) {
		if (data[fields[i]] == undefined || data[fields[i]] == '') {
			field = fields[i];
			break;
		}
	}
	return field;
}

exports.i18nAdd = function(system, local, message) {
	require('./system').i18nUpdate({
		system: system,
		from: 'en',
		message: message,
		systemId: 'S0000',
		to: 'th|ja|lo|zh-CN'
	});
}

exports.i18n = function(local, message) {
	if ( memory.i18n['common'][local][message] == undefined ) {
		this.i18nAdd('common', 'en', message);
		return message;
	}
	else return memory.i18n['common'][local][message];
}

/*exports.translateList = function(local, list) {
	var roleList = [];
	for(i=0; i<list.length; i++){
		roleList.push({
			key: list[i],
			value: util.i18n(local, 'role-'+list[i])
		});
	}
	return roleList;
}*/

exports.translateRoleList = function(local, list) {
	var roleList = [];
	for(i=0; i<list.length; i++){
		roleList.push({
			role: list[i],
			text: util.i18n(local, 'role-'+list[i])
		});
	}
	return roleList;
}

exports.translateScreen = function(local, list) {
	var group = {}
	for(i=0; i<list.length; i++){
		if ( group[list[i].screenGroup] == undefined ) group[list[i].screenGroup] = {};
		if ( group[list[i].screenGroup].name == undefined ) group[list[i].screenGroup].name =  this.i18n(local, 'screen-'+list[i].screenGroup);
		if ( group[list[i].screenGroup].list == undefined ) group[list[i].screenGroup].list = [];
		list[i].name = this.i18n(local, 'screen-'+list[i].screen);
		var screenGroup = list[i].screenGroup;
		delete list[i].screenGroup;
		group[screenGroup].list.push(list[i]);
	}
	return group;
}

exports.removeArray = function(array, message) {
	for(i=0; i<array.length; i++){
		if (array[i] == message) {
			array.splice(i,1);
			break;
		}
	}
	return array;
}

exports.emitToMemberId = function(id, name, data) {
	if (memory.member.id[id].sessionList != undefined) {
		for(i=0; i<memory.member.id[id].sessionList.length; i++){
			this.responseToSocketId(memory.member.id[id].sessionList[i], name, data);
		}
	}
}

exports.emitToMemberIdExceptSender = function(id, senderId, name, data) {
	if (memory.member.id[id].sessionList != undefined) {
		for(i=0; i<memory.member.id[id].sessionList.length; i++){
			if (senderId != memory.member.id[id].sessionList[i]) {
				this.responseToSocketId(memory.member.id[id].sessionList[i], name, data);
			}
		}
	}
}

exports.alertMultipleLogin = function(id, senderId) {
	if (memory.member.id[id].sessionList.length > 1 && !memory.member.id[id].allowMultipleLogin) {
		this.emitToMemberIdExceptSender(id, senderId, 'alert-login', {});
	}
}


exports.translate = function(callback, to, data){
	var http = require('https');
	http.get('https://translate.googleapis.com/translate_a/single?client=gtx&sl='+data.from+'&tl='+to+'&dt=t&q='+data.message, function(res) {
		var body = '';
		res.setEncoding('utf8');
		res.on('data', function(chunk) {
			body += chunk;
		});
		res.on('end', function() {
			var json = JSON.parse(body);
			callback(to, json[0][0][0], data);
		});
	});
}