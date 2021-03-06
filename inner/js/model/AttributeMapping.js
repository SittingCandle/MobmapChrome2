if (!window.mobmap) { window.mobmap={}; }

(function(aGlobal) {
	'use strict';
	
	function AttributeMapping() {
		this.nameMap = {};
		
		this.colIndexMap = {};
	}
	
	AttributeMapping.prototype = {
		addAttribute: function(name) {
			var a = new RecordAttributeMeta(name);
			this.nameMap[name] = a;
			
			return a;
		},
		
		getAttributeMetadata: function(name) {
			return this.nameMap[name] || null;
		},
		
		setColumnIndex: function(name, index) {
			var a = this.nameMap[name];
			if (a) {
				a.csvColumnIndex = index;
			}
		},
		
		forEachAttribute: function(proc) {
			for (var i in this.nameMap) if (this.nameMap.hasOwnProperty(i)) {
				proc(i, this.nameMap[i]);
			}
		},
		
		isColumnCollided: function(colIndex) {
			var count = 0;
			
			for (var name in this.nameMap) {
				var a = this.nameMap[name];
				if (colIndex === a.csvColumnIndex) {
					++count;
				}
			}
			
			return (count >= 2);
		},
		
		generateColIndexMap: function() {
			this.clearColIndexMap();
			
			for (var name in this.nameMap) {
				var meta = this.nameMap[name];
				this.colIndexMap[ meta.csvColumnIndex ] = meta;
			}
		},
		
		clearColIndexMap: function() {
			for (var i in this.colIndexMap) {
				delete this.colIndexMap[i];
			}
		},
		
		isColumnRegistered: function(idx) {
			return this.colIndexMap.hasOwnProperty(idx);
		},
		
		isColumnNamed: function(idx, name) {
			if ( !this.colIndexMap.hasOwnProperty(idx) ) {
				return false;
			}
			
			var meta = this.colIndexMap[idx];
			return meta.name === name;
		},
		
		getColumnName: function(idx) {
			var meta = this.colIndexMap[idx];
			return meta ? meta.name : null;
		},
		
		// short-hand methods
		isIDColumn:   function(idx) { return this.isColumnNamed(idx, 'id');   },
		isTimeColumn: function(idx) { return this.isColumnNamed(idx, 'time'); },
		isXColumn:    function(idx) { return this.isColumnNamed(idx, 'x');    },
		isYColumn:    function(idx) { return this.isColumnNamed(idx, 'y');    },
		
		convertToColumnType: function(colIndex, rawStr) {
			var meta = this.colIndexMap[colIndex] || null;
			if (meta) {
				switch(meta.dataType) {
				case AttributeType.INTEGER:
					return parseInt(rawStr, 10); break;

				case AttributeType.FLOAT:
				case AttributeType.CFLOAT:
					return parseFloat(rawStr); break;
				}
			}
			
			return rawStr;
		}
	};


	function RecordAttributeMeta(name) {
		this.name = name;
		this.dataType = AttributeType.STRING;
		this.csvColumnIndex = -1;
	}
	
	// +++ Export +++
	aGlobal.mobmap.AttributeMapping = AttributeMapping;
})(window);