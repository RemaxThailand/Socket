exports.action = function(data) {
	
	try {
		var requiredField = '';
		var hasAction = true;
		if ( data.action == 'login' ) {
			if (data.username == undefined || data.username == '') {
				if (data.res != undefined) data.res.json({success: false, error: 'MBR0001', errorMessage: util.i18n('en', 'Please input Username')});
				if (data.socket != undefined) util.responseError(data.socket, data.socketName, {action: data.action, error: 'MBR0001', errorMessage: util.i18n(data.session.local, 'Please input Username'), info: data });
			}
			else if (data.password == undefined || data.password == '') {
				if (data.res != undefined) data.res.json({success: false, error: 'MBR0002', errorMessage: util.i18n('en', 'Please input Password')});
				if (data.socket != undefined) util.responseError(data.socket, data.socketName, {action: data.action, error: 'MBR0002', errorMessage: util.i18n(data.session.local, 'Please input Password'), info: data });
			}
			else {
				data.username = data.username.toLowerCase();
				this.loginCheck(data);
			}
		}
		else if ( data.action == 'basicInfo' ) {
			this.basicInfoResult(data);
		}
		else if ( data.action == 'role' ) {
			this.roleResult(data);
		}
		else if ( data.action == 'roleChange' ) {
			requiredField = util.completeRequiredFields(data, ['role']);
			if (requiredField == '') {
				this.roleChangeResult(data);
			}
		}
		else if ( data.action == 'screen' ) {
			requiredField = util.completeRequiredFields(data, ['role']);
			if (requiredField == '') {
				this.screenResult(data);
			}
		}
		else if ( data.action == 'multipleLoginNotAllow' ) {
			util.emitToMemberIdExceptSender(data.session.id, data.socket.id, 'logout', {});
		}
		else if ( data.action == 'multipleLoginAllow' ) {
			memory.member.id[data.session.id].allowMultipleLogin = true;
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
		if (data.res != undefined) data.res.json({success: false, error: 'MBR0000', errorMessage: err.message});
		if (data.socket != undefined) util.responseError(data.socket, data.socketName, {action: data.action, error: 'MBR0000', errorMessage: err.message, info: {} });
	}
}

exports.loginCheck = function(data) {
	if ( memory.member.username[data.username] == undefined ){
		if (data.res != undefined) data.res.json({success: false, error: 'MBR0003', errorMessage: util.i18n('en', 'Username not found')});
		if (data.socket != undefined) util.responseError(data.socket, data.socketName, {action: data.action, error: 'MBR0003', errorMessage: util.i18n(data.session.local, 'Username not found'), info: {} });
	}
	else {
		if ( memory.member.username[data.username].password == data.password ) {
			clientSocket[data.socket.id].id = memory.member.username[data.username].id;
			data.token = {
				id: memory.member.username[data.username].id,
				userAgent: (data.socket.handshake.headers['user-agent'] != undefined) ? data.socket.handshake.headers['user-agent'] : ''
			};			
			if (memory.member.id[data.token.id].sessionList == undefined) memory.member.id[data.token.id].sessionList = [];
			memory.member.id[data.token.id].sessionList.push(data.socket.id);
			if (memory.member.id[data.token.id].sessionList.length > 1) {
				util.emitToMemberIdExceptSender(data.token.id, data.socket.id, 'alert-login', {});
			}
			util.jwtSign(this.responseToken, config.crypto.password, data);
		}
		else {
			if (data.res != undefined) data.res.json({success: false, error: 'MBR0004', errorMessage: util.i18n('en', 'Invalid Password')});
			if (data.socket != undefined) util.responseError(data.socket, data.socketName, {action: data.action, error: 'MBR0004', errorMessage: util.i18n(data.session.local, 'Invalid Password'), info: {} });
		}
	}
}

exports.responseToken = function(data, token) {
	var returnData = {success: true, token: token};
	if (data.res != undefined) data.res.json(returnData);
	if (data.socket != undefined) util.responseToSender(data.socket, data.socketName, returnData);
}

exports.basicInfoResult = function(data) {
	if ( memory.member.id[data.session.id] == undefined ) {
		if (data.socket != undefined) {
			util.responseError(data.socket, data.socketName, {action: data.action, error: 'MBR0005', errorMessage: util.i18n(data.session.local, 'Member Data not found'), info: {} });
			util.responseToSender(socket, 'logout', {});
		}
		else {
			if (data.res != undefined) data.res.json({success: false, error: 'SOL', errorMessage: 'Allow for Socket.io Only'});
		}
	}
	else {
		var object = memory.member.id[data.session.id];
		var result = {
			name: object.firstname == undefined ? (object.nickname == undefined ? object.username : object.nickname) : object.firstname,
			memberType: util.i18n(data.session.local, 'role-'+object.memberType)
		}
		if (data.socket != undefined) util.responseToSender(data.socket, data.socketName, { success: true, result: result });
	}
}

exports.roleResult = function(data) {
	if ( memory.member.id[data.session.id] == undefined ) {
		if (data.socket != undefined) {
			util.responseError(data.socket, data.socketName, {action: data.action, error: 'MBR0005', errorMessage: util.i18n(data.session.local, 'Member Data not found'), info: {} });
			util.responseToSender(socket, 'logout', {});
		}
		else {
			if (data.res != undefined) data.res.json({success: false, error: 'SOL', errorMessage: 'Allow for Socket.io Only'});
		}
	}
	else {
		if (memory.member.id[data.session.id].roleList == undefined) {
			data.command = 'sp_MemberTypeData '+data.session.id;
			util.query(this.loadRole, data);
		}
		else {
			var result = util.translateRoleList(data.session.local, memory.member.id[data.session.id].roleList);
			if (data.socket != undefined) util.responseToSender(data.socket, data.socketName, { success: true, result: result, memberType: memory.member.id[data.session.id].memberType });
		}
	}
}

exports.loadRole = function(recordset, data) {
	memory.member.id[data.session.id].roleList = [];
	for(i=0; i<recordset.length; i++){
		memory.member.id[data.session.id].roleList.push(recordset[i].memberType);
	}
	var result = util.translateRoleList(data.session.local, memory.member.id[data.session.id].roleList);
	if (data.socket != undefined) util.responseToSender(data.socket, data.socketName, { success: true, result: result, memberType: memory.member.id[data.session.id].memberType });
}

exports.roleChangeResult = function(data) {
	if (memory.member.id[data.session.id].roleList != undefined && memory.member.id[data.session.id].roleList.indexOf(data.role) > -1){
		memory.member.id[data.session.id].memberType = data.role;
		if (data.socket != undefined && memory.member.id[data.session.id].sessionList != undefined) {
			var result = util.translateRoleList(data.session.local, memory.member.id[data.session.id].roleList);
			util.responseToSender(data.socket, 'api-member-role', { success: true, result: result, memberType: data.role });
			if ( memory.member.id[data.session.id].sessionList.length > 1 ) {
				util.emitToMemberIdExceptSender(data.session.id, data.socket.id, 'reload-member-role', {});
			}
		}
		data.command = 'sp_MemberTypeUpdate '+data.session.id+', \''+data.role+'\'';
		util.execute(data);
	}
}

exports.screenResult = function(data) {
	if (memory.member.id[data.session.id].roleList != undefined && memory.member.id[data.session.id].roleList.indexOf(data.role) > -1){
		if (memory.memberScreen == undefined) memory.memberScreen = {};
		if (memory.memberScreen[data.role] != undefined) {
			this.loadScreen(null, data);
		}
		else {
			data.command = 'sp_MemberScreenData \''+data.systemId+'\', \''+memory.member.id[data.session.id].memberType+'\'';
			util.query(this.loadScreen, data);
		}
	}
}

exports.loadScreen = function(recordset, data) {
	if (recordset != null) memory.memberScreen[data.role] = recordset;
	if (data.socket != undefined) {
		var result = util.translateScreen(data.session.local, memory.memberScreen[data.role]);
		util.responseToSender(data.socket, data.socketName, { success: true, result: result });
		/*if ( memory.member.id[data.session.id].sessionList.length > 1 ) {
			util.emitToMemberIdExceptSender(data.session.id, data.socket.id, 'reload-member-screen', {});
		}*/
	}
}

exports.infoResult = function(socket, name, data, object) {
	/*if ( object == null ) {
		util.responseError(socket, name, {action: data.action, error: 'MBR0005', errorMessage: clientSocket[data.socket.id].i18n.__('Member Data not found')+' (ID '+clientSocket[data.socket.id].id+')', info: data });
		util.responseToSender(socket, 'logout', { access: false });
	}
	else {
		object.id = clientSocket[data.socket.id].id;
		object.memberType = clientSocket[data.socket.id].i18n.__('role-'+object.memberType);
		/*var moment = require('moment');
		moment.locale(clientSocket[data.socket.id].local);
		object.registerDate = moment(object.registerDate);* /
		delete object.password;
		util.responseToSender(socket, name, { success: true, result: object });
	}*/
}