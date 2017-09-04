sap.ui.define([
    "sap/ui/table/TablePersoController"
], function(TablePersoController) {
    "use strict";
    return TablePersoController.extend("com.siemens.tableViewer.control.ExtendedTablePersoController", {
        /**
         * Opens the personalization dialog for the Table to modify the visibility and
         * the order of the columns.
         *
         * <i>Using this functionality will require to load the sap.m library because the
         * personalization dialog is only available in this library for now.</i>
         *
         * @param {object} mSettings
         * @public
         * @experimental since 1.21.2 - API might change / feature requires the sap.m library!
         */
        openDialog: function(mSettings) {
            // create and open the dialog
            var bTreeTable = this._getTable() instanceof sap.ui.table.TreeTable;
            if (!this._oDialog) {

                var that = this;
                var mProperties = {
                    persoService: this.getPersoService(),
                    showSelectAll: !bTreeTable,
                    showResetAll: !bTreeTable,
                    contentWidth: mSettings && mSettings.contentWidth,
                    contentHeight: mSettings && mSettings.contentHeight || "20rem",
                    initialColumnState: this._oInitialPersoData.aColumns,
                    columnInfoCallback: function() {
                        return that._getCurrentTablePersoData(true).aColumns;
                    },
                    confirm: function() {
                        that._adjustTable(this.retrievePersonalizations());
                        if (that.getAutoSave()) {
                            that.savePersonalizations();
                        }
                    }
                };
                if (bTreeTable) {
                    this._aColumnProperties.push("supportHidden");
                    jQuery.sap.require("com.siemens.tableViewer.control.ExtendedTablePersoDialog");
                    this._oDialog = new com.siemens.tableViewer.control.ExtendedTablePersoDialog(mProperties);
                } else {
                    jQuery.sap.require("sap.m.TablePersoDialog");
                    this._oDialog = new sap.m.TablePersoDialog(mProperties);
                }
                this._oDialog._oDialog.removeStyleClass("sapUiPopupWithPadding"); // otherwise height calculation doesn't work properly!
                jQuery.sap.syncStyleClass("sapUiSizeCompact", this._getTable(), this._oDialog._oDialog);
            }
            this._oDialog._oSelectAllToolbar.setVisible(!bTreeTable);
            this._oDialog.open();

        },

        _getCurrentTablePersoData: function(bForDialog) {
            var oTable = this._getTable(),
                aColumns = oTable.getColumns();

            var oData = {
                aColumns: []
            };
            aColumns = this._removeStaticColumns(aColumns); //remove static filter columns
            for (var i = 0, l = aColumns.length; i < l; i++) {
                var oColumn = aColumns[i];
                var sPersoKey = this._getColumnPersoKey(oColumn);
                var oColumnInfo = {
                    id: sPersoKey,
                    order: i
                };
                var oMetadata = oColumn.getMetadata();
                for (var j = 0, lj = this._aColumnProperties.length; j < lj; j++) {
                    var sProperty = this._aColumnProperties[j];
                    if (oMetadata.hasProperty(sProperty)) {
                        oColumnInfo[sProperty] = oColumn.getProperty(sProperty);
                    }
                }
                if (bForDialog) {
                    if (oColumnInfo.order === 0 && oTable instanceof sap.ui.table.TreeTable) {
                        oColumnInfo.text = oColumn.getLabel().getFixContent()[0].getText();
                    } else {
                        oColumnInfo.text = oColumn.getLabel() && oColumn.getLabel().getText() || sPersoKey;
                    }
                }
                oData.aColumns.push(oColumnInfo);
            }

            return oData;
        },

        /**
         * Helper method added to remove static filter columns from personalization
         * @param {Array} aColumns - Array of columns from table
         * @returns {Array} aColumns - Array of columns without static filter columns
         */
        _removeStaticColumns : function (aColumns) {
			for (var i = aColumns.length - 1; i >= 0; i--) {
				if (aColumns[i].data("STATIC_COLUMN")) {
					aColumns.splice(i, 1);
				}
			}
            return aColumns;
        },

        _adjustTable: function(oData) {
            var oTable = this._getTable();
            if (!oTable || !oData || !jQuery.isArray(oData.aColumns)) {
                return;
            }

            // create a persoKey to column map
            var mColumns = {},
                aCols = oTable.getColumns();
            for (var i = 0, l = aCols.length; i < l; i++) {
                mColumns[this._getColumnPersoKey(aCols[i])] = aCols[i];
            }

            var aColumns = oData.aColumns;

            for (var i = 0, l = aColumns.length; i < l; i++) {
                var oColumnInfo = aColumns[i]; // P13N info object
                var oColumn = mColumns[oColumnInfo.id];

                // only if the column is available in the table
                // e.g. if the Table has been removed or renamed => ignore!
                if (oColumn) {

                    // apply the order
                    if (oTable.indexOfColumn(oColumn) !== oColumnInfo.order) {
                        oTable.removeColumn(oColumn);
                        oTable.insertColumn(oColumn, oColumnInfo.order);
                    }

                    var oMetadata = oColumn.getMetadata();
                    for (var j = 0, lj = this._aColumnProperties.length; j < lj; j++) {
                        var sProperty = this._aColumnProperties[j];
                        if (oColumnInfo[sProperty] !== undefined) {
                            try {
                                if (oMetadata.hasProperty(sProperty) && oColumn.getProperty(sProperty) != oColumnInfo[sProperty]) {
                                    oColumn.setProperty(sProperty, oColumnInfo[sProperty]);
                                }
                            } catch (ex) {
                                jQuery.sap.log.error("sap.ui.table.TablePersoController: failed to apply the value \"" + oColumn[sProperty] + "\" for the property + \"" + sProperty + "\".");
                            }
                        }
                    }

                }

            }

            // Commented due to crashes Table Binding
            /*if (typeof oTable._onPersoApplied === "function") {
            	oTable._onPersoApplied();
            }*/

        }
    });
});