if (!window.mobmap) { window.mobmap={}; }

(function(aGlobal) {
	'use strict';
	
	function ExploreMapType(ownerMap) {
		this.ownerMap = ownerMap;
		this.ownerObject = null;
		this.tileSize = new google.maps.Size(256, 256);
		this.renderAtlas = new RenderAtlas(this.tileSize, ownerMap);
		this.dataSoure = null;
		google.maps.event.addListener(ownerMap, 'zoom_changed', this.onMapZoomChange.bind(this));
	}
	
	ExploreMapType.prototype.setVisibility = function(v) {
		if (this.renderAtlas.currentVisibility === v) {
			return;
		}

		this.renderAtlas.currentVisibility = v;
		if (v) {
			this.renderAtlas.resetJob();
			this.renderAtlas.reserveJobNext();
		} else {
			this.renderAtlas.clearAllTiles();
		}
	}

	ExploreMapType.prototype.onMapZoomChange = function() {
		this.renderAtlas.invalidateOffscreenCanvas();
		this.renderAtlas.clear();
		this.renderAtlas.resetJob();
		this.renderAtlas.reserveJobNext(true);
	};

	ExploreMapType.installMapType = function(targetGMap) {
		var mt = new ExploreMapType(targetGMap);
		targetGMap.overlayMapTypes.insertAt(0, mt);
		return mt;
	};
	
	ExploreMapType.prototype.getTile = function(coord, zoom, ownerDocument) {
		var tileKey = ExploreMapType.makeTileKey(coord.x, coord.y);
		var tileElement = ownerDocument.createElement('canvas');
		setCanvasSize(tileElement, this.tileSize.width, this.tileSize.height);
		
		//tileElement.style.boxShadow = "0 0 3px rgba(10,90,0,0.5) inset";
		tileElement._cx = coord.x;
		tileElement._cy = coord.y;
		tileElement._lastRenderedIndex = -1;
		tileElement._tileKey = tileKey;

		this.renderAtlas.addTile(tileKey, tileElement);
		this.renderAtlas.setZoom(zoom);

		this.renderAtlas.transferOneTile(tileElement);

		return tileElement;
	};
	
	ExploreMapType.prototype.releaseTile = function(tileToRemove) {
		this.renderAtlas.removeTile(tileToRemove._tileKey);
	};
	
	ExploreMapType.prototype.setDataSource = function(ds) {
		if (this.dataSoure === ds) {
			return;
		}
		
		// Check implementation
		if (ds) {
			checkPolylineDatasourceImplementation(ds);
		}
		
		this.dataSoure = ds;
		this.renderAtlas.clearAllTiles();
		this.renderAtlas.dataSource = ds;
		this.renderAtlas.resetJob();
		this.renderAtlas.reserveJobNext();
	};

	ExploreMapType.makeTileKey = function(cx, cy) {
		return cx +'_'+ cy;
	};




	function RenderAtlas(tileSize, ownerMap) {
		this.currentVisibility = true;
		this.consumeJobClosure = this.consumeJob.bind(this);

		this.jobChunkSize = 900;
		this.jobFinishedCount = 0;
		this.nowJobRunning = false;
		this.nextDelayStartJob = false;
		
		this.tileSize = tileSize;
		this.ownerMap = ownerMap;
		this.canvas = document.createElement('canvas');
		this.tileKeyMap = {};
		this.currentZoom = 1;
		this.dataSource = null;

		this.canvasStatus = {
			minCX:0,maxCX:0,
			minCY:0,maxCY:0,
			width:0,
			height:0
		};

		this.tilesState = {
			minCX:0,maxCX:0,
			minCY:0,maxCY:0
		};

		this.defaultStrokeStyle = '#35d';
		this.renderNodes = false;
	}

	RenderAtlas.prototype = {
		setZoom: function(z) {
			this.currentZoom = z;
		},

		clear: function() {
			var m = this.tileKeyMap;
			for (var k in m) if (m.hasOwnProperty(k)) {
				delete m[k];
			}
		},

		clearAllTiles: function() {
			var w = this.tileSize.width;
			var h = this.tileSize.height;
			
			var m = this.tileKeyMap;
			for (var k in m) if (m.hasOwnProperty(k)) {
				var tileObj = m[k];
				var g = tileObj.getContext('2d');
				
				g.clearRect(0, 0, w, h);
				tileObj._lastRenderedIndex = -1;
			}
		},

		resetJob: function() {
			var g = this.canvas.getContext('2d');
			g.clearRect(0, 0, this.canvasStatus.width, this.canvasStatus.height);

			this.jobFinishedCount = 0;
		},

		invalidateOffscreenCanvas: function() {
			var s = this.canvasStatus;
			s.minCX = s.maxCX = s.minCY = s.maxCY = s.width = s.height = 0;
		},

		addTile: function(tileKey, tileObject) {
			this.tileKeyMap[tileKey] = tileObject;
			this.calcTileBounds();
			this.updateCanvasSize();
		},

		removeTile: function(tileKey) {
			delete this.tileKeyMap[tileKey];
		},

		calcTileBounds: function() {
			var minCX =  99999999;
			var maxCX = -99999999;
			var minCY =  99999999;
			var maxCY = -99999999;

			var m = this.tileKeyMap;
			for (var k in m) if (m.hasOwnProperty(k)) {
				var tileObj = m[k];
				var cx = tileObj._cx;
				var cy = tileObj._cy;

				minCX = Math.min(minCX, cx);
				maxCX = Math.max(maxCX, cx);
				minCY = Math.min(minCY, cy);
				maxCY = Math.max(maxCY, cy);
			}

			this.tilesState.minCX = minCX;
			this.tilesState.maxCX = maxCX;
			this.tilesState.minCY = minCY;
			this.tilesState.maxCY = maxCY;
/*
			console.log('XRange', minCX, maxCX)
			console.log('YRange', minCY, maxCY)
			*/
		},

		updateCanvasSize: function() {
			var needed = this.checkCanvasExpandNeeded();
			if (!needed) {
				return;
			}

			//console.log("REQ");

			var cs = this.canvasStatus;
			var ts = this.tilesState;

			cs.minCX = ts.minCX - 3;
			cs.maxCX = ts.maxCX + 3;
			cs.minCY = ts.minCY - 3;
			cs.maxCY = ts.maxCY + 3;

			var cw = (cs.maxCX - cs.minCX) * this.tileSize.width;
			var ch = (cs.maxCY - cs.minCY) * this.tileSize.height;

			cs.width = Math.floor(cw);
			cs.height = Math.floor(ch);
			setCanvasSize(this.canvas, cs.width, cs.height);

			this.resetJob();
			this.reserveJobNext();
			//console.log(cw,ch)
		},

		checkCanvasExpandNeeded: function() {
			var cs = this.canvasStatus;
			var ts = this.tilesState;

			if (ts.minCX <= cs.minCX || 
				ts.maxCX >= cs.maxCX ||
				ts.minCY <= cs.minCY ||
				ts.maxCY >= cs.maxCY) {
				return true;
			}

			return false;
		},

		consumeJob: function() {
			this.nowJobRunning = false;
			var ds = this.dataSource;
			if (!ds || !this.currentVisibility) {
				return;
			}

			var g = this.canvas.getContext('2d');
			var shouldContinue = false;
			var n = this.jobChunkSize;
			var plCount = ds.tpCountPolylines();
			var plLastIndex = plCount - 1;
			if (this.jobFinishedCount >= plLastIndex) {
				return;
			}

			for (var i = 0;i < n;++i) {
				var nextIndex = this.jobFinishedCount;
				this.renderOffscreen(g, nextIndex);
				//console.log(nextIndex)

				if (++this.jobFinishedCount <= plLastIndex) {
					shouldContinue = true;
				} else {
					break;
				}
			}

			this.transferOffscreenImage();
			if (shouldContinue) {
				this.reserveJobNext();
			}
		},

		reserveJobNext: function(delay) {
			if (delay) {
				this.nextDelayStartJob = true;
			}

			if (!this.nowJobRunning) {
				this.nowJobRunning = true;
				setTimeout(this.consumeJobClosure, this.nextDelayStartJob ? 250 : 1);
				this.nextDelayStartJob = false;
			}
		},

		renderOffscreen: function(g, polylineIndex) {
			var ds = this.dataSource;
			var len = ds.tpCountVerticesOfPolyline(polylineIndex);
			var pj = this.ownerMap.getProjection();
			var wsize = Math.pow(2, this.currentZoom);

			var tw = this.tileSize.width;
			var th = this.tileSize.height;
			var tox = (this.canvasStatus.minCX * tw);
			var toy = (this.canvasStatus.minCY * th);
			//console.log(tox, toy)
			var render_nodes = this.renderNodes;

			g.strokeStyle = this.defaultStrokeStyle;
			g.beginPath();
			for (var i = 0;i < len;++i) {
				var lat = ds.tpGetVertexLatitude(polylineIndex, i);
				var lng = ds.tpGetVertexLongitude(polylineIndex, i);
				var wPos = pj.fromLatLngToPoint( new google.maps.LatLng(lat, lng) );

				var sx = wPos.x * wsize - tox;
				var sy = wPos.y * wsize - toy;

				if (i === 0) {
					g.moveTo(sx, sy);
				} else {
					g.lineTo(sx, sy);
				}

				if (render_nodes) {
					g.fillRect(sx-1, sy-1, 3, 3);
				}
			}

			g.stroke();
		},

		transferOffscreenImage: function() {
			if (!this.currentVisibility) { return; }
			
			var tw = this.tileSize.width;
			var th = this.tileSize.height;
			var ox = this.canvasStatus.minCX;
			var oy = this.canvasStatus.minCY;
			var sourceImage = this.canvas;

			var m = this.tileKeyMap;
			for (var k in m) if (m.hasOwnProperty(k)) {
				var tileObject = m[k];
				var lastRenderedPolylineIndex = this.jobFinishedCount - 1;
				if (tileObject._lastRenderedIndex > lastRenderedPolylineIndex) {
					continue;
				}

				var cx = tileObject._cx;
				var cy = tileObject._cy;
				var g = tileObject.getContext('2d');
				g.clearRect(0, 0, tw, th);

				var rx = cx - ox;
				var ry = cy - oy;
				if (rx < 0 || ry < 0) {
					continue;
				}

				tileObject._lastRenderedIndex = lastRenderedPolylineIndex;
				g.drawImage(sourceImage, rx*tw, ry*th, tw, th, 0, 0, tw, th);
			}
		},

		transferOneTile: function(tileObject) {
			if (!this.currentVisibility) { return; }
			
			var tw = this.tileSize.width;
			var th = this.tileSize.height;
			var ox = this.canvasStatus.minCX;
			var oy = this.canvasStatus.minCY;
			var sourceImage = this.canvas;

			var cx = tileObject._cx;
			var cy = tileObject._cy;
			var g = tileObject.getContext('2d');
			g.clearRect(0, 0, tw, th);

			var rx = cx - ox;
			var ry = cy - oy;
			if (rx < 0 || ry < 0) {
				return;
			}

			tileObject._lastRenderedIndex = this.jobFinishedCount - 1;
			g.drawImage(sourceImage, rx*tw, ry*th, tw, th, 0, 0, tw, th);
		}
	}



	// -- Utilities
	
	function setCanvasSize(el, w, h) {
		var s = el.style;
		s.width = Math.floor(w) + 'px';
		s.height = Math.floor(h) + 'px';
		
		el.width = Math.floor(w);
		el.height = Math.floor(h);
	}
	
	
	var PolylineDatasourceMethods = [
		'tpCountPolylines',
		'tpCountVerticesOfPolyline'
	];
	
	function checkPolylineDatasourceImplementation(obj) {
		for (var i in PolylineDatasourceMethods) {
			var name = PolylineDatasourceMethods[i];
			if (! obj[name] ) {
				throw "Datasource object must implement " + name;
			}
		}
	}

	aGlobal.mobmap.ExploreMapType = ExploreMapType;
})(window);