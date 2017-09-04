sap.ui.define([
	"sap/ui/model/odata/v2/ODataTreeBinding"
], function(ODataTreeBinding) {
	"use strict";
	ODataTreeBinding.prototype.hasChildren = function(oContext) {
		if (this.bHasTreeAnnotations) {
			if (!oContext) {
				return false;
			}
			var sDrilldownState = oContext.getProperty(this.oTreeProperties["hierarchy-drill-state-for"]);
			var sHierarchyNode = oContext.getProperty(this.oTreeProperties["hierarchy-node-for"]);
			var iLength = this.oLengths[sHierarchyNode];

			// if the server returned no children for a node (even though it has a DrilldownState of "expanded"),
			// the length for this node is set to 0 and finalized -> no children available
			if (iLength === 0 && this.oFinalLengths[sHierarchyNode]) {
				return false;
			}
			sDrilldownState = sDrilldownState === 0 ? "expanded" : "leaf";
			// leaves do not have childre, only "expanded" and "collapsed" nodes
			// Beware: the drilldownstate may be undefined/empty string,
			//         in case the entity (oContext) has no value for the drilldown state property
			if (sDrilldownState === "expanded" || sDrilldownState === "collapsed") {
				return true;
			} else if (sDrilldownState === "leaf"){
				return false;
			} else {
				jQuery.sap.log.warning("The entity '" + oContext.getPath() + "' has not specified Drilldown State property value.");
				//fault tolerance for empty property values (we optimistically say that those nodes can be expanded/collapsed)
				if (sDrilldownState === undefined || sDrilldownState === "") {
					return true;
				}
				return false;
			}
		} else {
			if (!oContext) {
				return this.oLengths[this.getPath()] > 0;
			}
			var iLength = this.oLengths[oContext.getPath() + "/" + this._getNavPath(oContext.getPath())];

			//only return false if we definitely know that the length is 0, otherwise, we have either a known length or none at all (undefined)
			return iLength !== 0;
		}
	};
	return ODataTreeBinding;
});