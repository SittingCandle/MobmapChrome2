if (!window.mobmap) { window.mobmap={}; }

(function(aGlobal) {
	'use strict';
	
	function PlayController(ownerApp) {
		this.tickAnimationClosure = this.tickAnimation.bind(this);
		this.ownerApp = ownerApp;
		this.playOption = new PlayController.PlayOption();
		this.playSpeed = 0;
		this.animationRunning = false;
		
		this.prevDrawTime = 0;
		this.prevShownDataTime = 0;
	}
	
	PlayController.PresetPlaySpeed = [
		// real sec / movie sec.
		1,
		10,
		60,
		600,
		1800,
		3600,
		3600 * 6,
		3600 * 24
	];

	PlayController.prototype = {
		isPlaying: function() {
			return (this.playSpeed !== 0);
		},
		
		stop: function()     { this.setPlaySpeed(0); },
		play: function()     { this.playWithSpeed(1); },
		playFast: function() { this.playWithSpeed(5); },
		
		playWithSpeed: function(speed_nx) {
			if (this.playSpeed !== speed_nx) {
				this.autoRewindIfNeeded();
			}
			this.setPlaySpeed(speed_nx); 
		},
		
		setPlaySpeed: function(s) {
			if (this.playSpeed !== s) {
				this.initTimerStatus();
			}

			this.playSpeed = s;
			this.runAnimation();
		},
		
		// ------------------------------
		initTimerStatus: function() {
			this.prevDrawTime = now_time();
			var dt = this.ownerApp.getCurrentProjectDateTime();
			
			this.prevShownDataTime = dt.getCurrentTime();
		},
		
		runAnimation: function() {
			if (this.animationRunning) {
				return;
			}
			
			this.animationRunning = true;
			this.tickAnimation();
		},
		
		tickAnimation: function() {
			var needContinue = false;
			var nextTime = 5;
			
			if ( this.playSpeed ) {
				if ( this.processAnimationFrame() ) {
					needContinue = true;
				} else {
					this.stop();
					this.pushStopButton();
				}
			}
			
			if (needContinue) {
				setTimeout(this.tickAnimationClosure, nextTime);
			} else {
				this.animationRunning = false;
			}
		},
		
		pushStopButton: function() {
			var tpane = this.ownerApp.getToolPane();
			tpane.pushStopButton();
		},
		
		processAnimationFrame: function() {
			var curDataTime = this.ownerApp.getCurrentProjectDateTime();

			var cur_t = now_time();
			var dt = cur_t - this.prevDrawTime;
			
			var realt_per_ms = this.playOption.realSecPerPlayerSec / 1000;
			var dDataTime = this.playSpeed * dt * realt_per_ms;
			
			var endTime = this.getEndOfVisibleTimeline();
			var nextDataSec = curDataTime.getCurrentTime() + dDataTime;
			
			var nextTimeIsEnd = (nextDataSec >= endTime);
			
			// Set new time - - - - - -
			curDataTime.setCurrentTime(nextDataSec);
			
			this.prevDrawTime = cur_t;
			return !nextTimeIsEnd;
		},
		
		getEndOfVisibleTimeline: function() {
			return this.ownerApp.getTimelineBar().getViewportEnd();
		},

		getStartOfVisibleTimeline: function() {
			return this.ownerApp.getTimelineBar().getViewportStart();
		},
		
		setOptionRealSecPerPlaySec: function(s) {
			this.playOption.realSecPerPlayerSec = s;
		},
		
		autoRewindIfNeeded: function() {
			var endTime = this.getEndOfVisibleTimeline();
			var startTime = this.getStartOfVisibleTimeline();
			
			var curDataTime = this.ownerApp.getCurrentProjectDateTime();
			var cursec = curDataTime.getCurrentTimeAsInt();
			
			if (cursec >= (endTime - 1)) {
				curDataTime.setCurrentTime(startTime);
				return true;
			}
			
			return false;
		}
	};

	PlayController.getPresetPlaySpeed = function(index) {
		var ps = PlayController.PresetPlaySpeed;
		if (index < 0) {index = 0;}
		if (index >= ps.length) { index = ps.length - 1; }
		
		return ps[index];
	};
	

	PlayController.PlayOption = function() {
		this.realSecPerPlayerSec = 600;
	};

	function now_time() {
		return (new Date()) - 0;
	}

	aGlobal.mobmap.PlayController = PlayController;
})(window);