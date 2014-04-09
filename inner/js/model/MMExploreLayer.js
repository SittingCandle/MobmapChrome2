if (!window.mobmap) { window.mobmap={}; }

(function(aGlobal) {
	'use strict';
	
	function MMExploreLayer() {
		this.layerId = mobmap.layerGetNextId();
		this.jElement = $(document.createElement('span'));
		this.overlayViewType = mobmap.ExploreMapType.ViewType.Trajectory;
		this.ownerList = null;
		this.visible = true;
		this.primaryView = null;
		this.capabilities = mobmap.LayerCapability.FixOnBottom | mobmap.LayerCapability.ExploreOtherLayer;
		this.dataTimeRange = {
			start: 0,
			end: 0
		};
		
		this._lvObserved = false;
		this._markerOptions = null;
		this._lctrlObserved = false;
		this.dataReady = false;
		this.sourceLoader = null;
		
		this.targetLayerId = -1;
	}
	
	MMExploreLayer.prototype = {
		hasTimeRange: function() {
			return false;
		},
		
		setTargetLayerId: function(layer_id) {
			if (this.targetLayerId !== layer_id) {
				this.targetLayerId = layer_id;
				this.fireTargetSet(layer_id);
			}
		},
		
		setOverlayViewType: function(v) {
			if (this.overlayViewType === v) {
				return;
			}
			
			this.overlayViewType = v;
			this.eventDispatcher().trigger(mobmap.LayerEvent.ExploreViewTypeChange, [this, v]);
		},

		fireTargetSet: function(newTargetId) {
			this.eventDispatcher().trigger(mobmap.LayerEvent.ExploreTargetSet, [this, newTargetId]);
		}
	};
	
	mobmap.InstallMMLayerBaseMethods(MMExploreLayer.prototype);
	aGlobal.mobmap.MMExploreLayer = MMExploreLayer;
})(window);