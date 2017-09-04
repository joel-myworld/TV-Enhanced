/*!
 * Copyright 2017 Siemens AG
 */
sap.ui.define([
    "com/siemens/tableViewer/controller/BaseController",
    "com/siemens/tableViewer/controller/tablesUtilities",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/odata/ODataUtils"
], function(BaseController, tablesUtilities, JSONModel, ODataUtils) {
    "use strict";

    /**
     * Constructor for Tree Controller
     *
     * @class
     * This is an controller class for Tree tab view
     * @abstract
     *
     * @extends com.siemens.tableViewer.controller.BaseController
     *
     * @constructor
     * @public
     * @alias com.siemens.tableViewer.controller.tabs.Tree
     */
    return BaseController.extend("com.siemens.tableViewer.controller.tabs.Tree", {
        tablesUtilities: tablesUtilities,
        config: {
                paths: {
                    exportService: "odxl/odxl.xsjs"
                }
            },
        _oTreeTable: null,
        _oTreeViewModel: null,
        _iOriginalBusyDelay: null,
        _oColumnSettingsDialog: null,
        _lastAppliedFilters: null,

        /* =========================================================== */
        /* lifecycle methods                                           */
        /* =========================================================== */
        /**
         * Called when the Tree controller is instantiated. It sets up the event handling and other lifecycle tasks.
         * @public
         */
        onInit: function() {
            this._oTreeTable = this.byId("tree");
            this._oTreeViewModel = this.createViewModel();
            this._iOriginalBusyDelay = this._oTreeTable.getBusyIndicatorDelay();
            var oEventBus = this.getEventBus();

            // register event for updating table with filters
            oEventBus.subscribe("com.tableViewer", "filtersUpdated", this._setupFilters, this);
            // register event for requesting new data when input parameters changed
            oEventBus.subscribe("Main", "InputParams", this._bindTable, this);
            // register event for settign visible columns
            oEventBus.subscribe("com.tableViewer", "SetVisibleColumns",this._setVisibleColumns, this);

            this.setModel(this._oTreeViewModel, "treeView");

            this.getOwnerComponent()._onWhenConfigModelDataIsLoaded.then(function(oData) {
                this._fnColumnDataLoaded(oData);

                this.getOwnerComponent()._onWhenFiltersApplied.then(this._bindTable.bind(this));
            }.bind(this));

        },

        /**
         * Called when the Tree controller is going to be destroyed.
         * @public
         */
        onExit: function() {
            var oEventBus = this.getEventBus();

            oEventBus.unsubscribe("com.tableViewer", "filtersUpdated", this._setupFilters, this);
            oEventBus.unsubscribe("com.tableViewer", "SetVisibleColumns",this._setVisibleColumns, this);
            oEventBus.unsubscribe("Main", "InputParams", this._bindTable, this);
        },

        /* =========================================================== */
        /* event handlers                                              */
        /* =========================================================== */

        /**
         * Creates Personalization dialog where user can change tree table columns visiblity and order
         * @return {void}
         * @private
         */
        onTableColumnSettingsPress: function() {
            this._oColumnSettingsDialog = tablesUtilities._getTableColumnSettingsDialog(this._oColumnSettingsDialog, this._oTreeTable);
            this._oColumnSettingsDialog.openDialog();

            if (this._oColumnSettingsDialog._oDialog.mEventRegistry.confirm.length < 2) {
                this._oColumnSettingsDialog._oDialog.attachEventOnce("confirm", function() {
                    tablesUtilities._saveVisibleColumns(this);
                    this._bindTable();
                }.bind(this));
            }
        },
        /**
         * Event handler when an export button is pressed
         * @param {sap.ui.base.Event} oEvent - on Click event
         * @returns {void}
         * @public
         */
        onTableExport: function (oEvent) {
            tablesUtilities.openExportPopover(oEvent, this.getView(), this);
        },
        /**
         * Executed when user select export to excel possibility in Export Popover
         * @param {sap.ui.base.Event} oEvent - Excel/csv item list pressed
         * @return {void}
         * @public
         */
        onExportPressed: function(oEvent) {
            var sVisibleColumns = tablesUtilities._getTreeVisibleColumns(this._oTreeTable).toString(),
                sExportService = this.getOwnerComponent().getMetadata().getConfig().serviceUrl.replace("Main.xsodata", ""),
                oBinding = this._oTreeTable.getBinding("rows"),
                aFilters = oBinding.aFilters,
                oMainConfig = this.getOwnerComponent()._cachedConfigData,
                sDataSource = oMainConfig.getProperty("/DATA_SOURCE"),
                sSheetName = "data",
                sExportFileName = "export",
                sFormat = oEvent.getSource().data("id"),
                sExportURI = "",
                sInputParams = "",
                oMetadata = this.getModel("data").oMetadata,
			    sResolvedPath = oMainConfig.getProperty("/ENTITY_NAME"),
			    oEntitySet = oMetadata._getEntityTypeByPath(sResolvedPath),
			    sFilterParams = ODataUtils.createFilterParams(aFilters, oMetadata, oEntitySet);
                this.getView().byId("exportMenu").close();
                sFilterParams = sFilterParams ? "&" + sFilterParams : "";
                if (oMainConfig.getProperty("/INPUT_PARAMETERS")) {
                    sInputParams = sResolvedPath.slice(sResolvedPath.indexOf("("), sResolvedPath.indexOf(")") + 1);
                    sInputParams = sInputParams.replace(/datetime/g, ""); // Remove datetime property
                    sInputParams = sInputParams.replace(/time/g, ""); // Remove time property
                }
                sExportURI = sExportService + this.config.paths.exportService + "/%22_SYS_BIC%22/%22" + sDataSource + "%22" + sInputParams + "?"
                    + "$select=" + sVisibleColumns
                    + sFilterParams
                    + "&" + "$format=" + sFormat
                    + "&" + "fieldsep=;"
                    + "&" + "sheetname=" + sSheetName
                    + "&" + "download=" + sExportFileName + "." + sFormat
                    + "&" + "langu=" + this.getAppLanguage();
                window.open(sExportURI);
        },
        /* =========================================================== */
        /* begin: internal methods                                     */
        /* =========================================================== */

         /**
         * Set Visibility of columns in table
		 * @param {string} sChannel - Channel Name
		 * @param {string} sEvent - Event Name
		 * @param {object} oData - Odata Objects
         * @return {void}
         * @private
         */
        _setVisibleColumns:function(sChannel, sEvent, oData){
            tablesUtilities._setVisibleColumns(this,oData);
        },

        /**
         * Called on publish event
         * @return {void}
         * @private
         */
        _setupFilters: function() {
            this._bindTable();
        },

        /**
         * Bind column Model when received config from backend
         * @param {object} oData - Backend config data
         * @return {void}
         * @private
         */
        _fnColumnDataLoaded: function(oData) {
            var oMainViewModel = this.getView().getModel("mainView"),
            aVisibleColumns = oMainViewModel.getProperty("/visibleColumns"),
            oColumnModel = new JSONModel(oData);
            this.getView().setModel(oColumnModel, "columnModel");
            tablesUtilities._setVisibleColumns(this, aVisibleColumns);
            this._oTreeTable.bindElement({
                path: "columnModel>/"
            });
        },

        /**
         * Bind Table Data
         * @param {sap.ui.model.json.JSONModel} oMainViewModel - passed when promise resolved,
         * since from initialization Tree doesn't inherit mainView model
         * @return {void}
         * @private
         */
        _bindTable: function(oMainViewModel) {
            oMainViewModel = oMainViewModel || this.getView().getModel("mainView");
            var sPath = "data>/" + oMainViewModel.getProperty("/ENTITY_NAME"),
            oColumns = tablesUtilities._getServiceToColumnData(this),
            sSelectColumn = tablesUtilities._getSelectParameters(oColumns),
            oViewModel = this._oTreeViewModel,
            iOriginalBusyDelay = this._iOriginalBusyDelay;

            this._oTreeTable.bindRows({
                path: sPath,
                parameters: {
                    treeAnnotationProperties: {
                        hierarchyLevelFor: 'LEVEL',
                        hierarchyNodeFor: 'QUERY_NODE',
                        hierarchyParentNodeFor: 'PRED_NODE',
                        hierarchyDrillStateFor: 'IS_LEAF'
                    },
                    select: sSelectColumn
                },
                filters: oMainViewModel.getProperty("/filters"),
                events: {
                    dataRequested: function() {
                        if (Object.keys(this.mRequestHandles).length === 0) {
                            oViewModel.setProperty("/delay", 0);
                            oViewModel.setProperty("/busy", true);
                        }
                    },
                    dataReceived: function(oEvent) {
                        if (Object.keys(oEvent.getSource().mRequestHandles).length === 0) {

                            /**
                             * @ControllerHook Adaptation of Tree view
                             * This method is called after the tree data has been loaded to be shown on the tree view
                             * @callback com.siemens.tableViewer.controller.Table~extHookOnTreeDataReceived
                             * @param {object} oEvent Event Data
                             * @return {void}
                             */
                            if (this.extHookOnTreeDataReceived){
                                this.extHookOnTreeDataReceived(oEvent);
                            }
                            oViewModel.setProperty("/busy", false);
                            oViewModel.setProperty("/delay", iOriginalBusyDelay);
                        }
                    }.bind(this)
                }
            });
        }
    });
});