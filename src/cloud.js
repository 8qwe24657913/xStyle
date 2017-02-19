var SYNC_TYPE = {
	"Microsoft": 'OneDrive'
};
browser.runtime.sendMessage({"method": 'getSync'}).then(function(response) {
	console.log(response);
	if (response === null) {
		document.getElementById('sync-disconnected').style.display = "block";
		document.getElementById('sync-connected').style.display = "none";
		for (var k in SYNC_TYPE) {
			var newElement = document.createElement('button');
			newElement.type = "button";
			newElement.setAttribute('data-type', k);
			newElement.className = 'btn btn-sm btn-default';
			newElement.innerHTML = SYNC_TYPE[k];
			document.getElementById('sync-disconnected').appendChild(newElement);
		}
		document.getElementById('sync-disconnected').querySelectorAll(button).addEventListener("click", syncLogin, false);
	} else {
		document.getElementById('sync-connected').style.display = "block";
		document.getElementById('sync-disconnected').style.display = "none";
		document.getElementById('sync-connected').innerHTML = t('cloudSyncConnected', [SYNC_TYPE[response]]);
		var newElement = document.createElement('button');
		newElement.type = "button";
		newElement.className = 'btn btn-sm btn-default';
		newElement.innerHTML = t('exit');
		document.getElementById('sync-connected').appendChild(newElement);
	}
});


function syncLogin(e) {
	var type = e.target.getAttribute('data-type');
	var syncClass = 'sync' + type;
	window[syncClass]
}

function loadSyncedFileList() {

}