/*!
 * Copyright 2017 Siemens AG
 */
sap.ui.define([
	"sap/ui/Device"
], function (Device) {
	"use strict";

	var sCompactCozyClass = Device.support.touch ? "" : "sapUiSizeCompact";

	/**
	 * Table Viewer utilities
	 * com.siemens.tableViewer.controller.utilities
	 */
	return {
		/**
		 * Get Content Density class based on device.
		 * @returns {string} Compact/Cozy CSS Class name
		 */
		getContentDensityClass: function () {
			return sCompactCozyClass;
		},

		/**
		 * Attach Density class to the control
		 * @param {sap.ui.core.mvc.View} oView - view instance
		 * @param {sap.ui.core.Control} oControl - UI5 control
		 * @return {void}
		 */
		attachControl: function (oView, oControl) {
			if (sCompactCozyClass) {
				jQuery.sap.syncStyleClass(sCompactCozyClass, oView, oControl);
			}
			oView.addDependent(oControl);
		}
	};
});
