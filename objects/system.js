exports.action = function(data) {
	
	try {
		var requiredField = '';
		var hasAction = true;
		if ( data.action == 'reload' ) {
			requiredField = util.completeRequiredFields(data, ['data']);
			if (requiredField == '') {
				this.reloadSystem(data);
			}
		}
		else if ( data.action == 'i18nUpdate' ) {
			requiredField = util.completeRequiredFields(data, ['message', 'from', 'to']);
			if (requiredField == '') {
				if (data.system == undefined) data.system = data.systemId;
				this.i18nUpdate(data);
			}
		}
		else if ( data.action == 'i18nData' ) {
			this.i18nData(data);
		}
		else if ( data.action == 'i18nMessage' ) {
			requiredField = util.completeRequiredFields(data, ['key']);
			if (requiredField == '') {
				this.i18nMessage(data);
			}
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
				console.log(data.command);
				util.query(this.screenGroupDeleteResult, data);
			}
		}
		else if ( data.action == 'mainMenu' ) {
			data.command = 'sp_MainMenuData \''+data.systemId+'\'';
			util.query(this.mainMenuResult, data);
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
		else if ( data.action == 'screenDelete' ) {
			requiredField = util.completeRequiredFields(data, ['id']);
			if (requiredField == '') {
				data.command = 'sp_ScreenDelete \''+data.systemId+'\', \''+data.id+'\'';
				util.query(this.screenDeleteResult, data);
			}
		}
		else if ( data.action == 'translate' ) {
			requiredField = util.completeRequiredFields(data, ['message', 'from']);
			if (requiredField == '') {
				this.translateResult(data);
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
		if (data.socket != undefined) util.responseToAllClient('reload-screen', {screen: data.screen});
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
	data.translateList = data.to.split('|');
	data.translated[data.from] = data.message;
	data.command = 'sp_i18nUpdate \''+data.system+'\', \''+data.from+'\', N\''+data.message+'\', \''+data.message+'\', \''+data.systemId+'\'';
	util.execute(data);

	if ( memory.i18n[data.system] == undefined ) memory.i18n[data.system] = {};
	if ( memory.i18n[data.system][data.from] == undefined ) memory.i18n[data.system][data.from] = {};
	memory.i18n[data.system][data.from][data.message] = data.message;

	this.i18nUpdateLoop(data);
}


exports.i18nUpdateLoop = function(data) {
	if (data.translateList.length > 0) {
		var idx = data.translateList.length-1;
		var system = this;
		
		var http = require('https');
		http.get('https://translate.googleapis.com/translate_a/single?client=gtx&sl='+data.from+'&tl='+data.translateList[idx]+'&dt=t&q='+data.message, function(res) {

			var body = '';
			res.setEncoding('utf8');
			res.on('data', function(chunk) {
				body += chunk;
			});
			res.on('end', function() {
				var json = JSON.parse(body);
				data.translated[data.translateList[idx]] = json[0][0][0];

				util.execute({command: 'sp_i18nUpdate \''+data.system+'\', \''+data.translateList[idx]+'\', N\''+data.message+'\', N\''+json[0][0][0]+'\', \''+data.systemId+'\''});
		
				if ( memory.i18n[data.system] == undefined ) memory.i18n[data.system] = {};
				if ( memory.i18n[data.system][data.translateList[idx]] == undefined ) memory.i18n[data.system][data.translateList[idx]] = {};
				memory.i18n[data.system][data.translateList[idx]][data.message] = json[0][0][0];

				data.translateList.pop();
				system.i18nUpdateLoop(data);

			});
			res.on('error', (err) => {
				console.log('problem with request: '+err.message);
				data.translateList.pop();
				system.i18nUpdateLoop(data);
			});

		});
		
		/*var translate = require('google-translate-api');
		translate(data.message, {from: data.from, to: data.translateList[idx]}).then(resp => {
			data.translated[data.translateList[idx]] = resp.text;
			data.command = 'sp_i18nUpdate \''+data.system+'\', \''+data.translateList[idx]+'\', N\''+data.message+'\', N\''+resp.text+'\', \''+data.systemId+'\'';
			util.execute(data);
	
			if ( memory.i18n[data.system] == undefined ) memory.i18n[data.system] = {};
			if ( memory.i18n[data.system][data.translateList[idx]] == undefined ) memory.i18n[data.system][data.translateList[idx]] = {};
			memory.i18n[data.system][data.translateList[idx]][data.message] = resp.text;

			data.translateList.pop();
			this.i18nUpdateLoop(data);

		}).catch(err => {
			console.error(err);
			data.translateList.pop();
			this.i18nUpdateLoop(data);
		});*/
	}
	else {
		if (config.devMode) console.log(colors.yellow('Update ')+colors.cyan('i18n Data')+' (' + JSON.stringify(data.translated) + ') : ' + colors.bold.green('Success'));
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

exports.screenGroupResult = function(recordset, data) {
	for (i = 0; i < recordset.length; i++) {
		recordset[i].key = recordset[i].name;
		recordset[i].name = util.i18n(data.session.local, 'screen-'+recordset[i].name);
	}
	if (data.res != undefined) data.res.json({success: true, result: recordset});
	if (data.socket != undefined) util.responseToAllClient(data.socketName, { success: true, result: recordset}); //** responseToAllClient
	delete recordset;
	delete data;
}

exports.screenGroupUpdateResult = function(recordset, data) {
	for(i=0; i<config.local.length; i++) {
		memory.i18n['common'][config.local[i]]['screen-'+data.id] = data[config.local[i] == 'zh-CN' ? 'cn' : config.local[i]];
	}
	if (data.res != undefined) data.res.json({success: true});
	if (data.socket != undefined) {
		util.responseToAllClient(data.socketName, { success: true }); //** responseToAllClient
		util.responseToAllClient('reload-memberScreen', { screen: 'common' }); //** responseToAllClient
	}
	delete recordset;
	delete data;
}

exports.mainMenuResult = function(recordset, data) {
	for (i = 0; i < recordset.length; i++) {
		recordset[i].name = util.i18n(data.session.local, 'screen-'+recordset[i].id);
	}
	if (data.res != undefined) data.res.json({success: true, result: recordset});
	if (data.socket != undefined) util.responseToAllClient(data.socketName, { success: true, result: recordset}); //** responseToAllClient
	delete recordset;
	delete data;
}

exports.screenResult = function(recordset, data) {
	for (i = 0; i < recordset.length; i++) {
		recordset[i].name = util.i18n(data.session.local, 'screen-'+recordset[i].id);
	}
	if (data.res != undefined) data.res.json({success: true, result: recordset});
	if (data.socket != undefined) util.responseToAllClient(data.socketName, { success: true, result: recordset}); //** responseToAllClient
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
		util.responseToAllClient(data.socketName, { success: true }); //** responseToAllClient
		util.responseToAllClient('reload-memberScreen', { screen: data.id }); //** responseToAllClient
		util.responseToAllClient('create-screen', { screen: data.id }); //** responseToAllClient
	}
	delete recordset;
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
		util.responseToAllClient(data.socketName, { success: true }); //** responseToAllClient
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
		util.responseToAllClient(data.socketName, { success: true }); //** responseToAllClient
		//util.responseToAllClient('reload-memberScreen', { screen: data.id }); //** responseToAllClient
	}
	
	delete recordset;
	delete data;
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
	if ( Object.keys(data.translated).length == 5 ) {
		if (data.res != undefined) data.res.json({ success: true, result: data.translated });
		if (data.socket != undefined) util.responseToSender(data.socket, data.socketName, { success: true, result: data.translated }); //** responseToSender
		delete data;
	}
}