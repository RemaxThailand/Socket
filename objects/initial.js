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

exports.loadCompanyData = function() {
	util.query(this.loadCompany, { command: 'sp_CompanyData' });
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
				company: recordset[i].company
			}

			if(recordset[i].type.toLowerCase() == 'web'){
				memory.system.origin[recordset[i].origin] = recordset[i].id
			}
			memory.system.key[recordset[i].apiKey] = recordset[i].id;
		}
		debug(colors.yellow('Load ')+colors.cyan('API System Data')+' (Total ' + colors.cyan.bold(recordset.length) + ' records) : ' + colors.bold.green('Success'));
	}
	else {
		debug(colors.yellow('Load ')+colors.cyan('API System Data')+' : ' + colors.bold.red('No Data'));
	}
	util.setLoaded('systemData');
}


exports.loadSystemAccess = function(recordset, data) {
	if (recordset != undefined && recordset.length > 0) {
		memory.systemAccess = {};
		for (i = 0; i < recordset.length; i++) {
			memory.systemAccess[recordset[i].system+'-'+recordset[i].method+'-'+recordset[i].action] = recordset[i].allow;
		}
		debug(colors.yellow('Load ')+colors.cyan('System Access Data')+' (Total ' + colors.cyan.bold(recordset.length) + ' records) : ' + colors.bold.green('Success'));
	}
	else {
		debug(colors.yellow('Load ')+colors.cyan('System Access Data')+' : ' + colors.bold.red('No Data'));
	}
	util.setLoaded('systemAccessData');
}


exports.loadMember = function(recordset, data) {
	if (recordset != undefined && recordset.length > 0) {
		memory.member = {};
		for (i = 0; i < recordset.length; i++) {
			if (memory.member[recordset[i].company] == undefined) memory.member[recordset[i].company] = {
				username: {}
			}
			memory.member[recordset[i].company][recordset[i].id] = {}
			if (recordset[i].active) {
				memory.member[recordset[i].company][recordset[i].id].allowMultipleLogin = false;
				recordset[i].password = util.decrypt(recordset[i].password, recordset[i].username.toLowerCase());
				memory.member[recordset[i].company].username[recordset[i].username.toLowerCase()] = {
					password: recordset[i].password,
					id : recordset[i].id
				}
			}
			delete recordset[i].password;
			for (var k in recordset[i]){
				if (recordset[i][k] != null && recordset[i][k] != '') { 
					memory.member[recordset[i].company][recordset[i].id][k] = recordset[i][k];
				}
			}
			delete memory.member[recordset[i].company][recordset[i].id].company;
			delete memory.member[recordset[i].company][recordset[i].id].id;
		}
		debug(colors.yellow('Load ')+colors.cyan('Member Data')+' (Total ' + colors.cyan.bold(recordset.length) + ' records) : ' + colors.bold.green('Success'));
	}
	else {
		debug(colors.yellow('Load ')+colors.cyan('Member Data')+' : ' + colors.bold.red('No Data'));
	}
	util.setLoaded('memberData');
}


exports.loadCompany = function(recordset, data) {
	if (recordset != undefined && recordset.length > 0) {
		memory.company = {};
		for (i = 0; i < recordset.length; i++) {
			memory.company[ recordset[i].id ] = {
				name: recordset[i].name,
				website: recordset[i].website,
				address: recordset[i].address
			}
		}
		debug(colors.yellow('Load ')+colors.cyan('Company Data')+' (Total ' + colors.cyan.bold(recordset.length) + ' records) : ' + colors.bold.green('Success'));
	}
	else {
		debug(colors.yellow('Load ')+colors.cyan('Company Data')+' : ' + colors.bold.red('No Data'));
	}
	util.setLoaded('companyData');
}


