if (!window.mobmap) { window.mobmap={}; }

(function(aGlobal) {
	'use strict';
	
	function MarkerGenerator() {
		this.options = new MarkerGeneratorOptions();
		
		this.previewCanvas = document.createElement('canvas');
		this.resultCanvas = document.createElement('canvas');
		this.previewCanvas.setAttribute('class', 'mm-marker-preview-canvas');

		this.previewG = this.previewCanvas.getContext('2d');
		this.resultG = this.resultCanvas.getContext('2d');
		
		this.configureCanvas();
		
		this.testDummyMarkerGenerator();
	}
	
	MarkerGenerator.prototype = {
		configureCanvas: function() {
			var op = this.options;
			var w = op.chipWidth * op.nVariations;
			var h = op.chipHeight * 2;
			
			this.previewCanvas.width = w;
			this.previewCanvas.height = h;
		},
		
		testDummyMarkerGenerator: function() {
			var op = this.options;
			var baseColors = MarkerGenerator.generateRainbowColors(op.nVariations, 220);
		}
	};
	
	MarkerGenerator.generateRainbowColors = function(n, hueMax) {
		var RGBlist = [];
		var tmpC = [0,0,0];
		
		for (var i = 0;i < n;++i) {
			var t = i / (n - 0.99);
			var hue = Math.floor(hueMax * t);
			tmpC[0] = hue;
			tmpC[1] = 1;
			tmpC[2] = 0.8;

			hsvToRGB(tmpC);
			var rgb = new RGBColor(tmpC[0], tmpC[1], tmpC[2]);
			RGBlist.push(rgb);
		}
		
		return RGBlist;
	};
	
	MarkerGenerator.renderDotMarker = function(g) {
		
	};
	
	// --------------
	function MarkerGeneratorOptions() {
		this.jEventElement = $(document.createElement('span'));
		this.reset();
	}
	
	MarkerGeneratorOptions.prototype.reset = function() {
		this.chipWidth = 16;
		this.chipHeight = 16;
		this.nVariations = 4;
	}
	
	aGlobal.mobmap.MarkerGenerator = MarkerGenerator;
	aGlobal.mobmap.MarkerGeneratorOptions = MarkerGeneratorOptions;
})(window);