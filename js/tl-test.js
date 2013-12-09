(function(aGlobal) {
	'use strict';
	
	var gTL1 = null;
	
	function doWidgetTest() {
		gTL1 = new mobmap.TimelineBar();
		
		var container = document.getElementById('tl-container-1');
		container.appendChild(gTL1.element);

		var startTimeObj = new Date(2013, 7, 10,  0, 0);
		var endTimeObj = new Date(2013, 7, 12,  10, 0);
		console.log("Test Range\n", startTimeObj, "\n", endTimeObj);
		
		var t1 = Math.floor( startTimeObj.getTime() / 1000.0 );
		var t2 = Math.floor( endTimeObj.getTime() / 1000.0 );
		console.log(t1, t2);
		gTL1.setTimeRange(t1, t2);
	}
	
	aGlobal.doWidgetTest = doWidgetTest;
})(window);