if (!window.mobmap) { window.mobmap={}; }

(function(aGlobal) {
	'use strict';
	var kGradientCanvasWidth = 1024;
	
	function GradientEditor(boundGradient) {
		this.element = document.createElement('div');
		this.jElement = $( this.element );
		this.boundGradient = boundGradient;
		this.stopListView = new GradientStopListView();
		
		this.previewHeight = 10;
		this.previewWidth = 100;
		this.previewPadding = 4;
		
		this.previewCanvas = document.createElement('canvas');
		this.previewCanvasG = this.previewCanvas.getContext('2d');
		this.element.appendChild(this.previewCanvas);
		this.element.appendChild(this.stopListView.element);

		this.smallPreviewCanvas = document.createElement('canvas');
		this.smallPreviewCanvasG = this.smallPreviewCanvas.getContext('2d');

		this.gradientCanvas = document.createElement('canvas');
		this.gradientCanvasG = this.gradientCanvas.getContext('2d');
		
		this.previewCanvas.setAttribute('class', 'mm-gradient-editor-preview');
		this.configureCanvas();
		this.redraw();
		this.sendColorList();
		
		this.syncFromModel();
	}
	
	GradientEditor.prototype = {
		getPreviewElement: function() {
			return this.smallPreviewCanvas;
		},
		
		sendColorList: function() {
			this.boundGradient.cachedColorList.makeCacheFromCanvas( this.gradientCanvas );
		},
		
		configureCanvas: function() {
			this.gradientCanvas.width = kGradientCanvasWidth;
			this.gradientCanvas.height = 4;
			
			this.previewCanvas.width = this.previewWidth + (this.previewPadding << 1);
			this.previewCanvas.height = this.previewHeight + (this.previewPadding << 1);

			this.smallPreviewCanvas.width = this.previewWidth + 2;
			this.smallPreviewCanvas.height = this.previewHeight + 2;
		},
		
		redraw: function() {
			this.updateGradientCanvas();
			this.renderPreview();
			this.renderSmallPreview();
		},

		renderSmallPreview: function() {
			var w = this.previewWidth;
			var h = this.previewHeight;
			var g = this.smallPreviewCanvasG;
			g.clearRect(0, 0, w+2, h+2);
			g.fillStyle = 'rgba(0,0,0,0.5)';
			g.fillRect(0, 0, w+2, h+2);
			g.fillStyle = 'rgba(255,255,255,0.5)';
			g.fillRect(1, 1, w, h);

			g.drawImage(this.gradientCanvas, 0, 0, this.gradientCanvas.width - 0, 4,
				        1, 1, w, h);	
		},
		
		renderPreview: function() {
			this.clearPreview();
			var w = this.previewWidth;
			var h = this.previewHeight;
			var pad = this.previewPadding;
			
			var g = this.previewCanvasG;
			g.fillStyle = 'rgba(0,0,0,0.5)';
			g.fillRect(this.previewPadding-1, this.previewPadding-1, w+2, h+2);
			g.fillStyle = 'rgba(255,255,255,0.5)';
			g.fillRect(pad, pad, w, h);
			
			g.drawImage(this.gradientCanvas, 0, 0, this.gradientCanvas.width - 0, 4,
				        pad, pad, w, h);
				
			this.drawStopCursorsOnBar(g, pad, pad, w, this.boundGradient);
		},
		
		clearPreview: function() {
			var w = this.previewCanvas.width - 0;
			var h = this.previewCanvas.height - 0;
			this.previewCanvasG.clearRect(0, 0, w, h);
		},
		
		updateGradientCanvas: function() {
			var g = this.gradientCanvasG;
			var gr = g.createLinearGradient(0, 0, kGradientCanvasWidth, 0);
			this.registerGradientStops(gr, this.boundGradient);
			
			g.fillStyle = gr;
			g.fillRect(0, 0, kGradientCanvasWidth, 4);
		},
		
		registerGradientStops: function(gr, source) {
			var len = source.countStops();
			for (var i = 0;i < len;++i) {
				var stopColor = source.getStopAsHTMLColor(i);
				gr.addColorStop( source.getStopPosition(i) , stopColor);
			}
		},
		
		drawStopCursorsOnBar: function(g, ox, oy, bar_width, gradientSource) {
			var len = gradientSource.countStops();
			for (var i = 0;i < len;++i) {
				var t =  gradientSource.getStopPosition(i) / (len-1);
				var sc = gradientSource.getStopAsHTMLColor(i);
				var bx = Math.floor((bar_width-1) * t);
				
				this.drawStopCursor(g, ox + bx, oy, this.previewHeight-1, sc);
			}
		},
		
		drawStopCursor: function(g, x, y, h, stopColor) {
			g.save();
			g.translate(x, y);
			
			g.fillStyle = 'rgba(0,0,0,0.6)';
			g.fillRect(-1, -1, 3, h+1);
			g.fillRect(-2, h-1, 5, 5);
			g.fillStyle = '#fff';
			g.fillRect(0, 0, 1, h);
			g.fillStyle = '#aaa';
			g.fillRect(-1, h, 3, 3);
			g.fillStyle = stopColor;
			g.fillRect(-1, h, 3, 3);
			
			g.restore();
		},
		
		syncFromModel: function() {
			var dirty = false;
			var gr = this.boundGradient;
			var len = gr.countStops();
			
			var currentViewLength = this.stopListView.countStops();
			if (len !== currentViewLength) {
				// fast-pass
				// It must be dirty.
				dirty = true;
			} else {
				// slow-pass
				// Check inside.
				for (var i = 0;i < len;++i) {
					if ( !( this.stopListView.hasEqualStop(i, gr.getAt(i)) ) ) {
						dirty = true;
						break;
					}
				}
			}
			
			if (dirty) {
				this.stopListView.syncFrom(gr);
			}
		}
	};


	function GradientStopListView() {
		this.element = $H('table');
		this.items = [];
	}

	GradientStopListView.prototype = {
		countStops: function() {
			return this.items.length;
		},
		
		hasEqualStop: function(index, stop) {
			var item = this.items[index];
			if (!item) {return false;}
			
			return item.stopData.equals(stop);
		},
		
		addStopItem: function() {
			var item = new GradientStopListViewItem(this);
			this.element.appendChild(item.element);
			this.items.push(item);
		},
		
		clear: function() {
			var len = this.items.length;
			for (var i = 0;i < len;++i) {
				var item = this.items[0];
				this.remove(item);
			}
		},
		
		remove: function(item) {
			var index = this.items.indexOf(item);
			if (index >= 0) {
				this.element.removeChild(item.element);
				this.items.splice(index, 1);
			}
		},
		
		syncFrom: function(sourceGradient) {
			if (this.countStops() === sourceGradient.countStops()) {
				
			} else {
				this.rebuildFrom(sourceGradient);
			}
		},
		
		rebuildFrom: function(sourceGradient) {
			this.clear();
			console.log("rebuild");
		}
	};


	function GradientStopListViewItem(owner) {
		this.owner = owner;
		this.element = $H('tr');
		this.stopData = new MMGradientStop(0, 0, 0, 0, 0);
		this.buildView();
	}

	GradientStopListViewItem.prototype = {
		buildView: function() {
			var td1 = $H('td');
			this.element.appendChild(td1);
			
			td1.innerHTML = "Color picker";
		}
	};


	aGlobal.mobmap.GradientEditor = GradientEditor;
})(window);