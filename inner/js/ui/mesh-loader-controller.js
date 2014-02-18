if (!window.mobmap) { window.mobmap={}; }

(function(aGlobal) {
	'use strict';

	function MeshLoaderController(listener) {
		this.listener = listener;
		this.meshLoader = null;
		this.meshData = null;
		this.meshLayer = null;
		
		this.targetProject = null;
	}

	MeshLoaderController.prototype = {
		setTargetProject: function(pj) {
			this.targetProject = pj;
		},
		
		setLayer: function(lyr) {
			this.meshLayer = lyr;
		},
		
		loadFile: function(targetFile) {
			this.meshLoader = new mobmap.MeshCSVLoader(targetFile);
			this.meshData = new mobmap.MeshData();

			if (this.meshLayer) {
				this.meshLayer.sourceLoader = this.meshLoader;
				this.meshLayer.setMeshData(this.meshData);
			}

			this.meshLoader.preload(this);
			return this.meshData;
		},
		
		// Preload callbacks
		csvloaderAfterPreloadFinish: function(loader) {
			console.log("+ Preload finished, lc=",loader.countLines());
			this.meshLoader.readMetadata();
			
			if (this.meshLoader.isValidType()) {
				this.meshLoader.readRestContentAsync(this);
			}
		},
		
		csvloaderPreloadError: function(e) {
			console.log(e);
			
		},
		
		// Content loader callbacks
		
		meshloaderNewRecordLoaded: function(tSeconds, latIndex, lngIndex, value) {
			this.meshData.register(tSeconds, latIndex, lngIndex, value);
			console.log("New Record:", latIndex, lngIndex, "=>", value, "at", tSeconds);
		},
		
		meshloaderLoadFinish: function() {
			if (this.listener && this.listener.meshldrctrl_AfterLoadFinish) {
				this.listener.meshldrctrl_AfterLoadFinish(this);
			}
			
			if (this.meshLayer) {
				this.meshLayer.afterLoadFinish();
			}
		}
	};

	aGlobal.mobmap.MeshLoaderController = MeshLoaderController;
})(window);