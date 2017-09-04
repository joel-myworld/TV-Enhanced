/*!
 * Copyright 2017 Siemens AG
 */
sap.ui.define([
    "sap/m/P13nConditionPanel",
    "sap/ui/core/format/DateFormat",
    "sap/ui/core/format/NumberFormat",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "com/siemens/tableViewer/model/formatter"
], function(P13nConditionPanel, DateFormat, NumberFormat, Filter, FilterOperator, formatter) {
    "use strict";

    return P13nConditionPanel.extend("com.siemens.tableViewer.control.ExtendedP13nConditionPanel", {
        metadata: {
            properties: {
                columnName: "string",
                entitySet: "string",
                columnType: "float"
            }
        },

        /**
         * Handle inputed items into input field in the Value Help Dialog
         * @private
         * @param {object} oEvent event object
         */
        _handleSuggestionItems: function(oEvent) {
            var sTerm = oEvent.getParameter("suggestValue"),
                oInput = oEvent.getSource(),
                sColumnName = this.getColumnName();

            oInput.destroySuggestionItems();

            this.getModel("data").read("/" + this.getEntitySet(), {
                // filters: [new Filter("tolower(" + sColumnName + ")", FilterOperator.StartsWith, "tolower('" + sTerm + "')")],
                filters: [new Filter(sColumnName, FilterOperator.StartsWith, sTerm)],
                urlParameters: {
                    "$select": sColumnName
                },
                success: function(oData) {
                    oData.results.map(function(oObject) {
                        oInput.addSuggestionItem(new sap.ui.core.Item({
                            text: oObject[sColumnName]
                        }));
                    });
                }
            });
        },

        /**
         * Overwritten standard function
         * creates a new control for the condition value1 and value2 field. Control can be an Input or
         * DatePicker
         * @override
         * @private
         * @param {object} oCurrentKeyField object of the current selected KeyField which contains
         * type of the column ("string", "date" or "numeric") and a maxLength information
         * @param {object} oFieldInfo field information
         * @param {grid} oConditionGrid which should contain the new created field
         * @returns {Control} the created control instance either Input or DatePicker
         */
        _createField: function(oCurrentKeyField, oFieldInfo, oConditionGrid) {
            var oControl;
            var sCtrlType = oCurrentKeyField ? oCurrentKeyField.type : "";
            var that = this;

            var params = {
                value: oFieldInfo["Value"],
                width: "100%",
                placeholder: oFieldInfo["Label"],
                change: function() {
                    that._changeField(oConditionGrid);
                },
                layoutData: new sap.ui.layout.GridData({
                    span: oFieldInfo["Span"]
                })
            };

            // Siemens changes
            var iColumnType = this.getColumnType();
            if (iColumnType === 11) {
                params.showSuggestion = true;
                params.startSuggestion = 2;
                params.suggest = this._handleSuggestionItems.bind(this);
            }
            // End  of changes

            switch (sCtrlType) {
                case "numeric":
                    var oFloatFormatOptions;
                    if (oCurrentKeyField.precision || oCurrentKeyField.scale) {
                        oFloatFormatOptions = {};
                        if (oCurrentKeyField.precision) {
                            oFloatFormatOptions["maxIntegerDigits"] = parseInt(oCurrentKeyField.precision, 10);
                        }
                        if (oCurrentKeyField.scale) {
                            oFloatFormatOptions["maxFractionDigits"] = parseInt(oCurrentKeyField.scale, 10);
                        }
                    }
                    oConditionGrid.oFormatter = NumberFormat.getFloatInstance(oFloatFormatOptions);

                    oControl = new sap.m.Input(params);
                    break;
                case "date":
                    // Siemens changes
                    params.displayFormat = formatter.getDataTypeInstance(iColumnType).oFormatOptions.pattern;
                    // End  of changes
                    oConditionGrid.oFormatter = DateFormat.getDateInstance();
                    oControl = new sap.m.DatePicker(params);
                    break;
                default:
                    oConditionGrid.oFormatter = null;
                    oControl = new sap.m.Input(params);
            }

            if (oCurrentKeyField && oCurrentKeyField.maxLength && oControl.setMaxLength) {
                var l = -1;
                if (typeof oCurrentKeyField.maxLength === "string") {
                    l = parseInt(oCurrentKeyField.maxLength, 10);
                }
                if (typeof oCurrentKeyField.maxLength === "number") {
                    l = oCurrentKeyField.maxLength;
                }
                if (l > 0) {
                    oControl.setMaxLength(l);
                }
            }

            return oControl;
        },

        renderer: {}
    });
});