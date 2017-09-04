/*!
 * Copyright 2017 Siemens AG
 */
sap.ui.define([
    "com/siemens/tableViewer/controller/BaseController",
    "sap/ui/table/Column",
    "sap/m/Label",
    "sap/m/MessageBox",
    "sap/m/Text",
    "com/siemens/tableViewer/model/formatter",
    "com/siemens/tableViewer/model/models",
    "sap/ui/model/json/JSONModel",
    "com/siemens/tableViewer/control/ExtendedTablePersoController",
    "sap/m/MessageToast",
    "com/siemens/tableViewer/controller/utilities",
    "com/siemens/tableViewer/controller/Coloring",
    "sap/ui/model/Sorter",
    "sap/m/Link",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/odata/ODataUtils",
    "com/siemens/tableViewer/controller/tablesUtilities"
], function(BaseController, Column, Label, MessageBox, Text, formatter, models, JSONModel, TablePersoController, MessageToast, utilities, coloring, Sorter, Link, Filter, FilterOperator, ODataUtils, tablesUtilities) {
    "use strict";

    /**
     * Constructor for Table Controller
     *
     * @class
     * This is an controller class for Table tab view.
     * @abstract
     *
     * @extends com.siemens.tableViewer.controller.BaseController
     *
     * @constructor
     * @public
     * @alias com.siemens.tableViewer.controller.tabs.Table
     */
    return BaseController.extend("com.siemens.tableViewer.controller.tabs.Table", {
        formatter: formatter,
        coloring: coloring,

        config: {
            limitations: {
                exportRows: 5000
            },
            paths: {
                exportService: "odxl/odxl.xsjs"
            }
        },

        _oTableViewModel: null,
        _oBusyIndicator: null,
        _oTable: null,
        _iOriginalBusyDelay: null,

        _oColumnSettingsDialog: null,

        /* =========================================================== */
        /* lifecycle methods                                           */
        /* =========================================================== */

        /**
         * Called when the table controller is instantiated. It sets up the event handling and other lifecycle tasks.
         * @public
         */
        onInit: function() {
            var oEventBus = this.getEventBus(),
            bDependent = this.getOwnerComponent()._getUriParams("dependent");
            this._oTable = this.byId("table");
            this._oTableViewModel = this.createViewModel();
            this._oBusyIndicator = this._oTable.getNoData();
            this._iOriginalBusyDelay = this._oTable.getBusyIndicatorDelay();
            this._onWhenDependentFiltersApplied = null;

            this.setModel(this._oTableViewModel, "tableView");
            //attach on after rendering for table, for column color code and cell formatting
            this._oTable.addEventDelegate({
                onAfterRendering: this.onTableRendering
            }, this);

            // should be executed when data detail promise has been resolved;
            this.getOwnerComponent()._onWhenConfigModelDataIsLoaded.then(function(oData) {
                this._fnColumnDataLoaded(oData);
               if (bDependent) {
                    this._fnCheckDependent();
                    this._onWhenDependentFiltersApplied.then(this._setDependentFilters.bind(this));
                }else {
                    this.getOwnerComponent()._onWhenFiltersApplied.then(this._bindTable.bind(this));
                }
                this.getRouter().attachRoutePatternMatched(this._onRouteMatched, this);
            }.bind(this));
            oEventBus.subscribe("com.tableViewer", "ReturnFilterData", this._storeFilterData, this);
            oEventBus.subscribe("com.tableViewer", "SetVisibleColumns",this._setVisibleColumns, this);
            // register event for updating table with filters
            oEventBus.subscribe("com.tableViewer", "filtersUpdated", this._setupFilters, this);
        },

        /**
         * Called when the Table controller is going to be destroyed.
         * @public
         */
        onExit: function() {
            var oEventBus = this.getEventBus();
                oEventBus.unsubscribe("com.tableViewer", "filtersUpdated", this._setupFilters, this);
                oEventBus.unsubscribe("com.tableViewer", "SetVisibleColumns",this._setVisibleColumns, this);
                oEventBus.unsubscribe("com.tableViewer", "ReturnFilterData", this._storeFilterData, this);
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
        _onRouteMatched: function(oEvent) {
            if (oEvent.getParameters("arguments").arguments.tab === "Table") {
                this._setupFilters();
            }
        },

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
         * On after rendering of table
         * @public
         */
        onTableRendering: function() {
            var aColumns,
                sColumnColor,
                bIsCellFormat,
                aRows,
                iRow,
                oDomRow,
                aRowCells,
                aCells,
                aCustomData,
                sValue,
                fnCellFormat;

            aColumns = this._oTable.getColumns();

            // Get Visible Columns
            var aVisibleColumns = jQuery.grep(aColumns, function(oItem) {
                if (oItem.getProperty("visible")) {
                    return oItem;
                }
            });

            fnCellFormat = function(oCells) {
                aCustomData = oCells.getCustomData();
                sValue = oCells.getText();
                if (sValue && sValue !== "") {
                    //utility method to apply cell format coloring
                    coloring.applyCellFormatConditions(aCustomData, sValue, oCells.getId());
                }
            };

            aVisibleColumns.forEach(function(oColumn, i) {
                sColumnColor = oColumn.data("CELL_COLOR"); //custom data from column to flag COLOR_CODE values
                bIsCellFormat = oColumn.data("CELL_COLOR_FORMAT"); //custom data from column to flag CFORMAT, cell color config is enabled or not
                aRows = this._oTable.getRows();
                for (iRow = 0; iRow < aRows.length; iRow++) {
                    //check to see if the column has cell format enabled. If cell format enabled, dont color the cells from COLOR_CODE
                    if (bIsCellFormat) {
                        //get all the cells and custom data aggregated in those cell to set the cell colors.
                        aCells = aRows[iRow].getCells();
                        aCells.forEach(fnCellFormat);
                    } else {
                        //Get row DOM
                        oDomRow = aRows[iRow].getDomRef();
                        // Get row cells
                        aRowCells = jQuery(oDomRow).find("td");
                        // Add color to table row cell
                        jQuery(aRowCells[i + 1]).css("background-color", sColumnColor);
                    }
                }
            }.bind(this));
        },
        /**
         * Event handler for row selection change of Main table
         * @param {sap.ui.base.Event} oEvent - row selection change event
         * @public
         */
        onRowSelectionChange: function(oEvent) {
			var oMainConfig = this.getOwnerComponent()._cachedConfigData,
            iDrillDown = oMainConfig.getProperty("/DRILL_DOWN");
            if (iDrillDown === 1) {
				tablesUtilities._showHideDetailsButton(oEvent, this);
			} else if (iDrillDown === 2) {
				tablesUtilities._createDetailsTable(oEvent, this);
			}
		},
        /**
         *Creates Personalization dialog where user can change table columns visibility and order
         * @return {void}
         * @public
         */
        onTableColumnSettingsPress: function() {
            var oColumnSettingsDialog = this._getTableColumnSettingsDialog();
            oColumnSettingsDialog.openDialog();
            if (oColumnSettingsDialog._oDialog.mEventRegistry.confirm.length < 2) {
                oColumnSettingsDialog._oDialog.attachEventOnce("confirm", function() {
                    tablesUtilities._saveVisibleColumns(this);
                    this._bindTable();
                }.bind(this));
            }
        },

        /**
         * Creates Table Column Sorting Dialog, when user clicks on Sorting Icon
         * @return {void}
         * @public
         */
        onTableColumnSortingPress: function() {
            var oSortingDialog = this._getTableColumnSortingDialog(),
            oModel = new JSONModel(this._createTableColumnSortingData());
            oSortingDialog.setModel(oModel);
            oSortingDialog.open();
        },

        /**
         * Sort change event fires when you change sort on single column
         * @param {Object} oEvent - event object
         * @private
         */
        onSortChange: function(oEvent) {
            var aSorter = [],
            oColumn = oEvent.getParameter("column"),
            oMainViewModel = this.getModel("mainView");
            aSorter.push(new Sorter(oColumn.getSortProperty(), this._isDescending(oEvent.getParameter("sortOrder"))));
            oMainViewModel.setProperty("/sorters", aSorter);
            tablesUtilities._updateSort(this,oColumn.getSortProperty(),oEvent.getParameter("sortOrder"));
            tablesUtilities._saveVisibleColumns(this);
        },

        /**
         * Reset Table Column Sorting Properties from Cached Model
         * @param {sap.ui.base.Event} oEvent - on Reset button clicked
         * @return {void}
         * @public
         */
        onSortingDialogReset: function(oEvent) {
            var oSortingDialog = oEvent.getSource(),
            oCachedData = this.getOwnerComponent()._cachedConfigData,
            oModel = new JSONModel(this._createTableColumnSortingData(oCachedData));
            oSortingDialog.setModel(oModel);
        },

        /**
         * Apply sorting properties from the Sorting Dialog to the Table
         * Creates message toast and close dialog
         * @param {sap.ui.base.Event} oEvent - on Ok button clicked
         * @return {void}
         * @public
         */
        onSortingDialogOk: function(oEvent) {
            var oMainViewModel = this.getModel("mainView"),
            oSortingDialog = oEvent.getSource(),
            aSortItems = oSortingDialog.getModel().getProperty("/sortItems"),
            aTableColumnData = tablesUtilities._getServiceToColumnData(this),
            oTable = this._oTable,
            aSorters = [];

            aTableColumnData.forEach(function(oTableColumn) {
                // find sort element
                var aNewSortingItem = aSortItems.filter(function(item) {
                    return item.COLUMN === oTableColumn.COLUMN;
                });

                if (aNewSortingItem.length === 1) {
                    aNewSortingItem = aNewSortingItem[0];
                    aSorters.push(new Sorter(aNewSortingItem.COLUMN, this._isDescending(aNewSortingItem.COLUMN_SORTING)));

                } else if (aNewSortingItem.length > 1) {
                    return jQuery.sap.log.error("Multiple elements found in new sorting");
                }

                oTableColumn.COLUMN_SORTED = !!aNewSortingItem.COLUMN_SORTING;
                oTableColumn.COLUMN_SORTING = aNewSortingItem.COLUMN_SORTING;

            }.bind(this));

            oMainViewModel.setProperty("/sorters", aSorters);

            this._sortTable(aSorters);
            oTable.getModel("columnModel").updateBindings();
            tablesUtilities._saveVisibleColumns(this);
            MessageToast.show(this.getResourceBundle().getText("tbl.columnSortingChanged"));
            oSortingDialog.close();
        },

        /**
         * Executed when user remove sorting item from the Sorting Dialog
         * Removes items from the data model
         * @param {sap.ui.base.Event} oEvent - on Remove button clicked
         * @return {void}
         * @public
         */
        onTableSortingDialogRemove: function(oEvent) {
            var params = oEvent.getParameters(),
            oModel = oEvent.getSource().getModel(),
            oData = oModel.getData();
            oData.sortItems = oData.sortItems.filter(function(element) {
                return element.COLUMN !== params.key;
            });
        },

        /**
         * Add Sorting item to the Column Sorting Dialog list
         * @param {sap.ui.base.Event} oEvent - on Add button clicked
         * @return {void}
         * @public
         */
        onTableSortingDialogAddSortItem: function(oEvent) {
            var params = oEvent.getParameters(),
            oModel = oEvent.getSource().getModel(),
            oData = oModel.getData();

            var oSortItem = {
                COLUMN: params.sortItemData.getColumnKey(),
                COLUMN_SORTING: params.sortItemData.getOperation()
            };
            if (params.index) {
                oData.sortItems.splice(params.index, 0, oSortItem);
            } else {
                oData.sortItems.push(oSortItem);
            }
            oModel.setData(oData, true);
        },

        /**
         * Close Sorting Dialog
         * @param {sap.ui.base.Event} oEvent - sorting dialog cancel event
         * @return {void}
         * @public
         */
        onSortingDialogCancel: function(oEvent) {
            oEvent.getSource().close();
        },

        /**
         * Opens export to excel menu control
         * @param {sap.ui.base.Event} oEvent - on Click event
         * @return {void}
         * @public
         */
        onTableExport: function(oEvent) {
            var iRowCount = this._oTableViewModel.getProperty("/rowCount"),
            sErrMessage,
            oOptions;

             //Check limitations on Export
            if (iRowCount > this.config.limitations.exportRows) {
                oOptions = {
                    title: this.getResourceBundle().getText("tbl.export.ErrorDialogTitle"),
                    icon: MessageBox.Icon.ERROR,
                    actions: [MessageBox.Action.ABORT],
                    initialFocus: MessageBox.Action.ABORT,
                    styleClass: utilities.getContentDensityClass()
                };

                sErrMessage = this.getResourceBundle().getText("tbl.export.ErorrDialogMsg", [iRowCount, this.config.limitations.exportRows]);

                //Show Error message
                MessageBox.show(sErrMessage, oOptions);
                return;
            }
            tablesUtilities.openExportPopover(oEvent, this.getView(), this);
        },

        /**
         * Executed when user select export to excel possibility in Export Popover
         * @param {sap.ui.base.Event} oEvent - Excel/csv item list pressed
         * @return {void}
         * @public
         */
        onExportPressed: function(oEvent) {
            var sFormat = oEvent.getSource().data("id"),
            sFileName = "export" + '.' + sFormat,
            sSheetName = "data",
            sServicePath = this.getOwnerComponent().getMetadata().getConfig().serviceUrl.replace("Main.xsodata", "") + this.config.paths.exportService,
            sURL = "",
            sInputParams = "",
            sVisibleColumns = this._getTableVisibleColumns(this._oTable).toString(),
            oMainConfig = this.getOwnerComponent()._cachedConfigData,
            sDataSource = oMainConfig.getProperty("/DATA_SOURCE"),
            oBinding = this._oTable.getBinding("rows"),
            aColumns = this._oTable.getAggregation("columns"),
            sSortedColumns = oBinding.sSortParams,
            sUnsortedColumns = tablesUtilities.getUnsortedColumns(aColumns),
            aFilters = oBinding.aApplicationFilters,
            oMetadata = this.getModel("data").oMetadata,
			sResolvedPath = oMainConfig.getProperty("/ENTITY_NAME"),
			oEntitySet = oMetadata._getEntityTypeByPath(sResolvedPath),
			sFilterParams = ODataUtils.createFilterParams(aFilters, oMetadata, oEntitySet);
            this.getView().byId("exportMenu").close();
            if (oMainConfig.getProperty("/INPUT_PARAMETERS")) {
				sInputParams = sResolvedPath.slice(sResolvedPath.indexOf("("), sResolvedPath.indexOf(")") + 1);
				sInputParams = sInputParams.replace(/datetime/g, ""); // Remove datetime property
				sInputParams = sInputParams.replace(/time/g, ""); // Remove time property
			}
            if (sSortedColumns && sUnsortedColumns !== "") {
				sSortedColumns = sSortedColumns + "," + sUnsortedColumns;
            } else if (!sSortedColumns) {
                sSortedColumns = "$orderby=" + sUnsortedColumns;
            }
            sFilterParams = sFilterParams ? "&" + sFilterParams : "";
			//replace datetime to enable export for ctype 20..
			sFilterParams = sFilterParams.replace(/%20datetime%27/g, "%20%27");
            //replace time in FilterString
			sFilterParams = tablesUtilities.replaceTimeString(sFilterParams);
			sFilterParams = sFilterParams.replace(/(\d)([M])([)%])/g, "$1$3");
            //sURL = sServicePath + sDataSource;
            sURL = sServicePath + "/%22_SYS_BIC%22/%22" + sDataSource + "%22" + sInputParams;
            sURL = sURL + "?" +
                "$select=" + sVisibleColumns +
                "&" + sSortedColumns +
                sFilterParams +
                "&" + "IS_KFG=" + tablesUtilities.getKFGValues(sVisibleColumns, oMainConfig, tablesUtilities._getTableColumnPath()) +
                "&" + "$format=" + sFormat +
                "&" + "fieldsep=;" +
                "&" + "sheetname=" + sSheetName +
                "&" + "download=" + sFileName +
                "&" + "langu=" + this.getAppLanguage()
            ;
            window.open(sURL);
        },
        /**
         * Event handler for press event of Cell configuration button. To open config Dialog
         * @public
         */
        onPressColorConfiguration: function() {
            if (!this._oColorConfigDialog) {
                // create fragment instance
                this._oColorConfigDialog = sap.ui.xmlfragment(this._getCellColorConfigFragDiagId(), "com.siemens.tableViewer.view.fragments.CellConfigDialog", this);
                //get the service columns from main config model and set it to the JSON model
                var oModel = this.getOwnerComponent()._cachedConfigData,
                    aColumns = tablesUtilities._getServiceToColumnData(this,oModel),
                    //aColumns = this._getServiceToColumnData(),
                    oCellColorsColumnModel,
                    fnGetCellFormatEnabledColumns,
                    aCellFormatEnabledColumns = [],
                    aVisibility = [],
                    sColors,
                    aColors;
                fnGetCellFormatEnabledColumns = function(oColumn) {
                    if (oColumn.CFORMAT === 1 && (oColumn.CTYPE === 3 || oColumn.CTYPE === 7)) {
                        sColors = oColumn.CRANGE_COLORS;
                        aColors = [];
                        if (sColors) {
                            aColors = coloring.getColorsJSONData(sColors);
                        } else {
                            aColors = oColumn.CFORMAT_COLOR ? coloring.getColorsJSONData(oColumn.CFORMAT_COLOR) : [];
                        }
                        aVisibility = coloring.getNoVisibleSelects(oColumn.CFORMAT_CONDITION); //get number of selects dropdown to be made visible
                        aCellFormatEnabledColumns.push({ //JSON Data for cell config dialog
                            LABEL: oColumn.LABEL, //label for each column enabled for cell format
                            COLUMN: oColumn.COLUMN, //column name in table
                            CONDITION: oColumn.CFORMAT_CONDITION, //formatting conditions
                            SLIDER_VALUE1: this.setSliderOneValue(oColumn.CFORMAT_CONDITION),
                            SLIDER_VALUE2: this.setSliderTwoValue(oColumn.CFORMAT_CONDITION),
                            SLIDER_MIN: this.setSliderMinValue(oColumn.CRANGE),
                            SLIDER_MAX: this.setSliderMaxValue(oColumn.CRANGE),
                            COLORS: oColumn.CFORMAT_COLOR, //formatting colors for conditions
                            RANGES: oColumn.CRANGE, //minimum and maximum value in range slider
                            COLOROPTIONS: aColors, //colors in drop down
                            VISIBILITY: aVisibility, //visibility flag for dropdown to hide/unhide when the ranges are changes
                            COLORS_DEFAULT_KEY: coloring.getColorsAfterSplit(oColumn.CFORMAT_COLOR) //selected key for the drop downs
                        });
                    }
                }.bind(this);
                aColumns.filter(fnGetCellFormatEnabledColumns);
                oCellColorsColumnModel = new JSONModel();
                oCellColorsColumnModel.setData({
                    items: aCellFormatEnabledColumns
                });
                this.setModel(oCellColorsColumnModel, "cellColorsColumnModel");
                this.getView().addDependent(this._oColorConfigDialog);
                utilities.attachControl(this.getView(), this._oColorConfigDialog);
            }
            //open cell config dialog
            this._oColorConfigDialog.open();
        },

        /**
         * Link press event handler for table popup dialog
         * @param {sap.ui.base.Event} oEvent - Link press event
         * @public
         */
        onLinkPressTableCell: function(oEvent) {
            if (!this._oTablePopupDrillDown) {
                this._oTablePopupDrillDown = sap.ui.xmlfragment(this._getTablePopupFragDiagId(), "com.siemens.tableViewer.view.fragments.TablePopupDrilldown", this);
                this.getView().addDependent(this._oTablePopupDrillDown);
                utilities.attachControl(this.getView(), this._oTablePopupDrillDown);
                var oTablePopupViewModel = this.createTablePopViewModel();
                this.setModel(oTablePopupViewModel, "tablePopupView");
            }
            tablesUtilities._createTablePopupDrilldown(oEvent, this);
            //open the fragment dialog
            this._oTablePopupDrillDown.open();
        },

        /**
         * Formatter function to return value for Slider value one from conditions
         * @param {String} sCondition - condition for cell formatting
         * @returns {Number} fNumber - value 1 for range slider
         * @public
         */
        setSliderOneValue: function(sCondition) {
            var aConditions = coloring.getCellConditions(sCondition),
            //pass the conditions retrieved from config table and get the value1 and value2 values for the slider
            oValue = coloring.getConfigRangeValues(aConditions);
            return parseFloat(oValue.iVal1);
        },

        /**
         * Formatter function to return value for Slider value two from conditions
         * @param {String} sCondition - condition for cell formatting
         * @returns {Number} fNumber - value 2 for range slider
         * @public
         */
        setSliderTwoValue: function(sCondition) {
            var aConditions = coloring.getCellConditions(sCondition),
            //pass the conditions retrieved from config table and get the value1 and value2 values for the slider
            oValue = coloring.getConfigRangeValues(aConditions);
            return parseFloat(oValue.iVal2);
        },

        /**
         * Formatter function to return value for Slider minimum value from conditions
         * @param {String} sRange - range for slider min:max
         * @returns {Number} fNumber - minimum value for range slider
         * @public
         */
        setSliderMinValue: function(sRange) {
            var oRange = coloring.getColonDelimitValues(sRange);
            return parseFloat(oRange.iZero);
        },

        /**
         * Formatter function to return value for Slider maximum value from conditions
         * @param {String} sRange - range for slider min:max
         * @returns {Number} fNumber - maximum value for range slider
         * @public
         */
        setSliderMaxValue: function(sRange) {
            var oRange = coloring.getColonDelimitValues(sRange);
            return parseFloat(oRange.iOne);
        },

        /**
         * Event handler for on press of save button in cell config dialog. Cell config to be applied to TV on this event
         * @param {sap.ui.base.Event} oEvent - event handler for on save of cell config button
         * @public
         */
        onSaveCellColorDialog: function() {
            var aColumns = tablesUtilities._getServiceToColumnData(this),
                oModel = this.getOwnerComponent()._cachedConfigData,
                fnSaveCellFormatEnabledColumns,
                aData = [],
                fnGetFormContents,
                oMax,
                oMin,
                oValue1,
                oColorsLyt,
                aColorItems,
                aColors,
                aContent,
                bFlag = false;
            fnSaveCellFormatEnabledColumns = function(oColumn) {
                fnGetFormContents = function(oContent) {
                    oMax = oContent.getItems()[0].getItems()[1].getItems()[2]; //slider maximum range values
                    oMin = oContent.getItems()[0].getItems()[1].getItems()[1]; //slider minimum range values
                    oValue1 = oContent.getItems()[0].getItems()[0].getItems()[1].getItems()[0]; //slider one values
                    oColorsLyt = oContent.getItems()[1]; //colors layout hbox
                    aColorItems = oColorsLyt.getItems(); //colors items
                    aColors = [];
                    for (var i = 0; i < aColorItems.length; i++) {
                        if (aColorItems[i].getVisible()) {
                            aColors.push(aColorItems[i].getSelectedKey()); //only visible select dropdown considered for config update
                        }
                    }
                    oColumn.CFORMAT_CONDITION = oValue1.data("CFORMAT_CONDITION"); // values for format conditions
                    oColumn.CFORMAT_COLOR = aColors.toString(); //set values for cell format colors
                    oColumn.CRANGE = oMin.getValue() + ":" + oMax.getValue(); //set values for range slider range changes
                };
                //iteration for cell format enabled columns with integer and float type
                if (oColumn.CFORMAT === 1 && (oColumn.CTYPE === 3 || oColumn.CTYPE === 7)) {
                    aContent = coloring._getColumnFormContainer(oColumn.COLUMN, this).getFormElements()[0].getFields();
                    //iteration to get cell configuration details from the form containers
                    aContent.forEach(fnGetFormContents);
                    if (bFlag) {
                        aData.push(oColumn); //use this array for update to configuration table
                    }
                }
            }.bind(this);
            aColumns.filter(fnSaveCellFormatEnabledColumns);
            aColumns = tablesUtilities._getServiceToColumnData(this,oModel);
            bFlag = true;
            aColumns.filter(fnSaveCellFormatEnabledColumns);
            //prepare payload for batch update
            if (aData.length > 0) {
                this._updateConfigTable(aData);
            }
            //close cell config dialog
            this._oColorConfigDialog.close();
        },

        /**
         * Event handler for on close of cell config dialog
         * @public
         */
        onCloseCellColorDialog: function() {
            //close cell config dialog
            this._oColorConfigDialog.close();
        },

        /**
         * Event handler for change/livechange of value1 input field that has the value 1 value from the range slider
         * @param {sap.ui.base.Event} oEvent - Event Parameter
         * @public
         */
        onSliderOneValueChange: function(oEvent) {
            coloring.onSliderOneInputValueChange(oEvent, this);
        },

        /**
         * Event handler for change/livechange of value2 input field that has the value 2 value from the range slider
         * @param {sap.ui.base.Event} oEvent - Event parameter
         * @public
         */
        onSliderTwoValueChange: function(oEvent) {
            coloring.onSliderTwoInputValueChange(oEvent, this);
        },

        /**
         * Event handler for change/livechange of minimum range input field that has the minimum value from the range slider
         * @param {sap.ui.base.Event} oEvent - Event parameter
         * @public
         */
        onSliderMinValueChange: function(oEvent) {
            coloring.onSliderMinInputValueChange(oEvent, this);
        },

        /**
         * Event handler for change/livechange of maximum range input field that has the maximum value from the range slider
         * @param {sap.ui.base.Event} oEvent - Event parameter
         * @public
         */
        onSliderMaxValueChange: function(oEvent) {
            coloring.onSliderMaxInputValueChange(oEvent, this);
        },

        /**
         * Event handler for on change/onlive change event of RangeSlider. To set the range values to the Text control
         * @param {sap.ui.base.Event} oEvent - change/live change event handler of the RangeSlider
         * @private
         */
        onRangeSliderChange: function(oEvent) {
            coloring.onRangeSliderValueChange(oEvent, this);
        },

        /**
         * Event handler to close the dialog for table dialog popup
         * @public
         */
        onTableCellPopupClose: function() {
            this._oTablePopupDrillDown.close();
        },
        /**
         * Event handler to show report on clicking Show Details
         * @public
         */
        onDrillDown: function() {
			var aSelectedIndices = this._oTable.getSelectedIndices(),
				aBondItems = [],
				oItemContext,
				oValuesForFilter = {},
				aVisibleColumns = [],
				oEventBus = this.getEventBus(),
                setValuesForFilter;

			oEventBus.publish("com.tableViewer", "SaveInitialReport");

			this._oTable.getColumns().map(function(oColumn) {
				if (oColumn.getVisible()) {
					aVisibleColumns.push(oColumn.getSortProperty());
				}
			});

			this.getOwnerComponent()._cachedConfigData.getProperty(tablesUtilities._getTableColumnPath()).map(function(oColumn) {
				if (oColumn.DRILL_DOWN_BOND && aVisibleColumns.indexOf(oColumn.COLUMN) !== -1) {
					aBondItems.push({
						from: oColumn.COLUMN,
						to: oColumn.DRILL_DOWN_BOND
					});
					oValuesForFilter[oColumn.DRILL_DOWN_BOND] = [];
				}
			});

			setValuesForFilter = function(oBondItem) {
				if (oItemContext.getProperty(oBondItem.from) instanceof Date) {
					if (oValuesForFilter[oBondItem.to].map(Number).indexOf(+oItemContext.getProperty(oBondItem.from)) === -1) {
						oValuesForFilter[oBondItem.to].push(oItemContext.getProperty(oBondItem.from));
					}
				} else {
					if (oValuesForFilter[oBondItem.to].indexOf(oItemContext.getProperty(oBondItem.from)) === -1) {
						oValuesForFilter[oBondItem.to].push(oItemContext.getProperty(oBondItem.from));
					}
				}
			};

			for (var iSelectedIndex in aSelectedIndices) {
				oItemContext = this._oTable.getContextByIndex(aSelectedIndices[iSelectedIndex]);
				if (oItemContext) {
					jQuery.grep(aBondItems, setValuesForFilter);
				}
			}
            tablesUtilities._createVariantModelforNav(oValuesForFilter, this);
        },
        /* =========================================================== */
        /* begin: internal methods                                     */
        /* =========================================================== */

        /**
         * Called on publish event
         * @return {void}
         * @private
         */
        _setupFilters: function() {
            this._bindTable();
        },
        /**
         * Method to return the column arrays that are visible in table
         * @param {Object} oTable - table
         * @returns {Array} aColumns - Array of columns which are visible
         * @private
         */
        _getTableVisibleColumns: function(oTable) {
            var aColumns = [];
            oTable.getColumns().map(function(oColumn) {
                if (oColumn.getVisible()) {
                    aColumns.push(oColumn.getSortProperty());
                }
            });
            return aColumns;
        },
        /**
         * Method to update the cell configuration in cell config table set by the admin privileged user.
         * @param {Object} aData - array of columns which are cell format enabled and are of column type 3 and 7
         * @private
         */
        _updateConfigTable: function(aData) {
            var oMainModel, sCTRLID = this.getOwnerComponent()._sControlId,
                mParameters;
            this._oTable.setBusy(true);
            var fnSuccess = jQuery.proxy(function() {
                //refresh the column template factory
                this._oTable.getBinding("columns").refresh(true);
                this._oTable.setBusy(false);
                oMainModel.setUseBatch(false);
            }, this);
            var fnError = jQuery.proxy(function(oResponse) {
                jQuery.sap.log.error(JSON.stringify(oResponse),"com.siemens.tableViewer.Table._updateConfigTable");
                this._oTable.setBusy(false);
                oMainModel.setUseBatch(false);
            }, this);
            //create a  model for update of cell config to column config table
            oMainModel = this.getOwnerComponent().getModel("main");
            oMainModel.setUseBatch(true);
            //Set deferred batch group
            oMainModel.setDeferredBatchGroups(["cellConfigUpdateBatchId"]);
            //update all the columns that are enabled for cell config
            for (var i = 0; i < aData.length; i++) {
                mParameters = {};
                mParameters.batchGroupId = "cellConfigUpdateBatchId";
                mParameters.merge = false;
                if (aData[i].COLUMN_SORTED) {
                    delete aData[i].COLUMN_SORTED;
                }
                oMainModel.update("/ColumnConfig(CTRLID='" + sCTRLID + "',COLUMN='" + aData[i].COLUMN + "')", aData[i], mParameters);
            }
            // Submit batch
            oMainModel.submitChanges({
                batchGroupId: "cellConfigUpdateBatchId",
                success: fnSuccess,
                error: fnError
            });
        },

        /**
         * to return the instance of table in dialog fragment
         * @return {object} fragment instance
         * @private
         */
        _getTablePopupFrag: function() {
            return this._getFragmentControl(this._getTablePopupFragDiagId(), "siemensUiPopupTable");
        },

        /**
         * to return the instance of table in dialog fragment
         * @return {object} Table popup dialog control instance
         * @private
         */
        _getPopupDialog: function() {
            return this._getFragmentControl(this._getTablePopupFragDiagId(), "siemensUiPopupDialog");
        },

        /**
         * to return the instance of table popup fragment
         * @return {String} Id for table popup
         * @private
         */
        _getTablePopupFragDiagId: function() {
            return this.createId("tvFragTablePopup");
        },

        /**
         * Helper method to return the instance of cell config dialog control
         * @returns {String} Id of cell config dialog control
         * @private
         */
        _getCellColorConfigFragDiagId: function() {
            return this.createId("tvFragCellConfigDialog");
        },

        /**
         * Helper method to return the instance of simple form control in cell config dialog
         * @returns {Object} Instance of Simple form control
         * @private
         */
        _getCellColorConfigForm: function() {
            return this._getFragmentControl(this._getCellColorConfigFragDiagId(), "siemensUiCellColorForm");
        },

        /**
         * Checks if sorting is descending
         * @param {String} iColumnSorting - sorting column name
         * @returns {Boolean} bSortAscDesc - true/false
         * @private
         */
        _isDescending: function(iColumnSorting) {
            var bSortAscDesc;
            switch (iColumnSorting) {
			    case "Ascending":
				    bSortAscDesc = false;
				break;
			    case "Descending":
				    bSortAscDesc = true;
				break;
                case 1:
				    bSortAscDesc = false;
				break;
			    case 2:
				    bSortAscDesc = true;
				break;
                default:
                break;
			    }
            return bSortAscDesc;
        },

        /**
         * Sort Table
         * @param {sap.ui.model.Sorter} aSorter - array of sorted column
         * @private
         */
        _sortTable: function(aSorter) {
            var oTable = this._oTable,
            oBinding = oTable.getBinding("rows");
            oBinding.sort(aSorter);
        },

        /**
         * Transform Column Configuration model data to Sorting Dialog Model format
         * Appends initial "null" element to the items.
         * @param {object} oModel - Odata model of data
         * @returns {object} oModel - Odata model of data
         * @private
         */
        _createTableColumnSortingData: function(oModel) {
            var oDataModel = oModel,
            sNullElementText = sap.ui.getCore().getLibraryResourceBundle("sap.m").getText("P13NDIALOG_SELECTION_NONE"),
            oColumns = tablesUtilities._getServiceToColumnData(this,oDataModel),
            sSelectProperties = this._getSelectParameters(oColumns);

            return oColumns.reduce(function(obj, item) {
                if (sSelectProperties.indexOf(item.COLUMN) > -1 && this._isColumnVisible(item.STDRD)) {
                    obj.items.push({
                        COLUMN: item.COLUMN,
                        LABEL: item.LABEL
                    });

                    if (item.COLUMN_SORTED) {
                        obj.sortItems.push({
                            COLUMN: item.COLUMN,
                            COLUMN_SORTING: item.COLUMN_SORTING
                        });
                    }
                }
                return obj;
            }.bind(this), {
                items: [{
                    COLUMN: null,
                    LABEL: sNullElementText
                }],
                sortItems: []
            });
        },
        /**
         * Check if column is visible
         * @param {number} iSTDRD - Column visibility number
         * @returns {boolean} - true/false
         * @private
         */
        _isColumnVisible: function(iSTDRD) {
            return iSTDRD > 0;
        },

        /**
         * Getter for table sorting dialog. if doesn't exists creates one.
         * @returns {com.siemens.tableViewer.view.fragments.TableSortingDialog} - Sorting dialog instance
         * @private
         */
        _getTableColumnSortingDialog: function() {
            var oView = this.getView(),
            oTablSortingDialog = oView.byId("sortingDialog");
            if (!oTablSortingDialog) {
                oTablSortingDialog = sap.ui.xmlfragment(oView.getId(), "com.siemens.tableViewer.view.fragments.TableSortingDialog", this);
                utilities.attachControl(oView, oTablSortingDialog);
                oView.addDependent(oTablSortingDialog);
            }
            return oTablSortingDialog;
        },

        /**
         * Gets table column settings dialog. If doesn't exists creates it
         * @returns {sap.ui.table.TablePersoController} - Table persona instance
         * @private
         */
        _getTableColumnSettingsDialog: function() {
            if (!this._oColumnSettingsDialog) {
                this._oColumnSettingsDialog = new TablePersoController("columnSettingsDialog", {
                    table: this._oTable
                });
            }
            return this._oColumnSettingsDialog;
        },

        /**
         * Get column configuration from the backend;
         * @param {Array} aColumns - All columns
         * @returns {Array} aAggregateColumns - Aggregated column array
         * @private
         */
        _getAggregateColumns: function(aColumns) {
            return aColumns.reduce(function(aTransition, oColumn, iColumnIndex) {
                if (oColumn.AGGREGATE) {
                    aTransition.push({
                        column: oColumn.COLUMN,
                        index: iColumnIndex,
                        label: oColumn.LABEL
                    });
                }
                return aTransition;
            }, []);
        },

        /**
         * Get $select properties based on table columns
         * @param {object} oColumns - column object
         * @returns {string} - Selected columns string
         * @private
         */
        _getSelectParameters: function(oColumns) {
            return oColumns.reduce(function(sSelect, oColumn) {
                if (!!oColumn.STDRD) {
                    sSelect = sSelect ? [sSelect, oColumn.COLUMN].join() : oColumn.COLUMN;
                }
                return sSelect;
            }, "");
        },
        /**
         * Bind data to table viewer's table. Consider $select, $filter and $orderby
         * @param {object} oMainViewModel - Config model instance
         * @param {object} oDataModel - Data model instance
         * @private
         */
        _bindTable: function(oMainViewModel, oDataModel) {
            oMainViewModel = oMainViewModel || this.getModel("mainView");
            oDataModel = oDataModel || this.getModel("data");
            var sPath = "data>/" + oMainViewModel.getProperty("/ENTITY_NAME"),
            oViewModel = this._oTableViewModel,
            iOriginalBusyDelay = this._iOriginalBusyDelay,
            oTable = this._oTable,
            // get Column properties
            aColumns = tablesUtilities._getServiceToColumnData(this),
            sSelectColumn = this._getSelectParameters(aColumns),
            // get Aggregated columns
            aAggregateColumns = this._getAggregateColumns(aColumns),
            // get $orderBy if value is in $select string
            aSortedItems = oMainViewModel.getProperty("/sorters") || this._getDefaultSortColumns(aColumns,sSelectColumn),
            aFinalSorters = tablesUtilities._getSortersForVisibleColumns(oTable, sSelectColumn, aSortedItems);
            oMainViewModel.setProperty("/sorters", aSortedItems);
            // For InputParameters Functionality & Master-Detail
			oTable.clearSelection();
            oTable.bindRows({
                path: sPath,
                sorter: aFinalSorters,
                filters: oMainViewModel.getProperty("/filters"),
                parameters: {
                    operationMode: "Server",
                    select: sSelectColumn
                },
                events: {
                    dataRequested: function() {
                        oViewModel.setProperty("/delay", 0);
                        oViewModel.setProperty("/busy", true);
                    },
                    dataReceived: function(oEvent) {
                        /**
                         * @ControllerHook Adaptation of Table view
                         * This method is called after the table data has been loaded to be shown on the table view
                         * @callback com.siemens.tableViewer.controller.Table~extHookOnTableDataReceived
                         * @param {object} oEvent Event data
                         * @return {void}
                         */
                        if (this.extHookOnTableDataReceived){
                            this.extHookOnTableDataReceived(oEvent);
                        }
                        oViewModel.setProperty("/busy", false);
                        oViewModel.setProperty("/delay", iOriginalBusyDelay);
                    }.bind(this),
                    change: function() {
                        oViewModel.setProperty("/rowCount", this.iLength);
                    }
                }
            });
            this._bindAggregatedColumns(sSelectColumn, oMainViewModel.getProperty("/filters"), oTable, oDataModel, oMainViewModel.getProperty("/ENTITY_NAME"), aAggregateColumns);
        },

        /**
         * Create requests for each visible aggregated column
         * @param {string} sVisibleColumns - Visible Columns
         * @param {array}  aFilters - Filters for requests
         * @param {object} oTable - Table reference
         * @param {object} oModel - Odata model of table
         * @param {string} sPath - Entity set name
         * @param {array}  aAggregatedColumns - Aggregated column array
         * @return {void}
         * @private
         */
        _bindAggregatedColumns: function(sVisibleColumns, aFilters, oTable, oModel, sPath, aAggregatedColumns) {
            aAggregatedColumns.filter(function(oAggregatedItem) {
                return sVisibleColumns.search(oAggregatedItem["column"]) !== -1;
            }).forEach(function(oAggregatedItem) {
                models.requestData(
                    oModel,
                    sPath,
                    oAggregatedItem["column"],
                    this._handleRequestSuccess.bind.apply(this._handleRequestSuccess, [this].concat([oTable, oAggregatedItem])),
                    this._handleRequestError.bind(this),
                    false,
                    aFilters.length > 0 && aFilters);
            }.bind(this));
        },

        /**
         * Get single aggregate column reference
         * @param {string} sColumn - Column name
         * @param {Array} aColumns - All columns from table
         * @returns {sap.ui.table.Column} - Single aggregated column
         * @private
         */
        _getAggregateColumn: function(sColumn, aColumns) {
            return aColumns.filter(function(oColumn) {
                return oColumn.getSortProperty() === sColumn;
            })[0];
        },

        /**
         * Get default sorting columns
         * @param {array} aColumns - Array of Visible Columns
         * @param {string} sSelectColumn - String of selected columns
         * @return {array} - Sorter array of columns
         * @private
         */
        _getDefaultSortColumns:function(aColumns,sSelectColumn){
            return aColumns.filter(function(oColumn) {
                return oColumn.COLUMN_SORTED && sSelectColumn.indexOf(oColumn.COLUMN) > -1;
            }).map(function(sortItem) {
                return new Sorter(sortItem.COLUMN, this._isDescending(sortItem.COLUMN_SORTING));
            }.bind(this));
        },

        /**
         * Success handler after oData response
         * @param {sap.ui.table.Table} oTable - Table reference
         * @param {object} oAggregatedItem - Aggregated column properties
         * @param {object} oData - Response data
         * @return {void}
         * @private
         */
        _handleRequestSuccess: function(oTable, oAggregatedItem, oData) {
            var sColumn = oAggregatedItem["column"],
            oColumn = this._getAggregateColumn(sColumn, oTable.getAggregation("columns")),
            oLabel = oColumn.getAggregation("label"),
            sText = oAggregatedItem["label"];
            if (oData.results[0][sColumn]) {
                var iSum = oData.results[0][sColumn];
                sText = sText.split("\n")[0];
                sText += "\n [" + formatter.formatDataBasedOnColumnType(7, iSum) + "]";
            }
            oLabel.setText(sText);
            oTable.rerender();
        },
        /**
         * Error handler after odata response
         * @param {object} oError - Error data
         * @return {void}
         * @private
         */
        _handleRequestError: function(oError) {
            jQuery.sap.log.error(oError,"com.siemens.tableViewer.Table._bindAggregatedColumns");
        },
        /**
         * Executed when service configuration details such as Columns has been recieved
         * @param {object} oData - respond from ODataModel read statement
         * @private
         */
        _fnColumnDataLoaded: function(oData) {
            var oMainViewModel = this.getView().getModel("mainView"),
            aVisibleColumns = oMainViewModel.getProperty("/visibleColumns"),
            oColumnModel = new JSONModel(oData);
            this.getView().setModel(oColumnModel, "columnModel");
            //before binding the column model to table, hide all static filters from the model.
            this._hideStaticColumns();
            tablesUtilities._setVisibleColumns(this,aVisibleColumns);
            this._oTable.bindElement({
                path: "columnModel>/"
            });
        },

        /**
         * Table Column Aggregation Factory method. Aggregation binding is used to automatically create child controls according to model data.
         * It's called when table recieves column binding.
         * @param {sap.ui.core.ID} sId - Control instance id
         * @param {sap.ui.model.Context} oContext - context object refrence
         * @returns {sap.ui.table.Column} - Column instance
         * @private
         */
        _columnFactory: function(sId, oContext) {
            return new Column(sId, {
                visible: "{ path: 'columnModel>STDRD', type: 'com.siemens.tableViewer.model.types.hanaBoolean'}",
                label: this._createColumnLabel(oContext),
                template: this._getRowTemplate(oContext),
                sortProperty: "tolower({columnModel>COLUMN})",
                sorted: "{columnModel>COLUMN_SORTED}",
                sortOrder: "{path: 'columnModel>COLUMN_SORTING', type: 'com.siemens.tableViewer.model.types.columnSorter'}",
                autoResizable: true,
                hAlign: "{= ${columnModel>IS_KFG} === 1 ? 'Right' : 'Left'}",
                width: "{columnModel>CWIDTH}",
                tooltip: "{columnModel>DESCRIPTION}"
            }).data("CELL_COLOR", "{columnModel>" + oContext + "/COLOR_CODE}").
            data("CELL_COLOR_FORMAT", "{= ${columnModel>" + oContext + "/CFORMAT} === 1 ? true : false}"). //custom data added to columns for flagging cell format flag and color code flag;
            data("STATIC_COLUMN", "{= ${columnModel>" + oContext + "/FILTERTYPE} === 'StaticSingleSelect' || ${columnModel>" + oContext + "/FILTERTYPE} === 'StaticMultiSelect' || ${columnModel>" + oContext + "/FILTERTYPE} === 'StaticMultiValueHelp' ? true : false}");//custom data for static column flag
        },

        /**
         * Creates Table Column Label
         * @returns {sap.m.Label} - Text instance
         * @private
         */
        _createColumnLabel: function() {
            return new Text({
                text: "{columnModel>LABEL}",
                textAlign: {
                    path: "columnModel>IS_KFG",
                    formatter: formatter.alignColumnLabel
                }
            });
        },
        /**
         * Creates Row Template
         * @param {sap.ui.model.Context} oContext - Context object instance
         * @returns {sap.m.Label} - Label instance
         * @private
         */
        _getRowTemplate: function(oContext) {
            if (oContext.getProperty("IS_LINK") === 1) {
                //check for CFORMAT to add cell format required custom data for cell color formatting
                if (oContext.getProperty("CFORMAT") === 1) {
                    return this._getTemplateForCellFormatEnabled("link", oContext);
                } else {
                    return new Link({
                        text: {
                            path: "data>" + oContext.getProperty("COLUMN"),
                            type: formatter.getDataTypeInstance(oContext.getProperty("CTYPE")),
                            formatter: jQuery.proxy(this.formatCellsBackground) //formatter function for apply cell color formatting
                        },
                        press: jQuery.proxy(this.onLinkPressTableCell, this)
                    });
                }
            } else {
                if (oContext.getProperty("CFORMAT") === 1) {
                    return this._getTemplateForCellFormatEnabled("label", oContext);
                } else {
                    return new Label({
                        design: "{= ${columnModel>" + oContext + "/IS_KFG} === 1 ? 'Bold' : 'Standard'}",
                        text: {
                            path: "data>" + oContext.getProperty("COLUMN"),
                            type: formatter.getDataTypeInstance(oContext.getProperty("CTYPE"))
                        }
                    });
                }
            }
        },

        /**
         * Method to return the control type for the column template when IS_LINK and CFORMAT is enabled for Table Popup drilldown and cell config
         * @param {String} sControlType - type of control expected.
         * @param {Object} oContext - Model binding context
         * @returns {Object} oControl - sap.m.Link or sap.m.Label
         * @private
         */
        _getTemplateForCellFormatEnabled: function(sControlType, oContext) {
            var oControl, aConditions, sColors, i, aCustomDatas;
            aConditions = coloring.getCellConditions(oContext.getProperty("CFORMAT_CONDITION") ? oContext.getProperty("CFORMAT_CONDITION") : "");
            //get colors for cell formatting
            sColors = oContext.getProperty("CFORMAT_COLOR") ? oContext.getProperty("CFORMAT_COLOR") : "";
            //get custom data by using colors and conditions. custom data for cells used for applying cell colors
            aCustomDatas = coloring.getCellCustomData(aConditions, sColors);
            if (sControlType === "link") {
                oControl = new Link({
                    text: {
                        path: "data>" + oContext.getProperty("COLUMN"),
                        type: formatter.getDataTypeInstance(oContext.getProperty("CTYPE")),
                        formatter: jQuery.proxy(this.formatCellsBackground) //formatter function for apply cell color formatting
                    },
                    press: jQuery.proxy(this.onLinkPressTableCell, this)
                });
            } else {
                oControl = new Label({
                    design: "{= ${columnModel>" + oContext + "/IS_KFG} === 1 ? 'Bold' : 'Standard'}",
                    text: {
                        path: "data>" + oContext.getProperty("COLUMN"),
                        type: formatter.getDataTypeInstance(oContext.getProperty("CTYPE")),
                        formatter: jQuery.proxy(this.formatCellsBackground) //formatter function for apply cell color formatting
                    }
                });
            }
            //add custom data to the controls. No of conditions and colors equals number of custom data.
            for (i = 0; i < aCustomDatas.length; i++) {
                oControl.addCustomData(aCustomDatas[i]);
            }

            return oControl;
        },
        /**
         * Formatter for table cells to apply colors to cells based on custom data conditions
         * @param {String} sValue - cell text value
         * @returns {string} sValue - cell text value
         * @public
         */
        formatCellsBackground: function(sValue) {
            var aData = this.getCustomData();
            if (sValue && sValue !== "") {
                coloring.applyCellFormatConditions(aData, sValue, this.getId());
            } else {
                coloring.setCellBackgroundColor(this.getId(), "");
            }
            return sValue;
        },
		/**
		 * Function to check if application is loaded in dependent mode and set filters accordingly
		 * @private
		 */
		_fnCheckDependent: function(){
            var bDependent = this.getOwnerComponent()._getUriParams("dependent"),
            bInitial = bDependent !== "true";
            if (bDependent) {
				bInitial = bDependent !== "true";
				this._onWhenDependentFiltersApplied = tablesUtilities._createInitialFilters(bInitial, this);
			}
				this.getModel("tableView").setProperty("/busy", false);
		},
		/**
		 * Method to bind dependent report filters to table after promise is ready
		 * @param {Array} aFilters - array of filters from variant
		 * @private
		 */
		_setDependentFilters : function (aFilters) {
            var bDependent = this.getOwnerComponent()._getUriParams("dependent");
            if (bDependent === "true"){
                aFilters = aFilters.length > 0 || aFilters instanceof sap.ui.model.Filter ? aFilters : undefined;
                this.getModel("mainView").setProperty("/filters", aFilters);
			}
            this.getOwnerComponent()._onWhenFiltersApplied.then(this._bindTable(this.getModel("mainView")));
        },
        /**
         * Method to store the filter object after getting filter data for filter bar
         * @param {String} sChannel - channel name
         * @param {String} sEvent - event name
         * @param {Object} oData - filter object
         * @private
         */
		_storeFilterData: function(sChannel, sEvent, oData) {
			this._filterObject = oData;
		}
    });
});