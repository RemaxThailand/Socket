exports.action = function(data) {
	
	try {
		var requiredField = '';
		var hasAction = true;
		if ( data.action == 'translate' ) {
			requiredField = util.completeRequiredFields(data, ['message', 'from']);
			if (requiredField == '') {
				this.translateResult(data);
			}
		}
		else if ( data.action == 'i18nUpdate' ) {
			requiredField = util.completeRequiredFields(data, ['message', 'from']);
			if (requiredField == '') {
				if (data.system == undefined) data.system = data.systemId;
				this.i18nUpdate(data);
			}
		}
		else if ( data.action == 'i18nData' ) {
			requiredField = util.completeRequiredFields(data, ['system']);
			if (requiredField == '') {
				this.i18nData(data);
			}
		}
		else if ( data.action == 'i18nMessage' ) {
			requiredField = util.completeRequiredFields(data, ['key']);
			if (requiredField == '') {
				this.i18nMessage(data);
			}
		}
		else if ( data.action == 'systemScreen' ) {
			this.systemScreenResult(data);
		}
		else if ( data.action == 'screenGroup' ) {
			data.command = 'sp_ScreenGroupData \''+data.systemId+'\'';
			util.query(this.screenGroupResult, data);
		}
		else if ( data.action == 'screenGroupUpdate' ) {
			requiredField = util.completeRequiredFields(data, ['id','en','th','lo','ja','cn']);
			if (requiredField == '') {
				data.command = 'sp_ScreenGroupUpdate \''+data.systemId+'\', \''+data.id+'\', N\''+data.en+'\', N\''+data.th+'\', N\''+data.lo+'\', N\''+data.ja+'\', N\''+data.cn+'\', \''+data.session.id+'\'';
				util.query(this.screenGroupUpdateResult, data);
			}
		}
		else if ( data.action == 'screenGroupDelete' ) {
			requiredField = util.completeRequiredFields(data, ['id']);
			if (requiredField == '') {
				data.command = 'sp_ScreenGroupDelete \''+data.systemId+'\', \''+data.id+'\'';
				util.query(this.screenGroupDeleteResult, data);
			}
		}
		else if ( data.action == 'mainScreen' ) {
			data.command = 'sp_MainScreenData \''+data.systemId+'\'';
			util.query(this.mainScreenResult, data);
		}
		else if ( data.action == 'screen' ) {
			data.command = 'sp_ScreenData \''+data.systemId+'\'';
			util.query(this.screenResult, data);
		}
		else if ( data.action == 'screenUpdate' ) {
			requiredField = util.completeRequiredFields(data, ['id','link','icon','en','th','lo','ja','cn']);
			if (requiredField == '') {
				data.command = 'sp_ScreenUpdate \''+data.systemId+'\', \''+data.id+'\', \''+data.link+'\', \''+data.icon+'\', N\''+data.en+'\', N\''+data.th+'\', N\''+data.lo+'\', N\''+data.ja+'\', N\''+data.cn+'\', \''+data.session.id+'\'';
				util.query(this.screenUpdateResult, data);
			}
		}
		else if ( data.action == 'screenIndexUpdate' ) {
			requiredField = util.completeRequiredFields(data, ['id','index']);
			if (requiredField == '') {
				data.command = 'sp_ScreenIndexUpdate \''+data.systemId+'\', \''+data.id+'\', '+data.index+', \''+data.session.id+'\'';
				util.execute(data, this.screenIndexUpdateResult);
			}
		}
		else if ( data.action == 'screenDelete' ) {
			requiredField = util.completeRequiredFields(data, ['id']);
			if (requiredField == '') {
				data.command = 'sp_ScreenDelete \''+data.systemId+'\', \''+data.id+'\'';
				util.query(this.screenDeleteResult, data);
			}
		}
		else if ( data.action == 'memberScreen' ) {
			var result = util.translateMemberType(data.session.local, Object.keys(memory.memberType).sort(function(a,b){return memory.memberType[a]-memory.memberType[b]}));
			if (data.res != undefined) data.res.json({success: true, result: memory.screen[data.systemId], memberType: result });
			if (data.socket != undefined) util.responseToSender(data.socket, data.socketName, { success: true, result: memory.screen[data.systemId], memberType: result });
		}
		else if ( data.action == 'memberScreenUpdate' ) {
			requiredField = util.completeRequiredFields(data, ['screen','role','permission']);
			if (requiredField == '') {
				if (data.permission == '0000'){
					data.command = 'sp_MemberScreenUpdate \''+data.systemId+'\', \''+data.screen+'\', \''+data.role+'\', \''+data.permission+'\', \''+data.session.id+'\'';
					util.execute(data, this.memberScreenDeleteResult);
				}
				else if (data.permission.length == 4)
				{
					data.command = 'sp_MemberScreenUpdate \''+data.systemId+'\', \''+data.screen+'\', \''+data.role+'\', \''+data.permission+'\', \''+data.session.id+'\'';
					util.execute(data, this.memberScreenUpdateResult);
				}
				else {
					if (data.res != undefined) data.res.json({success: false, error: 'SYS0002', errorMessage: util.i18n('en', 'Invalid data format')+' (permission)'});
					if (data.socket != undefined) util.responseError(data.socket, data.socketName, {action: data.action, error: 'SYS0002', errorMessage: util.i18n(data.session.local, 'Invalid data format')+' (permission)', info: { id: data.socket.id } });
				}
			}
		}
		else if ( data.action == 'reload' ) {
			requiredField = util.completeRequiredFields(data, ['data']);
			if (requiredField == '') {
				this.reloadSystem(data);
			}
		}
		else {
			hasAction = false;
		}

		if ( !hasAction ) {
			if (data.res != undefined) data.res.json({success: false, error: 'ACT0000', errorMessage: 'Action ' + data.action + ' ' + util.i18n('en', 'is not implemented')});
			if (data.socket != undefined) util.responseError(data.socket, data.socketName, {action: data.action, error: 'ACT0000', errorMessage: 'Action ' + data.action + ' ' + util.i18n(data.session.local, 'is not implemented'), info: { id: data.socket.id } });
		}
		else if (requiredField != '') {
			if (data.res != undefined) data.res.json({success: false, error: 'ACT0001', errorMessage: util.i18n('en', 'Please fill out all required fields')+' (' + requiredField + ')'});
			if (data.socket != undefined) util.responseError(data.socket, data.socketName, {action: data.action, error: 'ACT0001', errorMessage: util.i18n(data.session.local, 'Please fill out all required fields')+' ('+requiredField+')', info: { id: data.socket.id, field: requiredField } });
		}
	}
	catch(err) {
		console.log(err);
		if (data.res != undefined) data.res.json({success: false, error: 'SYS0000', errorMessage: err.message});
		if (data.socket != undefined) util.responseError(data.socket, data.socketName, {action: data.action, error: 'SYS0000', errorMessage: err.message, info: {} });
	}
}

