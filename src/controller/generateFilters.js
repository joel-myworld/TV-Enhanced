/*!
 * Copyright 2017 Siemens AG
 */
sap.ui.define([
   "sap/ui/model/FilterOperator",
   "sap/ui/model/Filter",
   "sap/ui/core/format/DateFormat",
   "com/siemens/tableViewer/model/formatter"
], function (FilterOperator, Filter, DateFormat, formatter) {
	"use strict";

	return {
		/**
		 * Static function to generate filter array from the given field name array and JSON data object
		 *
		 * @param {Array} aFieldNames - array of field names
		 * @param {Object} oData - the JSON object data
		 * @param {Object} mSettings - optional settings used while creating filters
		 * @returns {Array} array of {@link sap.ui.model.Filter}
		 * @public
		 */
		generateFilters: function(aFieldNames, oData, mSettings) {
			var aFilters = [], aArrayFilters = null, oExcludeFilters = null, aExcludeFilters = null, sField = null, oValue = null, oValue1, oValue2, aValue = null, iLen = 0, iFieldLength = 0;
			var oDateFormatSettings, bEnableUseContainsAsDefault, aStringFields, aTimeFields, bUseContains, bIsTimeField, oStringDateFormatter, aStringDates, aStringShortDates, bStringDate, sValue;
			if (mSettings) {
				oDateFormatSettings = mSettings.dateSettings;
				bEnableUseContainsAsDefault = mSettings.useContainsAsDefault; // Using contains for string
				aStringFields = mSettings.stringFields; // Array of string paths
				aTimeFields = mSettings.timeFields; // Array of dates paths
				aStringDates = mSettings.stringDates;
				aStringShortDates = mSettings.stringShortDates;
			}
			if (aFieldNames && oData) {
				iFieldLength = aFieldNames.length;
				while (iFieldLength--) {
					bIsTimeField = false;
					sField = aFieldNames[iFieldLength];
					bUseContains = false;
					if (bEnableUseContainsAsDefault && aStringFields) {
						if (aStringFields.indexOf(sField) > -1) {
							bUseContains = true;
						}
					} else if (aTimeFields && aTimeFields.indexOf(sField) > -1) {
						bIsTimeField = true;
					}
					oValue = oData[sField];
					if (oValue && oValue.hasOwnProperty("low")) {// The data in the model corresponds to low and high Objects
						bStringDate = false;
						if (aStringDates && aStringDates.indexOf(sField) > -1) {
							bStringDate = true;
							oStringDateFormatter = this.getDateTimeInstance(formatter.formatOptions("Date").source.pattern);
						} else if (aStringShortDates && aStringShortDates.indexOf(sField) > -1) {
							bStringDate = true;
							oStringDateFormatter = this.getDateTimeInstance(formatter.formatOptions("MonthDate").source.pattern);
						}
						if (oValue.low && oValue.high) {
							if (bStringDate) {
								oValue1 = oStringDateFormatter.format(typeof oValue.low === "string" ? new Date(oValue.low) : oValue.low);
								oValue2 = oStringDateFormatter.format(typeof oValue.low === "string" ? new Date(oValue.high) : oValue.high);
							} else {
								oValue1 = oValue.low;
								oValue2 = oValue.high;
							}
							if (oDateFormatSettings && oDateFormatSettings.UTC && oValue1 instanceof Date && oValue2 instanceof Date) {
								oValue1 = this.getDateInUTCOffset(oValue1);
								oValue2 = this.getDateInUTCOffset(oValue2);
							}
							aFilters.push(new Filter(sField, FilterOperator.BT, oValue1, oValue2));
						} else if (oValue.low) {
							if (bStringDate) {
								oValue1 = oStringDateFormatter.format(typeof oValue.low === "string" ? new Date(oValue.low) : oValue.low);
							} else {
								oValue1 = oValue.low;
								if (oDateFormatSettings && oDateFormatSettings.UTC) {
									oValue1 = this.getDateInUTCOffset(oValue1);
								}
							}
							aFilters.push(new Filter(sField, FilterOperator.EQ, oValue1));
						}
					} else if (oValue && oValue.hasOwnProperty("items")) {// The data in the model corresponds to multi-value/range with a typed in value
						aArrayFilters = [];
						aExcludeFilters = [];
						oExcludeFilters = null;
						if (oValue && oValue.hasOwnProperty("ranges")) { // Check if the data is for an unrestricted filter
							aValue = oValue.ranges;
							iLen = aValue.length;
							// Range Filters
							while (iLen--) {
								oValue1 = aValue[iLen].value1;
								oValue2 = aValue[iLen].value2;
								if (bIsTimeField) {
									if (oValue1 instanceof Date) {
										oValue1 = this.getEdmTimeFromDate(oValue1);
									}
									if (oValue2 instanceof Date) {
										oValue2 = this.getEdmTimeFromDate(oValue2);
									}
								} else if (oDateFormatSettings && oDateFormatSettings.UTC) {// Check if Date values have to be converted to UTC
									if (oValue1 instanceof Date) {
										oValue1 = this.getDateInUTCOffset(oValue1);
									}
									if (oValue2 instanceof Date) {
										oValue2 = this.getDateInUTCOffset(oValue2);
									}
								}
								if (aValue[iLen].exclude) { // Exclude Select Option is not supported entirely except EQ, which can be changed to NE
									if (aValue[iLen].operation === FilterOperator.EQ) {
										aExcludeFilters.push(new Filter(sField, FilterOperator.NE, oValue1));
									}
								} else {
									if (bUseContains && (aValue[iLen].operation === FilterOperator.Contains || aValue[iLen].operation === FilterOperator.StartsWith || aValue[iLen].operation === FilterOperator.EndsWith)) {
//										sField = "tolower(" + sField + ")";
//										oValue1 = "tolower('" + oValue1 + "')";
										aArrayFilters.push(new Filter("tolower(" + sField + ")", aValue[iLen].operation, "tolower('" + oValue1 + "')", oValue2));
									}else {
										aArrayFilters.push(new Filter(sField, aValue[iLen].operation, oValue1, oValue2));
									}
								}
							}
							if (aExcludeFilters.length) {
								oExcludeFilters = new Filter(aExcludeFilters, true);
							}
						}
						aValue = oValue.items;
						iLen = aValue.length;
						// Item filters
						while (iLen--) {
							if (aValue[iLen].key && aValue[iLen].key === "Hierarchy") {
								aArrayFilters.push(new Filter("QUERY_NODE_NAME", FilterOperator.EQ, aValue[iLen].text));
							}else {
								//sValue = aValue[iLen].key ? aValue[iLen].key : aValue[iLen];
								if (aValue[iLen].key) {
									sValue = aValue[iLen].key;
								}else if (aValue[iLen].text || aValue[iLen].text === "") {
									sValue = aValue[iLen].text;
								}else {
									sValue = aValue[iLen];
								}
								aArrayFilters.push(new Filter(sField, FilterOperator.EQ, sValue));
							}
						}
						// Only ignore "", null and undefined values
						if (oValue.value || oValue.value === 0 || oValue.value === false) {
							if (typeof oValue.value === "string") {
								oValue.value = oValue.value.trim();
							}
							if (oValue.value || oValue.value === 0 || oValue.value === false) {
								if (bUseContains) {
									//sField = "tolower(" + sField + ")";
									//oValue.value = "tolower('" + oValue.value + "')";
									aArrayFilters.push(new Filter("tolower(" + sField + ")", aValue[iLen].operation, "tolower('" + oValue.value + "')"));
								}
								aArrayFilters.push(new Filter(sField, bUseContains ? FilterOperator.Contains : FilterOperator.EQ, oValue.value));
							}
						}

						// OR the array values while creating the filter
						if (aArrayFilters.length) {
							// If Exclude and array (inlcude) filters exists --> use AND between them before pushing to the filter array
							if (oExcludeFilters) {
								aFilters.push(new Filter([
									new Filter(aArrayFilters, false), oExcludeFilters
								], true));
							} else {
								aFilters.push(new Filter(aArrayFilters, false));
							}
						} else if (oExcludeFilters) {
							// Only exclude filters exists --> add to the filter array
							aFilters.push(oExcludeFilters);
						}
					} else if (oValue || oValue === 0 || oValue === false) {// Single Value
						// Only ignore "", null and undefined values
						if (typeof oValue === "string") {
							oValue = oValue.trim();
						}
						if (oValue && oValue instanceof Date) {
							if (bIsTimeField) {
								oValue = this.getEdmTimeFromDate(oValue);
							} else if (oDateFormatSettings && oDateFormatSettings.UTC) {
								oValue = this.getDateInUTCOffset(oValue);
							}
						}
						if (oValue || oValue === 0 || oValue === false) {
							if (bUseContains) {
//								sField = "tolower(" + sField + ")";
//								oValue = "tolower('" + oValue + "')";
								aArrayFilters.push(new Filter("tolower(" + sField + ")", aValue[iLen].operation, "tolower('" + oValue + "')"));
							}
							aFilters.push(new Filter(sField, bUseContains ? FilterOperator.Contains : FilterOperator.EQ, oValue));
						}
					}
				}
			}
			// AND the top level filter attributes if there is more than 1
			return (aFilters.length > 1) ? [
				new Filter(aFilters, true)
			] : aFilters;
		},

		/**
		 * Get Date in UTC Offset
		 * @param {Date} oDate - Date instance
		 * @return {string} - format "yyyy-MM-ddTHH:mm:ss"
		 * @public
		 */
		getDateInUTCOffset: function(oDate) {
			return new Date(oDate.valueOf() - oDate.getTimezoneOffset() * 60 * 1000).toISOString().split(".")[0];
		},

		/**
		 * Parse date to Edm.Time format
		 * @param {Date} oDate - Date instance
		 * @return {string} - format "'PT'HH'H'mm'M'ss'S'"
		 * @public
		 */
		getEdmTimeFromDate: function(oDate) {
			if (!this._oTimeFormat) {
				this._oTimeFormat = DateFormat.getTimeInstance({
					pattern: "'PT'HH'H'mm'M'ss'S'"
				});
			}
			return this._oTimeFormat.format(oDate);
		},

		/**
		 * Get DateTime instance based on pattern
		 * @param {string} sPattern - for example (yyyyMMdd)
		 * @param {object} - DateTime Instance for formatting values
		 */
		getDateTimeInstance: function(sPattern) {
            return DateFormat.getDateTimeInstance({
                pattern: sPattern
            });
        }
	};
});