/*!
 * Copyright 2017 Siemens AG
 */
sap.ui.define([
    "com/siemens/tableViewer/controller/BaseController",
    "sap/ui/model/json/JSONModel",
    "com/siemens/tableViewer/model/models",
    "com/siemens/tableViewer/model/formatter",
    "com/siemens/tableViewer/controller/utilities",
    "sap/ui/model/odata/ODataModel",
    "sap/ui/model/odata/CountMode",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
], function(BaseController, JSONModel, models, formatter, utilities, ODataModel, CountMode, Filter, FilterOperator) {
    "use strict";

    /**
     * Constructor for Main Controller
     *
     * @class
     * This is an controller class for Main view.
     * @abstract
     *
     * @extends com.siemens.tableViewer.controller.BaseController
     *
     * @constructor
     * @public
     * @alias com.siemens.tableViewer.controller.Main
     */
    return BaseController.extend("com.siemens.tableViewer.controller.Main", {
        formatter: formatter,

        _iOriginalBusyDelay: null,
        _oErrorHandler: null,
        _isInputParamsCalled : false,

        /* =========================================================== */
        /* lifecycle methods                                           */
        /* =========================================================== */

        /**
         * Called when the main view is instantiated.
         * It sets up the event handling and other lifecycle tasks.
         * @public
         */
        onInit: function() {
            var oView = this.getView(),
				oController = this.getView().getController();
            this._iOriginalBusyDelay = oView.getBusyIndicatorDelay();

            // set view properties model
            var oViewModel = this.createViewModel(),
                oEventBus = this.getEventBus(),
				aApplicationFilter = [];
            oViewModel.setProperty("/bFilterValueFireChanges", true);
			oViewModel.setProperty("/filters", []);
            oView.setModel(oViewModel, "mainView");

			/**
			 * @ControllerHook Adaptation of Main view
			 * This method is called inside the init method of the main view controller
			 * @callback com.siemens.tableViewer.controller~extHookOnInitFilter
			 * @return {void}
			 */
            if (oController.extHookOnInitFilter){
               aApplicationFilter = oController.extHookOnInitFilter();
            }
			this._applyApplicationFilters(aApplicationFilter,oViewModel);

            this.getOwnerComponent()._onWhenConfigModelDataIsLoaded.then(function (oData) {
				this._cachConfigData(oData);
				this._setMainViewModelProperty(oData);
			}.bind(this));

            // save app status before opening a dependant report
			oEventBus.subscribe("com.tableViewer", "SaveInitialReport", this._saveInitialReport, this);

            // attach route matched
            this.getRouter().getRoute("tableviewer").attachMatched(this.onRouteMatched, this);
        },

        /* =========================================================== */
        /* event handlers                                              */
        /* =========================================================== */

        /**
         * Executed when event route "tableviewer" matched.
         * It bind current view with configuration passing Control Id
         * @param oEvent {sap.ui.base.Event}
         * @public
         */
        onRouteMatched: function(oEvent) {
            if (!this._isTableViewerRouteMatch(oEvent)) {
                return;
            }

            var oTab = oEvent.getParameter("arguments")["tab"],
            oViewModel = this.getView().getModel("mainView");
            // when Data Details Model Promise has been resolved - continue with building required UI views
            this.getOwnerComponent()._onWhenConfigModelDataIsLoaded.then(function(oData) {
				var sUriParamDepend = this.getOwnerComponent()._getUriParams("dependent"),
				bHideVariant,
				oEventBus = this.getEventBus();
                if (this._loadIconTabs(oTab)) {
                    return;
                }
                if (oData["INPUT_PARAMETERS"] && this._isInputParamsCalled === false) {
                    this._isInputParamsCalled = true;
                    this._initInputParameters();
                }
                this._loadFilterBar();

                this._setTableData(oData["ODATA_SRV"]);
				//prepare flag to hide variant when report to report interface has dependent variant
                if (sUriParamDepend) {
					bHideVariant = sUriParamDepend === "true" ? true : false;
				}else {
					bHideVariant = false; //when no url param with dependent by default take it false
				}
                if (oData["VARIANT_HIDDEN"] || bHideVariant) {
                    this.resolveOnWhenFilterAppliedPromise(this);
					if (bHideVariant) {//publish event for setting the busy state for filter bar to false during report to report
						oEventBus.publish("FilterBar", "SetBusyState", {
                            busy: false,
                            delay: this._iOriginalBusyDelay
                        });
                    }
                } else {
                    this._loadVariantMngt();
                    oViewModel.setProperty("/filterVisible", true);
                }

                this.byId("tableTab").getParent().bindProperty("visible", "mainView>/filterVisible");
            }.bind(this)).catch(function() {
                this.getRouter().getTargets().display("notFound");
            }.bind(this));
        },
        /**
		 * Navigates back in the browser history, if the entry was created by this app.
		 * If not, it navigates to the Fiori Launchpad home page.
		 * @param {Boolean} bDeleted - variant to be deleted when navback
		 * @returns {void}
		 * @public
		 */
		onNavBack: function(bDeleted) {
            var oHistory = sap.ui.core.routing.History.getInstance(),
				sPreviousHash = oHistory.getPreviousHash(),
                oVariantModel = this.getModel("main"),
                sCtrl = this.getOwnerComponent()._sControlId,
				bDependent = this.getOwnerComponent()._getUriParams("dependent");

                if (!(typeof bDeleted === "boolean") && bDependent === "true") {

				if (!oVariantModel) {
					// set variant model
					oVariantModel = models.createODataModelWithParameters(this.getOwnerComponent().getMetadata().getConfig().serviceUrl);
					this.setModel(oVariantModel, "main");
				}
                oVariantModel.read("/UserVariants", {
					filters: [new Filter([new Filter("VARIANTID", FilterOperator.EQ, "DependentReport"), new Filter("CTRLID", FilterOperator.EQ, sCtrl)], true)],
					success: function(oData) {
						var sUri = oData.results[0].__metadata.uri;
						var sPath = sUri.substring(sUri.lastIndexOf("UserVariants"), sUri.length).replace("UserVariants", "VariantManagement");
						sPath = sPath.replace(",IS_GLOBAL=0","");
						sPath =	sPath.replace(",IS_GLOBAL=1","");
						oVariantModel.remove("/" + sPath, {
							success: function() {
								jQuery.sap.log.info("Variant removed");
								this.onNavBack(true);
							}.bind(this),
							error: function(oError) {
								jQuery.sap.log.error(oError);
							}
						});
					}.bind(this)
				});
                return;
                }
                if (sPreviousHash !== undefined) {
				// The history contains a previous entry
				history.go(-1);
			} else {
				// Navigate back to FLP home
				if (sap.ushell) {
					sap.ushell.Container.getService("CrossApplicationNavigation").backToPreviousApp();
				} else {
					history.go(-1);
				}

			}
        },

        /**
         * When icon tab is changed
         * @param {sap.ui.base.Event} oEvent - on select iconTab
         * @public
         */
        onIconTablSelect: function(oEvent) {
            this.getRouter().navTo("tableviewer", {
                tab: oEvent.getParameter("selectedKey")
            }, false /*with history*/ );
        },
        /**
		 * Call Input parameter Dialog
		 * @public
		 */
		onInputParametersPress: function() {
			// create fragment instance
			if (!this._oInputParameterDialog) {
				this._oInputParameterDialog = sap.ui.xmlfragment("com.siemens.tableViewer.view..fragments.InputParametersDialog", this);
                utilities.attachControl(this.getView(), this._oInputParameterDialog);
				// Create controls for Input parameters
				this._createControls();
			}
			jQuery.sap.delayedCall(0, this, function() {
				this._oInputParameterDialog.open();
			});
		},
        /**
		 * Cancel Input parameter dialog
		 * @public
		 */
		onInputParameterCancel: function() {
			this._oInputParameterDialog.close();
		},
		/**
		 * Create entity path and search data for this url
		 * @public
		 */
		onInputParameterSearch: function() {
			var oEventBus = this.getEventBus(),
			oInputParamsModel = this.getModel("inputParameters"),
			oMainViewModel = this.getModel("mainView");
			this._setEntityNameWithInputParams(oInputParamsModel, oMainViewModel);
			// this._clearFilterItems();//reset filters
			// Request new data for the chart & table
            var sTab = oMainViewModel.getProperty("/selectedKey");
            if  (sTab === "Chart"){
                    oEventBus.publish("com.tableViewer", "filtersUpdatedFromChart");
            }else if ( sTab === "Mix" ){
                    oEventBus.publish("com.tableViewer", "filtersUpdatedFromChart");
                    oEventBus.publish("com.tableViewer", "filtersUpdated");
            }else {
                    oEventBus.publish("com.tableViewer", "filtersUpdated");
            }
			// Close dialog if it exists
			if (this._oInputParameterDialog) {
				this._oInputParameterDialog.close();
			}
		},
        /* =========================================================== */
        /* begin: internal methods                                     */
        /* =========================================================== */
        /**
		 * To clear previous filters in filter bar. Fires filter bar clear event
		 * @private
		 */
		_clearFilterItems: function() {
			var oFilterContainer = this.byId("filterBarContainer"),
			oFilterBar = oFilterContainer.getContent()[0].getContent()[0];
			oFilterBar.fireClear();
		},
        /**
		 * To instantiate the input parameters call
		 * @private
		 */
        _initInputParameters: function() {
            var oMainConfigModel = this.getOwnerComponent()._cachedConfigData,
			sEntityName = oMainConfigModel.getProperty("/ENTITY_NAME"),
			aSplitedEntity = sEntityName.split("/"),
			oInputParamsModel = models.createInputParametersModel(),
            bDependent,
            oModel = models.createODataModelWithParameters(this.getModel("mainView").getProperty("/SERVICE_URL")),
            fnLoadParameters;

			this.setModel(oInputParamsModel, "inputParameters");
			fnLoadParameters = function () {
				this._getMetadataDefaultValues(oModel, oInputParamsModel);
				// Check if ENTITY_NAME has full path like EntitySet(KEYS=''..)/Results
				if (aSplitedEntity.length > 1) {
					this._getDefaultEntityValues(aSplitedEntity[0], oInputParamsModel);
				}
				bDependent = this.getOwnerComponent()._getUriParams("dependent");
				if (bDependent === "true") {
					this._getDefaultEntityValues(aSplitedEntity[0], oInputParamsModel);
				}
				if (bDependent === "false") {
					return;
				} else if (oMainConfigModel.getProperty("/INPUTPARAMS_DIALOG")) {
					this.onInputParametersPress();
				} else {
					this._setEntityNameWithInputParams(oInputParamsModel, oMainConfigModel);
				}
			};
			oModel.attachMetadataLoaded(fnLoadParameters.bind(this), fnLoadParameters);
        },
        /**
		 * Create CheckBox controls for Input parameters and put them on the dialog
		 * @private
		 */
		_createControls: function() {
			var oControls = this.getModel("inputParameters").getProperty("/controls"),
				oSimpleForm = sap.ui.getCore().byId("siemensUiInputParamsForm"),
				oUIControl;

			for (var sTechName in oControls) {
				// Add Label
				oSimpleForm.addContent(new sap.m.Label({
					text: "{inputParameters>/controls/" + sTechName + "/label}"
				}).addStyleClass("sapUiTinyMarginTop"));

				// Create UI Control
				switch (oControls[sTechName].type) {
					case "Edm.Byte":
					case "Edm.Int16":
					case "Edm.Int32":
					case "Edm.Int64":
					case "Edm.Decimal":
					case "Edm.Single":
					case "Edm.Double":
						oUIControl = new sap.m.Input({
							value: "{inputParameters>/controls/" + sTechName + "/value}",
							type: "Number",
							width: "80%"
						});
						break;
					case "Edm.DateTime":
						oUIControl = new sap.m.DatePicker({
							value: {
								path: "inputParameters>/controls/" + sTechName + "/value",
								type: "sap.ui.model.type.Date",
								formatOptions: {
									source: {
										pattern: 'yyyy-MM-ddTHH:mm:ss'
									}
								}
							},
							width: "80%"
						});
						break;
					case "Edm.Time":
						oUIControl = new sap.m.Input({
							value: {
								path: "inputParameters>/controls/" + sTechName + "/value",
								type: "sap.ui.model.type.Time",
								formatOptions: {
									source: {
										pattern: "'PT'HH'H'mm'M'ss'S'"
									},
									pattern: "HH:mm"
								}
							},
							width: "80%"
						});
						break;
					case "Edm.String":
					default:
						oUIControl = new sap.m.Input({
							value: "{inputParameters>/controls/" + sTechName + "/value}",
							type: "Text",
							width: "80%"
						});
						break;
				}
				// Add Control
				oSimpleForm.addContent(oUIControl);
			}
		},
        /**
         * Cache configuration data
         * @param {object} oData - backend data
         * @private
         */
        _cachConfigData: function(oData) {
            this.getOwnerComponent()._cachedConfigData = jQuery.extend(true, {}, new JSONModel(oData));
        },
        /**
         * Remove busy indicator and set view model properties
         * @param {object} oData - backend data
         * @return {void}
         * @private
         */
        _setMainViewModelProperty: function(oData) {
            var oMainViewModel = this.getModel("mainView"),
            oJsonData = oMainViewModel.getData();

            oJsonData.busy = false;
            oJsonData.delay = this._iOriginalBusyDelay;
            oJsonData.ENTITY_NAME = oData["ENTITY_NAME"];
            oJsonData.PAGE_TITLE = oData["DESCRIPTION"] || this.getResourceBundle().getText("errors.notfound");
            oJsonData.SERVICE_NAME = oData["SERVICE_NAME"];
            oJsonData.SERVICE_URL_ABSOLUTE = this.getOwnerComponent()._sServicePath;
            oJsonData.SERVICE_URL = this.getOwnerComponent()._sServicePath + "data/" + oData["SERVICE_NAME"];
            oJsonData.ODATA_SRV = oData["ODATA_SRV"];
            oJsonData.IS_HIERARCHY = oData["IS_HIERARCHY"];
            oJsonData.CHART_VISIBLE = oData["CHART_HIDDEN"];
            oJsonData.TABLE_TITLE = oData["TABLE_TITLE"];
            oJsonData.DRILL_DOWN = oData["DRILL_DOWN"];
            oJsonData.DRILL_DOWN_TARGET = oData["DRILL_DOWN_TARGET"];
            oJsonData.IS_MIXED = oData["IS_MIXED"];
            oJsonData.INPUT_PARAMETERS = oData["INPUT_PARAMETERS"];
            oJsonData.ADMIN_CELL_COLOR = oData["ADMIN_CELL_COLOR"];
			oJsonData.ADMIN_SHARE_VARIANT = oData["ADMIN_SHARE_VARIANT"];

            oMainViewModel.setData(oJsonData);
        },

        /**
         * Lazy Loading of Icon Tabs
         * @param {string} sTab - Hash parameter
         * @return {boolean} true/false - is target exist or not
         * @private
         */
        _loadIconTabs: function(sTab) {
            var aVisibleItems = this.byId("idIconTabBar").getItems().reduce(function(aTransition, oItem) {
                if (oItem.getVisible()) {
                    aTransition.push(oItem.getKey());
                }
                return aTransition;
            }, []);

            if (sTab && aVisibleItems.indexOf(sTab) > -1) {
                if (sTab === "Chart" && this._getChartVisible()) {
                    sTab = "Table";
                }
                this.getModel("mainView").setProperty("/selectedKey", sTab);
                this.getRouter().getTargets().display(sTab);
                return false;
            } else {
                sTab = aVisibleItems[0];
                this._navToTab(sTab);
                return true;
            }
        },

        /**
         * Navigate to default tab
         * @param {string} sTab - visible icon tab
         * @private
         */
        _navToTab: function(sTab) {
            // the default table should be visible
            this.getRouter().navTo("tableviewer", {
                tab: sTab
            }, true /*no history*/ );
        },

        /**
         * Getter for chart visibility property
         * @returns {Number} 0|1 - is Visible
         * @private
         */
        _getChartVisible: function() {
            return this.getModel("mainView").getProperty("/CHART_VISIBLE");
        },

        /**
         * Validate route match
         * @param oEvent {sap.ui.base.Event}
         * @returns {boolean}
         * @private
         */
        _isTableViewerRouteMatch: function(oEvent) {
            return oEvent.getParameter("name") === "tableviewer";
        },

        /**
         * Using router find target variant management and load depended view
         * @private
         */
        _loadVariantMngt: function() {
            this.getRouter().getTargets().display("variantManagement");
        },

        /**
         * Using router find target filterbar and load depended view
         * @private
         */
        _loadFilterBar: function() {
            this.getRouter().getTargets().display("filterBar");
        },

        /**
         * Setter for oData data model
         * @param {boolean} bOdata - is service oData based
         * @private
         */
        _setTableData: function(bOdata) {
            if (bOdata) {
                var sServiceURL = this.getModel("mainView").getProperty("/SERVICE_URL");
                this.getView().setModel(models.createODataModelWithParameters(sServiceURL), "data");
                // initialize the error handler
                jQuery.sap.require("com.siemens.tableViewer.controller.ErrorHandler");
                this._oErrorHandler = new com.siemens.tableViewer.controller.ErrorHandler(this);
            }
        },
        /**
         * Function for saving current app status before opening dependant report
         * @private
         * @returns {void}
         */
        _saveInitialReport: function() {
            var sMainConfigModel = this.getModel("mainView"),
				sCtrlID = this.getOwnerComponent()._sControlId,
				oFilterObject = {},
                oVariantModel = this.getModel("main"),
                oPayLoad;

			oFilterObject["oFilters"] = this._getAppliedFilters();

			if (sMainConfigModel.getProperty("/INPUT_PARAMETERS")) {
				oFilterObject["IP"] = sMainConfigModel.getProperty("/ENTITY_NAME");
			}
			if (!oVariantModel) {
				// set variant model
				oVariantModel = models.createODataModelWithParameters(this.getOwnerComponent().getMetadata().getConfig().serviceUrl);
				this.setModel(oVariantModel, "main");
			}
            oPayLoad = {
				CTRLID: sCtrlID,
				VARIANTID: "InitialReport",
				USERID: "",
				VARIANT_NAME: "InitialReport",
				IS_DEFAULT: 0,
				IS_GLOBAL: 0,
				IS_HIDDEN: 1,
				FILTER_OBJECT: encodeURI(JSON.stringify(oFilterObject)),
				FOR_USERS: "",
				TABLE_COLUMNS: encodeURI(JSON.stringify(this._getTableColumns()))
			};

			oVariantModel.create("/VariantsUpsert", oPayLoad, {
				success: function() {
					if (this.getModel("mainView").getProperty("/moveToNewReport")) {
						this.getModel("mainView").setProperty("/moveToNewReport", false);
						this.handleCrossAppNavigation(sCtrlID, true);
					} else {
						this.getModel("mainView").setProperty("/moveToNewReport", true);
					}
				}.bind(this),
				error: function(oError) {
					jQuery.sap.log.error(oError,"com.siemens.tableViewer.Main._saveInitialReport");
				}
			});
        },
		/**
		 * Method to get the applied filters for the table for saving intial report for report-report functionality
		 * @returns {Array} aSavedObjects - Array of objects with key, texts, field name and class name Details
		 * @private
		 */
        _getAppliedFilters: function() {
			var oFilterBar = this.byId("filterBarContainer").getContent()[0].getContent()[0],
				aFilterItems = oFilterBar.getFilterItems(),
				aSavedObjects = [];

			jQuery.grep(aFilterItems, function(oFilterItem) {
				var oFilterControl = oFilterBar.determineControlByFilterItem(oFilterItem),
					sClassName = oFilterControl.getMetadata()._sClassName;

				if (sClassName === "sap.m.MultiInput" && (oFilterControl.getTokens().length > 0 || !!oFilterControl.getValue())) {
					if (oFilterControl.getTokens().length > 0) {
						var aTokensString = [];

						jQuery.grep(oFilterControl.getTokens(), function(oToken) {
							aTokensString.push({
								sKey: oToken.getKey(),
								sText: oToken.getText(),
								sCustomDataKey: oToken.getCustomData()[0].getProperty("key"),
								sCustomData: JSON.stringify(oToken.getCustomData()[0].getProperty("value"))
							});
						});

						aSavedObjects.push({
							sFieldName: oFilterControl.getName(),
							sClassName: sClassName,
							aTokens: JSON.stringify(aTokensString)
						});
					} else {
						aSavedObjects.push({
							sFieldName: oFilterControl.getName(),
							sClassName: sClassName,
							sValue: oFilterControl.getValue()
						});
					}
				} else if (sClassName === "sap.m.Input" && oFilterControl.getValue()) {
					aSavedObjects.push({
						sFieldName: oFilterControl.getName(),
						sClassName: sClassName,
						sValue: oFilterControl.getValue()
					});
				} else if (sClassName === "sap.m.DatePicker" && oFilterControl.getDateValue()) {
					aSavedObjects.push({
						sFieldName: oFilterControl.getName(),
						sClassName: sClassName,
						sValue: oFilterControl.getDateValue()

					});
				} else if (sClassName === "sap.m.DateRangeSelection" && oFilterControl.getDateValue()) {
					var aValues = [];

					aValues.push(oFilterControl.getDateValue());

					if (oFilterControl.getSecondDateValue()) {
						aValues.push(oFilterControl.getSecondDateValue());
					}

					aSavedObjects.push({
						sFieldName: oFilterControl.getName(),
						sClassName: sClassName,
						aValues: JSON.stringify(aValues)
					});
				} else if (sClassName === "sap.m.MultiComboBox" && oFilterControl.getSelectedItems().length > 0) {
					var aItems = oFilterControl.getSelectedItems().map(function(oItem) {
						return oItem.getProperty("text");
					});

					aSavedObjects.push({
						sFieldName: oFilterControl.getName(),
						sClassName: sClassName,
						aValues: JSON.stringify(aItems)
					});
				} else if (sClassName === "sap.m.ComboBox" && oFilterControl.getSelectedKey()) { //take values from combobox control for filtering
					aSavedObjects.push({
						sFieldName: oFilterControl.getName(),
						sClassName: sClassName,
						sValue: oFilterControl.getSelectedKey()
					});
				}
			});
			return aSavedObjects;
		},
        /**
		 * Retrieve the table columns
		 * @private
		 * @returns {string} sVisibleColumns - string of visible column, separated by comma
		 */
		_getTableColumns: function() {
			var sVisibleColumns = "",
			oTable = this._getTable(),
			aColumns;

			if (oTable !== undefined && oTable !== null) {
				    aColumns = oTable.getAggregation("columns");
					sVisibleColumns = this._readVisibleColumns(aColumns, false);
			} else {
				sVisibleColumns = "";
			}
			return sVisibleColumns;
		},
        /**
		 * Retrieve the table tree/table
		 * @private
		 * @returns {object} oTable table instance
		 */
		_getTable: function() {
			var oTable,
			sIconTabId = this._getIconTab(),
			oIconTab = this.getView().byId(sIconTabId);
			if (oIconTab.getAggregation("content") !== null) {
				if (oIconTab.getAggregation("content").length > 0){
					if (sIconTabId === "mixTab") {
						oTable = oIconTab.getAggregation("content")[0].getAggregation("content")[0].getAggregation("contentAreas")[0].getAggregation("content")[0].getAggregation("content")[0];
					} else {
						oTable = oIconTab.getAggregation("content")[0].getAggregation("content")[0];
					}
				}
			}
			return oTable;
		},
        /**
		 * Retrieve icon tab instance
		 * @private
		 * @returns {object} sIconTabId - icon tab instance
		 */
		_getIconTab: function() {
			var oModel = this.getOwnerComponent()._cachedConfigData,
				sMixed = oModel.getProperty("/IS_MIXED"),
				sIconTabId = (this._tableViewerTableType === "table") ? "tableTab" : "treeTab";
			if (sMixed === 1) {
				sIconTabId = "mixTab";
			}
			return sIconTabId;
		},

		/**
		 * Apply custom application filters
		 * @private
		 * @param {Array} aApplicationFilter - Application filters
		 * @param {Object} oViewModel - Main view model
		 * @returns {void}
		 */
		_applyApplicationFilters:function(aApplicationFilter,oViewModel){
            var bAppFilter = this.checkFilters(aApplicationFilter);
            if (bAppFilter){
                oViewModel.setProperty("/filters", aApplicationFilter);
				oViewModel.setProperty("/applicationFilters", aApplicationFilter);
            }else {
                jQuery.sap.log.error("Application filters are not correct");
            }
		}
        /* =========================================================== */
        /* end: internal methods                                       */
        /* =========================================================== */
    });
});