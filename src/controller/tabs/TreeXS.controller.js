/*!
 * Copyright 2017 Siemens AG
 */
sap.ui.define([
    "com/siemens/tableViewer/controller/BaseController",
    "com/siemens/tableViewer/controller/utilities",
    "com/siemens/tableViewer/controller/tablesUtilities",
    "com/siemens/tableViewer/model/models",
    "sap/m/MessageBox",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/odata/ODataUtils"
], function(BaseController, utilities, tablesUtilities, models, MessageBox, JSONModel, ODataUtils) {
    "use strict";

    /**
     * Constructor for XS Tree Controller
     *
     * @class
     * This is an controller class for XS Tree tab view
     * @abstract
     *
     * @extends com.siemens.tableViewer.controller.BaseController
     *
     * @constructor
     * @public
     * @alias com.siemens.tableViewer.controller.tabs.TreeXS
     */
    return BaseController.extend("com.siemens.tableViewer.controller.tabs.TreeXS", {
        tablesUtilities: tablesUtilities,

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
            this._oTreeTable = this.byId("treeXS");
            this._oTreeViewModel = this.createViewModel();
            this._iOriginalBusyDelay = this._oTreeTable.getBusyIndicatorDelay();
            var oEventBus = this.getEventBus();

            // register event for updating table with filters
            oEventBus.subscribe("com.tableViewer", "filtersUpdated", this._setupFilters, this);
            // register event for requesting new data when input parameters changed
            oEventBus.subscribe("Main", "InputParams", this._requestNewData, this);

            this.setModel(this._oTreeViewModel, "treeView");

            this.getOwnerComponent()._onWhenConfigModelDataIsLoaded.then(function() {
                var oTreeDeferred = jQuery.Deferred();
                jQuery.when(oTreeDeferred).done(this._bindTree.bind(this)).fail(this._handleFailedDataLoading.bind(this));

                var sServiceUrl = this.getModel("mainView").getProperty("/SERVICE_URL");
                models.requestTreeData(sServiceUrl, oTreeDeferred);
            }.bind(this));

        },

        /**
         * Called when the Filter Bar controller is going to be destroyed.
         * @public
         */
        onExit: function() {
            var oEventBus = this.getEventBus();

            oEventBus.unsubscribe("com.tableViewer", "filtersUpdated", this._setupFilters, this);
            oEventBus.unsubscribe("Main", "InputParams", this._requestNewData, this);
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
                    this._requestNewData();
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
                sFilterParams = this._lastAppliedFilters,
                oMainConfig = this.getOwnerComponent()._cachedConfigData,
                sSheetName = "data",
                sExportFileName = "export",
                sFormat = oEvent.getSource().data("id"),
                sExportURI = "";
                this.getView().byId("exportMenu").close();
                sFilterParams = sFilterParams ? "&$filter=" + sFilterParams.replace(/&/g, "%26") : "";
                sExportURI = sExportService + "data/" + oMainConfig.getProperty("/SERVICE_NAME") + "?"
                        + "$select=" + sVisibleColumns
                        + sFilterParams
                        + "&" + "mode=export"
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
         * Apply filters
         * @return {void}
         * @private
         */
        _setupFilters: function() {
            var aFilters = this.getModel("mainView").getProperty("/filters"),
            oColumnModel = {
                aColumns: this.getModel("data").getProperty("/Columns")
            },
            oSimulateODataObject = this._simulateODataObject(),
            sFilterString = unescape(ODataUtils.createFilterParams(aFilters, oSimulateODataObject, oColumnModel).substring(8));

            // Check if filters already applied
            if (this._lastAppliedFilters !== sFilterString) {
                this._lastAppliedFilters = sFilterString;

                this._requestNewData();
            }
        },

        /**
         * Simulate oData Object to create proper filter string
         * @return {object} - object with function which replace standard one
         * @private
         */
        _simulateODataObject: function() {
            return {
                _getPropertyMetadata: function(oColumnModel, sPath) {
                    var aColumns = oColumnModel["aColumns"],
                        oType;

                    jQuery.grep(aColumns, function(oColumn) {
                        if (oColumn.COLUMN === sPath && oColumn.CTYPE === 11) {
                            oType = {
                                type: "Edm.String"
                            };
                            return;
                        }
                    });

                    return oType;
                }
            };
        },
        /**
         * Bind JSON model data to Tree Table
         * @param {sap.ui.model.json.JSONModel} oTreeModel - Tree model instance
         * @return {void}
         * @private
         */
        _bindTree: function(oTreeModel) {
            var oViewModel = this.getModel("treeView"),
            //Number.MAX_SAFE_INTEGER does not work in IE. Works only with chrome. Hence using Math.pow which gives exactly same value as Max safe integer.
            iLimit = Number.MAX_SAFE_INTEGER ? Number.MAX_SAFE_INTEGER : Math.pow(2, 53) - 1;
            oTreeModel.setSizeLimit(iLimit);

            this.setModel(oTreeModel, "data");
            oViewModel.setProperty("/busy", false);
            oViewModel.setProperty("/delay", this._iOriginalBusyDelay);

            this._setColumnDataModel({
                Columns: oTreeModel.getProperty("/Columns")
            });

            this._oTreeTable.bindRows({
                path: "data>/Data",
                events: {
                    dataRequested: function() {
                        oViewModel.setProperty("/delay", 0);
                        oViewModel.setProperty("/busy", true);
                    },
                    dataReceived: function(oEvent) {
                            /**
                             * @ControllerHook Adaptation of Tree XS view
                             * This method is called after the tree data has been loaded to be shown on the tree XS view
                             * @callback com.siemens.tableViewer.controller.Table~extHookOnTreeXsDataReceived
                             * @param {object} oEvent Event data
                             * @return {void}
                             */
                            if (this.extHookOnTreeXsDataReceived){
                                this.extHookOnTreeXsDataReceived(oEvent);
                            }
                        oViewModel.setProperty("/busy", false);
                        oViewModel.setProperty("/delay", this._iOriginalBusyDelay);
                    }.bind(this)
                }
            });
        },

        /**
         * Handle failed request from xsjx service
         * @param {object} XMLHttpRequest - Failed response
         * @param {string} sTextStatus - Response status
         * @return {void}
         * @private
         */
        _handleFailedDataLoading: function(XMLHttpRequest) {
            var sMessage = this._getErrorMessage(XMLHttpRequest);
            var oResourceBundle = this.getResourceBundle();
            MessageBox.show(
                    sMessage, {
                    icon: MessageBox.Icon.ERROR,
                    title: oResourceBundle.getText("errorTitle"),
                    styleClass: utilities.getContentDensityClass(),
                    actions: [MessageBox.Action.CLOSE],
                    onClose: function() {}
                }
            );
            this.getModel("treeView").setProperty("/busy", false);
        },
        /**
         * Returns the error message that is to be shown
         * @param {object} XMLHttpRequest - contains the response sent by the server
         * @returns {string} the error message to be shown to the user
         */
        _getErrorMessage : function(XMLHttpRequest){
            var sString = XMLHttpRequest.responseText.toString(), aMatch, sMessage, sLocale, oBundle;
            // regex to check for error code in the server response
            aMatch = /{"code":(\d+)/.exec(sString);
            jQuery.sap.require("jquery.sap.resources");
            sLocale = sap.ui.getCore().getConfiguration().getLanguage();
            // Load the custom properties file that maps error codes to error messages
            oBundle = jQuery.sap.resources({url : "./errorText.properties", locale: sLocale});
            if (aMatch) {
                sMessage = oBundle.getText(aMatch[1]);
            } else {
                // in case code is not present, default message
                sMessage = oBundle.getText("0");
            }
                return sMessage;
        },

        /**
         * Set Column model to Table
         * @param {object} oData - date received from backend for column Config
         * @return {void}
         * @private
         */
        _setColumnDataModel: function(oData) {
            this._oTreeTable.setModel(new JSONModel(oData), "columnModel");
        },

        /**
         * Request to load new data from backend (support selecting and filtering data)
         * @param {sap.ui.table.treetable} oTable - Tree table instance
         * @param {string} sVisibleColumns - Visible columns in string for selecting parameter
         * @param {string} sFilters - Completed filter string
         * @return {void}
         * @private
         */
        _requestJsonData: function(oTable, sVisibleColumns, sFilters) {
            var sServiceUrl = this.getModel("mainView").getProperty("/SERVICE_URL"),
            oJsonModel;
            sServiceUrl = location.hostname === "localhost" ? '/localService/tree/mockdata/getHierarchyV4_2.json' : sServiceUrl;
            oJsonModel = oTable.getModel("data");

            oJsonModel.loadData(sServiceUrl, {
                "$select": sVisibleColumns,
                "$filter": sFilters
            });
        },

        /**
         * Requests new data from database based on visible columns
         * @return {void}
         * @private
         */
        _requestNewData: function() {
            var oTable = this._oTreeTable,
            sVisibleColumns = tablesUtilities._getSelectParameters(oTable.getModel("columnModel").getProperty("/Columns"));

            this._requestJsonData(oTable, sVisibleColumns, this._lastAppliedFilters);
        }
    });
});