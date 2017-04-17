exports.loadSystemData = function() {
	util.query(this.loadSystem, { command: 'sp_SystemData' });
}

exports.loadSystemAccessData = function() {
	util.query(this.loadSystemAccess, { command: 'sp_SystemAccessData' });
}

exports.loadMemberData = function() {
	util.query(this.loadMember, { command: 'sp_MemberData' });
}

exports.loadScreenMappingData = function() {
	util.queryMultiple(this.loadScreenMapping, { command: 'sp_ScreenMappingData' });
}

exports.loadi18nData = function() {
	util.query(this.loadi18n, { command: 'sp_i18nData' });
}

exports.loadSystem = function(recordset, data) {
	if (recordset != undefined && recordset.length > 0) {
		memory.system = {
			origin: {},
			key: {}
		}
		for (i = 0; i < recordset.length; i++) {
			memory.system[recordset[i].id] = {
				secretKey: recordset[i].secretKey,
				name: recordset[i].name,
				description: recordset[i].description,
			}

			if(recordset[i].type.toLowerCase() == 'web'){
				memory.system.origin[recordset[i].origin] = {
					id: recordset[i].id,
				}
			}
			memory.system.key[recordset[i].apiKey] = {
				id: recordset[i].id,
			}
		}
		console.log(colors.yellow('Load ')+colors.cyan('API System Data')+' (Total ' + colors.cyan.bold(recordset.length) + ' records) : ' + colors.bold.green('Success'));
		console.log(memory.system);
	}
	else {
		console.log(colors.yellow('Load ')+colors.cyan('API System Data')+' : ' + colors.bold.red('No Data'));
	}
	memory.status.loadedSystemData = true;
}


exports.loadSystemAccess = function(recordset, data) {
	if (recordset != undefined && recordset.length > 0) {
		memory.systemAccess = {};
		for (i = 0; i < recordset.length; i++) {
			memory.systemAccess[recordset[i].system+'-'+recordset[i].method+'-'+recordset[i].action] = {
				allow: recordset[i].allow,
				callCount: recordset[i].callCount,
				callDate: recordset[i].callDate,
			}
		}
		console.log(colors.yellow('Load ')+colors.cyan('System Access Data')+' (Total ' + colors.cyan.bold(recordset.length) + ' records) : ' + colors.bold.green('Success'));
	}
	else {
		console.log(colors.yellow('Load ')+colors.cyan('System Access Data')+' : ' + colors.bold.red('No Data'));
	}
	memory.status.loadedSystemAccessData = true;
}


exports.loadMember = function(recordset, data) {
	if (recordset != undefined && recordset.length > 0) {
		memory.member = {
			id: {},
			username: {}
		}
		for (i = 0; i < recordset.length; i++) {
			memory.member.id[recordset[i].id] = {}
			memory.member.id[recordset[i].id].allowMultipleLogin = false;
			recordset[i].password = util.decrypt(recordset[i].password, recordset[i].username.toLowerCase());
			memory.member.username[recordset[i].username.toLowerCase()] = {
				password: recordset[i].password,
				id : recordset[i].id
			}
			delete recordset[i].password;
			for (var k in recordset[i]){
				if (recordset[i][k] != null && recordset[i][k] != '') { 
					memory.member.id[recordset[i].id][k] = recordset[i][k];
				}
			}
		}
		console.log(colors.yellow('Load ')+colors.cyan('Member Data')+' (Total ' + colors.cyan.bold(recordset.length) + ' records) : ' + colors.bold.green('Success'));
	}
	else {
		console.log(colors.yellow('Load ')+colors.cyan('Member Data')+' : ' + colors.bold.red('No Data'));
	}
	memory.status.loadedMemberData = true;
}


exports.loadScreenMapping = function(recordset, data) {
	//console.log(data);
	//console.log('loadScreenMapping');
	//console.log(recordset);
	if (recordset != undefined && recordset.length > 0) {
		/*memory.screen = {
			memberType: {},
			screen: {}
		}*/
		for (i = 0; i < recordset.length; i++) {
			/*memory.memberType = {}
			memory.member.id[recordset[i].id].allowMultipleLogin = false;
			recordset[i].password = util.decrypt(recordset[i].password, recordset[i].username.toLowerCase());
			memory.member.username[recordset[i].username.toLowerCase()] = {
				password: recordset[i].password,
				id : recordset[i].id
			}
			delete recordset[i].password;
			for (var k in recordset[i]){
				if (recordset[i][k] != null && recordset[i][k] != '') { 
					memory.member.id[recordset[i].id][k] = recordset[i][k];
				}
			}*/
		}
		console.log(colors.yellow('Load ')+colors.cyan('Screen Mapping Data')+' (Total ' + colors.cyan.bold(recordset.length) + ' records) : ' + colors.bold.green('Success'));
	}
	else {
		console.log(colors.yellow('Load ')+colors.cyan('Screen Mapping Data')+' : ' + colors.bold.red('No Data'));
	}
	memory.status.loadedScreenMapping = true;
}


exports.loadi18n = function(recordset, data) {
	if (recordset != undefined && recordset.length > 0) {
		memory.i18n = {};
		for (i = 0; i < recordset.length; i++) {
			if ( memory.i18n[recordset[i].system] == undefined ) memory.i18n[recordset[i].system] = {};
			if ( memory.i18n[recordset[i].system][recordset[i].local] == undefined ) memory.i18n[recordset[i].system][recordset[i].local] = {};
			memory.i18n[recordset[i].system][recordset[i].local][recordset[i].languageKey] = recordset[i].message;
		}
		console.log(colors.yellow('Load ')+colors.cyan('i18n Data')+' (Total ' + colors.cyan.bold(recordset.length) + ' records) : ' + colors.bold.green('Success'));
	}
	else {
		console.log(colors.yellow('Load ')+colors.cyan('i18n Data')+' : ' + colors.bold.red('No Data'));
	}
	memory.status.loadedi18nData = true;
}

exports.addUser = function(socket) {
	clientSocket[socket.id] = {};
	clientSocket[socket.id].local = 'th';
	clientSocket[socket.id].isServer = false;
}

exports.setLocale = function(socket, local) {
	if ( clientSocket[socket.id] == undefined ) this.addUser(socket);
	clientSocket[socket.id].local = local;
}