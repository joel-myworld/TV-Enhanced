sap.ui.define([
	"sap/ui/commons/RangeSlider",
	"sap/ui/layout/HorizontalLayout",
	"sap/m/Input",
	"sap/m/Select",
	"sap/m/Text",
	"com/siemens/tableViewer/model/formatter"
], function (RangeSlider, HorizontalLayout, Input, Select, Text, formatter) {
	"use strict";
	/**
	 * Table Viewer Coloring
	 * com.siemens.tableViewer.controller.Coloring
	 */
	/**
	 * Method to return the range text after selection of range values(value1 and value2), min and max values.
	 * Method to set the dropdown fields based on the available condition range in slider
	 * @param {Number} iValue1 - value from value1 input field
	 * @param {Number} iValue2 -  value from value2 input field
	 * @param {Number} iMin - value from minimum input field
	 * @param {Number} iMax - value from maximum input field
	 * @param {object} oSource - Range Slider in cell config dialog
	 * @param {object} oColorsLyt - layout for colors dropdown
	 * @returns {String} sText - formatted text required for processing cell coloring
	 * @private
	 */
	function cellFormatConditionsFromSlider (iValue1, iValue2, iMin, iMax, oSource, oColorsLyt, oController) {
		var sColumnName = oSource.data("column"),
			oSliderText = getSliderConditions(iValue1, iValue2, iMin, iMax),
			iNoOfRanges = oSliderText.noOfRanges,
			sText = oSliderText.conditions,
			iSelects = 0,
			aContents,
			oModelData = oController.getModel("cellColorsColumnModel").getProperty("/items"),
			aVisibility;
		if (oColorsLyt) {
			aContents = oColorsLyt.getItems();
			for (var iContent = 0; iContent < aContents.length; iContent++) {
				if (aContents[iContent].getVisible()) {
					iSelects++; //number of dropdowns for colors that are visible
				}
			}
			//check if the number of conditions and no. of dropwdowns are same
			if (iSelects !== iNoOfRanges) {
				//if no. of conditions are more than the no. of dropdowns then make the available dropdowns visible to true
				var fnGetColumnData;
				fnGetColumnData = function(oColumn) {
					if (oColumn.COLUMN === sColumnName) {
						oColumn.VISIBILITY = aVisibility;
					}
				};
				aVisibility = getNoVisibleSelectsText(sText);
				oModelData.forEach(fnGetColumnData);
			}
		}
		//cell format condition text
		return sText;
	}
	/**
	 * Method to get the conditions for cell color formatting in the required format (min:slidervalue1&slidervalue1:slidervalue2&slidervalue2:max)
	 * and to get the no. of ranges from the conditions framed
	 * @param {Number} iValue1 - range slider value 1
	 * @param {Number} iValue2 - range slider value 2
	 * @param {Number} iMin - minimum range of range slider
	 * @param {Number} iMax - maximum range of range slider
	 * @return {object} object - no. of ranges and cell format condition string in the object
	 * @private
	 */
	function getSliderConditions (iValue1, iValue2, iMin, iMax) {
		var sText, aConditions;
		//conditions that are possible based on the slider positions accordingly frame the conditions
		if (iValue1 === iValue2 && iValue1 === parseFloat(iMin) && iValue2 < parseFloat(iMax)) { //ivalue=ivalue2=imin
			sText = iValue1 + ":" + iMax;
		} else if (iValue1 === iValue2 && iValue1 > parseFloat(iMin) && iValue2 === parseFloat(iMax)) { //ivalue=ivalue2=imax
			sText = iMin + ":" + iMax;
		} else if (iValue1 === iValue2 && iValue1 > parseFloat(iMin) && iValue2 < parseFloat(iMax)) { //ivalue=ivalue2
			sText = iMin + ":" + iValue1 + "&" + iValue1 + ":" + iMax;
		} else if (iValue1 > parseFloat(iMin)) {
			//then atleast two ranges or more
			sText = iMin + ":" + iValue1;
			if (iValue2 < parseFloat(iMax)) {
				sText = iMin + ":" + iValue1 + "&" + iValue1 + ":" + iValue2 + "&" + iValue2 + ":" + iMax;
			} else {
				if (iValue2 === parseFloat(iMax)) {
					sText = iMin + ":" + iValue1 + "&" + iValue1 + ":" + iMax;
				}
			}
		} else {
			//then only one or two ranges
			if (iValue1 === parseFloat(iMin)) {
				sText = iMin + ":" + iValue2;

				if (iValue2 < parseFloat(iMax)) {
					sText = iMin + ":" + iValue2 + "&" + iValue2 + ":" + iMax;
				} else {
					if (iValue2 === parseFloat(iMax)) {
						sText = iMin + ":" + iMax;
					}
				}

			}
		}
		aConditions = cellConditions(sText);
		return {noOfRanges : aConditions.length, conditions : sText};
	}
	/**
	 * Function to set the visiblity flags for the select dropdown in the fragment. Visiblity flag is set based on the number of ranges in the conditions.
	 * @param {String} sCondition - cell format condition
	 * @returns {Array} aVisibility - array with visibility flags
	 * @private
	 */
	function getNoVisibleSelectsText (sCondition) {
		var aConditions = cellConditions(sCondition),
		aVisibility = [];
		var iNoRanges = aConditions.length;
		if (iNoRanges < 3) {
			var iDelta = 3 - iNoRanges;
		}
		for (var i = 0; i < iNoRanges; i++) {
			aVisibility.push(true);
		}
		if (iDelta !== 0) {
			for (var i = 0; i < iDelta; i++) {
				aVisibility.push(false);
			}
		}
		return aVisibility;
	}
	/**
	 * Helper method to split cell formatting conditions from string to array
	 * @param {string} sConditions - Cell formatting conditions
	 * @returns {Array} aConditions - Array of conditions after split from &
	 * @private
	 */
	function cellConditions (sConditions) {
		var aConditions = [];
		if (sConditions) {
			if (sConditions.match(/([&*])/g) !== null) {
				//multiple conditions
				aConditions = sConditions.split("&");
			} else {
				//single condition
				aConditions.push(sConditions);
			}
		}
		return aConditions;
	}
	return {
	/**
	 * Helper method to apply cell background color by checking the conditions applied on the cell custom data
	 * @param {Array} aCustomData - custom data applied for the labels(template for columns) which has conditions and colors
	 * @param {String} sValue - cell text value
	 * @param {Object} oCell - cell instance
	 * @public
	 */
	applyCellFormatConditions : function (aCustomData, sValue, oCell) {
		var iStart, iLast, iParseStart, iParseValue, iParseLast, oParseValues, fnCheckCellConditions;
		fnCheckCellConditions = function (oCustomData) {
			if (typeof oCustomData.getValue() === "string") {
				//check to see the custom data has ":" as the delimiter. If ":" is there, then there are multiple ranges in a condition else there is only one range
				if ((oCustomData.getValue()).match(/([:*])/g) !== null) {
					//value with range
					//check for type
					iStart = (oCustomData.getValue()).split(":")[0];
					iLast = (oCustomData.getValue()).split(":")[1];
					//check if sValue is numeric or not
					sValue = this.removeCommaFromNumber(sValue);
					oParseValues = this.parseConditionValues(iStart, sValue);
					iParseStart = oParseValues.iParseNum;
					iParseValue = oParseValues.iParseVal;
					oParseValues = this.parseConditionValues(iLast, sValue);
					iParseLast = oParseValues.iParseNum;
					iParseValue = oParseValues.iParseVal;
					if (!isNaN(iParseStart && iParseLast)) {
						//check if iParseStart and iParseLast is greater or lesser
						if (iParseStart > iParseLast) {
							var iTemp = iParseStart;
							iParseStart = iParseLast;
							iParseLast = iTemp;
						}
						return this.compareConditions(iParseValue, iParseStart, iParseLast, oCell, oCustomData.getKey(), "multiple");
					} else if (isNaN(parseFloat(iStart) && parseFloat(iLast))) {
						//for string
						return this.compareConditions(sValue, iStart, iLast, oCell, oCustomData.getKey(), "multiple");
					} else {
						this.setCellBackgroundColor(oCell, "");
						return true;
					}
				} else {
					//single value
					iLast = oCustomData.getValue();
					sValue = this.removeCommaFromNumber(sValue);
					oParseValues = this.parseConditionValues(iLast, sValue);
					if (!isNaN(oParseValues.iParseNum)) {
						//for numeric
						return this.compareConditions(oParseValues.iParseVal, oParseValues.iParseNum, null, oCell, oCustomData.getKey(), "single");
					}
					if (isNaN(parseFloat(iLast))) {
						//for string
						return this.compareConditions(sValue, iLast, null, oCell, oCustomData.getKey(), "single");
					}
				}
			}
		}.bind(this);
		aCustomData.some(fnCheckCellConditions);
	},
	/**
	 * Helper method to compare the values against the conditional values
	 * @param {Number} iValue - value from the cell
	 * @param {Number} iStart - start value range
	 * @param {Number} iLast - end value range
	 * @param {Object} oCell - cell instance
	 * @param {String} sKey - color which will be applied as the background color
	 * @param {String} sType - type of condition, multiple conditions (more than 1 with & delimiter) or single (only 1 without & delimiter)
	 * @returns {Boolean} Boolean true/false - value from the cell falls within the range true else false
	 * @public
	 */
	compareConditions : function (iValue, iStart, iLast, oCell, sKey, sType) {
		if (sType === "multiple") {
			if (iValue >= iStart && iValue <= iLast) {
				this.setCellBackgroundColor(oCell, sKey);
				return true;
			} else {
				this.setCellBackgroundColor(oCell, "");
				return false;
			}
		}else {
			if (iValue === iStart) {
				this.setCellBackgroundColor(oCell, sKey);
				return true;
			} else {
				this.setCellBackgroundColor(oCell, "");
				return false;
			}
		}
	},
	/**
	 * Helper method to parse values to integer or float
	 * @param {Number} iNum - value which is required to be compared against the value from cell
	 * @param {String} sValue - value from the cell
	 * @returns {Object} oParseValue - parsed values
	 * @private
	 */
	parseConditionValues : function (iNum, sValue) {
		var oParseValue = {};
		if (Number(iNum) % 1 === 0) {
			oParseValue.iParseNum = parseInt(iNum, 10);
			oParseValue.iParseVal = parseInt(sValue, 10);
		} else {
			if (Number(iNum) % 1 !== 0) {
				oParseValue.iParseNum = parseFloat(iNum);
				oParseValue.iParseVal = parseFloat(sValue);
			}
		}
		return oParseValue;
	},
	/**
	 * Helper method to apply cell background color
	 * @param {String} - sId of the cell
	 * @param {String} - color to be set as the background for the cell
	 * @returns {Object} object - cell reference
	 * @public
	 */
	setCellBackgroundColor : function (sId, sKey) {
		return jQuery("#" + sId).parent().parent().css("background-color", sKey);
	},
	/**
	 * Helper method to remove comma from value
	 * @param {String} sValue - cell text value
	 * @returns {String} sValue - value without comma
	 * @public
	 */
	removeCommaFromNumber : function (sValue) {
		if (typeof sValue !== "string") {
			sValue = sValue.toString();
		}
		if (sValue.match(/([,*])/g) !== null) {
			if (!isNaN(Number(sValue.split(",").join("")))) {
				sValue = sValue.split(",").join("");
			}
		}
		return sValue;
	},
	/**
	 * Method to get the max and min range values with colon delimiters. Used to get the conditional values for cell formatting feature
	 * @param {Object} oColumn - current column which is cell format enabled
	 * @returns {Object} oValues - values returned after split from colon
	 * @private
	 */
	getColonDelimitValues : function (sRange) {
		var oValues = {iZero : 0, iOne : 0};
		if (sRange) {
			if (sRange.match(/:/) !== null) {
				oValues.iZero = sRange.split(":")[0];
				oValues.iOne = sRange.split(":")[1];
			}
		}
		return oValues;
	},
	/**
	 * Method to get the value1 and value2 for the range slider
	 * @param {Array} aConditions - array of conditions for cell formatting
	 * @returns {Object} object - value1 and value2 for range sliders
	 * @private
	 */
	getConfigRangeValues : function (aConditions) {
		//length defined no. of ranges. At any case, there can be only three ranges for slider
		var iNoRanges = aConditions.length, iValue1, iValue2;
		//set value1 and value2 values and then use it to set to range slider
		if (iNoRanges === 3) { // there are three ranges in condition. The second index of the array contains both the value1 and value2 values for slider.
			iValue1 = aConditions[1].split(":")[0];
			iValue2 = aConditions[1].split(":")[1];
		} else {
			if (iNoRanges === 1) { // there are only one range in condition. value 1 and value 2 will be same as minimum and maximum range of the slider
				iValue1 = aConditions[0].split(":")[0];
				iValue2 = aConditions[0].split(":")[1];
			}

			if (iNoRanges === 2) { // there are two ranges in condition. second value of first index and second value of second index will be the value 1 and value 2 values for the slider
				iValue1 = aConditions[0].split(":")[1];
				iValue2 = aConditions[1].split(":")[1];
			}
		}
		return {iVal1 : iValue1, iVal2 : iValue2};
	},
	/**
	 * Method to prepare labels for range slider by taking minimum and maximum values from the slider
	 * To keep the labels of the slider short by using units for the labels.
	 * @param {Number} iMin - Minimum number of the slider
	 * @param {Number} iMax - Maximum number of the slider
	 * @returns {Array} aLabel - array containing labels
	 * @private
	 */
	getRangeSliderLabels: function(iMin, iMax) {
		var iDifference = 0,
			iQuotient = 0,
			aLabel = [],
			iLeast;
		if (iMax > iMin) {
			iLeast = iMin;
			iDifference = iMax - iMin;
		} else {
			iLeast = iMax;
			iDifference = iMin - iMax;
		}
		//get the quotient to add the next range as the label on the slider
		iQuotient = iDifference / 4;

		for (var i = 0; i <= 4; i++) {
			if (i === 0) {
				//formatter to show the label with the units
				aLabel.push(formatter.formatRangeSliderLabel(iLeast).toString());
			} else {
				//add the previous number with quotient for the next range on the slider
				iLeast = iLeast + iQuotient;
				//formatter to show the label with the units
				aLabel.push(formatter.formatRangeSliderLabel(iLeast).toString());
			}

		}

		return aLabel;
	},
	/**
	 * Function to convert string formatted colors to JSON formatted colors
	 * @param {String} sColors - Colors in string format
	 * @returns {Array} aJSONData - JSON formatted colors
	 * @public
	 */
	getColorsJSONData: function (sColors) {
		var aColors = [], aJSONData = [];
		if (sColors) {
			if (sColors.match(/([,*])/g) !== null) {
				//multiple conditions
				aColors = sColors.split(",");
				for (var iColor = 0; iColor < aColors.length; iColor++) {
					aJSONData.push({key : aColors[iColor], text : aColors[iColor]});
				}
			} else {
				//single condition
				//aColors.push(sColors);
				aJSONData.push({key : sColors, text : sColors});
			}
		}
		//return aColors;
		return aJSONData;
	},
	/**
	 * Method to return the colors split for the conditions for cell coloring
	 * @param {String} sColors - colors with comma separated
	 * @returns {object} aColors - colors that are split and pushed in array
	 * @public
	 */
	getColorsAfterSplit: function (sColors) {
		var aColors = [];
		if (sColors) {
			if (sColors.match(/([,*])/g) !== null) {
				//multiple conditions
				aColors = sColors.split(",");
			} else {
				//single condition
				aColors.push(sColors);
			}
		}
		return aColors;
	},
	/**
	 * Helper method to valid the values entered in Value1, value2, minimum and maximum input field in cell config dialog
	 * @param {String} sValue - value from the source input field
	 * @param {object} oSlider - Range slider in cell config dialog
	 * @param {boolean} isValue - flag to check only for value1 and value2 input field (if true)
	 * @param {boolean} isChechkMax - flag to check for maximum value from the slider
	 * @param {boolean} isCheckMin - flag to check minimum minimum value from the slider
	 * @returns {boolean} true/false - if the values are valid or not
	 * @public
	 */
	isRangeValueValid: function(sValue, oSlider, isValue, isCheckMax, isCheckMin) {
		//check for alphabet is present or not - applicable for both values and range
		if (sValue.match(/^[-+]?[0-9]\d*(\.\d+)?$/) === null) {
			return false;
		}
		//check for value is less than or greater than ranges
		if (isValue) {
			if (isCheckMax) {
				if (parseFloat(sValue) > oSlider.getMax()) {
					return false;
				} else {
					return true;
				}
			}

			if (isCheckMin) {
				if (parseFloat(sValue) < oSlider.getMin()) {
					return false;
				} else {
					return true;
				}
			}

		}

	},
	/**
	 * Format value to float
	 * @param {String} sValue - value for formatting/parsing to float
	 * @public
	 */
	fnParseValue : function (sValue) {
		if (sValue) {
			return parseFloat(sValue);
		}else {
			return sValue;
		}
	},
	/**
	 * Helper method to split cell formatting conditions from string to array
	 * @param {string} sConditions - Cell formatting conditions
	 * @returns {Array} aConditions - Array of conditions after split from &
	 * @public
	 */
	getCellConditions: function (sConditions) {
		return cellConditions(sConditions);
	},
	/**
	 * Method to generate custom conditions for table cells for cell color formatting.
	 * The custom data generated here are used for comparing cells values with cell format conditions from config table and set background color referred from config table
	 * Custom data are with colors as key and conditions as value
	 * @param {Array} aConditions - array of cell format conditions
	 * @param {String} sColors - colors from config table with comma separated
	 * @returns {Array} aCustomData - array of custom data with colors as key and conditions as value
	 * @public
	 */
	getCellCustomData: function (aConditions, sColors) {
		var aColors = [],
			aCustomData = [];
		//split colors string by comma
		if (sColors) {
			aColors = this.getColorsAfterSplit(sColors);
		}
		//if no. of conditions not equal to no. of colors fill empty slots of the array for colors with empty string
		if (aColors !== null && aColors !== undefined && aColors.length !== aConditions.length) {
			var iDelta = 0;
			if (aConditions.length > aColors.length) {
				iDelta = aConditions.length - aColors.length;
			} else {
				iDelta = aColors.length - aConditions.length;
			}

			for (var iEmpty = 0; iEmpty < iDelta; iEmpty++) {
				aColors.push("");
			}
		}
		//prepare custom data with colors as key and conditions as value
		for (var i = 0; i < aConditions.length; i++) {
			aCustomData.push(new sap.ui.core.CustomData({
				key: aColors[i],
				value: aConditions[i]
			}));
		}
		return aCustomData;
	},
	/**
	 * Formatter method to set the item background color and text
	 * @param {String} sColor - Item text
	 * @public
	 * @returns {String} sText - formatted text
	 */
	fnFormatColorText : function (sColor) {
		if (sColor === "#d7eaa2" || sColor === "#c6e17d" || sColor === "#9dc62d" || sColor === "#759422" || sColor === "#5b731a" || sColor === "#80b877" || sColor === "#61a656" || sColor === "b6d957") {
			sColor = "Green";
		} else if (sColor === "#e17b24" || sColor === "#e79651" || sColor === "#b96319" || sColor === "#dd8e07" || sColor === "#fac364") {
			sColor = "Orange";
		} else if (sColor === "#f2d249" || sColor === "#fbd491") {
			sColor = "Yellow";
		} else if (sColor === "#e34352" || sColor === "#d32030" || sColor === "#a71926" || sColor === "#911621") {
			sColor = "Red";
		}
		return sColor;
	},
	/**
	 * Method to return the range text after selection of range values(value1 and value2), min and max values.
	 * Method to set the dropdown fields based on the available condition range in slider
	 * @param {Number} iValue1 - value from value1 input field
	 * @param {Number} iValue2 -  value from value2 input field
	 * @param {Number} iMin - value from minimum input field
	 * @param {Number} iMax - value from maximum input field
	 * @param {object} oSource - Range Slider in cell config dialog
	 * @param {object} oColorsLyt - layout for colors dropdown
	 * @param {Object} oController - reference to table controller
	 * @returns {String} sText - formatted text required for processing cell coloring
	 * @public
	 */
	getCellFormatConditionsFromSlider: function(iValue1, iValue2, iMin, iMax, oSource, oColorsLyt, oController) {
		return cellFormatConditionsFromSlider(iValue1, iValue2, iMin, iMax, oSource, oColorsLyt, oController);
	},
	/**
	 * Event handler for change/livechange of value1 input field that has the value 1 value from the range slider
	 * @param {sap.ui.base.Event} oEvent - Event Parameter
	 * @param {Object} oController - reference to table controller
	 * @public
	 */
	onSliderOneInputValueChange: function(oEvent, oController) {
		var sColumn = oEvent.getSource().data("COLUMN"),
			isValid,
			oRangeSlider,
			sText,
			oValue1 = oEvent.getSource(),
			oValue2,
			fnGetFormContents,
			aContent,
			oColorsLyt;
		if (oEvent.getSource().getValue() === "") {
			oEvent.getSource().setValue(parseFloat(0));
		}
		fnGetFormContents = function(oContent) {
			oRangeSlider = oContent.getItems()[0].getItems()[0].getItems()[0];
			oValue2 = oContent.getItems()[0].getItems()[0].getItems()[1].getItems()[1]; //slider two values
			oColorsLyt = oContent.getItems()[1];
			//check the value entered is valid or not
			isValid = this.isRangeValueValid(oValue1.getValue(), oRangeSlider, true, false, true);
			if (!isValid) {
				//if not valid, set the value1 value to range slider minimum value
				oValue1.setValue(parseFloat(oRangeSlider.getMin()));
			}
			oRangeSlider.setValue(parseFloat(oValue1.getValue()));
			//get the formatted range text and set the custom data
			sText = this.getCellFormatConditionsFromSlider(parseFloat(oValue1.getValue()), parseFloat(oValue2.getValue()), parseFloat(oRangeSlider.getMin()), parseFloat(oRangeSlider.getMax()), oRangeSlider, oColorsLyt, oController);
			oValue1.data("CFORMAT_CONDITION", sText);
			oValue2.data("CFORMAT_CONDITION", sText);
		}.bind(this);
		aContent = this._getColumnFormContainer(sColumn, oController).getFormElements()[0].getFields();
		aContent.forEach(fnGetFormContents);
	},
	/**
	 * Event handler for change/livechange of value2 input field that has the value 2 value from the range slider
	 * @param {sap.ui.base.Event} oEvent - Event parameter
	 * @param {Object} oController - reference to table controller
	 * @public
	 */
	onSliderTwoInputValueChange: function(oEvent, oController) {
		var sColumn = oEvent.getSource().data("COLUMN"),
			isValid,
			oRangeSlider,
			sText,
			oValue2 = oEvent.getSource(),
			oValue1,
			fnGetFormContents,
			aContent,
			oColorsLyt;
		if (oEvent.getSource().getValue() === "") {
			oEvent.getSource().setValue(parseFloat(0));
		}
		fnGetFormContents = function(oContent) {
			oRangeSlider = oContent.getItems()[0].getItems()[0].getItems()[0];
			oValue1 = oContent.getItems()[0].getItems()[0].getItems()[1].getItems()[0]; //slider one values
			oColorsLyt = oContent.getItems()[1];
			//check the value entered is valid or not
			isValid = this.isRangeValueValid(oValue2.getValue(), oRangeSlider, true, true, false);
			if (!isValid) {
				//if not valid, set the value1 value to range slider minimum value
				oValue2.setValue(parseFloat(oRangeSlider.getMax()));
			}
			oRangeSlider.setValue2(parseFloat(oValue2.getValue()));
			//get the formatted range text and set the custom data
			sText = this.getCellFormatConditionsFromSlider(parseFloat(oValue1.getValue()), parseFloat(oValue2.getValue()), parseFloat(oRangeSlider.getMin()), parseFloat(oRangeSlider.getMax()), oRangeSlider, oColorsLyt, oController);
			oValue1.data("CFORMAT_CONDITION", sText);
			oValue2.data("CFORMAT_CONDITION", sText);
		}.bind(this);
		aContent = this._getColumnFormContainer(sColumn, oController).getFormElements()[0].getFields();
		aContent.forEach(fnGetFormContents);
	},
	/**
         * Event handler for change/livechange of minimum range input field that has the minimum value from the range slider
         * @param {sap.ui.base.Event} oEvent - Event parameter
		 * @param {Object} oController - reference to table controller
         * @public
         */
        onSliderMinInputValueChange: function(oEvent, oController) {
            var oMinInput = oEvent.getSource();
            //check for the value entered is null or blank
            if (oEvent.getSource().getValue() === "") {
                return;
            }
            //check for value entered is valid or not.
            var isValid = this.isRangeValueValid(oMinInput.getValue(), "", false, false, false);
            if (!isValid && isValid !== undefined) {
                return;
            }
            var sColumn = oEvent.getSource().data("COLUMN"),
                oRangeSlider, oMax, oValue1, oValue2, sText, fnGetFormContents, aContent, oColorsLyt;
            fnGetFormContents = function(oContent) {
                oRangeSlider = oContent.getItems()[0].getItems()[0].getItems()[0];
                oMax = oContent.getItems()[0].getItems()[1].getItems()[2]; //slider two values
                oValue1 = oContent.getItems()[0].getItems()[0].getItems()[1].getItems()[0]; //slider one values
                oValue2 = oContent.getItems()[0].getItems()[0].getItems()[1].getItems()[1]; //slider two values
                oColorsLyt = oContent.getItems()[1];
                oRangeSlider.setMin(parseFloat(oMinInput.getValue()));
                oRangeSlider.setLabels(this.getRangeSliderLabels(oRangeSlider.getMin(), oRangeSlider.getMax()));
                oMinInput.data("CFORMAT_CONDITION", oRangeSlider.getMin() + ":" + oRangeSlider.getMax());
                oMax.data("CFORMAT_CONDITION", oRangeSlider.getMin() + ":" + oRangeSlider.getMax());
                //check if the minimum range value of the slider is greater than the value1 of the range slider
                if (parseFloat(oValue1.getValue()) < parseFloat(oMinInput.getValue())) {
                    oValue1.setValue(parseFloat(oMinInput.getValue()));
                }
                //get the formatted text range selection
                sText = this.getCellFormatConditionsFromSlider(parseFloat(oValue1.getValue()), parseFloat(oValue2.getValue()), parseFloat(oRangeSlider.getMin()), parseFloat(oRangeSlider.getMax()), oRangeSlider, oColorsLyt, oController);
                oValue1.data("CFORMAT_CONDITION", sText);
                oValue2.data("CFORMAT_CONDITION", sText);
            }.bind(this);
            aContent = this._getColumnFormContainer(sColumn, oController).getFormElements()[0].getFields();
            aContent.forEach(fnGetFormContents);
        },
		/**
         * Event handler for change/livechange of maximum range input field that has the maximum value from the range slider
         * @param {sap.ui.base.Event} oEvent - Event parameter
		 * @param {Object} oController - reference to table controller
         * @public
         */
        onSliderMaxInputValueChange: function(oEvent, oController) {
            var oMaxInput = oEvent.getSource();
            //check for the value entered is null or blank
            if (oEvent.getSource().getValue() === "") {
                return;
            }
            //check for value entered is valid or not.
            var isValid = this.isRangeValueValid(oMaxInput.getValue(), "", false, false, false);

            if (!isValid && isValid !== undefined) {
                return;
            }

            var sColumn = oEvent.getSource().data("COLUMN"),
                oRangeSlider, oMin, oValue1, oValue2, sText, fnGetFormContents, aContent, oColorsLyt;
            fnGetFormContents = function(oContent) {
                oRangeSlider = oContent.getItems()[0].getItems()[0].getItems()[0];
                oMin = oContent.getItems()[0].getItems()[1].getItems()[1]; //slider one values
                oValue1 = oContent.getItems()[0].getItems()[0].getItems()[1].getItems()[0]; //slider one values
                oValue2 = oContent.getItems()[0].getItems()[0].getItems()[1].getItems()[1]; //slider two values
                oColorsLyt = oContent.getItems()[1];
                oRangeSlider.setMax(parseFloat(oMaxInput.getValue()));
                oRangeSlider.setLabels(this.getRangeSliderLabels(oRangeSlider.getMin(), oRangeSlider.getMax()));
                oMin.data("CFORMAT_CONDITION", oRangeSlider.getMin() + ":" + oRangeSlider.getMax());
                oMaxInput.data("CFORMAT_CONDITION", oRangeSlider.getMin() + ":" + oRangeSlider.getMax());
                if (parseFloat(oValue2.getValue()) > parseFloat(oMaxInput.getValue())) {
                    oValue2.setValue(parseFloat(oMaxInput.getValue()));
                }
                //get the formatted text range selection
                sText = this.getCellFormatConditionsFromSlider(parseFloat(oValue1.getValue()), parseFloat(oValue2.getValue()), parseFloat(oRangeSlider.getMin()), parseFloat(oRangeSlider.getMax()), oRangeSlider, oColorsLyt, oController);
                oValue1.data("CFORMAT_CONDITION", sText);
                oValue2.data("CFORMAT_CONDITION", sText);
            }.bind(this);
            aContent = this._getColumnFormContainer(sColumn, oController).getFormElements()[0].getFields();
            aContent.forEach(fnGetFormContents);
        },
		/**
         * Event handler for on change/onlive change event of RangeSlider. To set the range values to the Text control
         * @param {sap.ui.base.Event} oEvent - change/live change event handler of the RangeSlider
		 * @param {Object} oController - reference to table controller
         * @public
         */
        onRangeSliderValueChange: function(oEvent, oController) {
            var oRangeSlider = oEvent.getSource(),
                oValue1 = parseFloat(oRangeSlider.getValue()),
                oValue2 = parseFloat(oRangeSlider.getValue2()),
                iMin = parseFloat(oEvent.getSource().getMin()),
                iMax = parseFloat(oEvent.getSource().getMax()),
                oValue1Input,
                oValue2Input,
                sText,
                fnGetFormContents,
                aContent,
                oColorsLyt;

            var sColumn = oEvent.getSource().data("column");

            fnGetFormContents = function(oContent) {
                oValue1Input = oContent.getItems()[0].getItems()[0].getItems()[1].getItems()[0]; //slider one values
                oValue2Input = oContent.getItems()[0].getItems()[0].getItems()[1].getItems()[1]; //slider two values
                oColorsLyt = oContent.getItems()[1];
                sText = this.getCellFormatConditionsFromSlider(parseFloat(oValue1.toFixed(2)), parseFloat(oValue2.toFixed(2)), iMin, iMax, oRangeSlider, oColorsLyt, oController); // get the conditions from sliders positions
                oValue1Input.data("CFORMAT_CONDITION", sText);
                oValue2Input.data("CFORMAT_CONDITION", sText);
                oValue1Input.setValue(parseFloat(oValue1.toFixed(2))); //set the slider positions to the input fields
                oValue2Input.setValue(parseFloat(oValue2.toFixed(2))); //set the slider positions to the input fields
                oRangeSlider.setValue(parseFloat(oValue1.toFixed(2))); //set the slider positions
                oRangeSlider.setValue2(parseFloat(oValue2.toFixed(2))); //set the slider positions
            }.bind(this);
            aContent = this._getColumnFormContainer(sColumn, oController).getFormElements()[0].getFields();
            aContent.forEach(fnGetFormContents);
        },

		/**
         * Function to return the form container for the related column.
         * Using this container we can get all the control's values that are used to configure cell colors for the column
         * @param {String} sColumn - Column name
		 * @param {Object} oController - reference to table controller
         * @returns {Object} oSelectedContainer - Form container for the column
         * @private
         */
        _getColumnFormContainer: function(sColumn, oController) {
            var oForm = oController._getCellColorConfigForm(),
                fnGetColumnFormContents,
                oSelectedContainer,
                aFormContainers;
            aFormContainers = oForm.getFormContainers(); //No. of columns enabled that are available in cell config dialog
            fnGetColumnFormContents = function(oFormContainer) {
                if (oFormContainer.data("column") === sColumn) {
                    oSelectedContainer = oFormContainer;
                }
            };
            aFormContainers.filter(fnGetColumnFormContents);
            return oSelectedContainer;
        },
		/**
		 * Function to set the visiblity flags for the select dropdown in the fragment. Visiblity flag is set based on the number of ranges in the conditions.
		 * @param {String} sCondition - cell format condition
		 * @returns {Array} aVisibility - array with visibility flags
		 * @private
		 */
		getNoVisibleSelects : function (sCondition) {
			return getNoVisibleSelectsText(sCondition);
		}
	};
});