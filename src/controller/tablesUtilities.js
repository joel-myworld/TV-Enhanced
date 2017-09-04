/*!
 * Copyright 2017 Siemens AG
 */
sap.ui.define([
    "com/siemens/tableViewer/control/ExtendedTablePersoController",
    "com/siemens/tableViewer/control/ExtendedColumn",
    "com/siemens/tableViewer/model/formatter",
    "sap/m/Button",
    "sap/m/Label",
    "sap/m/Text",
    "sap/ui/layout/FixFlex",
    "./utilities",
    "com/siemens/tableViewer/model/models",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/json/JSONModel",
    "sap/ui/table/Column"
], function(TablePersoController, Column, formatter, Button, Label, Text, FixFlex, utilities, models, Filter, FilterOperator, JSONModel, UIColumn) {
    "use strict";

    /**
     * Expands all columns
     * @param {sap.ui.table.TreeTable} oTable - TreeTable instance
     * @return {void}
     * @private
     */
    function _expandAll(oTable) {
        for (var iRow = 0; iRow < oTable.getBinding("rows").getLength(); iRow++) {
            oTable.expand(iRow);
        }
    }

    /**
     * Collapse all columns
     * @param {sap.ui.table.TreeTable} oTable - TreeTable instance
     * @return {void}
     * @private
     */
    function _collapseAll(oTable) {
        oTable.setFirstVisibleRow(0); // Otherwise busy indicator will be forever
        oTable.collapseAll();
    }
    /**
     * To prepare filters for details table. DRILL_DOWN_BOND gives the column from which the value has to be considered for filter
     * @param {Object} oRowData - Selected row data from master table
     * @param {String} sVisibleColumns - visible columns from master table
     * @param {Object} oMainConfig - cache data from main configuration
     * @returns {Array} aFilters - array of filters for details table
     * @private
     */
    function _getSelDetailsFilterDrillDwn (oRowData, sVisibleColumns, oMainConfig) {
		var aColumns = oMainConfig.getProperty("/ServiceToColumnConfig/results"),
	    aFilters;
		aFilters = aColumns.reduce(function(aTransitionalFilters, oColumn) {
			if (oColumn.DRILL_DOWN_BOND && sVisibleColumns.indexOf(oColumn.COLUMN) > -1) {
				aTransitionalFilters.push(new Filter(oColumn.DRILL_DOWN_BOND, FilterOperator.EQ, oRowData[oColumn.COLUMN]));
			}
			return aTransitionalFilters;
		}, []);
		return aFilters;
	}
    /**
     * Get $select properties based on table columns
     * @param {Array} aColumns - Table Columns
     * @returns {String} sSelect - parameters for $select
     * @private
     */
    function getVisibleColumns (aColumns) {
        return aColumns.reduce(function(sSelect, oColumn) {
            if (!!oColumn.STDRD) {
                sSelect = sSelect ? [sSelect, oColumn.COLUMN].join() : oColumn.COLUMN;
            }
            return sSelect;
        }, "");
    }
    /**
     * Get column configuration from the backend;
     * @param {Object} oController - Instace of controller
     * @param {Object} oDataModel - Instance of data model
     * @returns {Array} Column array
     * @private
     */
    function getColumnConfigData (oController, oDataModel) {
        if (oDataModel) {
            return oDataModel.getProperty("/ServiceToColumnConfig/results");
        }
        return oController.getView().getModel("columnModel").getProperty("/ServiceToColumnConfig/results");
    }
    /**
     * To bind details table with filters
     * @param {Object} oController - reference to table controller
     * @param {Object} oDetailsConfigModel - column configuration model for details table
     * @param {Object} oDetailsTable - instance of details table
     * @param {Object} oSelectedRowData - Row data from master table
     * @param {Object} oMasterTable - instance of master table
     * @param {Object} oMainConfig - cache data of main configuration model
     * @returns {void}
     * @private
     */
    function _bindDetailsTable (oController, oDetailsConfigModel, oDetailsTable, oSelectedRowData, oMasterTable, oMainConfig) {
        oDetailsConfigModel = oController.getModel("detConfig");
        var aColumns = oDetailsConfigModel.getProperty("/ServiceToColumnConfig/results"),
        sVisibleColumns = getVisibleColumns(aColumns),
		aAggregatedColumns = oController._getAggregateColumns(aColumns),
        aFilters,
        oModel,
        oInputParametersModel,
        fnBindTable;
		// get row data from the selected row and return the filter
		aFilters = _getSelDetailsFilterDrillDwn(oSelectedRowData, oController._getTableVisibleColumns(oMasterTable).toString(), oMainConfig);
		if (aFilters.length === 0) {
			jQuery.sap.log.error("Please set configured columns to be visible for Master-Detail functionality, to be able to pass filters");
			return;
		}

		oModel = oDetailsTable.getModel("detSRV");
		oInputParametersModel = oDetailsTable.getModel("detInputParams");
		fnBindTable = function() {
            oDetailsTable.bindAggregation("columns", "detConfig>/ServiceToColumnConfig/results", _prepareDetailsTableRows.bind(this));
			//bind rows of table with drill data and select parameter with visible columns
			oDetailsTable.bindRows({
				path: "detSRV>/" + oDetailsConfigModel.getProperty("/ENTITY_NAME"),
				filters: aFilters,
				parameters: {
					select: sVisibleColumns
				},
                events: {
                    dataRequested: function() {
                        oDetailsTable.setBusy(true);
                    },
                    dataReceived: function(oEvent) {
                        _setAggregatedSumLabel(oEvent, aAggregatedColumns, oDetailsTable);
                        oDetailsTable.setBusy(false);
                    }
                }
			});
		};

		if (!oModel.getServiceMetadata()) {
			oModel.attachMetadataLoaded(function() {
				if (oDetailsConfigModel.getProperty("/INPUT_PARAMETERS")) {
					oController._getMetadataDefaultValues(oModel, oInputParametersModel);
					var aSplitedEntity = oDetailsConfigModel.getProperty("/ENTITY_NAME").split("/");
					if (aSplitedEntity.length > 1) {
						oController._getDefaultEntityValues(aSplitedEntity[0], oInputParametersModel);
					}
					if (oMainConfig.getProperty("/INPUT_PARAMETERS")) {
						oController._getDefaultEntityValues(oMainConfig.getProperty("/ENTITY_NAME"), oInputParametersModel);
					}

					oController._setEntityNameWithInputParams(oInputParametersModel, oDetailsConfigModel);
				}
				fnBindTable();
			});
		} else {
			if (oDetailsConfigModel.getProperty("/INPUT_PARAMETERS") && oMainConfig.getProperty("/INPUT_PARAMETERS")) {
				oController._getDefaultEntityValues(oMainConfig.getProperty("/ENTITY_NAME"), oInputParametersModel);
				oController._setEntityNameWithInputParams(oInputParametersModel, oDetailsConfigModel);
			}
			fnBindTable();
		}
    }
    /**
     * Method to bind popup table for drill down
     * @param {Object} oController - reference to table controller
     * @private
     */
    function _bindTablePopUp (oController) {
        //prepare service url for oData requests for data
        var oTablePopup = oController._getTablePopupFrag(),
            oModelSrv,
            aFilters = oController.getModel("tablePopupView").getProperty("/filters"),
            sService = oController.getOwnerComponent().getMetadata().getConfig().serviceUrl.replace("Main.xsodata", ""),
            sServiceUrl = [sService, "data/", oController.getModel("tableDrillServiceColumns").getProperty("/SERVICE_NAME")].join(""),
            oDrillConfigModel,
            bIsODataServer,
            aColumns,
            sSelectColumn,
            aAggregateColumns,
            sEntityName;
        //check to see if ODATA_SRV is 1
        bIsODataServer = oController.getModel("tableDrillServiceColumns").getProperty("/ODATA_SRV") === 1 ? true : false;

        if (bIsODataServer) {
            // create and set the ODataModel
            oModelSrv = models.createODataModelWithParameters(sServiceUrl);
            //set and enable busy indicator to popup table
            oController.attachRequestsForControlBusyIndicator(oModelSrv, oTablePopup);
            oController.setModel(oModelSrv, "tableDrilloDataSrv");
            oController.getOwnerComponent()._createMetadataPromise(oModelSrv);
            //retrieve visible columns from config model of target source
            oDrillConfigModel = oController.getModel("tableDrillServiceColumns");
            aColumns = getColumnConfigData(oController, oDrillConfigModel);
            sSelectColumn = oController._getSelectParameters(aColumns);
            // get Aggregated columns
            aAggregateColumns = oController._getAggregateColumns(aColumns);
            sEntityName = oController.getModel("tableDrillServiceColumns").getProperty("/ENTITY_NAME");
            //bind table column with config data
            oTablePopup.bindAggregation("columns", "tableDrillServiceColumns>/ServiceToColumnConfig/results", _prepareRows.bind(this));
            //set table with drill data
            oTablePopup.setModel(oController.getModel("tableDrilloDataSrv"));
            //bind rows of table with drill data and select parameter with visible columns
            oTablePopup.bindRows({
                path: "tableDrilloDataSrv>/" + sEntityName,
                parameters: {
                    select: sSelectColumn
                },
                filters: aFilters,
                events: {
                    dataRequested: function() {
                        oTablePopup.setBusy(true);
                    },
                    dataReceived: function(oEvent) {
                        _setAggregatedSumLabel(oEvent, aAggregateColumns, oTablePopup);
                        oTablePopup.setBusy(false);
                    }
                }
            });
        }
    }
    /**
     * Prepare row template and columns for Table Popup
     * @private
     * @param {string} sId - Current id of the control aggregation
     * @param {object} oContext - Model context of the control
     * @returns {object} oUIControl - Column control for table
     */
    function _prepareRows (sId, oContext) {
        var oLabel,
            oTemplate;
        oLabel = new Label({
            design: "{= ${tableDrillServiceColumns>" + oContext + "/IS_KFG} === 1 ? 'Bold' : 'Standard'}",
            text: "{tableDrillServiceColumns>LABEL}"
        });
        oTemplate = new Label({
            design: "{= ${tableDrillServiceColumns>" + oContext + "/IS_KFG} === 1 ? 'Bold' : 'Standard'}",
            text: {
                path: "tableDrilloDataSrv>" + oContext.getProperty("COLUMN"),
                type: formatter.getDataTypeInstance(oContext.getProperty("CTYPE"))
            }
        });
        return new Column(sId, {
            visible: "{ path: 'tableDrillServiceColumns>STDRD', type: 'com.siemens.tableViewer.model.types.hanaBoolean'}",
            label: oLabel,
            template: oTemplate,
            sortProperty: "{tableDrillServiceColumns>COLUMN}",
            sorted: "{tableDrillServiceColumns>COLUMN_SORTED}",
            sortOrder: "{path: 'tableDrillServiceColumns>COLUMN_SORTING', type: 'com.siemens.tableViewer.model.types.columnSorter'}",
            autoResizable: true,
            hAlign: "{= ${tableDrillServiceColumns>IS_KFG} === 1 ? 'Right' : 'Left'}",
            width: "{tableDrillServiceColumns>CWIDTH}",
            tooltip: "{tableDrillServiceColumns>DESCRIPTION}"
        });
    }
    /**
     * Method to set the sum to aggregated column in the table
     * @param {sap.ui.base.Event} oEvent - event
     * @param {Array} aAggregateColumns - array of aggregated columns
     * @param {Object} oTable - table instance
     * @private
     */
    function _setAggregatedSumLabel (oEvent, aAggregateColumns, oTable) {
        var aKeys = oEvent.getSource().aKeys,
            oModel = oEvent.getSource().getModel(),
            aColumns,
            iTempSum,
            iSum,
            oFloatFormat,
            oLabel,
            sText;
        if (aAggregateColumns) {
            aColumns = oTable.getAggregation("columns");
            iTempSum = parseFloat(0);
            jQuery.grep(aAggregateColumns, function(oAggregatedItem) {
                oLabel = aColumns[oAggregatedItem["index"]].getAggregation("label");
                sText = oAggregatedItem["label"];
                for (var index = 0; index < aKeys.length; index++) {
                    if (oModel.oData[aKeys[index]]) {
                        iSum = oModel.oData[aKeys[index]][oAggregatedItem["column"]];
                        oFloatFormat = sap.ui.core.format.NumberFormat.getFloatInstance(formatter.formatOptions("Float"));
                        iTempSum += parseFloat(iSum);
                    }
                }
                sText = sText.split("\n")[0];
                sText += "\n [" + oFloatFormat.format(iTempSum) + "]";
                oLabel.setText(sText);
            });
        }
    }
    /**
     * Prepare row template and columns for Master details table
     * @private
     * @param {string} sId - Current id of the control aggregation
     * @param {object} oContext - Model context of the control
     * @returns {object} UIColumn - sap.ui.table.Column control for table
     */
    function _prepareDetailsTableRows (sId, oContext) {
        var oLabel,
            oTemplate;
        oLabel = new Label({
            design: "{= ${detConfig>" + oContext + "/IS_KFG} === 1 ? 'Bold' : 'Standard'}",
            text: "{detConfig>LABEL}"
        });
        oTemplate = new Label({
            design: "{= ${detConfig>" + oContext + "/IS_KFG} === 1 ? 'Bold' : 'Standard'}",
            text: {
                path: "detSRV>" + oContext.getProperty("COLUMN"),
                type: formatter.getDataTypeInstance(oContext.getProperty("CTYPE"))
            }
        });
        return new UIColumn(sId, {
            visible: "{ path: 'detConfig>STDRD', type: 'com.siemens.tableViewer.model.types.hanaBoolean'}",
            label: oLabel,
            template: oTemplate,
            sortProperty: "{detConfig>COLUMN}",
            sorted: "{detConfig>COLUMN_SORTED}",
            sortOrder: "{path: 'detConfig>COLUMN_SORTING', type: 'com.siemens.tableViewer.model.types.columnSorter'}",
            autoResizable: true,
            hAlign: "{= ${detConfig>IS_KFG} === 1 ? 'Right' : 'Left'}",
            width: "{detConfig>CWIDTH}",
            tooltip: "{detConfig>DESCRIPTION}"
        });
    }
    return {
        /**
         * Gets table column settings dialog. If doesn't exists creates it
         * @param {sap.ui.table.TablePersoController|*} oColumnSettingsDialog - TablePersoController
         * @param {sap.ui.table.TreeTable} oTable - TreeTable instance
         * @returns {sap.ui.table.TablePersoController} - Personalization Dialog
         * @private
         */
        _getTableColumnSettingsDialog: function(oColumnSettingsDialog, oTable) {
            if (!oColumnSettingsDialog) {
                oColumnSettingsDialog = new TablePersoController({
                    table: oTable
                });
            }
            return oColumnSettingsDialog;
        },

        /**
         * Get $select properties based on table columns
         * @param {array} aColumns - Table Columns
         * @returns {string} sSelect - parameters for $select
         * @private
         */
        _getSelectParameters: function(aColumns) {
            return aColumns.reduce(function(sSelect, oColumn) {
                if (!!oColumn.STDRD) {
                    sSelect = sSelect ? [sSelect, oColumn.COLUMN].join() : oColumn.COLUMN;
                }
                return sSelect;
            }, "");
        },

        /**
         * Generates a column for a table with all settings
         * @param {string} sId - ID for the column
         * @param {sap.ui.model.Context} oContext - Column information from model
         * @returns {sap.ui.table.Column} - Newly generated column
         * @private
         */
        _columnFactory: function(sId, oContext) {
            var oLabel,
            oTemplate,
            oUIControl;

            oLabel = new Label({
                text: "{columnModel>LABEL}",
                design: {
                    path: "columnModel>IS_KFG",
                    formatter: formatter.labelDesign
                }
            });

            // Get first column for adding buttons
            if (sId.substr(sId.length - 1) === "0" && this.firstColumn !== false) {
                this.firstColumn = false;
                oLabel = new FixFlex({
                    fixContent: [oLabel, new FixFlex({
                        vertical: false,
                        fixFirst: false,
                        fixContent: [new Button({
                            icon: "sap-icon://expand-group",
                            press: jQuery.proxy(function() {
                                _expandAll(this._oTreeTable);
                            }, this)
                        }).addStyleClass("sapUiTinyMarginEnd"), new Button({
                            icon: "sap-icon://collapse-group",
                            press: jQuery.proxy(function() {
                                _collapseAll(this._oTreeTable);
                            }, this)
                        })]
                    })]
                });
            }

            oTemplate = new Text({
                text: {
                    path: "data>" + oContext.getProperty("COLUMN"),
                    type: formatter.getDataTypeInstance(oContext.getProperty("CTYPE"))
                }
            });

            oUIControl = new Column(sId, {
                visible: {
                    path: "columnModel>STDRD",
                    type: "com.siemens.tableViewer.model.types.hanaBoolean"
                },
                label: oLabel,
                template: oTemplate,
                autoResizable: true,
                supportHidden: {
                    path: "columnModel>SUPPORT_HIDDEN",
                    type: "com.siemens.tableViewer.model.types.hanaBoolean"
                },
                hAlign: {
                    path: "columnModel>IS_KFG",
                    formatter: formatter.alignColumn
                },
                width: "{columnModel>CWIDTH}",
                tooltip: "{columnModel>DESCRIPTION}"
            }).data("COLUMN", "{columnModel>COLUMN}");

            return oUIControl;
        },
        /**
         * Method to return the unsorted columns from the table
         * @param {Array} aColumns - Array of columns from the table
         * @returns {String} sUnsortedColumns - String containing columns which are not sorted
         * @public
         */
        getUnsortedColumns: function (aColumns) {
            var sUnsortedColumns = "";
			for (var iColumn = 0; iColumn < aColumns.length; iColumn++) {
				if (aColumns[iColumn].getVisible() && !aColumns[iColumn].getSorted()) {
					sUnsortedColumns += sUnsortedColumns === "" ? aColumns[iColumn].getSortProperty() : "," + aColumns[iColumn].getSortProperty();
				}
			}
			return sUnsortedColumns;
		},
        /**
         * Method to return the Key figure value
         * @param {String} sVisibleColumns - Visible columns in the table
         * @param {Object} oMainConfig - Main configuration model
         * @param {String} sTableColumnPath - binding path for the table columns
         * @returns {String} sTransition, sResult - Key figure value names
         * @pubic
         */
        getKFGValues: function(sVisibleColumns, oMainConfig, sTableColumnPath) {
		    var sResult = oMainConfig.getProperty(sTableColumnPath).reduce(function(sTransition, oColumn) {
		        if (oColumn.IS_KFG === 1 && sVisibleColumns.search(oColumn.COLUMN) !== -1) {
		            sTransition += sTransition === "" ? oColumn.COLUMN : "," + oColumn.COLUMN;
		        }
		        return sTransition;
		    }, "");
		    return sResult;
		},
        /**
         * Method to return the filter parameters after replace time from string
         * @param {String} sFilterParams - filter query string
         * @returns {String} sFilterParams - filter query string after replacing time from string
         * @public
         */
        replaceTimeString: function(sFilterParams) {
            var sPattern = "%20time%27",
            iIndex,
            bCondition = true,
            sTime = "",
            sReplaceTime = "",
            oTimeFormatter = new sap.ui.model.type.Time({
				source: {
					pattern: "HH:mm:ss"
				},
				pattern: "'PT'HH'H'mm'M'ss'S'"
			});
            while (bCondition) {
                iIndex = sFilterParams.indexOf(sPattern);
                if (iIndex === -1) {
                    bCondition = false;
                } else {
                    sTime = sFilterParams.substr(iIndex + sPattern.length, 11);
                    sReplaceTime = oTimeFormatter.parseValue(sTime, "string");
                    sFilterParams = sFilterParams.replace(sPattern + sTime, "%20%27" + sReplaceTime);
                }
            }
		    return sFilterParams;
		},
        /**
         * Method to return the column arrays that are visible in table
         * @param {Object} oTable - table
         * @returns {Array} aColumns - Array of columns which are visible
         * @private
         */
        _getTreeVisibleColumns: function(oTable) {
            var aColumns = [];
            oTable.getColumns().map(function(oColumn) {
                if (oColumn.getVisible()) {
                    aColumns.push(oColumn.data("COLUMN"));
                }
            });
            return aColumns;
        },
        /**
         * Helper method to open export popover fragment on export button event
         * @param {sap.ui.base.Event} oEvent - export button event
         * @param {Object} oView - current view from where the export is pressed
         * @param {Object} oParent - reference to controller
         * @returns {void}
         * @public
         */
        openExportPopover : function (oEvent, oView, oParent) {
            var oExportMenu = oView.byId("exportMenu");

            if (!oExportMenu) {
                oExportMenu = sap.ui.xmlfragment(oView.getId(), "com.siemens.tableViewer.view.fragments.ExportDialog", oParent);
                utilities.attachControl(oView, oExportMenu);
            }

            oExportMenu.openBy(oEvent.getSource());
        },
        /**
         * To get the target calculation Id from configuration model
         * @param {Object} oMainConfig - Main configuration model with cache data
         * @returns {String} sTargetCalcID - Calculation Id
         * @private
         */
        _getTargetCalcID: function(oMainConfig) {
			var sTargetCalcID = oMainConfig.getProperty("/DRILL_DOWN_TARGET");
			return sTargetCalcID;
		},
        /**
         * Method to create details table instance, to create config column model and data model for details table
         * @param {sap.ui.base.Event} oEvent - row selection event
         * @param {Object} oController - reference to table controller
         * @private
         */
        _createDetailsTable: function(oEvent, oController) {
            var oMasterTable = oEvent.getSource(),
            oDetailsTable,
            oDetailsTableLayout = oController.byId("siemensUiDetailTableLayout"),
            iRowIndex = oEvent.getParameter("rowIndex"),
            oSelectedRowContext,
            oSelectedRowData,
            oDetailsConfigModel = oDetailsConfigModel ? oController.getModel("detConfig") : new JSONModel(),
            oModel,
            oInputParametersModel,
            sMainODataUrl,
            sServiceUrl,
            bIsODataService,
            oDetailsTableTitle,
            oMainConfig = oController.getOwnerComponent()._cachedConfigData,
            oMainModel = oController.getModel("main");
            oController._onWhenDetailsTableConfigDataIsLoaded = null;
            if (oMasterTable.isIndexSelected(iRowIndex)) {
                oDetailsTable = oController.byId("siemensUiDetailsTable");
				oSelectedRowContext = oEvent.getParameter("rowContext");
				oSelectedRowData = oSelectedRowContext.getObject();
                // check if table already exist
				if (!oDetailsTable) {
                    oDetailsTable = sap.ui.xmlfragment(oController.getView().getId(), "com.siemens.tableViewer.view.fragments.DetailsTable");
					oDetailsTableLayout.addContent(oDetailsTable);
                    // prepare service url for oData requests for config
					sMainODataUrl = oController.getOwnerComponent().getMetadata().getConfig().serviceUrl;
					//sMainODataUrl = [sODataUrl, "Main.xsodata"].join("");
					oController._onWhenDetailsTableConfigDataIsLoaded = models.createRequestConfigurationModelPromise(this._getTargetCalcID(oMainConfig), oMainModel);
					//oController.setModel(oDetailsConfigModel, "detConfig");
                    oController._onWhenDetailsTableConfigDataIsLoaded.then(function(oData) {
                        oDetailsConfigModel.setData(oData);
                        oController.setModel(oDetailsConfigModel, "detConfig");
                        // prepare service url for oData requests for data
                        var sReplaceUrl = sMainODataUrl.replace("Main.xsodata", "");
					    sServiceUrl = [sReplaceUrl, "data/", oDetailsConfigModel.getProperty("/SERVICE_NAME")].join("");
                        // check to see if ODATA_SRV is 1
                        bIsODataService = oDetailsConfigModel.getProperty("/ODATA_SRV") === 1;
                        if (bIsODataService) {
                            oModel = models.createODataModelWithParameters(sServiceUrl);
                            // set and enable busy indicator to detail table
                            oController.attachRequestsForControlBusyIndicator(oModel, oDetailsTable);
                            oDetailsTable.setModel(oModel, "detSRV");
                        } else {
                            jQuery.sap.log.error("Please configure your Detail service properly","com.siemens.tableViewer.tableUtilities._createDetailsTable");
                            return;
                        }
                        // bind table column with config data
                        oDetailsTable.bindAggregation("columns", "detConfig>/ServiceColumns/results", _prepareRows.bind("detSRV>"));
                        // bind table Title
                        oDetailsTableTitle = oController.byId("siemensUiDetailsTableTitle");
                        oDetailsTableTitle.bindProperty("text", "detConfig>/TABLE_TITLE");
                        // bind table Treshhold
                        oDetailsTable.bindProperty("threshold", {
                            path: "detConfig>/THRESHOLD"
                            //formatter: formatter.getThreshold
                        });
                        if (oDetailsConfigModel.getProperty("/INPUT_PARAMETERS")) {
                            // create Input Parameters model
                            oInputParametersModel = models.createInputParametersModel();
                            oDetailsTable.setModel(oInputParametersModel, "detInputParams");
                        }
                        _bindDetailsTable(oController, oDetailsConfigModel, oDetailsTable, oSelectedRowData, oMasterTable, oMainConfig);
                    }).catch(function() {
                        jQuery.sap.log.error("Error while getting details table config deta","com.siemens.tableViewer.tableUtilities._createDetailsTable");
                    });
				}else {
                    _bindDetailsTable(oController, oDetailsConfigModel, oDetailsTable, oSelectedRowData, oMasterTable, oMainConfig);
                }
                oDetailsTableLayout.setVisible(true);
            }else {
                oDetailsTableLayout.setVisible(false);
            }
        },

                /**
         * Return path to Column Binding
         * @returns {string}
         * @private
         */
        _getTableColumnPath: function() {
            return "/ServiceToColumnConfig/results";
        },

        /**
         * Get column configuration from the backend;
         * @param {Object} oController - Instace of controller
         * @param {Object} oDataModel - Instance of data model
         * @returns {Array} Column array
         * @private
         */
        _getServiceToColumnData: function(oController,oDataModel) {
            if (oDataModel) {
                return oDataModel.getProperty(this._getTableColumnPath());
            }
            return oController.getView().getModel("columnModel").getProperty(this._getTableColumnPath());
        },

        /**
         * Save visible column for variant
         * @param {Object} oController - Instace of controller
         * @returns {void}
         * @private
         */
		_saveVisibleColumns:function(oController){
			var oEventBus = oController.getEventBus();
			var aColumns = this._getServiceToColumnData(oController);
            var sSortOrder = null;
			var aVisibleColumns =  aColumns.filter(function(oColumn) {
										return oColumn.STDRD === 1;
								     }).map(function(oColumn) {
                                        sSortOrder = oColumn.COLUMN_SORTED ? oColumn.COLUMN_SORTING : null;
								        return {fieldName:oColumn.COLUMN,sortOrder:sSortOrder};
								     });
                oEventBus.publish("VariantManagement", "SetVariantModified");
                oEventBus.publish("VariantManagement", "SaveVisibleColumns",aVisibleColumns);
		},
        /**
         * Set columns to visible true
         * @param {Object} oController - reference to table controller
         * @param {Array} aVisibleColumns - Array of visible columns
         * @returns {void}
         * @private
         */
		_setVisibleColumns:function(oController, aVisibleColumns){
            if (!aVisibleColumns){
				return;
			}
			var aColumns = this._getServiceToColumnData(oController);
			var oColumnModel = oController.getModel("columnModel");
			var aColumnExist;

			if (aVisibleColumns.length > 0){
				aColumns.forEach(function(oColumn) {
					aColumnExist = jQuery.grep(aVisibleColumns, function(oVisibleColumns){
						return oVisibleColumns.fieldName === oColumn.COLUMN;
					});
					if (aColumnExist.length > 0 ){
						oColumn.STDRD = 1;
                        if (aColumnExist[0].sortOrder){
                            oColumn.COLUMN_SORTING = aColumnExist[0].sortOrder;
                            oColumn.COLUMN_SORTED  = true;
                        }else {
                            oColumn.COLUMN_SORTED  = false;
                        }
                    }else {
						oColumn.STDRD = 0;
					}
                });
			}else {
				var	aCachedColumns = oController.getOwnerComponent()._cachedConfigData.getProperty(this._getTableColumnPath());
				aColumns.forEach(function(oColumn) {
					aColumnExist = jQuery.grep(aCachedColumns, function(oCachedColumn){
						return oCachedColumn.COLUMN === oColumn.COLUMN && oCachedColumn.STDRD === 1;
					});
					if (aColumnExist.length > 0){
						oColumn.STDRD = 1;
                        oColumn.COLUMN_SORTED = aColumnExist[0].COLUMN_SORTED;
                        oColumn.COLUMN_SORTING = aColumnExist[0].COLUMN_SORTING;
					}else {
						oColumn.STDRD = 0;
					}
			});
            }
            oController.getModel("mainView").setProperty("/sorters",undefined);
			oColumnModel.updateBindings();
			oColumnModel.refresh();
		},
        /**
		 * To return the final sort to be applied to the table after checking the sort exist only for columns that are visible in the table
		 * also to reset the sorting property of the column, so that the column can be added again.
		 * @param {Object} oTable - instance of the table
		 * @param {String} sVisibleColumns - visible columns in table
		 * @param {Array} aSortedItems - Sorters available
         * @returns {Array} aSortedItems - Sorters for visible columns in table
		 * @private
		 */
		_getSortersForVisibleColumns: function(oTable, sVisibleColumns, aSortedItems) {
			var aTempSortPaths = [],
				aVisibleColumns = [],
				aMarkedforDeleteSorts;
				aVisibleColumns = sVisibleColumns.split(",");

			if (oTable.getBinding("rows") && aSortedItems) {
				//get all sort paths
				jQuery.each(aSortedItems, function(j, s) {
					aTempSortPaths.push(s.sPath);
				});
				//compare two arrays to get the columns that are not visible and has sort
				aMarkedforDeleteSorts = jQuery(aTempSortPaths).not(aVisibleColumns).get();
				//remove the sort of the hidden column
				for (var iDeleteSorts = 0; iDeleteSorts < aMarkedforDeleteSorts.length; iDeleteSorts++) {
					for (var iSorts = 0; iSorts < aSortedItems.length; iSorts++) {
						if (aMarkedforDeleteSorts[iDeleteSorts] === aSortedItems[iSorts].sPath) {
							aSortedItems.splice(iSorts, 1);
						}
					}
				}
				//reset the sort for the columns that were hidden
				for (var iMarkedSorts = 0; iMarkedSorts < aMarkedforDeleteSorts.length; iMarkedSorts++) {
					for (var iColumn = 0; iColumn < oTable.getAggregation("columns").length; iColumn++) {
						if (oTable.getAggregation("columns")[iColumn].getSortProperty() === aMarkedforDeleteSorts[iMarkedSorts]) {
							oTable.getAggregation("columns")[iColumn].setSorted(false);
							oTable.getAggregation("columns")[iColumn].setSortOrder(undefined);
						}
					}
				}

			}
			return aSortedItems;
		},

        /**
         * Update single sort in column model
         * @param {Object} oController - reference to table controller
         * @param {String} sColumnName - Column name
         * @param {String} sSortOrder - Sort order
         * @private
         */
        _updateSort:function(oController,sColumnName,sSortOrder){
            var oColumnModel = oController.getModel("columnModel"),
                aColumnData =  oColumnModel.getProperty(this._getTableColumnPath());
                aColumnData.forEach(function(oColumn){
                if (oColumn.COLUMN === sColumnName){
                    oColumn.COLUMN_SORTED = true;
                    oColumn.COLUMN_SORTING = sSortOrder === "Ascending" ? 1 : 2;
                }else {
                    oColumn.COLUMN_SORTED = false;
                    oColumn.COLUMN_SORTING = 0;
                }
                });
                oColumnModel.updateBindings();
        },

        /**
         * Helper method for creating intial variant and dependent variant when on drill down event is called
         * @param {Object} oValuesForFilter - object containing filter values
         * @param {Object} oController - reference to table controller
         * @private
         */
        _createVariantModelforNav: function(oValuesForFilter, oController){
            var sDrillDownTarget = oController.getOwnerComponent()._cachedConfigData.getProperty("/DRILL_DOWN_TARGET"),
                oVariantModel = oController.getModel("main"),
                oPayLoad,
                oFilterObject = {};

			oFilterObject["oFilters"] = oValuesForFilter;

			if (oController.getOwnerComponent()._cachedConfigData.getProperty("/INPUT_PARAMETERS")) {
				var sEntity = oController.getOwnerComponent()._cachedConfigData.getProperty("/ENTITY_NAME");
				oFilterObject["IP"] = sEntity.slice(sEntity.indexOf("(") + 1, sEntity.indexOf(")"));
			}

			if (!oVariantModel) {
				// set variant model
				oVariantModel = models.createODataModelWithParameters(oController.getOwnerComponent().getMetadata().getConfig().serviceUrl);
				oController.setModel(oVariantModel, "main");
			}

			oPayLoad = {
				CTRLID: sDrillDownTarget,
				VARIANTID: "DependentReport",
				USERID: "",
				VARIANT_NAME: "DependentReport",
				IS_DEFAULT: 0,
				IS_GLOBAL: 0,
				IS_HIDDEN: 1,
				FILTER_OBJECT: encodeURI(JSON.stringify(oFilterObject)),
				FOR_USERS: "",
				TABLE_COLUMNS: ""
			};

			oVariantModel.create("/VariantsUpsert", oPayLoad, {
				success: function() {
					if (oController.getModel("mainView").getProperty("/moveToNewReport")) {
						oController.getModel("mainView").setProperty("/moveToNewReport", false);
						oController.handleCrossAppNavigation(sDrillDownTarget, true);
					} else {
						oController.getModel("mainView").setProperty("/moveToNewReport", true);
					}
				},
				error: function(oError) {
					jQuery.sap.log.error(oError,"com.siemens.tableViewer.tableUtilities._createVariantModelforNav");
				}
			});
		},
		/**
         * returns the array of filters to use when loading the application for report to report
         * @param {Boolean} bInitial - to check if this is initial load of application
         * @param {Object} oController - reference for table controller
         * @returns {Promise} - array of filters for loading app in dependent or initial
         * @private
         */
        _createInitialFilters: function(bInitial, oController) {
            return new Promise(function(fnResolve) {
                // set variant model
                var oModel = oController.getComponentModel("main"),
                oValuesForFilter,
                oEventBus = oController.getEventBus(),
                oMainConfig = oController.getModel("mainView"),
                mainFilter = [],
                aFilters = [
                    new Filter("VARIANTID", FilterOperator.EQ, bInitial ? "InitialReport" : "DependentReport"),
                    new Filter("CTRLID", FilterOperator.EQ, oController.getOwnerComponent()._sControlId)
                ];

                oModel.read("/UserVariants", {
                    filters: [new Filter(aFilters, true)],
                    success: jQuery.proxy(function(oData) {
                        if (oData.results.length > 0) {
                            var oReceivedFilterObject = JSON.parse(decodeURI(oData.results[0].FILTER_OBJECT));
                            oValuesForFilter = oReceivedFilterObject.oFilters;

                            if (oMainConfig.getProperty("/INPUT_PARAMETERS")) {
                                oMainConfig.setProperty("/ENTITY_NAME", oReceivedFilterObject.IP);
                            }
                            oEventBus.publish("FilterBar", "FillFilterBar", {
                                initial: bInitial,
                                values: oValuesForFilter
                            });
                            oEventBus.publish("FilterBar", "ApplyVariant", oValuesForFilter);
                            var aFilters, oValue,
                            fPushFilterValues = function(sValue) {
                                aFilters.push(new Filter(oValue, FilterOperator.EQ, sValue));
                            };
                            if (oValuesForFilter instanceof Array) {
                                oEventBus.publish("FilterBar", "GetFilterData");
                                mainFilter = oController._filterObject;
                            } else {
                                for (oValue in oValuesForFilter) {
                                    aFilters = [];
                                    oValuesForFilter[oValue].map(fPushFilterValues);
                                    mainFilter.push(new Filter(aFilters, false));
                                }
                            mainFilter = mainFilter.length > 0 ? new Filter(mainFilter, true) : mainFilter;
                            }
                        }
                        fnResolve(mainFilter);
                    }, this),
                    error: function(oError) {
                        fnResolve(mainFilter);
                        jQuery.sap.log.error(oError,"com.siemens.tableViewer.tableUtilities._createInitialFilters");
                    }
                });
            }.bind(this));
		},
		/**
		 * Enable or disable show details button for report to report based on indices and selection mode of table
		 * @param {Object} oEvent - Row selection event of master table
		 * @param {Object} oController - reference for table controller
		 * @private
		 */
		_showHideDetailsButton: function(oEvent, oController) {
			var oTable = oEvent.getSource();
			if (oTable.getSelectionMode() === "MultiToggle" && oTable.getSelectedIndices().length > 0) {
				oController._oTableViewModel.setProperty("/enableShowDetailsButton", true);
			} else {
				oController._oTableViewModel.setProperty("/enableShowDetailsButton", false);
			}
		},
        /**
         * Method to create models for table popup dialog for columns config and data. Also binds the table popup dialog
         * @param {sap.ui.base.Event} oEvent - Link press event parameter
         * @param {Object} - reference to table controller
         * @private
         */
        _createTablePopupDrilldown: function(oEvent, oController) {
            //declare variables
            var oTable = oEvent.getSource().getParent().getParent(), //source table
                sVisibleColumns = oController._getTableVisibleColumns(oTable),
                oColumnConfig,
                oRowData = this._getSelectedRowData(oEvent.getSource().getParent().getCells(), sVisibleColumns),
                aFilters = [],
                aTableFilters = [],
                sCalculationId,
                sServiceUrl,
                aCustomData = oEvent.getSource().getCustomData(),
                iColumnIndex,
                sSourceColumnName;
            //get column index and get column name
            jQuery.each(aCustomData, function(iCustomData, oCustomData) {
                if (oCustomData.getKey() === "sap-ui-colindex") {
                    iColumnIndex = parseFloat(oCustomData.getValue());
                    return false;
                }
            });
            //get column by using sort property of the column
            sSourceColumnName = oTable.getColumns()[iColumnIndex].getSortProperty();
            oColumnConfig = this._getSourceColumnConfigDetails(sSourceColumnName, oController);
            //get row data from the selected row for the link key fields and return the filter
            aFilters = this._getLinkKeysDetailsFilter(oRowData, oColumnConfig);
            //get filters applied from the table
            aTableFilters = oTable.getBinding("rows").aApplicationFilters[0];
            if (aTableFilters) {
                aFilters.push(aTableFilters);
            }
            oController.getModel("tablePopupView").setProperty("/filters", aFilters);
            //set the target data source
            sCalculationId = oColumnConfig.dataSrc;
            //set dialog title and table header
            oController.getModel("tablePopupView").setProperty("/title", oColumnConfig.headerTitle);
            oController.getModel("tablePopupView").setProperty("/subtitle", oColumnConfig.subheaderTitle);
            sServiceUrl = oController.getModel("main").sServiceUrl;
            oController.setModel(this._readServiceColumns(sServiceUrl, sCalculationId, oController), "tableDrillServiceColumns");
        },
        /**
         * Method to return the filters for the link keys
         * @private
         * @param {object} oRowData - Current row data
         * @param {object} oItem - column configuration for table drill down
         * @returns {object} aFilters - Filter of arrays for link keys
         */
        _getLinkKeysDetailsFilter: function(oRowData, oItem) {
            var aFilters = [],
                sKeys = oItem.linkKeys,
                aKeys;
            if (sKeys.match(",") !== null) {
                aKeys = sKeys.split(",");
            } else {
                aKeys = sKeys;
            }
            if (typeof aKeys !== "string") {
                for (var i = 0; i < aKeys.length; i++) {
                    if (oRowData[aKeys[i]] !== undefined) {
                        aFilters.push(new Filter(aKeys[i], FilterOperator.EQ, oRowData[aKeys[i]]));
                    }
                }
            } else {
                if (oRowData[aKeys] !== undefined) {
                    aFilters.push(new Filter(aKeys, FilterOperator.EQ, oRowData[aKeys]));
                }
            }
            return aFilters;
        },
        /**
         * Method to return the row data from the link is pressed in the table
         * @param {Array} aCells - Array of cells
         * @param {Array} aVisibleColumns Array of Visible columns
         * @returns {Object} Object - Object containing column name and its value from a row
         * @private
         */
        _getSelectedRowData: function(aCells, aVisibleColumns) {
            var aCellValues = [];
            for (var i = 0; i < aCells.length; i++) {
                aCellValues.push(aCells[i].getBinding("text").oValue);
            }
            return this.getKeyValueObject(aVisibleColumns, aCellValues);
        },
        /**
         * Method to combine two arrays and provide a key value pair object
         * @param {Array} aKeys - Array containing keys
         * @param {Array} aVals - Array containing values
         * @returns {Object} oObj - Object containing key-value pair
         * @public
         */
        getKeyValueObject: function(aKeys, aVals) {
            return aKeys.reduce(
                function(oObj, sKey, i) {
                    oObj[sKey] = aVals[i];
                    return oObj;
                }, {}
            );
        },
        /**
         * Method to return source column drill down configuration details
         * @param {String} sSourceColumnName - all visible columns in the table
         * @param {Object} oController - reference to table controller
         * @returns {Object} oColumnConfig - columns which are active key for target
         * @private
         */
        _getSourceColumnConfigDetails: function(sSourceColumnName, oController) {
            var oModel = oController.getOwnerComponent()._cachedConfigData,
                aColumns = this._getServiceToColumnData(oController, oModel),
                oColumnConfig;
            jQuery.grep(aColumns, function(oItem, iItemIndex) {
                if (oItem.COLUMN === sSourceColumnName) {
                    if (oItem.LINK_KEY_FIELDS !== "" && oItem.LINK_KEY_FIELDS !== null) {
                        oColumnConfig = {
                            column: oItem.COLUMN,
                            index: iItemIndex,
                            label: oItem.LABEL,
                            linkKeys: oItem.LINK_KEY_FIELDS,
                            dataSrc: oItem.LINK_TARGET,
                            headerTitle: oItem.MAINHEADER_DRILL,
                            subheaderTitle: oItem.SUBHEADER_DRILL
                        };
                    }
                }
            });
            return oColumnConfig;
        },
        /**
         * Method to read the configuration details of the Calculation view
         * @private
         * @param {string} sUrl - service url for config
         * @param {string} sCalcId - target source
         * @param {Object} oController - reference to table controller
         * @returns {object} oConfigModel - Drilldown config model for columns aggregation
         */
        _readServiceColumns: function(sUrl, sCalcId, oController) {
            var oModel = oController.getModel("main"),
                oConfigModel = new JSONModel();
            // async call is required here
            oModel.read("/Service('" + sCalcId + "')", {
                urlParameters: "$expand=ServiceToColumnConfig",
                success: function(oData, oResponse) {
                    if (oData) {
                        oData.ServiceToColumnConfig.results.sort(function(oObject1, oObject2) {
                            return oObject1.SORTORDER - oObject2.SORTORDER;
                        });
                        oConfigModel.setData(oData);
                        _bindTablePopUp(oController);
                    } else {
                        jQuery.sap.log.error(JSON.stringify(oResponse),"com.siemens.tableViewer.tableUtilities._readServiceColumns");
                    }
                },
                error: function(oError) {
                    jQuery.sap.log.error(JSON.stringify(oError),"com.siemens.tableViewer.tableUtilities._readServiceColumns");
                },
                async: false
            });
            return oConfigModel;
        }
    };
});