/*!
 * Copyright 2017 Siemens AG
 */
sap.ui.define([
	"com/siemens/tableViewer/controller/BaseController",
	"com/siemens/tableViewer/model/models",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/model/json/JSONModel",
	"com/siemens/tableViewer/controller/utilities",
	"com/siemens/tableViewer/controller/chartsUtilities",
	"sap/m/List",
	"sap/m/ViewSettingsDialog",
	"sap/m/ViewSettingsItem",
	"sap/m/ViewSettingsFilterItem",
	"sap/m/Popover",
	"sap/m/StandardListItem",
	"sap/m/MessageBox",
	"sap/m/Text"
], function (BaseController, models, Filter, FilterOperator, JSONModel, utilities, chartsUtilities,
	List, ViewSettingsDialog, ViewSettingsItem, ViewSettingsFilterItem, Popover, StandardListItem, MessageBox, Text) {
	"use strict";

	/**
	 * Constructor for Chart Controller
	 *
	 * @class
	 * This is an controller class for Main view .
	 * @abstract
	 *
	 * @extends com.siemens.tableViewer.controller.BaseController
	 *
	 * @constructor
	 * @public
	 * @alias com.siemens.tableViewer.controller.Chart
	 */
	return BaseController.extend("com.siemens.tableViewer.controller.tabs.Chart", {
		chartsUtilities: chartsUtilities,
		_sEntityName: null,
		_chartsNames: "",
		_defChartConfig: "",
		_lastAppliedFilters: "",
		_lastAppliedSorters: "",

		/**
		 * Constants for Chart Controller
		 */
		config: {
			ui: {
				elements: {
					chart: "siemensUiChart",
					chartsGrid: "siemensUiChartsGrid",
					chartTypeButton: "chartTypeButton"
				}
			},
			paths: {
				chartsEntity: "/Charts",
				chartDimensionsMeasures: "ChartsToDimensionsMeasures",
				chartButtonsTypes: "ChartButtonsTypes",
				mainConfig: "main"
			},
			limitations: {
				chartLimitation: 5000,
				chartLimitationMeasures: 4
			},
			icons: {
				bar: "bar-chart",
				line: "line-chart",
				pie: "pie-chart",
				radar: "radar-chart",
				line_bar: "line-chart-dual-axis",
				combine: "multiple-line-chart",
				stacked: "upstacked-chart"
			}
		},

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */
		onInit: function () {
			var oEventBus = this.getEventBus();
			var oFilter = new Filter("CTRLID", FilterOperator.EQ, this.getOwnerComponent()._sControlId);

			this.getOwnerComponent()._onWhenConfigModelDataIsLoaded.then(function () {
				this._onWhenChartSetup = jQuery.Deferred();
				this._onWhenChartSetup.then(this._setupChart.bind(this));
				this._initializeChart(oFilter);
			}.bind(this));

			this.getRouter().attachRoutePatternMatched(this._onRouteMatched, this);

			// register event for updating table with filters
			oEventBus.subscribe("com.tableViewer", "filtersUpdatedFromChart", this._setupFilters, this);
			// register event for applying chart config
			oEventBus.subscribe("com.tableViewer", "SetChartConfig", this._setChartConfig, this);
		},

		/**
		 * Called when the chart controller is going to be destroyed.
		 * @public
		 */
		onExit: function () {
			var oEventBus = this.getEventBus();
			oEventBus.unsubscribe("com.tableViewer", "filtersUpdatedFromChart", this._setupFilters, this);
			oEventBus.unsubscribe("com.tableViewer", "SetChartConfig", this._setChartConfig, this);
		},

		/**
		 * Initialize chart via configuration
		 * @param {object} oFilter - Filter with control id
		 * @return {void}
		 * @private
		 */
		_initializeChart: function (oFilter) {
			models.requestChartsDimensionsMeasures(
				this.getComponentModel("main"),
				this.config.paths.chartsEntity, {
					"$expand": this.config.paths.chartDimensionsMeasures
				}, [oFilter],
				this._handleSuccessDimensionsMeasuresRequest.bind(this),
				this._handleErrorDimensionsMeasuresRequest.bind(this)
			);
		},

		/**
		 * Setup chart after Initialization
		 * @return {void}
		 * @private
		 */
		_setupChart: function () {
			this.getOwnerComponent()._onWhenFiltersApplied.then(this._bindChart.bind(this));
		},

		/**
		 * Setup filters for chart
		 * @param {String} sChannel - Channel name
		 * @param {String} sEvent  - Event name
		 * @param {Object} oData - addtional parameters
		 * @return {void}
		 * @private
		 */
		_setupFilters: function () {
			this._bindChart();
		},

		/**
		 * Set chart config and apply on chart view
		 * @param {String} sChannel - Channel name
		 * @param {String} sEvent  - Event name
		 * @param {Object} oData - addtional parameters
		 * @return {void}
		 * @private
		 */
		_setChartConfig: function (sChannel, sEvent, oData) {
			chartsUtilities._setChartConfig(this, oData);
		},

		/**
		 * Create data request for all charts
		 * @param {object} oMainViewModel - Configuration model instance
		 * @param {object} oDataModel - Data model instance
		 * @return {void}
		 * @public
		 */
		_bindChart: function (oMainViewModel, oDataModel) {
			oMainViewModel = oMainViewModel || this.getModel("mainView");
			oDataModel = oDataModel || this.getModel("data");
			var sEntityName = oMainViewModel.getProperty("/ENTITY_NAME");
			var aChartIds = this._chartsNames.split(",");
			var aFilters = oMainViewModel.getProperty("/filters");
			var aSorters = oMainViewModel.getProperty("/sorters");

			if (JSON.stringify(aFilters) !== JSON.stringify(this._lastAppliedFilters) ||
				JSON.stringify(aSorters) !== JSON.stringify(this._lastAppliedSorters) ||
				this._sEntityName !== sEntityName
			) {
				this._lastAppliedFilters = aFilters;
				this._lastAppliedSorters = aSorters;
				this._sEntityName !== sEntityName;
				aChartIds.map(function (sChartId) {
					// Check if model exist (initial loading)
					if (this.getModel(sChartId + "Data")) {
						this.getModel(sChartId + "Data").setProperty("/measures", []);
						this.getModel(sChartId + "Data").setProperty("/dimensions", []);
						this._onModelRequestChartData(this._handleCountRequestSuccess, "/$count/", sChartId, aFilters, aSorters, oMainViewModel, oDataModel);
					}
				}.bind(this));
			}
			this._lastAppliedFilters = aFilters;
			this._lastAppliedSorters = aSorters;
		},

		/**
		 * Create string for selected columns
		 * @param {string} sChartId - Chart ID
		 * @return {string} - String created based on selected measures and dimensions
		 * @private
		 */
		_getChartSelectedColumnsAsString: function (sChartId) {
			var aDimensions = this.getModel(sChartId).getProperty("/chartDimensionsMeasures/dimensions"),
				aMeasures = this.getModel(sChartId).getProperty("/chartDimensionsMeasures/measures"),
				sSelected,
				sSelectedMeasures = "",
				sSelectedDimensions = "",
				sChartType,
				sChartGroup,
				oOldSetting,
				aChartMeasureOld,
				chartData = {
					measures: [],
					dimensions: []
				};

			// Create dimension string part for request and dimension array
			jQuery.grep(aDimensions, function (oDimension) {
				if (oDimension.SELECTED) {
					sSelectedDimensions += !sSelectedDimensions ? oDimension.COLUMN : "," + oDimension.COLUMN;
					chartData.dimensions.push({
						LABEL: oDimension.LABEL,
						COLUMN: oDimension.COLUMN,
						CTYPE: oDimension.CTYPE,
						VALUES: []
					});
				}
			});

			aChartMeasureOld = this.getModel(sChartId).getData().measures;

			// Create measure string part for request and measure array
			jQuery.grep(aMeasures, function (oMeasure) {
				if (oMeasure.SELECTED) {
					sChartType = "Line Chart";
					sChartGroup = "1 Group";
					sSelectedMeasures += !sSelectedMeasures ? oMeasure.COLUMN : "," + oMeasure.COLUMN;
					if (aChartMeasureOld.length > 0) {
						oOldSetting = jQuery.grep(aChartMeasureOld, function (e) {
							return e.COLUMN === oMeasure.COLUMN;
						})[0];
						if (oOldSetting && oOldSetting.CHARTTYPE && oOldSetting.CHARTGROUP) {
							sChartType = oOldSetting.CHARTTYPE;
							sChartGroup = oOldSetting.CHARTGROUP;
						}
					}
					chartData.measures.push({
						LABEL: oMeasure.LABEL,
						COLUMN: oMeasure.COLUMN,
						CTYPE: oMeasure.CTYPE,
						VALUES: [],
						CHARTTYPE: sChartType,
						CHARTGROUP: sChartGroup
					});
				}
			});

			if (!!sSelectedDimensions && !!sSelectedMeasures) {
				sSelected = sSelectedDimensions + "," + sSelectedMeasures;
			}

			this.getModel(sChartId).setProperty("/measures", chartData.measures);
			this.getModel(sChartId).setProperty("/dimensions", chartData.dimensions);

			return sSelected;
		},

		/**
		 * Helper method to return the instance of simple form control in chart options dialog
		 * @returns {Object} - Instance of Simple form control
		 * @private
		 */
		_getHighchartOptionsForm: function () {
			return this._getFragmentControl(this._getHighchartOptionsFragDiagId(), "siemensHighchartOptionsForm");
		},

		/**
		 * Helper method to return the instance of chart options dialog control
		 * @returns {string} - Id of chart options dialog control
		 * @private
		 */
		_getHighchartOptionsFragDiagId: function () {
			return this.createId("tvFragHighchartOptionsDialog");
		},

		/**
		 * Method for getting chart options dialog
		 * @param {string} sChartId - Chart ID
		 * @param {object} oContext - Context
		 * @param {string} sSelectedChartType - Chart Type
		 * @param {string} sSelectedIcon - Chart Icon
		 * @returns {void}
		 * @public
		 */
		_getChartDialog: function (sChartId, oContext, sSelectedChartType, sSelectedIcon) {
			var aMeasures, oHighchartOptionsModel, oResourceBundle,
				aChartGroup = [],
				aChartType = [],
				iMeasureNumber, sGroup;
			// calling the fragment for the action
			if (!this.oDialogChart) {
				this.oDialogChart = sap.ui.xmlfragment(this._getHighchartOptionsFragDiagId(), "com.siemens.tableViewer/view/fragments/HighchartOptionsDialog", this); // associate controller with the fragment
				this.oDialogChart.data("chartId", sChartId).data("chartType", sSelectedChartType).data("chartIcon", sSelectedIcon);
				oHighchartOptionsModel = new JSONModel();
			}
			aMeasures = this.getModel(sChartId).getData().measures;
			//Chart types and group assignment
			oResourceBundle = this.getResourceBundle();
			aChartType.push({
				cType: oResourceBundle.getText("chart.lineChartText")
			});
			aChartType.push({
				cType: oResourceBundle.getText("chart.columnChartText")
			});

			sGroup = oResourceBundle.getText("dialog.highcharts.group");

			for (var i = 0; i < aMeasures.length; i++) {
				iMeasureNumber = i + 1;
				aChartGroup.push({
					text: iMeasureNumber + " " + sGroup,
					key: i
				});
			}
			aMeasures.forEach(function (oMeasures) {
				oMeasures.CHARTTYPES = aChartType;
				oMeasures.CHARTGROUPS = aChartGroup;
			});

			oHighchartOptionsModel.setData({
				items: aMeasures
			});
			this.setModel(oHighchartOptionsModel, "highchartOptionsModel");

			utilities.attachControl(this.getView(), this.oDialogChart);
			this.oDialogChart.open();
		},

		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */

		/**
		 * Called when chart route matched
		 * @param {object} oEvent - contains url hash parameters
		 * @return {void}
		 * @private
		 */
		_onRouteMatched: function (oEvent) {
			if (oEvent.getParameters("arguments").arguments.tab === "Chart") {
				this._bindChart();
			}
		},

		/**
		 * Event handler when a change chart measures and dimensions is pressed
		 * @param {sap.ui.base.Event} oEvent - the button pressed event
		 * @return {void}
		 * @public
		 */
		onChartDimensionMeasureButtonPressed: function (oEvent) {
			var sChartId = oEvent.getSource().getCustomData()[0].getProperty("value");

			if (!this.getModel(sChartId).getProperty("/ChartDimensionsMeasuresDialog")) {
				var oViewSettingsFilterItemMeasures = new ViewSettingsFilterItem({
					key: "measures",
					text: {
						path: "i18n>chart.filterMeasures"
					},
					multiSelect: true
				});

				var oViewSettingsFilterItemDimensions = new ViewSettingsFilterItem({
					key: "dimensions",
					text: {
						path: "i18n>chart.filterDimensions"
					},
					multiSelect: true
				});

				var oViewSettingsDialog = new ViewSettingsDialog({
					confirm: this.handleChartSettingsConfirm.bind.apply(this.handleChartSettingsConfirm, [this].concat([sChartId])),
					resetFilters: this.handleChartSettingsDialogResetFilters.bind.apply(this.handleChartSettingsDialogResetFilters, [this].concat([sChartId])),
					filterItems: [oViewSettingsFilterItemMeasures, oViewSettingsFilterItemDimensions]
				});

				var oViewSettingsItemTemplate = new ViewSettingsItem({
					text: {
						path: sChartId + ">LABEL"
					},
					key: {
						path: sChartId + ">COLUMN"
					},
					selected: {
						path: sChartId + ">SELECTED"
					}
				});

				oViewSettingsFilterItemMeasures.bindAggregation("items", sChartId + ">/chartDimensionsMeasures/measures", oViewSettingsItemTemplate);
				oViewSettingsFilterItemDimensions.bindAggregation("items", sChartId + ">/chartDimensionsMeasures/dimensions", oViewSettingsItemTemplate);

				utilities.attachControl(this.getView(), oViewSettingsDialog);
				this.getModel(sChartId).setProperty("/ChartDimensionsMeasuresDialog", oViewSettingsDialog);
			}

			jQuery.sap.delayedCall(0, this, function () {
				this.getModel(sChartId).getProperty("/ChartDimensionsMeasuresDialog").open("filter");
			});
		},

		/**
		 * Event handler when a change chart type button is pressed.
		 * It creates {sap.m.Popover} that shows the list of chart types.
		 * @param {sap.ui.base.Event} oEvent - the button pressed event
		 * @return {void}
		 * @public
		 */
		onChartTypeButtonPressed: function (oEvent) {
			var sChartId = oEvent.getSource().getCustomData()[0].getProperty("value"),
				sCharButtonsType = sChartId + this.config.paths.chartButtonsTypes;

			if (!this.getModel(sChartId).getProperty("/ChartTypePopover")) {
				this.getView().setModel(models.createChartButtonsModel(this.getResourceBundle()), sCharButtonsType);

				var oList = new List({});

				var oPopover = new Popover({
					placement: "Bottom",
					showHeader: false,
					content: [oList]
				});

				var oListTemplate = new StandardListItem({
					title: {
						path: sCharButtonsType + ">title"
					},
					icon: {
						path: sCharButtonsType + ">icon"
					},
					visible: {
						path: sCharButtonsType + ">enabled"
					},
					press: this.onChangeChartType.bind.apply(this.onChangeChartType, [this].concat([sChartId])),
					type: {
						path: sCharButtonsType + ">type"
					}
				});

				oList.bindAggregation("items", sCharButtonsType + ">/buttons", oListTemplate);

				utilities.attachControl(this.getView(), oPopover);

				this.getModel(sChartId).setProperty("/ChartTypePopover", oPopover);
			}

			// open popover with 0 delay
			var oButton = oEvent.getSource();
			jQuery.sap.delayedCall(0, this, function () {
				this.getModel(sChartId).getProperty("/ChartTypePopover").openBy(oButton);
			});
		},

		/**
		 * Handle Chart expand button pressed
		 * @param {sap.ui.base.Event} oEvent - the button pressed event
		 * @return {void}
		 * @public
		 */
		onChartExpandButtonPressed: function (oEvent) {
			this.getEventBus().publish("TableViewer", "FullMode");
			var oButton = oEvent.getSource();
			var sChartId = oButton.data("chartId");
			var oVisibilityModel = this.getModel("ChartVisibility");
			var oVisibility = oVisibilityModel.oData;
			var iChartsCount = 0;
			var iChartIndex;

			for (var sKey in oVisibility) {
				if (oVisibility.hasOwnProperty(sKey)) {
					iChartsCount++;

					if (sKey !== sChartId) {
						oVisibilityModel.setProperty("/" + sKey, !oVisibility[sKey]);
					} else {
						iChartIndex = iChartsCount;
					}
				}
			}

			var oGrid = this.getView().byId(this.config.ui.elements.chartsGrid);
			var oPanel = oButton.getParent().getParent();
			var oChartModel = this.getModel(sChartId);
			var bMatched = oButton.getProperty("icon") === "sap-icon://full-screen";
			var sGridSpan;
			var sPanelSpan;
			var sIcon;

			if (bMatched) {
				sGridSpan = sPanelSpan = "L12 M12 S12";
				sIcon = "sap-icon://exit-full-screen";
			} else {
				sGridSpan = sPanelSpan = chartsUtilities._setChartLayout(this, iChartIndex);
				sIcon = "sap-icon://full-screen";
			}

			oGrid.setDefaultSpan(sGridSpan);
			oPanel.getLayoutData().setSpan(sPanelSpan);
			oChartModel.setProperty("/expandButton/icon", sIcon);
			oChartModel.setProperty("/expandButton/pressed", bMatched);
			oChartModel.setProperty("/chartSettings/expanded", bMatched);
		},

		/**
		 * Create request for data if selected columns exist
		 * @param {function} fnSuccess - function to handle data count or raw data
		 * @param {string} sCount - additional string part for count request
		 * @param {string} sChartId - Chart ID
		 * @param {array} aFilters - received filter parameters
		 * @param {array} aSorters - received sorter parameters
		 * @param {object} oMainViewModel - Main configuration model instance
		 * @param {object} oDataModel - Main Data model instance
		 * @return {void}
		 * @private
		 */
		_onModelRequestChartData: function (fnSuccess, sCount, sChartId, aFilters, aSorters, oMainViewModel, oDataModel) {
			var sChartSelectedColumns = this._getChartSelectedColumnsAsString(sChartId);
			var aSelectedChartColumns = [];
			var aModelSorter = [];
			var bOrderBy = false;
			var sPath;

			oMainViewModel = oMainViewModel || this.getModel("mainView");
			sPath = oMainViewModel.getProperty("/ENTITY_NAME");
			oDataModel = oDataModel || this.getModel("data");

			if (sChartSelectedColumns) {
				aSelectedChartColumns = sChartSelectedColumns.split(",");
				if (aSorters && aSorters.length > 0) {
					jQuery.each(aSelectedChartColumns, function (i, c) {
						jQuery.each(aSorters, function (j, s) {
							if (c === s.sPath) {
								aModelSorter.push(s);
							}
						});
					});
				} else {
					bOrderBy = true;
				}
				this.getModel(sChartId).setProperty("/busy", true);
				models.requestData(
					oDataModel,
					sPath + sCount,
					sChartSelectedColumns,
					fnSuccess.bind.apply(fnSuccess, [this].concat([sChartId])),
					this._handleRequestError.bind.apply(this._handleRequestError, [this].concat([sChartId])),
					//true, // OrderBy Parameter
					bOrderBy,
					aFilters ? aFilters : undefined,
					aModelSorter
				);
			} else {
				this.getModel(sChartId).setProperty("/busy", false);
				// Check if model exist (initial loading)
				if (this.getModel(sChartId + "Data")) {
					this.getModel(sChartId + "Data").setProperty("/measures", []);
					this.getModel(sChartId + "Data").setProperty("/dimensions", []);
				}
			}
		},

		/**
		 * Event handler when a user selects a new chart type from Popover's list
		 * @param {string} sChartId - Chart ID
		 * @param {sap.ui.base.Event} oEvent - the Popover's List press event
		 * @return {void}
		 * @public
		 */
		onChangeChartType: function (sChartId, oEvent) {
			var oContext = oEvent.getSource().getBindingContext(sChartId + this.config.paths.chartButtonsTypes),
				sSelectedChartType = oContext.getProperty("id"),
				sSelectedIcon = oContext.getProperty("icon");

			var aDimensions = this.getModel(sChartId).getData().dimensions;
			if (sSelectedChartType === 'line_bar' && aDimensions.length > 0) {
				this._getChartDialog(sChartId, oContext, sSelectedChartType, sSelectedIcon);
			} else {
				this.getModel(sChartId).setProperty("/typeButton/icon", sSelectedIcon);
				this.getModel(sChartId).setProperty("/chartSettings/type", sSelectedChartType);
				chartsUtilities._saveChartConfig(this);
			}
			this.getModel(sChartId).getProperty("/ChartTypePopover").close();
		},

		/**
		 * Event handler when a user press "OK" button in the Chart Options dialog
		 * @returns {void}
		 * @public
		 */
		onHighchartsOk: function () {
			var sChartId = this.oDialogChart.getCustomData()[0].getProperty("value"),
				oHighchartOptionsModel = this.getModel("highchartOptionsModel"),
				sSelectedChartType = this.oDialogChart.getCustomData()[1].getProperty("value"),
				sSelectedIcon = this.oDialogChart.getCustomData()[2].getProperty("value"),
				aMeasures = oHighchartOptionsModel.oData;

			for (var i = 0; i < aMeasures.items.length; i++) {
				var sSelectedItem = oHighchartOptionsModel.getProperty("/items/" + i + "").CHARTTYPE;
				var sSelectedGroup = oHighchartOptionsModel.getProperty("/items/" + i + "").CHARTGROUP;
				aMeasures.items[i].CHARTTYPE = (sSelectedItem && sSelectedItem !== undefined && sSelectedItem !== "") ? sSelectedItem : "Column Chart";
				aMeasures.items[i].CHARTGROUP = (sSelectedGroup && sSelectedGroup !== undefined && sSelectedGroup !== "") ? sSelectedGroup : "0";
			}

			//check
			this.getModel(sChartId).setProperty("/typeButton/icon", sSelectedIcon);
			this.getModel(sChartId).setProperty("/chartSettings/type", sSelectedChartType);
			chartsUtilities._setChartData(this, sChartId);
			chartsUtilities._saveChartConfig(this);

			if (this.oDialogChart) {
				this.oDialogChart.destroy();
				this.oDialogChart = null;
			}
		},

		/**
		 * Event handler when a user press "CANCEL" button in the Chart Options dialog
		 * @param {sap.ui.base.Event} oEvent - the Chart options dialog "CANCEL"
		 * @returns {void}
		 * @public
		 */
		onHighchartsCancel: function () {
			if (this.oDialogChart) {
				this.oDialogChart.destroy();
				this.oDialogChart = null;
			}
		},

		/* =========================================================== */
		/* Callback handler functions                         */
		/* =========================================================== */

		/**
		 * Event handler when a dimension and measures dialog is closed with OK button
		 * @param {string} sChartId - Chart ID
		 * @return {void}
		 * @public
		 */
		handleChartSettingsConfirm: function (sChartId) {
			var aSorters = this._lastAppliedSorters;
			chartsUtilities._saveChartConfig(this);
			this._onModelRequestChartData(this._handleCountRequestSuccess, "/$count/", sChartId, this._lastAppliedFilters, aSorters);

		},

		/**
		 * Event handler when a user would like to reset his filters and restore icon has been pressed
		 * @param {string} sChartId - Chart ID
		 * @return {void}
		 * @public
		 */
		handleChartSettingsDialogResetFilters: function (sChartId) {
			this.getModel(sChartId).setProperty("/chartDimensionsMeasures", models.createDimensionMeasures(this.getModel(sChartId).getProperty("/oChart")[this.config.paths.chartDimensionsMeasures].results, sChartId));
		},

		/**
		 * Handle success dimension and measure response
		 * @param {object} oData - oDaya response
		 * @returns {void}
		 * @private
		 */
		_handleSuccessDimensionsMeasuresRequest: function (oData) {
			var oMainViewModel = this.getView().getModel("mainView");
			var aChartConfig = oMainViewModel.getProperty("/chartConfig");

			if (oData.results.length > 0) {
				this._chartCount = 0;
				var iChartCount = 0;
				var oVisibilityModel = new JSONModel();
				oData.results.map(function (oChart) {
					if (oChart.VISIBLE === 1) {
						this._chartCount++;
					}
				}.bind(this));
				oData.results.forEach(function (oChart) {
					if (oChart.VISIBLE === 1) {
						oVisibilityModel.setProperty("/" + oChart.CHARTID, true);
						chartsUtilities._setChartToView(this, oChart.CHARTID, iChartCount);
						chartsUtilities._setChartDimensionsMeasures(this, oChart);
						this._chartsNames += !this._chartsNames ? oChart.CHARTID : "," + oChart.CHARTID;
						iChartCount++;
						if (this.getModel(oChart.CHARTID)) {
							this.getModel(oChart.CHARTID).setProperty("/busy", false);
						}
					}
				}.bind(this));
				chartsUtilities._saveChartConfig(this, "defChartConfig");
				chartsUtilities._setChartConfig(this, aChartConfig);
				this.setModel(oVisibilityModel, "ChartVisibility");
				this._onWhenChartSetup.resolve();
			} else {
				this._addChartConfigurationModelErrorText();
			}
		},

		/**
		 * Set Error text to grid if no charts will be received
		 * @return {void}
		 * @private
		 */
		_addChartConfigurationModelErrorText: function () {
			var oGrid = this.getView().byId(this.config.ui.elements.chartsGrid);
			var oText = new Text({
				text: this.getResourceBundle().getText("chart.noData")
			});

			oText.setLayoutData(new sap.ui.layout.GridData({
				span: "L12 M12 S12",
				indent: "L4 M3 S2"
			}));

			oGrid.setBusy(false);
			oGrid.addContent(oText);
		},

		/**
		 * Handle error request for measure dimension
		 * @param {object} oError - Error response
		 * @returns {void}
		 * @private
		 */
		_handleErrorDimensionsMeasuresRequest: function (oError) {
			jQuery.sap.log.error(oError, "com.siemens.tableViewer.Chart._handleErrorDimensionsMeasuresRequest");
			var oGrid = this.getView().byId(this.config.ui.elements.chartsGrid);
			oGrid.setBusy(false);
		},

		/**
		 * Handle error request
		 * @param {string} sChartId - Chart ID
		 * @param {object} oError - Error response
		 * @returns {void}
		 * @private
		 */
		_handleRequestError: function (sChartId, oError) {
			jQuery.sap.log.error(oError, "com.siemens.tableViewer.Chart._handleRequestError");
			this.getModel(sChartId).setProperty("/busy", false);
		},

		/**
		 * Handle success count request
		 * @param {string} sChartId - Chart ID
		 * @param {object} oData - data count
		 * @param {object} response - received response
		 * @returns {void}
		 * @private
		 */
		_handleCountRequestSuccess: function (sChartId, oData) {
			if (oData < this.config.limitations.chartLimitation) {
				this._onModelRequestChartData(this._handleRequestSuccess, "", sChartId, this._lastAppliedFilters, this._lastAppliedSorters);
			} else {
				var oErrorData = {
					title: this.getModel(sChartId).getProperty("/title") + " - " + this.getResourceBundle().getText("errorTitle"),
					icon: MessageBox.Icon.ERROR,
					actions: [MessageBox.Action.ABORT],
					message: this.getResourceBundle().getText("loadChartDataLimitationErrorMessage", [oData.toString(), this.config.limitations.chartLimitation])
				};
				MessageBox.show(oErrorData.message, {
					icon: oErrorData.icon,
					title: oErrorData.title,
					actions: oErrorData.actions,
					defaultAction: MessageBox.Action.ABORT,
					styleClass: this.getOwnerComponent().getContentDensityClass(),
					onClose: function () {

					}
				});
				this._lastAppliedFilters = undefined;
				this._lastAppliedSorters = undefined;
				this.getModel(sChartId).setProperty("/busy", false);
			}
		},

		/**
		 * Handle success request
		 * @param {string} sChartId - Chart ID
		 * @param {object} oData - received data from backend
		 * @returns {void}
		 * @private
		 */
		_handleRequestSuccess: function (sChartId, oData) {
			var aColorScheme = this.getModel(sChartId).getProperty("/colorScheme"),
				bColor = aColorScheme.length > 0 ? true : false,
				sColor;

			/**
			 * @ControllerHook Adaptation of chart view
			 * This method is called after the chart data of the requested chart id has been loaded to be shown on the chart view
			 * @callback com.siemens.tableViewer.controller.Chart~extHookOnChartDataReceived
			 * @param {object} oData data response
			 * @return {void}
			 */
			if (this.extHookOnChartDataReceived) {
				this.extHookOnChartDataReceived(oData, sChartId);
			}

			// Get dimensions
			jQuery.grep(this.getModel(sChartId).getProperty("/dimensions"), function (oDimension) {
				oDimension.VALUES = oData.results.map(function (oObject) {
					return oObject[oDimension.COLUMN];
				});
			});

			// Count dimension size for dynamic model
			this.getModel(sChartId).setProperty("/size", this.getModel(sChartId).getProperty("/dimensions/0/VALUES").length);

			// Get measures
			jQuery.grep(this.getModel(sChartId).getProperty("/measures"), function (oMeasure, iMeasure) {
				if (bColor && aColorScheme.length > iMeasure) {
					sColor = aColorScheme[iMeasure];
				} else {
					sColor = chartsUtilities._randomColor();
				}
				this.getModel(sChartId).getProperty("/backgroundColorData").push({
					COLOR: sColor
				});

				oMeasure.VALUES = oData.results.map(function (oObject) {
					return oObject[oMeasure.COLUMN];
				});
			}.bind(this));

			if (this.getModel(sChartId).getProperty("/size") < this.getModel(sChartId).getProperty("/measures").length) {
				this.getModel(sChartId).setProperty("/size", this.getModel(sChartId).getProperty("/measures").length);
			}

			chartsUtilities._setChartData(this, sChartId);
		}

	});
});