exports.reloadSystem = function(data) {
	var initial = require('./initial');
	if ( data.data == 'SystemAccess' ) {
		initial.loadSystemAccessData();
		if (data.res != undefined) data.res.json({success: true});
		if (data.socket != undefined) util.responseToSender(data.socket, data.socketName, { success: true });
	}
	else if ( data.data == 'screen' ) {
		if (data.res != undefined) data.res.json({success: true, screen: data.screen});
		if (data.socket != undefined) {
			util.responseToSender(data.socket, data.socketName, { success: true });
			util.responseToAllClient('reload-screen', {screen: data.screen});
		}
	}
	else {
		if (data.res != undefined) data.res.json({success: false, error: 'SYS0001', errorMessage: util.i18n(data.session.local, 'No action for doing')+' (' + data.data + ')'});
		if (data.socket != undefined) util.responseError(data.socket, data.socketName, {action: data.action, error: 'SYS0001', errorMessage: util.i18n(data.session.local, 'No action for doing')+' (' + data.data + ')', info: {} });
	}
}

exports.i18nUpdate = function(data) {
	data.translated = {};
	if (data.res != undefined) data.res.json({success: true});
	if (data.socket != undefined) util.responseToSender(data.socket, data.socketName, { success: true });
	data.translated[data.from] = data.message;
	util.execute({command: 'sp_i18nUpdate \''+data.system+'\', \''+data.from+'\', N\''+data.message+'\', N\''+data.message+'\', \''+data.systemId+'\''});

	if ( memory.i18n[data.system] == undefined ) memory.i18n[data.system] = {};
	if ( memory.i18n[data.system][data.from] == undefined ) memory.i18n[data.system][data.from] = {};
	memory.i18n[data.system][data.from][data.message] = data.message;

	for (i=0; i<config.local.length; i++){
		if ( config.local[i] != data.from ) {
			util.translate(this.i18nUpdateLoop, config.local[i], data);
		}
	}
}

