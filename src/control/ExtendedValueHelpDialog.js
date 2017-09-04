/*!
 * Copyright 2017 Siemens AG
 */
sap.ui.define([
    "sap/ui/comp/valuehelpdialog/ValueHelpDialog",
    "com/siemens/tableViewer/control/ExtendedP13nFilterPanel",
    'jquery.sap.global'
], function(ValueHelpDialog, P13nFilterPanel, q) {
    "use strict";

    //noinspection Eslint
	return ValueHelpDialog.extend("com.siemens.tableViewer.control.ExtendedValueHelpDialog", {
        metadata: {
            properties: {
                entitySet: "string",
                columnType: "float"
            }
        },

        /**
         * Overwriting standard function for updating table from valuehelpdialog.js to remember item selection during search and clear
         */
        _updateTable: function() {
            var i, j, o, d;

            this.oRows = this.theTable.getBinding('rows');
            this.ignoreSelectionChange = true;
            this.theTable.clearSelection();
            //condition to handle clear icon press in search field
            if (this.theTable.data("clear")) {
                //get all the row indices and make it selected
                var aIndices = this.theTable.data("aIndices");
                aIndices = aIndices ? aIndices : [];
                for (var iIndex = 0; iIndex < aIndices.length; iIndex++) {
                    this.theTable.addSelectionInterval(aIndices[iIndex], aIndices[iIndex]);
                }
                //reset the flag
                this.theTable.data("clear", false);
                //refresh the binding to remember the selections
                this.theTable.getBinding("rows").refresh(true);
                //this.theTable.getModel().refresh(true);
            } else if (this.theTable.data("search")) {
                //condition to handle search icon press in search field
                var e1 = this._oSelectedItems.getItems();
                for (var j1 = 0; j1 < e1.length; j1++) {
                    var k1 = e1[j1];
                    var sSelValue = this._oSelectedItems.getModelData()[0][this.getKey()];
                    for (var i1 = 0; i1 < this.oRows.aKeys.length; i1++) {
                        if (this.oRows.oModel.getProperty("/" + this.oRows.aKeys[i1])[this.getKey()]) {
                            // Check if selected Items match received value
                            if (sSelValue.toString() === this.oRows.oModel.getProperty("/" + this.oRows.aKeys[i1])[this.getKey()].toString()) {
                                // Get Matched Path
                                var s1 = this.oRows.aKeys[i1];
                                // Remove old path from selected items
                                this._oSelectedItems.remove(k1);
                                // Get Selected token (by old path)
                                var t1 = this._getTokenByKey(k1, this._oSelectedTokens);
                                if (t1) {
                                    // Set new key to old Path
                                    t1.setKey(s1);
                                }
                                var d1 = this.theTable.getContextByIndex(i1);
                                if (d1) {
                                    var o1 = d1.getObject();
                                    this._oSelectedItems.add(s1, o1);
                                }
                                this.theTable.addSelectionInterval(i1, i1);
                                break;
                            }
                        }
                    }
                }
                //reset the flag
                this.theTable.data("search", false);
                //refresh the binding to remember the selection
                // this.theTable.getBinding("rows").refresh(true); // commented to prevent duplicate request in value help dialog table during search
                //this.theTable.getModel().refresh(true);
            } else {
                // Get Selected Items
                var e = this._oSelectedItems.getItems();
                // Check if table received data
                if (this.oRows.aKeys) {
                    for (j = 0; j < e.length; j++) {
                        // Get Selected Path
                        var k = e[j],
                            sSelectedValue;
                        // Get Selected Value
                        if (new Date(k).toString() !== "Invalid Date") {
                            sSelectedValue = k;
                        } else {
                            sSelectedValue = this._oSelectedItems.getModelData()[0][this.getKey()];
                        }
                        // Go trough all received items
                        for (i = 0; i < this.oRows.aKeys.length; i++) {
                            // Check if value not null
                            if (this.oRows.oModel.getProperty("/" + this.oRows.aKeys[i])[this.getKey()]) {
                                // Check if selected Items match received value
                                if (sSelectedValue.toString() === this.oRows.oModel.getProperty("/" + this.oRows.aKeys[i])[this.getKey()].toString()) {
                                    // Get Matched Path
                                    var s = this.oRows.aKeys[i];
                                    // Remove old path from selected items
                                    this._oSelectedItems.remove(k);
                                    // Get Selected token (by old path)
                                    var t = this._getTokenByKey(k, this._oSelectedTokens);
                                    if (t) {
                                        // Set new key to old Path
                                        t.setKey(s);
                                    }
                                    d = this.theTable.getContextByIndex(i);
                                    if (d) {
                                        o = d.getObject();
                                        this._oSelectedItems.add(s, o);
                                    }
                                    this.theTable.addSelectionInterval(i, i);
                                    break;
                                } else {
                                    //above if condition takes only the zero index value, for other selected items to be marked loop in again and mark as selected.
                                    for (var j2 = 0; j2 < e.length; j2++) {
                                        var sValue = this._oSelectedItems.getModelData()[j2][this.getKey()];
                                        if (sValue && sValue.toString() === this.oRows.oModel.getProperty("/" + this.oRows.aKeys[i])[this.getKey()].toString()) {
                                            this.theTable.addSelectionInterval(i, i);
                                            break;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }

            this.ignoreSelectionChange = false;
            this._updateTitles();
        },
    /**
     * Override standard function to show selection fial message only when select all in table is pressed
     */
    _createTable : function() {
            var t = this;
            var o = new sap.ui.table.Table({
                title: 'Items',
                selectionBehavior: sap.ui.table.SelectionBehavior.Row,
                selectionMode: this.getSupportMultiselect() ? sap.ui.table.SelectionMode.MultiToggle : sap.ui.table.SelectionMode.Single,
                noDataText: this._oRb.getText('VALUEHELPDLG_TABLE_PRESSSEARCH'),
                rowHeight: 32,
                rowSelectionChange: function(d) {
                    if (t.ignoreSelectionChange) {
                        return;
                    }
                    var e = d.getSource();
                    var f = d.getParameter('rowIndices');
                    d.getSource().data("aIndices", f);
                    var i, n = f.length;
                    var g;
                    var h;
                    var r;
                    for (i = 0; i < n; i++) {
                        g = f[i];
                        h = e.getContextByIndex(g);
                        r = h ? h.getObject() : null;
                        if (!r && this.getBinding("rows").iLength === n) {
                            sap.m.MessageBox.show(t._oRb.getText('VALUEHELPDLG_SELECTIONFAILED'), {
                                icon: sap.m.MessageBox.Icon.ERROR,
                                title: t._oRb.getText('VALUEHELPDLG_SELECTIONFAILEDTITLE'),
                                actions: [sap.m.MessageBox.Action.OK],
                                styleClass: !!this.$().closest('.sapUiSizeCompact').length ? 'sapUiSizeCompact' : ''
                            });
                            return;
                        }
                    }
                    var u = false;
                    if (t.theTable.getBinding('rows').aKeys) {
                        u = true;
                    }
                    for (i = 0; i < n; i++) {
                        g = f[i];
                        h = e.getContextByIndex(g);
                        r = h ? h.getObject() : null;
                        if (r) {
                            var k;
                            if (u) {
                                k = h.sPath.substring(1);
                            } else {
                                k = r[t.getKey()];
                            }
                            if (e.isIndexSelected(g)) {
                                q.sap.require('sap.ui.comp.smartfilterbar.FilterProvider');
                                t._oSelectedItems.add(k, r);
                                t._addToken2Tokenizer(k, t._getFormatedTokenText(k), t._oSelectedTokens);
                            } else {
                                t._oSelectedItems.remove(k);
                                t._removeTokenFromTokenizer(k, t._oSelectedTokens);
                            }
                        }
                    }
                    t._updateTitles();
                    if (!t.getSupportMultiselect()) {
                        t._onCloseAndTakeOverValues()();
                    }
                }
            }).addStyleClass('compVHMainTable');
            o.bindAggregation('columns', 'columns>/cols', function(i, d) {
                var e, f;
                if (d.getProperty('type') === 'string') {
                    f = {
                        path: d.getProperty('template')
                    };
                }
                if (d.getProperty('type') === 'boolean') {
                    e = new sap.m.CheckBox({
                        enabled: false,
                        selected: {
                            path: d.getProperty('template')
                        }
                    });
                } else {
                    e = new sap.m.Text({
                        wrapping: false,
                        text: {
                            path: d.getProperty('template'),
                            type: d.getProperty('oType')
                        },
                        tooltip: f
                    });
                }
                return new sap.ui.table.Column(i,{
                    label: '{columns>label}',
                    tooltip: '{columns>label}',
                    template: e,
                    width: '{columns>width}',
                    hAlign: e instanceof sap.m.CheckBox ? sap.ui.core.HorizontalAlign.Center : sap.ui.core.HorizontalAlign.Begin,
                    filterProperty: d.getProperty('filter'),
                    sortProperty: "tolower(" + d.getProperty('filter') + ")",
                    sortOrder: "Ascending",
                    sorted: true
                });
            });
            this.theTable = o;
        },
        /**
         * Override standard function
         * create a new instance of ranges grid with all inner controls
         * @private
         * @returns the ranges grid
         * @override
         */
        _createRanges: function() {
            this._oFilterPanel = new P13nFilterPanel({

                // Siemens changes
                columnName: this.getKey(),
                entitySet: this.getEntitySet(),
                columnType: this.getColumnType(),
                // End of changes

                maxIncludes: this.getMaxIncludeRanges(),
                maxExcludes: this.getMaxExcludeRanges(),
                containerQuery: true,
                addFilterItem: jQuery.proxy(function(oEvent) {
                    // sap.m.MessageToast.show("AddFilterItem");

                    var params = oEvent.mParameters;
                    var oRange = {
                        exclude: params.filterItemData.exclude,
                        keyField: params.filterItemData.columnKey,
                        operation: params.filterItemData.operation,
                        value1: params.filterItemData.value1,
                        value2: params.filterItemData.value2
                    };
                    this._oSelectedRanges[params.key] = oRange;

                    var sTokenText = this._getFormatedRangeTokenText(oRange.operation, oRange.value1, oRange.value2, oRange.exclude, oRange.keyField);
                    this._addToken2Tokenizer(params.key, sTokenText, oRange.exclude ? this._oExcludedTokens : this._oSelectedTokens);
                    this._updateTokenizer();
                }, this),
                removeFilterItem: jQuery.proxy(function(oEvent) {
                    // sap.m.MessageToast.show("RemoveFilterItem");

                    var params = oEvent.mParameters;
                    delete this._oSelectedRanges[params.key];
                    this._removeToken(params.key);
                    this._updateTokenizer();
                }, this),
                updateFilterItem: jQuery.proxy(function(oEvent) {
                    // sap.m.MessageToast.show("UpdateFilterItem");

                    var params = oEvent.mParameters;
                    var oRange = this._oSelectedRanges[params.key];
                    oRange.exclude = params.filterItemData.exclude;
                    oRange.keyField = params.filterItemData.columnKey;
                    oRange.operation = params.filterItemData.operation;
                    oRange.value1 = params.filterItemData.value1;
                    oRange.value2 = params.filterItemData.value2;

                    var sTokenText = this._getFormatedRangeTokenText(oRange.operation, oRange.value1, oRange.value2, oRange.exclude, oRange.keyField);
                    this._addToken2Tokenizer(params.key, sTokenText, oRange.exclude ? this._oExcludedTokens : this._oSelectedTokens);
                    this._updateTokenizer();
                }, this)
            });

            this._oFilterPanel.setIncludeOperations(this._aIncludeRangeOperations);
            this._oFilterPanel.setExcludeOperations(this._aExcludeRangeOperations);

            // this._oFilterPanel.setKeyFields([{key: "KeyField1", text: "Field1"}, {key: "KeyField2", text: "Field2", type : "date", isDefault: true}]);
            if (this._aRangeKeyFields) {
                this._aRangeKeyFields.forEach(function(item) {
                    item["text"] = item.label;
                });
                this._oFilterPanel.setKeyFields(this._aRangeKeyFields);
            }

            // var oCondition1= { "key": "i1", "text": "CompanyCode: a..z" , "exclude": false, "operation": sap.m.P13nConditionOperation.BT, "keyField":
            // "CompanyCode", "value1": "a", "value2": "z"};
            // var oCondition2= { "key": "i2", "text": "CompanyCode: =foo" , "exclude": false, "operation": sap.m.P13nConditionOperation.EQ, "keyField":
            // "CompanyCode", "value1": "foo", "value2": ""};
            // var oCondition3= { "key": "e1", "text": "CompanyCode: !(=foo)", "exclude": true , "operation": sap.m.P13nConditionOperation.EQ, "keyField":
            // "CompanyCode", "value1": "foo", "value2": ""};
            // var aConditions= [oCondition1, oCondition2, oCondition3];

            var aConditions = [];
            if (this._oSelectedRanges) {
                for (var rangeId in this._oSelectedRanges) {
                    var rangeData = this._oSelectedRanges[rangeId];
                    aConditions.push({
                        key: rangeId,
                        exclude: rangeData.exclude,
                        keyField: rangeData.keyField,
                        operation: rangeData.operation,
                        value1: rangeData.value1,
                        value2: rangeData.value2
                    });
                }
            }

            this._oFilterPanel.setConditions(aConditions);

            this._oRangeScrollContainer = new sap.m.ScrollContainer({
                vertical: true,
                horizontal: false,
                width: "100%",
                height: "300px",
                content: [
                    this._oFilterPanel
                ]
            });

            var oRangeFieldsGrid = new sap.ui.layout.Grid({
                width: "100%",
                defaultSpan: "L12 M12 S12",
                vSpacing: 0,
                hSpacing: 0,
                content: [
                    this._oRangeScrollContainer
                ]
            });

            this._sValidationDialogTitle = this._oRb.getText("VALUEHELPVALDLG_TITLE");
            this._sValidationDialogMessage = this._oRb.getText("VALUEHELPVALDLG_MESSAGE");
            this._sValidationDialogFieldMessage = this._oRb.getText("VALUEHELPVALDLG_FIELDMESSAGE");

            return oRangeFieldsGrid;
        },

        renderer: {}
    });
});
