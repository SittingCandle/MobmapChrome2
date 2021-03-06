var theApp = null;
(function(aGlobal) {
	var gmap_ready = false;

	// Entry point for the app
	function main() {
		waitGoogleMaps();
	}

	function mmGmapInitialized() {
		gmap_ready = true;
	}
	
	function waitGoogleMaps() {
		if (gmap_ready) {
			startApp();
		} else {
			setTimeout(waitGoogleMaps, 50);
		}
	}
	
	function startApp() {
		mobmap.installMobLayer();
		mobmap.installMeshOverlay();
		$('#content-pane').empty();
		observeMessage();
		
		var appScreen = new mobmap.Mobmap3PanesScreen(
							'mobmap-panes-view',
							'body-pane',
							'tools-pane'
						);
						
		theApp = new mobmap.Mobmap2App(appScreen);
	}

	function observeMessage() {
		window.addEventListener("message", onReceiveMessage, false);
	}
	
	function onReceiveMessage(e) {
		if (!e.data) {return;}
		if (e.data.indexOf('{') < 0) {return;}

		var dat = JSON.parse(e.data);

		if (dat.command) {
			var method_name = 'onMessage_' + dat.command;
			if (theApp[method_name]) {
				theApp[method_name](dat.params);
			} else {
				console.log("Message handler not found: " + method_name);
			}
		}
	}

	// Hook
	window.onload = main;

	aGlobal.mmGmapInitialized = mmGmapInitialized;
})(window);