exports.i18nUpdateLoop = function(local, message, data) {

	data.translated[local] = message;
	if ( memory.i18n[data.system][local] == undefined ) memory.i18n[data.system][local] = {};
	memory.i18n[data.system][local][data.message] = message;
	util.execute({command: 'sp_i18nUpdate \''+data.system+'\', \''+local+'\', N\''+data.message+'\', N\''+message+'\', \''+data.systemId+'\''});

	if ( Object.keys(data.translated).length == config.local.length ) {
		debug(colors.yellow('Update ')+colors.cyan('i18n Data')+' (' + JSON.stringify(data.translated) + ') : ' + colors.bold.green('Success'));
		util.responseToAllClient('updatei18n', {
			system: data.system,
			message: data.message,
			result: data.translated,
		});
		delete data;
	}

}

exports.i18nData = function(data) {
	var result = (data.system != undefined && memory.i18n[data.system] != undefined) ? memory.i18n[data.system] : memory.i18n;
	if (data.res != undefined) data.res.json({ success: true, result: result });
	if (data.socket != undefined) util.responseToSender(data.socket, data.socketName, { success: true, result: result }); //** responseToSender
	delete result;
	delete data;
}

exports.i18nMessage = function(data) {
	data.translated = {};
	for (i=0; i<config.local.length; i++){
		data.translated[config.local[i]] = (memory.i18n['common'][config.local[i]][data.key] != undefined) ? memory.i18n['common'][config.local[i]][data.key] : data.key;
	}
	if (data.res != undefined) data.res.json({ success: true, result: data.translated });
	if (data.socket != undefined) util.responseToSender(data.socket, data.socketName, { success: true, result: data.translated }); //** responseToSender
	delete data;
}

exports.systemScreenResult = function(data) {
	var company = {};
	var systemScreen = {}
	var memberScreen = {}
	Object.keys(memory.screen).forEach(function(key) {
		company[key] = {
			name: memory.company[key].name,
			role: {}
		}
		var arr = [];
		Object.keys(memory.screen[key]).forEach(function(role) {
			arr.push ({
				role: role,
				index: memory.screen[key][role].index,
				name: util.i18n(data.session.local, 'role-'+role)
			})
		});
		var sortBy = require('sort-array');
		company[key].role = sortBy(arr, ['index']);

		arr = [];
		Object.keys(memory.screen[key].member).forEach(function(system) {
			if (system != 'index' && system != 'active') {
				arr.push ({
					id: system,
					name: memory.system[system].name
				})
			}
		});
		company[key].system = sortBy(arr, ['index']);

		for(i=0; i<company[key].role.length; i++){
			var role = company[key].role[i].role;
			for(j=0; j<company[key].system.length; j++){
				var system = company[key].system[j].id;

				if (memberScreen[system] == undefined) memberScreen[system] = {}
				if (memberScreen[system][role] == undefined) memberScreen[system][role] = {}
				// กลุ่มเมนู
				Object.keys(memory.screen[key][role][system]).forEach(function(group) {
					if ( systemScreen[system] == undefined ) systemScreen[system] = {};
					if ( systemScreen[system][group] == undefined ) systemScreen[system][group] = {
						name: util.i18n(data.session.local, 'screen-'+group),
						index: memory.screen[key][role][system][group].index
					};
					// เมนูหลัก
					Object.keys(memory.screen[key][role][system][group].child).forEach(function(mainScreen) {
						if (memberScreen[system][role][mainScreen] == undefined) memberScreen[system][role][mainScreen] = {
							insert: memory.screen[key][role][system][group].child[mainScreen].insert,
							update: memory.screen[key][role][system][group].child[mainScreen].update,
							delete: memory.screen[key][role][system][group].child[mainScreen].delete,
							index: memory.screen[key][role][system][group].child[mainScreen].index,
							group: group
						}
						if ( systemScreen[system][group][mainScreen] == undefined ) systemScreen[system][group][mainScreen] = {
							name: util.i18n(data.session.local, 'screen-'+mainScreen),
							index: memory.screen[key][role][system][group].child[mainScreen].index,
							icon: memory.screen[key][role][system][group].child[mainScreen].icon,
							link: memory.screen[key][role][system][group].child[mainScreen].link
						};
						if ( memory.screen[key][role][system][group].child[mainScreen].child != {} ) {
							// เมนูย่อย
							Object.keys(memory.screen[key][role][system][group].child[mainScreen].child).forEach(function(screen) {
								if (memberScreen[system][role][screen] == undefined) memberScreen[system][role][screen] = {
									insert: memory.screen[key][role][system][group].child[mainScreen].child[screen].insert,
									update: memory.screen[key][role][system][group].child[mainScreen].child[screen].update,
									delete: memory.screen[key][role][system][group].child[mainScreen].child[screen].delete,
									index: memory.screen[key][role][system][group].child[mainScreen].child[screen].index,
									parent: mainScreen
								}
								if ( systemScreen[system][group][mainScreen].child == undefined ) systemScreen[system][group][mainScreen].child = {};
								if ( systemScreen[system][group][mainScreen].child[screen] == undefined ) systemScreen[system][group][mainScreen].child[screen] = {
									name: util.i18n(data.session.local, 'screen-'+screen),
									index: memory.screen[key][role][system][group].child[mainScreen].child[screen].index,
									icon: memory.screen[key][role][system][group].child[mainScreen].child[screen].icon,
									link: memory.screen[key][role][system][group].child[mainScreen].child[screen].link
								};
							});
						}
					});
				});
			}
		}

	});
	if (data.res != undefined) data.res.json({ success: true, result: company, screen: systemScreen, memberScreen: memberScreen });
	if (data.socket != undefined) util.responseToSender(data.socket, data.socketName, { success: true, result: company, screen: systemScreen, memberScreen: memberScreen }); //** responseToSender
	delete data;
}

