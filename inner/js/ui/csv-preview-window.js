if (!window.mobmap) { window.mobmap={}; }

(function(aGlobal) {
	'use strict';

	function CSVPreviewWindow() {
		this.element = this.jElement = null;
		// ----------------------------------
		this.buildElements();
	}
	
	CSVPreviewWindow.prototype = {
		buildElements: function() {
			this.element = $H('div');
			this.jElement = $(this.element);
			this.element.id = 'mm-csv-preview-inner';
			document.body.appendChild(this.element);

			this.jElement.show().kendoWindow({
				modal:true,
				pinned: true,
				position: { top: '0px',left: '0px' },
				width: "100%",
				height: "100%",
				visible: false,
				animation: {
				    close: { duration: 200 }
				},
				title: 'CSV Preview'
			});
			
			// Set wrapper ID
			this.jElement.data("kendoWindow").wrapper.attr('id', 'mm-csv-preview-window');
		},
		
		open: function(pickedFile) {
			if (pickedFile) {
				this.jElement.data("kendoWindow").open();
			}
		}
	};

	// +++ Export +++
	aGlobal.mobmap.CSVPreviewWindow = CSVPreviewWindow;
})(window);