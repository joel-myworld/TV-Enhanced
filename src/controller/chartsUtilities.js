/*!
 * Copyright 2017 Siemens AG
 */
sap.ui.define([
	"com/siemens/tableViewer/control/Chart",
	"com/siemens/tableViewer/control/ChartDimension",
	"com/siemens/tableViewer/control/ChartMeasure",
	"com/siemens/tableViewer/control/ChartBackgroundColor",
	"com/siemens/tableViewer/control/ChartBorderColorData",
	"sap/ui/model/json/JSONModel",
	"com/siemens/tableViewer/model/models",
	"sap/m/Panel",
	"sap/m/Title",
	"sap/m/Toolbar",
	"sap/m/ToolbarSpacer",
	"sap/m/Button",
	"sap/m/ToggleButton",
	"sap/m/VBox"
], function (ChartControl, ChartDimension, ChartMeasure, ChartBackgroundColor, ChartBorderColorData, JSONModel, models,
	Panel, Title, Toolbar, ToolbarSpacer, Button, ToggleButton, VBox) {
	"use strict";

	return {

		/**
		 * Create Chart inside Panel and set it to grid
		 * @param {object} oController - Controller instance
		 * @param {string} sChartId - Chart ID
		 * @param {integer} iChartIndex - Chart index on the grid
		 * @return {void}
		 * @private
		 */
		_setChartToView: function (oController, sChartId, iChartIndex) {
			var oGrid = oController.getView().byId(oController.config.ui.elements.chartsGrid);
			oGrid.setBusy(false);

			var oChart = this._getChartInstance(oController, sChartId);

			var oPanel = this._getChartPanel(oController, sChartId, oChart);

			oPanel.setLayoutData(new sap.ui.layout.GridData({
				span: this._setChartLayout(oController, iChartIndex + 1)
			}));

			var mDimMeasParams = this._getDimensionMeasureParams(sChartId);

			var mColorParams = this._getColorParams(sChartId);

			var oMeasuresTemplate = new ChartMeasure(mDimMeasParams),
				oDimensionsTemplate = new ChartDimension(mDimMeasParams),
				oBackgroundColorTemplate = new ChartBackgroundColor(mColorParams),
				oBorderColorTemplate = new ChartBorderColorData(mColorParams);

			oController.setModel(models.createChartModel(), sChartId + "Data");

			oChart.bindAggregation("measures", sChartId + "Data>/measures", oMeasuresTemplate);
			oChart.bindAggregation("dimensions", sChartId + "Data>/dimensions", oDimensionsTemplate);
			oChart.bindAggregation("backgroundColorData", sChartId + "Data>/backgroundColorData", oBackgroundColorTemplate);
			oChart.bindAggregation("borderColorData", sChartId + "Data>/borderColorData", oBorderColorTemplate);

			oGrid.addContent(oPanel);

		},

		/**
		 * Get Chart control instance
		 * @param {object} oController - Controller instance
		 * @param {string} sChartId - Chart ID
		 * @return {Chart} Chart instance
		 * @private
		 */
		_getChartInstance: function (oController, sChartId) {
			return new ChartControl({
				id: oController.config.ui.elements.chart + sChartId,
				width: {
					path: sChartId + ">/chartSettings/width"
				},
				height: {
					path: sChartId + ">/chartSettings/height"
				},
				type: {
					path: sChartId + ">/chartSettings/type"
				},
				nodata: {
					path: "i18n>chart.noData"
				},
				yaxisLabel: {
					path: sChartId + ">/chartSettings/yaxislabel"
				},
				expanded: {
					path: sChartId + ">/chartSettings/expanded"
				}
			});
		},

		/**
		 * Get chart panel
		 * @param {object} oController - Controller instance
		 * @param {string} sChartId - Chart ID
		 * @param {Chart} Chart instance
		 * @return {Panel} Panel instance
		 * @private
		 */
		_getChartPanel: function (oController, sChartId, oChart) {
			return new Panel({
				expandable: "{= ${" + sChartId + ">/chartSettings/expanded} === false}",
				expanded: true,
				width: "auto",
				visible: {
					path: "ChartVisibility>/" + sChartId
				},
				headerToolbar: new Toolbar({
					content: [new Title({
							text: {
								path: sChartId + ">/title"
							}
						}),
						new ToolbarSpacer(),
						new Button({
							press: oController.onChartTypeButtonPressed.bind(oController),
							tooltip: {
								path: sChartId + ">/typeButton/tooltip"
							},
							icon: {
								path: sChartId + ">/typeButton/icon"
							}
						}).data("chartId", sChartId),
						new Button({
							press: oController.onChartDimensionMeasureButtonPressed.bind(oController),
							tooltip: {
								path: sChartId + ">/measuresDimensionButton/tooltip"
							},
							icon: {
								path: sChartId + ">/measuresDimensionButton/icon"
							}
						}).data("chartId", sChartId),
						new ToggleButton({
							press: oController.onChartExpandButtonPressed.bind(oController),
							pressed: {
								path: sChartId + ">/expandButton/pressed"
							},
							tooltip: {
								path: sChartId + ">/expandButton/tooltip"
							},
							icon: {
								path: sChartId + ">/expandButton/icon"
							},
							visible: "{= ${mainConfig>/IS_MIXED} !== 1}"
						}).data("chartId", sChartId)
					]
				}),
				content: [new VBox({
					busy: {
						path: sChartId + ">/busy"
					},
					busyIndicatorDelay: 0,
					items: [oChart]
				})],
				expand: function () {
					oController.getModel(sChartId + "Data").refresh(true);
					oController.getModel(sChartId + "Data").updateBindings(true);
				}
			});

		},

		/**
		 * Get dimension measure parameters
		 * @param {string} sChartId - Chart ID
		 * @return {object} Object paramters
		 * @private
		 */
		_getDimensionMeasureParams: function (sChartId) {
			return {
				values: {
					path: sChartId + "Data>VALUES"
				},
				label: {
					path: sChartId + "Data>LABEL"
				},
				ctype: {
					path: sChartId + "Data>CTYPE"
				},
				column: {
					path: sChartId + "Data>COLUMN"
				},
				chartype: {
					path: sChartId + "Data>CHARTTYPE"
				},
				chartgroup: {
					path: sChartId + "Data>CHARTGROUP"
				}
			};
		},

		/**
		 * Get color parameters
		 * @param {string} sChartId - Chart ID
		 * @return {object} Object paramters
		 * @private
		 */
		_getColorParams: function (sChartId) {
			return {
				color: {
					path: sChartId + "Data>COLOR"
				}
			};
		},

		/**
		 * Set Chart layout
		 * @param {object} oController - Controller instance
		 * @param {integer} iChartIndex - Chart index on the grid
		 * @return {string} sSpan - Span for chart on the grid
		 * @private
		 */
		_setChartLayout: function (oController, iChartIndex) {
			var sSpan = "";

			if (oController._chartCount % 3 === 2) {
				if (oController._chartCount - iChartIndex === 1 || oController._chartCount - iChartIndex === 0) {
					sSpan += "L6 ";
				}
			} else if (oController._chartCount % 3 === 1 && iChartIndex === oController._chartCount) {
				sSpan += "L12 ";
			} else {
				sSpan += "L4 ";
			}

			if (oController._chartCount % 2 && iChartIndex === oController._chartCount) {
				sSpan += "M12 ";
			} else {
				sSpan += "M6 ";
			}

			sSpan += "S12";

			return sSpan;
		},

		/**
		 * Create chart support model
		 * @param {object} oController - Controller instance
		 * @param {object} oChart - Chart parameters received from backend
		 * @return {void}
		 * @private
		 */
		_setChartDimensionsMeasures: function (oController, oChart) {
			var oChartModel = new JSONModel({
				busy: true,
				delay: 0,
				title: oChart.TITLE,
				chartSettings: {
					type: oChart.TYPE,
					width: "auto",
					height: "250",
					yaxislabel: oChart.YAXISLABEL,
					expanded: false
				},
				typeButton: {
					tooltip: oController.getResourceBundle().getText("chart.chartChange"),
					icon: "sap-icon://" + oController.config.icons[oChart.TYPE]
				},
				measuresDimensionButton: {
					tooltip: oController.getResourceBundle().getText("chart.toggleLegend"),
					icon: "sap-icon://drop-down-list"
				},
				expandButton: {
					tooltip: oController.getResourceBundle().getText("chart.expandChart"),
					icon: "sap-icon://full-screen",
					pressed: false
				},
				chartDimensionsMeasures: models.createDimensionMeasures(oChart[oController.config.paths.chartDimensionsMeasures].results, oChart.CHARTID),
				oChart: oChart,
				measures: [],
				dimensions: [],
				backgroundColorData: [],
				colorScheme: oChart.COLOR ? oChart.COLOR.split(',') : [],
				size: 0
			});

			oController.setModel(oChartModel, oChart.CHARTID);
		},

		/**
		 * Set Chart data model
		 * @param {object} oController - Controller instance
		 * @param {string} sChartId - Chart ID
		 * @returns {void}
		 * @private
		 */
		_setChartData: function (oController, sChartId) {
			var oJsonModel = oController.getModel(sChartId + "Data");

			if (location.hostname !== "localhost") {
				oJsonModel.setSizeLimit(oController.getModel(sChartId).getProperty("/size"));
			}

			oJsonModel.setData({
				measures: oController.getModel(sChartId).getProperty("/measures"),
				dimensions: oController.getModel(sChartId).getProperty("/dimensions"),
				backgroundColorData: oController.getModel(sChartId).getProperty("/backgroundColorData"),
				size: oController.getModel(sChartId).getProperty("/size")
			});

			oController.getModel(sChartId).setProperty("/busy", false);
		},

		/**
		 * Returns randomly generated color for chart
		 * @returns {integer} - randomly generated integer for colors
		 * @private
		 */
		_randomColorFactor: function () {
			return Math.round(Math.random() * 255);
		},

		/**
		 * Returns randomly generated color for chart
		 * @returns {string} - randomly generated color
		 * @private
		 */
		_randomColor: function () {
			return "rgba(" + this._randomColorFactor() + "," + this._randomColorFactor() + "," + this._randomColorFactor() + ",.7)";
		},

		/**
		 * Returns color codes from supplied color string
		 * @param {string} - sColor comma separated color string
		 * @returns {array} - array color code
		 * @private
		 */
		_getBackgroundColor: function (sColor) {
			var aColor = sColor.split(','),
				sColor = aColor.length > 0 ? aColor[Math.floor(Math.random() * aColor.length)] : undefined;
			return sColor ? [{
				COLOR: sColor
			}] : [];
		},

		/**
		 * Save Chart config in main View Model
		 * @param {object} oController - Controller instancee
		 * @param {string} sType - Saving chart config from default config/user specific
		 * @returns {void}
		 * @private
		 */
		_saveChartConfig: function (oController, sType) {
			var oEventBus = oController.getEventBus(),
				oChartConfig = {},
				aChartConfig = [],
				aChartId = oController._chartsNames.split(",");

			jQuery.each(aChartId, function (iChartId, sChartId) {
				oChartConfig = {
					CHARTID: "",
					TYPE: "",
					ICON: "",
					MEASURES: "",
					DIMENSIONS: "",
                    MEASURESGROUP: ""
				};
				oChartConfig.CHARTID = sChartId;
				oChartConfig.TYPE = oController.getModel(sChartId).getProperty("/chartSettings/type");
				oChartConfig.ICON = oController.getModel(sChartId).getProperty("/typeButton/icon");
				oChartConfig.MEASURES = this._getSelectedMeasuresDimensions(oController, sChartId, "measures");
				oChartConfig.DIMENSIONS = this._getSelectedMeasuresDimensions(oController, sChartId, "dimensions");
				oChartConfig.MEASURESGROUP = this._getMeasuresGroup(oController, sChartId);
				aChartConfig.push(oChartConfig);
			}.bind(this));

			//default config
			if (sType) {
				oController._defChartConfig = aChartConfig;
			} else {
				oEventBus.publish("VariantManagement", "SetVariantModified");
				oEventBus.publish("VariantManagement", "SaveChartConfig", aChartConfig);
			}
		},

		/**
		 * Set Chart config and apply to view
		 * @param {object} oController - Controller instance
		 * @param {array} aChartConfig - Chart config array
		 * @returns {void}
		 * @private
		 */
		_setChartConfig: function (oController, aChartConfig) {
			if (!aChartConfig) {
				return;
			}
			aChartConfig = aChartConfig.length === 0 ? oController._defChartConfig : aChartConfig;

			var aChartId = oController._chartsNames.split(","),
				aChartExist = [];
			aChartId.forEach(function (sChartId, iChart) {
				aChartExist = jQuery.grep(aChartConfig, function (oChartConfig) {
					return sChartId === oChartConfig.CHARTID;
				});
				if (aChartExist.length > 0) {
					oController.getModel(sChartId).setProperty("/typeButton/icon", aChartExist[0].ICON);
					oController.getModel(sChartId).setProperty("/chartSettings/type", aChartExist[0].TYPE);
					this._setSelectedMeasuresDimensions(oController, sChartId, aChartExist[0].MEASURES || oController._defChartConfig[iChart].MEASURES, "measures");
					this._setSelectedMeasuresDimensions(oController, sChartId, aChartExist[0].DIMENSIONS || oController._defChartConfig[iChart].DIMENSIONS, "dimensions");
                    aChartExist[0].TYPE === "line_bar" ? this._setMeasuresGroup(oController,sChartId,aChartExist[0].MEASURESGROUP) : "";
				}
			}.bind(this));
		},

		/**
		 * Get selected measures dimensions from chart model
		 * @param {object} oController - Controller instance
		 * @param {string} sChartId - Chart id
		 * @param {string} sMeasureDimensionText - property name measures/dimensions
		 * @returns {string} sSelectedMeasuresDimensions - Comma separated measures/dimensions string
		 * @private
		 */
		_getSelectedMeasuresDimensions: function (oController, sChartId, sMeasureDimensionText) {
			var aMeasuresDimensions = oController.getModel(sChartId).getProperty("/chartDimensionsMeasures/" + sMeasureDimensionText);
			return aMeasuresDimensions.reduce(function (sSelectedMeasuresDimensions, oMeasuresDimensions) {
				if (oMeasuresDimensions.SELECTED) {
					sSelectedMeasuresDimensions = sSelectedMeasuresDimensions ? [sSelectedMeasuresDimensions, oMeasuresDimensions.COLUMN].join() : oMeasuresDimensions.COLUMN;
				}
				return sSelectedMeasuresDimensions;
			}, "");
		},

		/**
		 * Set selected measures dimensions to chart model
		 * @param {object} oController - Controller instance
		 * @param {string} sChartId - Chart id
		 * @param {string} sSelectedMeasuresDimensions - Comma separated measures/dimensions string
		 * @param {string} sMeasureDimensionText - property name measures/dimensions
		 * @returns {void}
		 * @private
		 */
		_setSelectedMeasuresDimensions: function (oController, sChartId, sSelectedMeasuresDimensions, sMeasureDimensionText) {
			if (sSelectedMeasuresDimensions) {
				var aMeasuresDimensions = oController.getModel(sChartId).getProperty("/chartDimensionsMeasures/" + sMeasureDimensionText);
				aMeasuresDimensions.forEach(function (oMeasuresDimensions) {
					if (sSelectedMeasuresDimensions.indexOf(oMeasuresDimensions.COLUMN) > -1) {
						oMeasuresDimensions.SELECTED = true;
					} else {
						oMeasuresDimensions.SELECTED = false;
					}
				});
			}
		},

		/**
		 * Get measures group for combine chart
		 * @param {object} oController - Controller instance
		 * @param {string} sChartId - Chart id
		 * @returns {array}- measures group object array
		 * @private
		 */
		_getMeasuresGroup: function (oController, sChartId) {
			var aMeasuresGroup = oController.getModel(sChartId).getProperty("/measures");
			return aMeasuresGroup.map(function (oMeasuresGroup) {
				return {
					CHARTGROUP: oMeasuresGroup.CHARTGROUP,
					CHARTTYPE: oMeasuresGroup.CHARTTYPE,
					COLUMN: oMeasuresGroup.COLUMN
				};
			});
		},

		/**
		 * Set measures group for highchart
		 * @param {object} oController - Controller instance
		 * @param {string} sChartId - Chart id
		 * @param {array} aMeasuresGroup - measures group object array
		 * @returns {void}
		 * @private
		 */
		_setMeasuresGroup: function (oController, sChartId, aMeasuresGroup) {
			var aMeasuresGroupVal = [];
			var aMeasuresGroupProp = oController.getModel(sChartId).getProperty("/measures");
			aMeasuresGroupProp.forEach(function (oMeasuresGroupProp) {
				if (aMeasuresGroup) {
					aMeasuresGroupVal = aMeasuresGroup.filter(function (oMeasuresGroup) {
						return oMeasuresGroup.COLUMN === oMeasuresGroupProp.COLUMN;
					});
				} else {
					aMeasuresGroupVal.push({CHARTGROUP: "0",CHARTTYPE: "Line Chart"});
				}
				if (aMeasuresGroupVal.length > 0) {
					oMeasuresGroupProp.CHARTGROUP = aMeasuresGroupVal[0].CHARTGROUP;
					oMeasuresGroupProp.CHARTTYPE = aMeasuresGroupVal[0].CHARTTYPE;
				}
			});
		}

	};

});
