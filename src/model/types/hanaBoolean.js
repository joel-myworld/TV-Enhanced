sap.ui.define([
	"sap/ui/model/SimpleType"
], function (SimpleType) {
	"use strict";
	return SimpleType.extend("com.siemens.tableViewer.model.types.hanaBoolean", {
		/**
		 * Formats for the ui representation
		 * @param sValue
		 * @returns {boolean}
		 */
		formatValue: function (sValue) {
			return sValue == 1;
		},
		/**
		 * Parsing for writing back to the model
		 * This method receives the user’s input as a parameter.
		 * This method’s job is to convert the user’s value (external value) into a
		 * suitable internal representation of the value (internal value).
		 * @param sValue
		 * @param sInternalType
		 * @returns {number}
		 */
		parseValue: function (sValue) {
			return sValue === true ? 1 : 0;
		},
		/**
		 * Validates the value to be parsed
		 * @param sValue
		 * @returns {*}
		 */
		validateValue: function (sValue) {
			return sValue;
		}

	});
});