exports.screenGroupUpdateResult = function(recordset, data) {
	for(i=0; i<config.local.length; i++) {
		memory.i18n['common'][config.local[i]]['screen-'+data.id] = data[config.local[i] == 'zh-CN' ? 'cn' : config.local[i]];
	}
	if (data.res != undefined) data.res.json({success: true});
	if (data.socket != undefined) {
		util.responseToSender(data.socket, data.socketName, { success: true }); //** responseToSender
		util.responseToAllClient('reload-memberScreen', { screen: 'common' }); //** responseToAllClient
	}
	delete recordset;
	delete data;
}

exports.mainScreenResult = function(recordset, data) {
	for (i = 0; i < recordset.length; i++) {
		recordset[i].name = util.i18n(data.session.local, 'screen-'+recordset[i].id);
	}
	if (data.res != undefined) data.res.json({success: true, result: recordset});
	if (data.socket != undefined) util.responseToSender(data.socket, data.socketName, { success: true, result: recordset }); //** responseToSender
	delete recordset;
	delete data;
}

exports.screenGroupResult = function(recordset, data) {
	for (i = 0; i < recordset.length; i++) {
		recordset[i].key = recordset[i].name;
		recordset[i].name = util.i18n(data.session.local, 'screen-'+recordset[i].name);
	}
	if (data.res != undefined) data.res.json({success: true, result: recordset});
	if (data.socket != undefined) util.responseToSender(data.socket, data.socketName, { success: true, result: recordset }); //** responseToSender
	delete recordset;
	delete data;
}

exports.screenResult = function(recordset, data) {
	for (i = 0; i < recordset.length; i++) {
		recordset[i].name = util.i18n(data.session.local, 'screen-'+recordset[i].id);
	}
	if (data.res != undefined) data.res.json({success: true, result: recordset});
	if (data.socket != undefined) util.responseToSender(data.socket, data.socketName, { success: true, result: recordset }); //** responseToSender
	delete recordset;
	delete data;
}

exports.screenUpdateResult = function(recordset, data) {
	for(i=0; i<config.local.length; i++) {
		memory.i18n['common'][config.local[i]]['screen-'+data.id] = data[config.local[i] == 'zh-CN' ? 'cn' : config.local[i]];
	}
	Object.keys(memory.memberScreen).forEach(function(key) {
		for(i=0; i<memory.memberScreen[key].length; i++){
			if (memory.memberScreen[key][i].screen == data.id) {
				memory.memberScreen[key][i].icon = data.icon;
				memory.memberScreen[key][i].link = data.link;
				break;
			}
		}
	});
	if (data.res != undefined) data.res.json({success: true});
	if (data.socket != undefined) {
		util.responseToSender(data.socket, data.socketName, { success: true }); //** responseToSender
		util.responseToAllClient('reload-memberScreen', { screen: data.id }); //** responseToAllClient
		util.responseToAllClient('create-screen', { screen: data.id }); //** responseToAllClient
	}
	delete recordset;
	delete data;
}