exports.loadScreenMapping = function(recordset, data) {
	// https://github.com/RemaxThailand/Socket/wiki/ตัวแปรหลักในระบบ-:-Memory#screen
	if (recordset != undefined && recordset.length > 0) {
		memory.memberType = {}
		memory.screen = {}
		for (i = 0; i < recordset[0].length; i++) { // Member Type
			if ( memory.memberType[recordset[0][i].company] == undefined ) memory.memberType[recordset[0][i].company] = {}
			memory.memberType[recordset[0][i].company][recordset[0][i].id] = {
				index: recordset[0][i].index,
				active: recordset[0][i].active
			}
		}
		for (i = 0; i < recordset[1].length; i++) { // Screen
			// Company
			if ( memory.screen[recordset[1][i].company] == undefined ) memory.screen[recordset[1][i].company] = {}
			// Company > MemberType
			if ( memory.screen[recordset[1][i].company][recordset[1][i].memberType] == undefined ) {
				memory.screen[recordset[1][i].company][recordset[1][i].memberType] = {
					index: memory.memberType[recordset[1][i].company][recordset[1][i].memberType].index,
					active: memory.memberType[recordset[1][i].company][recordset[1][i].memberType].active
				};
			}
			// Company > MemberType > System
			if ( memory.screen[recordset[1][i].company][recordset[1][i].memberType][recordset[1][i].system] == undefined ) memory.screen[recordset[1][i].company][recordset[1][i].memberType][recordset[1][i].system] = {};
			// Company > MemberType > System > ScreenGroup
			if ( memory.screen[recordset[1][i].company][recordset[1][i].memberType][recordset[1][i].system][recordset[1][i].screenGroup] == undefined )
				memory.screen[recordset[1][i].company][recordset[1][i].memberType][recordset[1][i].system][recordset[1][i].screenGroup] = {
					index: recordset[1][i].screenGroupIndex,
					child: {}
				};
			// Company > MemberType > System > ScreenGroup > Main Screen
			if (recordset[1][i].parent == '') {
				if ( memory.screen[recordset[1][i].company][recordset[1][i].memberType][recordset[1][i].system][recordset[1][i].screenGroup].child[recordset[1][i].screen] == undefined ) {
					memory.screen[recordset[1][i].company][recordset[1][i].memberType][recordset[1][i].system][recordset[1][i].screenGroup].child[recordset[1][i].screen] = {
						insert: recordset[1][i].canInsert,
						update: recordset[1][i].canUpdate,
						delete: recordset[1][i].canDelete,
						index: recordset[1][i].index,
						link: recordset[1][i].link,
						icon: recordset[1][i].icon,
						child: {}
					}
				}
			}
			// Company > MemberType > System > ScreenGroup > Main Screen > Screen
			else {
				memory.screen[recordset[1][i].company][recordset[1][i].memberType][recordset[1][i].system][recordset[1][i].screenGroup].child[recordset[1][i].parent].child[recordset[1][i].screen] = {
					insert: recordset[1][i].canInsert,
					update: recordset[1][i].canUpdate,
					delete: recordset[1][i].canDelete,
					index: recordset[1][i].index,
					link: recordset[1][i].link,
					icon: recordset[1][i].icon
				}
			}
		}
		delete memory.memberType;
		debug(colors.yellow('Load ')+colors.cyan('Screen Mapping Data')+' (Total ' + colors.cyan.bold(recordset[1].length) + ' records) : ' + colors.bold.green('Success'));
	}
	else {
		debug(colors.yellow('Load ')+colors.cyan('Screen Mapping Data')+' : ' + colors.bold.red('No Data'));
	}
	util.setLoaded('screenMapping');
}


exports.loadi18n = function(recordset, data) {
	if (recordset != undefined && recordset.length > 0) {
		memory.i18n = {};
		for (i = 0; i < recordset.length; i++) {
			if ( memory.i18n[recordset[i].system] == undefined ) memory.i18n[recordset[i].system] = {};
			if ( memory.i18n[recordset[i].system][recordset[i].local] == undefined ) memory.i18n[recordset[i].system][recordset[i].local] = {};
			memory.i18n[recordset[i].system][recordset[i].local][recordset[i].languageKey] = recordset[i].message;
		}
		debug(colors.yellow('Load ')+colors.cyan('i18n Data')+' (Total ' + colors.cyan.bold(recordset.length) + ' records) : ' + colors.bold.green('Success'));
	}
	else {
		debug(colors.yellow('Load ')+colors.cyan('i18n Data')+' : ' + colors.bold.red('No Data'));
	}
	util.setLoaded('i18nData');
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