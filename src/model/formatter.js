/*!
 * Copyright 2017 Siemens AG
 */
sap.ui.define([
    "sap/ui/model/type/Integer",
    "sap/ui/model/type/Float",
    "sap/ui/model/type/Date",
    "sap/ui/model/odata/type/DateTime",
    "sap/ui/model/odata/type/Time",
    "sap/ui/core/format/DateFormat",
    "sap/ui/core/HorizontalAlign",
    "sap/ui/core/TextAlign",
    "sap/m/LabelDesign",
    "sap/ui/core/format/NumberFormat"
], function(IntegerType, FloatType, DateType, DateTimeType, TimeType, DateFormat, HorizontalAlign, TextAlign, LabelDesign,NumberFormat) {
    "use strict";

    return {
        /**
         * Returns common data type instances for binding purposes
         * @param {number} iColumnType - Column type number
         * @returns {sap.ui.model.(type/odata)|*} - returns
         * (Integer/Float/Date/DateTime/Time) instance with parameters
         * @public
         */
        getDataTypeInstance: function(iColumnType) {
            var mTypes = {
                3: new IntegerType(this.formatOptions("Integer")),
                7: new FloatType(this.formatOptions("Float")),
                14: new DateType(this.formatOptions("DateTime")),
                15: new DateType(this.formatOptions("Date")),
                17: new DateType(this.formatOptions("MonthDate")),
                20: new DateTimeType(this.formatOptions("EdmDate")),
                21: new DateTimeType(this.formatOptions("EdmShortDate")),
                22: new TimeType(this.formatOptions("EdmTime"))
            };

            return mTypes[iColumnType];
        },

       getDateTimeInstance: function(sPattern) {
            return DateFormat.getDateTimeInstance({
                pattern: sPattern
            });
        },

        /**
         * Returns format options for common data types
         * @param {string} sType - data type
         * @returns {object} - parameters for each supported data type
         * @public
         */
        formatOptions: function(sType) {
            var oFormatOptions = {
                Integer: {
                    groupingEnabled: true
                },
                Float: {
                    groupingEnabled: true,
                    minFractionDigits: 0,
                    maxFractionDigits: 2
                },
                DateTime: {
                    pattern: "dd.MM.yyyy",
                    source: {
                        pattern: "yyyy-MM-ddTHH:mm:ss.fffZ"
                    }
                },
                Date: {
                    pattern: "dd.MM.yyyy",
                    source: {
                        pattern: "yyyyMMdd"
                    }
                },
                MonthDate: {
                    pattern: "MM.yyyy",
                    source: {
                        pattern: "yyyyMM"
                    }
                },
                EdmDate: {
                    pattern: "dd.MM.yyyy",
                    source: {}
                },
                EdmShortDate: {
                    pattern: "MM.yyyy",
                    source: {}
                },
                EdmTime: {
                    pattern: "HH:mm:ss",
                    source: {}
                },
                Chart: {
                    style: "short",
                    maxFractionDigits: 1
                }
            };

            return oFormatOptions[sType];
        },

        /**
         * Method to format the labels on the range slider to the shortest form with units
         * @param {Number} iNum - Label passed to be formatted
         * @returns {Number} iFormattedNo - Formatted number with units
         * @public
         */
        formatRangeSliderLabel: function(iNum) {
            var bIsNegative = false,
                iFormattedNo;
            if (iNum < 0) {
                bIsNegative = true;
            }
            iNum = Math.abs(iNum);
            if (iNum >= 1000000000) {
                iFormattedNo = (iNum / 1000000000).toFixed(1).replace(/\.0$/, '') + 'G';
            } else if (iNum >= 1000000) {
                iFormattedNo = (iNum / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
            } else if (iNum >= 1000) {
                iFormattedNo = (iNum / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
            } else {
                iFormattedNo = iNum;
            }
            if (bIsNegative) {
                iFormattedNo = '-' + iFormattedNo;
            }
            return iFormattedNo;
        },

        /**
         * Return formatted values based on received data type
         * @param {integer} iColumnType - Column data type
         * @param {string || typeof Date} sValue - received value
         * @returns {string} - formatted value
         */
        formatDataBasedOnColumnType: function(iColumnType, sValue) {
            var sResult = {
                3: this._formatValueAsStrings.bind(this, [iColumnType, sValue]),
                7: this._formatValueAsStrings.bind(this, [iColumnType, sValue]),
                14: this._formatValueAsStrings.bind(this, [iColumnType, sValue]),
                15: this._formatValueAsStrings.bind(this, [iColumnType, sValue]),
                17: this._formatValueAsStrings.bind(this, [iColumnType, sValue]),
                20: this._formatDateAsEdmType.bind(this, ["EdmDate", sValue]),
                21: this._formatDateAsEdmType.bind(this, ["EdmShortDate", sValue]),
                22: this._formatTimeAsEdmType.bind(this, ["EdmTime", sValue])
            };

            return (sResult[iColumnType] && sResult[iColumnType]()) || sValue;
        },
        /**
         * To get the token on user entry directly in multiinput control on filter bar
         * @param {Number} iType - column type
         * @param {String} sColumn - Column name
         * @param {String} sValue - value from multiinput control
         * @returns {sap.m.Token} oToken - token for the multiinput control
         * @public
         */
        getFormattedToken : function (iType, sColumn, sValue) {
            var oToken;
            switch (iType) {
	            case 17:
                    if ((sValue.match(/([0][1-9]|[1][012]).((18|19|20|21)\d\d)$/)) === null) {
	                    break;
	                }
	                var sDate = sValue.split(".");
	                var sTempDate = sDate[1] + "" + sDate[0];
	                oToken = new sap.m.Token({
	                    text: sValue,
	                    key: sTempDate
	                }).data("UserEntry", sColumn);
	                break;
	            case 20:
                    // check for date format of DD.MM.YYYY
                    if ((sValue.match(/(\d{1,2}).(\d{1,2}).(\d{4})$/)) === null) {
						break;
					}
					var sDate = sValue.split(".");
					var sTempDate = new Date(sDate[1] + " " + sDate[0] + " " + sDate[2] + " 12:00:00");
					oToken = new sap.m.Token({
						text: sValue.toString(),
						key: sTempDate.toString()
					}).data("UserEntry", sColumn);
	                break;
	            case 22:
                    if ((sValue.match(/(2[0-3]|1[0-9]|0[0-9]|[^0-9][0-9]):([0-5][0-9]|[0-9]):([0-5][0-9]|[0-9][^0-9])$/)) === null) {
						break;
					}
					var sTime = sValue.split(":");
					var sTempTime = "PT" + sTime[0] + "H" + sTime[1] + "M" + sTime[2] + "S";
					oToken = new sap.m.Token({
						text: sValue.toString(),
						key: sTempTime.toString()
					}).data("UserEntry", sColumn);
	                break;
	            default:
                    oToken = new sap.m.Token({
						text: sValue.toString(),
						key: sValue.toString()
					}).data("UserEntry", sColumn);
            }
            return oToken;
        },
        /**
         * Format string values based on ColumnType
         * @param {array} aParams - aParams[0] - ColumnType; aParam[1] - Value
         * @return {string} - Formatted value
         * @private
         */
        _formatValueAsStrings: function(aParams) {
            if (aParams[0] === 17 && typeof aParams[1] === "object") {
                 aParams[1] = this.convertDatetoString(aParams[1]);
             }
            return this.getDataTypeInstance(aParams[0]).formatValue(aParams[1], "string");
        },
        /**
         * Formatter function to convert date object to string in YYYYMM format
         * @param {Object} oDate - Date object from the date picker
         * @returns {String} sDate - Date in string format YYYYMM format
         * @public
         */
        convertDatetoString : function (oDate) {
            var sDate,
            sMonth = (oDate.getMonth() + 1).toString();
            sDate = oDate.getFullYear().toString() + (sMonth.length === 1 ? "0" + sMonth : sMonth);
            return sDate;
        },
        /**
         * Format Date object value
         * @param {array} aParams - aParams[0] - ColumnType; aParam[1] - Value
         * @return {string} - Formatted value
         * @private
         */
        _formatDateAsEdmType: function(aParams) {
            return DateFormat.getDateInstance(this.formatOptions(aParams[0])).format(new Date(aParams[1]));
        },

        /**
         * Format Time object value
         * @param {array} aParams - aParams[0] - ColumnType; aParam[1] - Value
         * @return {string} - Formatted value
         * @private
         */
        _formatTimeAsEdmType: function(aParams) {
            return DateFormat.getTimeInstance(this.formatOptions(aParams[0])).format(new Date(aParams[1]));
        },

        getDateTimeInstanceBasedOnColumnType: function(iColumnType) {
            var oInstance;

            switch (iColumnType) {
                case 20:
                    oInstance = this.getDateTimeInstance("dd.MM.yyyy");
                    break;
                case 21:
                    oInstance = this.getDateTimeInstance("MM.yyyy");
                    break;
                default:
                    oInstance = this.getDateTimeInstance("dd.MM.yyyy");
                    break;
            }

            return oInstance;
        },

        getFloatInstance: function(sType) {
            return NumberFormat.getFloatInstance(this.formatOptions(sType));
        },

        /**
         * Enable "Publish" button on Shared Variant Dialog.
         * Enabled when Variant Name and Selected Users exist.
         * @param {boolean} bInput - is "Name" valid
         * @param {boolean} bMultiInput - is user(s) selected
         * @return {boolean} - Enable/Disable button
         */
        setButtonEnabled: function(bInput, bMultiInput) {
            return bInput && bMultiInput;
        },

        /**
         * Hide Table Icon Tab
         * @param {number} isTree - is data represented as hierarchy
         * @param {number} isODataEnabled - is oData service
         * @return {boolean} - Visible/Invisible
         */
        hideTableTab: function(isTree, isODataEnabled, isMixed) {
            return isTree === 0 && isODataEnabled === 1 && !isMixed;
        },

        /**
         * Hide Table Icon Tab
         * @param {number} isTree - is data represented as hierarchy
         * @param {number} isODataEnabled - is oData service
         * @param {number} isChartHidden - is Chart tab enabled
         * @return {boolean} - Visible/Invisible
         */
        hideChartTab: function(isTree, isODataEnabled, isChartHidden, isMixed) {
            return isTree === 0 && isODataEnabled === 1 && isChartHidden === 0 && !isMixed;
        },

        /**
         * Hide Table Icon Tab
         * @param {number} isTree - is data represented as hierarchy
         * @param {number} isODataEnabled - is oData service
         * @return {boolean} - Visible/Invisible
         */
        hideTreeXSTab: function(isTree, isODataEnabled) {
            return isTree === 1 && isODataEnabled === 0;
        },

        /**
         * Hide Table Icon Tab
         * @param {number} isTree - is data represented as hierarchy
         * @param {number} isODataEnabled - is oData service
         * @return {boolean} - Visible/Invisible
         */
        hideTreeTab: function(isTree, isODataEnabled) {
            return isTree === 1 && isODataEnabled === 1;
        },
        /**
         * Hide Mix Icon Tab
         * @param {number} isTree - is data represented as hierarchy
         * @param {number} isOdataEnabled - is Odata service
         * @return {boolean} - Visible/Invisible
         */
        hideMixTab: function(isODataEnabled, isMixed, isTree){
            return isODataEnabled === 1 && isMixed === 1 && isTree === 0;
        },

        /**
         * Align column text
         * @param {number} isKFG - is Measure
         * @return {string} - Right/Left
         */
        alignColumn: function(isKFG) {
            return isKFG && isKFG === 1 ? HorizontalAlign.Right : HorizontalAlign.Left;
        },

        /**
         * Change column Label design
         * @param {number} isKFG - is Measure
         * @return {string} - Bold/Standard
         */
        labelDesign: function(isKFG) {
            return isKFG && isKFG === 1 ? LabelDesign.Bold : LabelDesign.Standard;
        },

        /**
         * Change column Label design and align.
         * Since {@link sap.m.Label} doesn't support "\n" and
         * {@link sap.m.Text} doesn't support "Design" property.
         * @param {number} isKFG - is Measure
         * @return {string} - Right/Left
         */
        alignColumnLabel: function(isKFG) {
            var sAlign;
            if (isKFG && isKFG === 1) {
                this.addStyleClass("siemensTextBold");
                sAlign = TextAlign.Right;
            } else {
                sAlign = TextAlign.Left;
            }
            return sAlign;
        },
        /**
         * Return aggregated column text based on received value
         * @param {String} sAggColValue - Aggregated column text with value
         * @returns {string} - Aggregated column text
         */
        formatAggregatedColumnText: function(sAggColValue) {
           var sAggColText;
            if (sAggColValue) {
                sAggColText = sAggColValue.split("\n")[0];
            }
            return sAggColText;
        },
        /**
         * Return true if one, else return false
         * @param {String} iValue - value from configuration file to determine true or false
         * @returns {boolean} - true/false
         */
        setTrueIfValueEqOne: function(iValue) {
            return iValue === 1;
        }

    };
});