exports.screenIndexUpdateResult = function(data) {
	Object.keys(memory.memberScreen).forEach(function(key) {
		if (memory.memberScreen[key] != undefined) {
			for(i=0; i<memory.memberScreen[key].length; i++) {
				if (memory.memberScreen[key][i].screen != undefined && memory.memberScreen[key][i].screen == data.id) {
					memory.memberScreen[key][i].index = data.index;
				}
			}
		}
	});
	if (data.res != undefined) data.res.json({success: true, result: recordset});
	if (data.socket != undefined) {
		util.responseToSender(data.socket, data.socketName, { success: true, screen: data.id }); //** responseToSender
		util.responseToAllClient('reload-memberScreen', { screen: data.id }); //** responseToAllClient
	}
	delete data;
}

exports.screenDeleteResult = function(recordset, data) {
	for(i=0; i<config.local.length; i++) {
		delete memory.i18n['common'][config.local[i]]['screen-'+data.id]
	}
	Object.keys(memory.memberScreen).forEach(function(key) {
		for(i=0; i<memory.memberScreen[key].length; i++){
			if (memory.memberScreen[key][i].screen == data.id) {
				delete memory.memberScreen[key][i];
			}
		}
	});
	if (data.res != undefined) data.res.json({success: true});
	if (data.socket != undefined) {
		util.responseToSender(data.socket, data.socketName, { success: true }); //** responseToSender
		util.responseToAllClient('reload-memberScreen', { screen: data.id }); //** responseToAllClient
		util.responseToAllClient('delete-screen', { screen: data.id }); //** responseToAllClient
	}
	
	delete recordset;
	delete data;
}

exports.screenGroupDeleteResult = function(recordset, data) {
	for(i=0; i<config.local.length; i++) {
		delete memory.i18n['common'][config.local[i]]['screen-'+data.id]
	}
	if (data.res != undefined) data.res.json({success: true});
	if (data.socket != undefined) {
		util.responseToSender(data.socket, data.socketName, { success: true }); //** responseToSender
		//util.responseToAllClient('reload-memberScreen', { screen: data.id }); //** responseToAllClient
	}
	
	delete recordset;
	delete data;
}

exports.memberScreenUpdateResult = function(data) {
	if ( memory.screen[data.systemId][data.screen] == undefined ) {
		memory.screen[data.systemId][data.screen] = {
			parent: '',
			group: memory.screen[data.systemId]['member-profile']['member'].group,
		}
	}
	memory.screen[data.systemId][data.screen][data.role] = {
		insert: data.permission.substr(1, 1) == 1,
		update: data.permission.substr(2, 1) == 1,
		delete: data.permission.substr(3, 1) == 1
	}

	if (data.res != undefined) data.res.json({success: true, screen: data.screen, role: data.role});
	if (data.socket != undefined) {
		util.responseToSender(data.socket, data.socketName, { success: true, screen: data.screen, role: data.role }); //** responseToSender
	}
		
	data.command = 'sp_MemberScreenData \''+data.systemId+'\', \''+data.role+'\'';
	util.query(function(recordset, data) {
		memory.memberScreen[data.role] = recordset;
		util.responseToAllClient('reload-memberScreen', { screen: data.screen, role: data.role }); //** responseToAllClient
	}, data);

}

exports.memberScreenDeleteResult = function(data) {
	delete memory.screen[data.systemId][data.screen][data.role];
	if (data.res != undefined) data.res.json({success: true, screen: data.screen, role: data.role});
	if (data.socket != undefined) {
		util.responseToSender(data.socket, data.socketName, { success: true, screen: data.screen, role: data.role }); //** responseToSender
		util.responseToAllClient('delete-screen', { screen: data.id }); //** responseToAllClient
	}
		
	data.command = 'sp_MemberScreenData \''+data.systemId+'\', \''+data.role+'\'';
	util.query(function(recordset, data) {
		memory.memberScreen[data.role] = recordset;
		util.responseToAllClient('reload-memberScreen', { screen: data.screen, role: data.role }); //** responseToAllClient
	}, data);

}



exports.translateResult = function(data) {
	data.translated = {};
	data.translated[data.from] = data.message;
	for (i=0; i<config.local.length; i++){
		if ( config.local[i] != data.from ) {
			util.translate(this.translateData, config.local[i], data);
		}
	}
}

exports.translateData = function(local, message, data) {
	data.translated[local] = message;
	if ( Object.keys(data.translated).length == config.local.length ) {
		if (data.res != undefined) data.res.json({ success: true, result: data.translated });
		if (data.socket != undefined) util.responseToSender(data.socket, data.socketName, { success: true, result: data.translated }); //** responseToSender
		delete data;
	}
}