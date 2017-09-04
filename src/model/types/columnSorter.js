sap.ui.define([
	"sap/ui/model/SimpleType"
], function (SimpleType) {
	"use strict";
	return SimpleType.extend("com.siemens.tableViewer.model.types.columnSorter", {
		/**
		 * Formats for the ui representation
		 * @param sValue
		 * @returns {*}
		 */
		formatValue: function (sValue) {
			if (sValue === 0) {
				return null;
			}
			return sValue === 2 ? 'Descending' : 'Ascending';

		},
		/**
		 * Parsing for writing back to the model
		 * This method receives the user’s input as a parameter.
		 * This method’s job is to convert the user’s value (external value) into a
		 * suitable internal representation of the value (internal value).
		 * @param sValue
		 * @returns {number}
		 */
		parseValue: function (sValue) {
			if (!sValue) {
				return 0;
			}
			return sValue === 'Descending' ? 2 : 1;

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
