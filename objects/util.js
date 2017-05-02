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

exports.responseToAllClientInRoomExceptSender = function(socket, room, name, data) {
	socket.broadcast.to(room).emit(name, data);
}

exports.responseToAllClientExceptSender = function(socket, name, data) {
	socket.broadcast.emit(name, data);
}

exports.responseToAllClientExceptSenderInRoom = function(socket, room, name, data) {
	socket.broadcast.to(room).emit(name, data);
}

exports.responseError = function(socket, name, data) {
	console.error('Action '+ colors.bold.magenta(data.action.toUpperCase()) + colors.red.bold(' : Error '+data.error) + colors.yellow.bold(' - '+data.errorMessage));
	exports.responseToSender(socket, name, { success: false, action: data.action, error: data.error, errorMessage: data.errorMessage });
	exports.responseToAllClientExceptSender(socket, 'systemError', { error: data.error, errorMessage: data.errorMessage, info: data.info });
}

exports.jwtSign = function(callback, key, data) {
	callback(data, require('jsonwebtoken').sign(data.token, key));
}

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

exports.execute = function(data, callback){
    var sql = require('mssql');
    var connection = new sql.Connection(config.mssql, function(err) {
        var request = new sql.Request(connection);
        request.query(data.command, function(err, recordset, returnValue) {
            if (!err) {
				connection.close();
				if (callback != undefined) callback(data);
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

exports.i18nAdd = function(system, message) {
	require('./system').i18nUpdate({
		system: system,
		from: 'en',
		message: message,
		systemId: 'S0000'
	});
}

exports.i18n = function(local, message) {
	if ( memory.i18n['common'][local][message] == undefined ) {
		this.i18nAdd('common', message);
		return message;
	}
	else return memory.i18n['common'][local][message];
}

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
		group[list[i].screenGroup].list.push(list[i]);
	}
	return group;
}

exports.translateMemberType = function(local, list) {
	var result = [];
	for(i=0; i<list.length; i++){
		result.push({
			id: list[i],
			name: this.i18n(local, 'role-'+list[i])
		});
	}
	return result;
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
	if (memory.member[data.session.companyId][id].sessionList != undefined) {
		for(i=0; i<memory.member[data.session.companyId][id].sessionList.length; i++){
			this.responseToSocketId(memory.member[data.session.companyId][id].sessionList[i], name, data);
		}
	}
}

exports.emitToMemberIdExceptSender = function(id, senderId, name, data) {
	if (memory.member[data.session.companyId][id].sessionList != undefined) {
		for(i=0; i<memory.member[data.session.companyId][id].sessionList.length; i++){
			if (senderId != memory.member[data.session.companyId][id].sessionList[i]) {
				this.responseToSocketId(memory.member[data.session.companyId][id].sessionList[i], name, data);
			}
		}
	}
}

exports.alertMultipleLogin = function(id, senderId) {
	if (memory.member[data.session.companyId][id].sessionList.length > 1 && !memory.member[data.session.companyId][id].allowMultipleLogin) {
		this.emitToMemberIdExceptSender(id, senderId, 'alert-login', {});
	}
}


exports.translate = function(callback, to, data){
	var http = require('https');
	http.get(config.translateUrl+'sl='+data.from+'&tl='+to+'&dt=t&q='+data.message, function(res) {
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

exports.setLoaded = function(name) {
	if (memory.ready != undefined) {
		try { delete memory.loaded[name] } catch (err) {}
		memory.ready = Object.keys(memory.loaded).length == 0;
		if (memory.ready) delete memory.loaded;
	}
}

exports.dateFormat = function(format) {
	return require('moment')().format(format);
}

exports.memberTypeMenu = function(companyId, role, systemId, local) {
	if ( memory.screen[companyId][role][systemId] != undefined ) {
		var screen = memory.screen[companyId][role][systemId];

		// กลุ่มของเมนู
		var result = [];
		Object.keys(screen).forEach(function(key) {
			result.push({
				group: key,
				index: screen[key].index,
				name: util.i18n(local, 'screen-'+key),
				child: []
			});
		});
		// เรียงลำดับกลุ่มขอเมนู
		var sortBy = require('sort-array');
		result = sortBy(result, ['index']);

		for (i=0; i<result.length; i++){
			delete result[i].index;
			// เมนูหลัก
			result[i].child = this.loadChildScreen(screen[result[i].group].child, local);

			for (c=0; c<result[i].child.length; c++){
				// เมนูย่อย
				result[i].child[c].child = this.loadChildScreen(screen[result[i].group].child[result[i].child[c].screen].child, local);
				delete result[i].child[c].index;
				if (result[i].child[c].child.length == 0) {
					delete result[i].child[c].child;
				}
				else {
					for (x=0; x<result[i].child[c].child.length; x++){
						delete result[i].child[c].child[x].index;
						delete result[i].child[c].child[x].child;
					}
				}
			}
		}
		return result;
	}
	else {
		return null;
	}
}

exports.loadChildScreen = function(child, local) {
	var arr = [];
	Object.keys(child).forEach(function(key) {
		arr.push({
			screen: key,
			index: child[key].index,
			link: child[key].link,
			icon: child[key].icon,
			name: util.i18n(local, 'screen-'+key),
			child: []
		});
	});
	var sortBy = require('sort-array');
	arr = sortBy(arr, ['index']);
	return arr;
}