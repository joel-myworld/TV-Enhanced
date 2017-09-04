/*!
 * Copyright 2017 Siemens AG
 */
sap.ui.define([
    "sap/ui/base/Object",
    "com/siemens/tableViewer/control/ExtendedValueHelpDialog",
    "com/siemens/tableViewer/controller/utilities",
    "com/siemens/tableViewer/model/formatter",
    "sap/ui/Device",
    "sap/m/Toolbar",
    "sap/m/ToolbarSpacer",
    "sap/m/Title",
    "sap/m/SearchField",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], function(Object, ValueHelpDialog, utilities, formatter, Device, Toolbar, ToolbarSpacer, Title, SearchField, JSONModel, Filter, FilterOperator) {
    "use strict";

    /**
     * Constructor for Value Help Dialog
     *
     * @class
     * This is an abstract base class for Value Help Dialog object
     * @abstract
     *
     * @extends sap.ui.base.Object
     *
     * @constructor
     * @public
     * @alias sap.ui.comp.valuehelpdialog.ValueHelpDialog
     */
    return Object.extend("com.siemens.tableViewer.controller.ValueHelpDialog", {
        _oContext: null,
        _oResourceBundle: null,
        _sEntityName: null,
        _oValueHelpDialog: null,
        _oValueHelpDialogTable: null,
        _iOriginalTableBusyDelay: null,

        /**
         * Constructor
         * @param {sap.ui.model.Context} oContext - context of binded column, part of "filterModel" model
         * @param {sap.m.MultiInput} oControl - parent control
         * @param {object} oResourceBundle - i18n model
         * @param {string} sEntityName - Entity name for getting data
         * @param {sap.ui.model.odata.v2.ODataModel} oDataModel - oData model instance
         * @param {sap.ui.model.json.JSONModel} oPropertiesModel - Model with mandatory data for creating VHD
         * @param {boolean} bSupportRanges - Enable/Disable Ranges Tab
         * @param {array} [aFilters] - array of {@link sap.ui.model.Filter}
         * @returns {sap.ui.comp.valuehelpdialog.ValueHelpDialog} - Value Help Dialog instance
         * @public
         */
        constructor: function(oContext, oControl, oResourceBundle, sEntityName, oDataModel, oPropertiesModel, bSupportRanges, aFilters) {
            this._oContext = oContext;
            this._oResourceBundle = oResourceBundle;
            this._sEntityName = sEntityName;

            // Create Value Help Dialog instance
            this._oValueHelpDialog = this._createValueHelpDialog(bSupportRanges);

            // Set Value Help dialog models
            this._setValueHelpDialogModels(oPropertiesModel, oDataModel);

            // Adjust Standard Value Help Dialog Formatting functions
            this._adjustValueHelpDialogFormattingFunctions();

            // Set existing tokens from parent control
            this._setTokens(oControl);

            // Prepare range key fields for "Define Conditions" tab
            this._prepareRangeKeyFields();

            // Get Value Help Dialog Table
            this._oValueHelpDialogTable = this._oValueHelpDialog.getTable();

            // Create Table search bar
            this._createTableSearchBar();

            // Create Table Columns
            this._createTableColumnsModel();

            // Attach busy indicator to Table
            this._attachBusyIndicator();

            // Bind Value Help Dialog Table Rows
            this._bindTableRows(aFilters);

            // Sync style class
            this._oValueHelpDialog.addStyleClass(utilities.getContentDensityClass());

            return this._oValueHelpDialog;
        },

        /**
         * Set filterModel model and data model to VHD
         * @param {sap.ui.model.json.JSONModel} oPropertiesModel - configuration model
         * @param {sap.ui.model.odata.v2.ODataModel} oDataModel - data model instance
         * @returns {void}
         * @private
         */
        _setValueHelpDialogModels: function(oPropertiesModel, oDataModel) {
            // Set filterModel model to Value Help Dialog
            this._oValueHelpDialog.setModel(oPropertiesModel, "filterModel");

            // Set Data model
            this._oValueHelpDialog.setModel(oDataModel, "data");
        },

        /**
         * Set tokens of parent control to Value Help Dialog
         * @param {sap.m.MultiInput} oControl - parent control
         * @returns {void}
         * @private
         */
        _setTokens: function(oControl) {
            this._oValueHelpDialog.setTokens(oControl.getTokens());
        },

        /**
         * Reassign Standard Value Help Dialog formatting functions
         * @return {void}
         * @private
         */
        _adjustValueHelpDialogFormattingFunctions: function() {
            this._oValueHelpDialog._getFormatedRangeTokenText = this._getFormatedRangeTokenText;
            this._oValueHelpDialog._getFormatedTokenText = this._getFormatedTokenText;
        },

        /**
         * Adjusted Standard Value Help Dialog function.
         * Creates and returns the Token text for the selected item
         * @returns {string} - the token text for the selected items with the sKey
         * @private
         */
        _getFormatedTokenText: function() {
            var sTokenText = ValueHelpDialog.prototype._getFormatedTokenText.apply(this, arguments);

            var iColumnType = this.getColumnType();

            return formatter.formatDataBasedOnColumnType(iColumnType, sTokenText);
        },

        /**
         * Adjusted Standard Value Help Dialog function.
         * Creates and returns the Token text for a range
         * @returns {string} - the range token text
         * @private
         */
        _getFormatedRangeTokenText: function() {
            var iColumnType = this.getColumnType();

            if (arguments[1]) {
                arguments[1] = formatter.formatDataBasedOnColumnType(iColumnType, arguments[1]);
            }
            if (arguments[2]) {
                arguments[2] = formatter.formatDataBasedOnColumnType(iColumnType, arguments[2]);
            }

            return ValueHelpDialog.prototype._getFormatedRangeTokenText.apply(this, arguments);
        },

        /**
         * Enables busy indicator and save it initial delay. Bind busy and delay to model
         * @returns {void}
         * @private
         */
        _attachBusyIndicator: function() {
            this._iOriginalTableBusyDelay = this._oValueHelpDialogTable.getBusyIndicatorDelay();

            this._oValueHelpDialogTable.setEnableBusyIndicator(true);

            this._oValueHelpDialogTable.bindProperty("busy", "busy>/busy");
            this._oValueHelpDialogTable.bindProperty("busyIndicatorDelay", "busy>/delay");

            this._oValueHelpDialogTable.setModel(this._createBusyModel(), "busy");

            // Enables Busy Indicator directly after opens Value Help Dialog
            this._oValueHelpDialog.attachAfterOpen(function() {
                if (this._oValueHelpDialogTable.getBinding("rows").bPendingRequest) {
                    this._oValueHelpDialogTable.getModel("busy").setProperty("/busy", true);
                }
            }.bind(this));
        },

        /**
         * Create model for busy indicator
         * @returns {sap.ui.model.json.JSONModel} - JSON model instance with
         * parameters busy and delay
         * @private
         */
        _createBusyModel: function() {
            return new JSONModel({
                busy: true,
                delay: 0
            });
        },

        /**
         * Create Value Help Dialog instance
         * @param {boolean} bSupportRanges - Ranges tab enabled/disabled
         * @returns {sap.ui.comp.valuehelpdialog.ValueHelpDialog} - Value Help Dialog instance
         * @private
         */
        _createValueHelpDialog: function(bSupportRanges) {
            var aData = this._oContext.getModel().getData();
            var title = aData.length ? aData[0].LABEL : null;
            if (!title){
                title = {	path: "filterModel>" + this._oContext + "/LABEL",
                        formatter: formatter.formatAggregatedColumnText};
            }
            var oDescriptionKey = aData.length ? aData[0].COLUMN : null;
            if (!oDescriptionKey) {
                oDescriptionKey =  this._oContext.getProperty("COLUMN");
            }
            return new ValueHelpDialog({
                title:title,
                supportMultiselect: true,
                supportRanges: bSupportRanges,
                key: oDescriptionKey,
                descriptionKey: oDescriptionKey,
                tokenDisplayBehaviour: "DescriptionOnly",
                stretch: Device.system.phone,
                entitySet: this._sEntityName,
                columnType: aData.length ? aData[0].CTYPE : "{filterModel>" + this._oContext + "/CTYPE}" ,
                cancel: function() {
                    this.close();
                },
                afterClose: function() {
                    this.destroy();
                }
            }).data("path", this._oContext.getPath());
        },

        /**
         * Set label and key for ranges tab
         * @returns {void}
         * @private
         */
        _prepareRangeKeyFields: function() {
            var sType, iColumnType, label, column;
            var aColumns = this._oContext.getObject() ? this._oContext.getObject() : this._oContext.getModel().getData();
            for (var i in aColumns){
            iColumnType = aColumns.CTYPE ? aColumns.CTYPE : aColumns[i].CTYPE;
                switch (iColumnType) {
                    case 3:
                    case 7:
                        sType = "numeric";
                        break;
                    case 14:
                    case 15:
                    case 17:
                    case 20:
                    case 21:
                        sType = "date";
                        break;
                    default:
                        sType = "string";
                        break;
                    }
            label = aColumns.length ? aColumns[i].LABEL : "{filterModel>" + this._oContext + "/LABEL}";
            column = aColumns.length ? aColumns[i].COLUMN : this._oContext.getProperty("COLUMN");
            this._oValueHelpDialog.setRangeKeyFields([{
                label: label,
                key: column,
                type: sType
            }]);


            if (iColumnType === 11) {
                this._oValueHelpDialog.setIncludeRangeOperations(["EQ", "BT", "LT", "LE", "GT", "GE", "Contains", "StartsWith", "EndsWith"]);
                this._oValueHelpDialog.setExcludeRangeOperations(["EQ"]);
            }
            }

        },

        /**
         * Hide standard title and create custom toolbar.
         * @returns {void}
         * @private
         */
        _createTableSearchBar: function() {
            this._oValueHelpDialogTable.addStyleClass("siemensHide");

            this._oValueHelpDialogTable.setToolbar(this._createTableToolbar());
        },

        /**
         * Create toolbar with title and SearchField
         * @returns {sap.m.Toolbar} - Instance of Toolbar
         * @private
         */
        _createTableToolbar: function() {
            var bVisible;
            if (!this._oContext.getProperty("CTYPE")){
                if (this._oContext.getModel().getData().length > 0 ){
                    bVisible = this._oContext.getModel().getData()[0].CTYPE === 11 ? true : false;
                }
            } else {
                bVisible = this._oContext.getProperty("CTYPE") === 11;
            }
            return new Toolbar({
                content: [new Title({
                    text: this._oResourceBundle.getText("vhd.TableTitle")
                }).addStyleClass("clsVHTableTitle"), new ToolbarSpacer(), new SearchField({
                    width: "50%",
                    visible: bVisible,
                    search: this._filterTable.bind(this)
                })]
            });
        },

        /**
         * Function for filter table
         * @param {sap.ui.base.Event} oEvent - search event
         * @returns {void}
         * @private
         */
        _filterTable: function(oEvent) {
            var sTerm = oEvent.getParameter("query");
            //check if clear button search field is pressed
            if (oEvent.getParameter("refreshButtonPressed") === undefined && oEvent.getParameter("query") === "") {
                this._oValueHelpDialogTable.data("clear", true);
                //set flag for search of table is done
                this._oValueHelpDialogTable.data("search", false);
            } else {
                this._oValueHelpDialogTable.data("clear", false);
                 //set flag for search of table is done
                this._oValueHelpDialogTable.data("search", true);
            }

            var aFilters = [];
            if (sTerm) {
                var aCols = this._oValueHelpDialogTable.getColumns();
                for (var i in aCols) {
                   aFilters.push( new Filter( "tolower(" + aCols[i].getProperty("filterProperty") + ")", FilterOperator.Contains, "tolower('" + sTerm + "')" ));
                }
                this._oValueHelpDialogTable.getBinding("rows").filter(new Filter({filters: aFilters, and: false}));
                //oFilter = new Filter(this._oContext.getProperty("COLUMN"), FilterOperator.Contains, sTerm);
            } else {
                this._oValueHelpDialogTable.getBinding("rows").filter(null);
            }
        },

        /**
         * Create Table columns model
         * @returns {void}
         * @private
         */
        _createTableColumnsModel: function() {
            var mCols = {
                cols: []
            };

            if (!this._oContext.getObject()){
                var aObjects = this._oContext.getModel().getData();
                for (var i in aObjects){
                    mCols.cols.push(this._createColumn(aObjects[i]));
                }
            } else {
                mCols.cols.push(this._createColumn(this._oContext.getObject()));
            }

            var sColumnName = this._oContext.getProperty("FILTER_TXT_COLUMN");
            if (sColumnName) {
                var oModel = this._oContext.getModel();
                var iColumnIndex;
                var sPath = "/ServiceToColumnConfig/results";
                oModel.getProperty(sPath).find(function(oColumn, iIndex) {
                    if (oColumn.COLUMN === sColumnName) {
                        iColumnIndex = iIndex;
                        return true;
                    }
                    return false;
                });

                var oContext = this._oContext.getModel().getProperty(sPath + "/" + iColumnIndex);
                oContext && mCols.cols.push(this._createColumn(oContext));
            }

            this._oValueHelpDialogTable.setModel(new JSONModel(mCols), "columns");
        },

        /**
         * Create Table column map of parameters
         * @param {sap.ui.model.Context} oContext - context of binded column, part of "filterModel" model
         * @returns {object} - with column properties
         * @private
         */
        _createColumn: function(oContext) {
            return {
                label: formatter.formatAggregatedColumnText(oContext.LABEL),
                template: "data>" + oContext.COLUMN,
                oType: formatter.getDataTypeInstance(oContext.CTYPE),
                filter: oContext.COLUMN
            };
        },

        /**
         * Bind Table Rows
         * @param {array} aFilters - Dependent filters
         * @returns {void}
         * @private
         */
        _bindTableRows: function(aFilters) {
            var oBusyModel = this._oValueHelpDialogTable.getModel("busy");

            !this._oValueHelpDialogTable.getBinding("rows") || this._oValueHelpDialogTable.setFirstVisibleRow(0);

            var sSelect = this._oValueHelpDialogTable.getModel("columns").getProperty("/cols").map(function(oColumn) {
                return oColumn.filter;
            }).join();
            var sOrderBy = "tolower(" + sSelect.split(",")[0] + ")";

            this._oValueHelpDialogTable.bindRows({
                path: "data>/" + this._sEntityName,
                parameters: {
                    select: sSelect
                },
                filters: aFilters,
                sorter: new sap.ui.model.Sorter(sOrderBy),
                events: {
                    dataRequested: function() {
                        oBusyModel.setProperty("/delay", 0);
                        oBusyModel.setProperty("/busy", true);
                    },
                    dataReceived: function() {
                        oBusyModel.setProperty("/busy", false);
                        oBusyModel.setProperty("/delay", this._iOriginalTableBusyDelay);
                    }.bind(this),
                    change: function() {
                        this._oValueHelpDialog._updateTable();
                    }.bind(this)
                }
            });
        }
    });
});