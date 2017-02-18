var syncMicrosoft = {
	"client_id": 'd742c0ec-f3ba-4ce9-949a-56507e86ca98',
	"scope": 'openid,onedrive.readwrite,onedrive.appfolder',
	"api_url": 'https://api.onedrive.com/v1.0/',
	"makeLoginState": function() {
		var string = Math.random().toString(36).replace(/(\W)/g, '').substr(0, 6);
		sessionStorage.setItem('msState', string);
	},
	"getLoginState": function() {
		return sessionStorage.getItem('msState');
	},
	"getLoginUrl": function() {
		var url = 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=' + this.client_id + '&response_type=code&redirect_uri=https://login.microsoftonline.com/common/oauth2/nativeclient&response_mode=query&scope=' + this.scope + '&state=' + this.makeLoginState();
		return url;
	},
	"isLoginCallback": function(url) {
		if (url.indexOf('https://login.microsoftonline.com/common/oauth2/nativeclient') !== 0) {
			return false;
		}
		if (url.indexOf('state=' + this.getLoginState()) < 0) {
			return false;
		}
		return true;
	},
	"loginCallback": function(url) {
		var _this = this;
		var callback = function(response) {
			var user_info = JSON.parse(response);
			user_info.expires_at = new Date().getTime() + (user_info.expires_in * 1000);
			localStorage.setItem('microsoft', JSON.stringify(user_info));
			_this.initFloder();
		};
		var xhr = new XMLHttpRequest();
		xhr.onreadystatechange = function() {
			if (xhr.readyState == 4) {
				if (xhr.status >= 400) {
					callback(null);
				} else {
					callback(xhr.responseText);
				}
			}
		};
		xhr.open("POST", 'https://login.microsoftonline.com/common/oauth2/v2.0/token', true);
		xhr.setRequestHeader("Content-type","application/x-www-form-urlencoded");
		xhr.send('client_id=' + this.client_id + '&scope=' + this.scope + '&code=' + url.match(/code=(.*?)&/)[1] + '&redirect_uri=' + encodeURIComponent('https://login.microsoftonline.com/common/oauth2/nativeclient') + '&grant_type=authorization_code');
	},
	"getUser": function() {
		var _this = this;
		return new Promise(function(resolve){
			var user_info = localStorage.getItem('microsoft', user_info);
			if (user_info === null) {
				resolve(null);
			}
			user_info = JSON.parse(user_info);
			if (user_info.expires_at >= new Date().getTime()) {
				//reload the token
				var callback = function(response) {
					var uinfo = JSON.parse(response);
					uinfo.expires_at = new Date().getTime() + (uinfo.expires_in * 1000);
					localStorage.setItem('microsoft', JSON.stringify(uinfo));
					resolve(uinfo.access_token);
				};
				var xhr = new XMLHttpRequest();
				xhr.onreadystatechange = function() {
					if (xhr.readyState == 4) {
						if (xhr.status >= 400) {
							callback(null);
						} else {
							callback(xhr.responseText);
						}
					}
				};
				xhr.open("POST", 'https://login.microsoftonline.com/common/oauth2/v2.0/token', true);
				xhr.setRequestHeader("Content-type","application/x-www-form-urlencoded");
				xhr.send('client_id=' + _this.client_id + '&scope=' + _this.scope + '&refresh_token=' + user_info.refresh_token + '&redirect_uri=' + encodeURIComponent('https://login.microsoftonline.com/common/oauth2/nativeclient') + '&grant_type=refresh_token');
			}
			resolve(user_info.access_token);
		});
	},
	"handleSync": function(syncContent) {
		var _this = this;
		var filename;
		var content = '';
		switch (syncContent.type) {
			case 'setting':
				filename = 'setting.json';
				content = JSON.stringify(syncContent.content);
				break;
			case 'style':
				filename = 'style-' + syncContent.style.id + '.json';
				content = JSON.stringify(syncContent.style);
				break;
		}
		return new Promise(function(resolve){
			_this.uploadFile(filename, content).then(resolve);
		});
	},
	"callApi": function(apiUrl, apiData, apiMethod) {
		var _this = this;
		if (apiMethod === null || apiMethod === undefined) {
			apiMethod = 'GET';
		}
		return new Promise(function(resolve){
			_this.getUser().then(function(token) {
				var xhr = new XMLHttpRequest();
				xhr.onreadystatechange = function() {
					if (xhr.readyState == 4) {
						var content = xhr.responseText;
						if (content.substr(0, 1) === '{' || content.substr(0, 1) === '[') {
							content = JSON.parse(content);
						}
						resolve(content);
					}
				};
				xhr.open(apiMethod, _this.api_url + apiUrl, true);
				xhr.setRequestHeader("Content-type","application/x-www-form-urlencoded");
				xhr.setRequestHeader("Authorization", "bearer " + token);
				var sendData = apiData;
				if (typeof(apiData) === 'object') {
					sendData = JSON.stringify(apiData);
				}
				xhr.send(sendData);
			});
		});
	},
	"initFloder": function() {
		var url = 'drive/special/approot/children';
		var _this = this;
		this.callApi(url).then(function(response) {
			var makeInit = true;
			for (var i in response.value) {
				if (response.value[i].name == 'xstyle') {
					makeInit = false;
					break;
				}
			}
			if (makeInit) {
				_this.callApi('drive/special/approot/children', {"name":"xstyle","folder":{}}, 'POST');
			}
		});
	},
	"uploadFile": function(filename, content) {
		var _this = this;
		return new Promise(function(resolve){
			_this.callApi('drive/special/approot:/xstyle/' + filename + ':/content', content, 'PUT').then(resolve);
		});
	},
	"getFile": function(filename) {
		var _this = this;
		return new Promise(function(resolve){
			_this.callApi('drive/special/approot:/xstyle/' + filename + ':/content', '', 'GET').then(resolve);
		});
	}
}