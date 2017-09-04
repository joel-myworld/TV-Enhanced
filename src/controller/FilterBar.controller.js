/*!
 * Copyright 2017 Siemens AG
 */
sap.ui.define([
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/ui/comp/filterbar/FilterItem",
    "./filterTypeMapping",
    "./generateFilters",
    "sap/ui/comp/valuehelpdialog/ValueHelpDialog",
    "sap/m/Token",
    "./HierarchyFilters",
    "com/siemens/tableViewer/model/formatter"
], function(BaseController, JSONModel, FilterItem, filterTypeMapping, generateFilters, ValueHelpDialog, Token, hierarchyFilters, formatter) {
    "use strict";

    /**
     * Constructor for Filter Bar Controller
     *
     * @class
     * This is an controller class for Filter View.
     * @abstract
     *
     * @extends com.siemens.tableViewer.controller.BaseController
     *
     * @constructor
     * @public
     * @alias com.siemens.tableViewer.controller.FilterBar
     */
    return BaseController.extend("com.siemens.tableViewer.controller.FilterBar", {
        _oFilterBar: null,
        _iOriginalBusyDelay: null,
        _oFilterViewModel: null,
        _aFilterBarStringFieldNames: [],
        _aFilterBarTimeFieldNames: [],
        _aFilterBarStringDates: [],
        _aFilterBarStringShortDates: [],

        filterTypeMapping: filterTypeMapping,

        /* =========================================================== */
        /* lifecycle methods                                           */
        /* =========================================================== */

        /**
         * Called when the Filter Bar view is instantiated. It sets up the event handling and other lifecycle tasks.
         * @public
         */
        onInit: function() {
            var oEventBus = this.getEventBus();
            oEventBus.subscribe("FilterBar", "FillFilterBar", this._fillFilterBar, this);
            oEventBus.subscribe("FilterBar", "FetchVariant", this._getVariantData, this);
            oEventBus.subscribe("FilterBar", "ApplyVariant", this._setVariantData, this);
            oEventBus.subscribe("FilterBar", "SetBusyState", this._setBusyState, this);
            oEventBus.subscribe("FilterBar", "GetFilterData", this._getFilterData, this);

            this._oFilterBar = this.getView().byId("filterBar");
            this._iOriginalBusyDelay = this._oFilterBar.getBusyIndicatorDelay();

            // Insert Layout for Variant Management into FiterBar Toolbar
            var oLayout = new sap.ui.layout.HorizontalLayout("idVariantMngtPanel", {}).addStyleClass("sapUiNoMarginBegin");
            this._oFilterBar._oToolbar.insertContent(oLayout, 1);

            // create filter view model, repsonsible for busy dialogs
            this._oFilterViewModel = this.createViewModel();
            this.getView().setModel(this._oFilterViewModel, "filterBarView");

            this._oFilterBar.attachFilterChange(this._attachFilterChange, this);

            // register Filter Bar functions
            this._oFilterBar.registerFetchData(this._fetchData);
            this._oFilterBar.registerApplyData(this._applyData);
            this._oFilterBar.attachAfterVariantLoad(function() {
                if (this.getOwnerComponent()._onWhenFiltersApplied.state() === "pending") {
                    this.resolveOnWhenFilterAppliedPromise(this);
                } else {
                    this._applyFilters();
                }

            }.bind(this));
            this._oFilterBar.registerGetFiltersWithValues(this._getFiltersWithValues);

            // should be executed when data detail promise has been resolved;
            this.getOwnerComponent()._onWhenConfigModelDataIsLoaded.then(this._fnFilterDataLoaded.bind(this));
        },

        /**
         * Called when the Filter Bar controller is going to be destroyed.
         * @public
         */
        onExit: function() {
            var oEventBus = this.getEventBus();
            oEventBus.unsubscribe("FilterBar", "FillFilterBar", this._fillFilterBar, this);
            oEventBus.unsubscribe("FilterBar", "FetchVariant", this._getVariantData, this);
            oEventBus.unsubscribe("FilterBar", "ApplyVariant", this._setVariantData, this);
            oEventBus.unsubscribe("FilterBar", "SetBusyState", this._setBusyState, this);
            oEventBus.unsubscribe("FilterBar", "GetFilterData", this._getFilterData, this);
        },

        /* =========================================================== */
        /* event handlers                                              */
        /* =========================================================== */

        /**
         * On Filter Bar Go button pressed
         * @param {sap.ui.base.Event} oEvent - on Button Clicked
         * @return {void}
         * @public
         */
        onSearch: function(oEvent) {
            var oFilterBar = oEvent.getSource();
            if (oFilterBar._oFilterDialog) {
                oFilterBar._oFilterDialog.attachEventOnce("afterClose", function() {
                    oFilterBar.fireFilterChange();
                });
            }else {
                oFilterBar.fireFilterChange();
            }
        },

        /**
         * On Filter Bar Clear button pressed
         * @return {void}
         * @public
         */
        onClear: function() {
            var oFilterBar = this._oFilterBar,
            oViewModel = this.getModel("mainView"),
            oMainConfig = this.getOwnerComponent()._cachedConfigData;

            oViewModel.setProperty("/bFilterValueFireChanges", false);

            this._clearFilterItems(oFilterBar);
            //also reset hierarchy filter models
            hierarchyFilters._resetHierarchyFilterModel(oMainConfig, this);
            oViewModel.setProperty("/bFilterValueFireChanges", true);
            oFilterBar.fireFilterChange();
        },
        /**
		 * Event handler for on toggle event of tree table nodes. On close or open event of nodes in tree table.
		 * @param {sap.ui.base.Event} oEvent - toggle event in tree table
		 * @public
		 */
        onHierarchyDialogToogleState: function(oEvent) {
            hierarchyFilters.onToggleState(oEvent);
		},
		/**
		 * Event handler for Ok press event in the hierarchy dialog
		 * @param {sap.ui.base.Event} oEvent - Ok press event in hierarchy dialog
		 * @public
		 */
		onHierarchyDialogOk: function (oEvent) {
			hierarchyFilters.onConfirmHierarchyFilter(oEvent);
		},
		/**
		 * Event handler for Cancel press event in the hierarchy dialog
		 * @param {sap.ui.base.Event} oEvent - Cancel press event in hierarchy dialog
		 * @public
		 */
		onHierarchyDialogCancel: function (oEvent) {
			hierarchyFilters.onCancelHierarchyFilter(oEvent);
		},
		/**
		 * Event handler for change of selection of checkboxes in hierarchy filter dialog
		 * @param {sap.ui.base.Event} oEvent - checkbox change event in tree table in filter dialog
		 * @public
		 */
		onChangeTriStateCheckBoxes: function (oEvent) {
			hierarchyFilters.onChangeCheckBox(oEvent);
		},
		/**
		 * On before open event handler for Hierarchy filter dialog. Before open of hierarchy dialog apply the dependent filters to the tree table
		 * @param {sap.ui.base.Event} oEvent - on before open event
		 * @public
		 */
		onBeforeHierarchyDialogOpen: function (oEvent) {
			hierarchyFilters.onBeforeHierarchy(oEvent);
		},
        /* =========================================================== */
        /* begin: internal methods                                     */
        /* =========================================================== */
        /**
         * Fill filters property from the filterbar controls
         * @private
         */
        _getFilterData: function() {
			var oEventBus = this.getEventBus(),
			oFilterBar = this.byId("filterBar"),
			aFetchData = this._fetchData.bind(oFilterBar)(),
			aMainFilters = this._generateFilters(aFetchData);
			aMainFilters = aMainFilters.aFilters ? aMainFilters : undefined;

			this.getModel("mainView").setProperty("/filters", aMainFilters);

			oEventBus.publish("com.tableViewer", "ReturnFilterData", aMainFilters);
		},
        /**
         * Clear all filterItems controls
         * @param {sap.ui.comp.filterbar.FilterBar} oFilterBar - Filter bar instance
         * @return {void}
         * @private
         */
        _clearFilterItems: function(oFilterBar) {
            var oItems = oFilterBar.getAllFilterItems(true),
            oControl;

            jQuery.each(oItems, function(iIndex, oItem) {
                oControl = oFilterBar.determineControlByFilterItem(oItem);

                // DatePicker && DateRangeSelection controls
                if (oControl.setDateValue) {
                    oControl.setDateValue();
                    if (oControl.setSecondDateValue) {
                        oControl.setSecondDateValue();
                    }
                }
                // ComboBox controls
                if (oControl.setSelectedKey) {
                    oControl.setSelectedKey();
                }
                // MultiComboBox controls
                if (oControl.setSelectedKeys) {
                    oControl.setSelectedKeys();
                }
                if (oControl.setValue) {
                    oControl.setValue();
                }
                // MultiInput controls
                if (oControl.removeAllTokens) {
                    oControl.removeAllTokens();
                }
            });
        },

        /**
         * Attach to filter change event
         * @param {sap.ui.base.Event} oEvent - on any filter changes
         * @return {void}
         * @private
         */
        _attachFilterChange: function(oEvent) {
            var oFilterBar = oEvent.getSource(),
            oEventBus = this.getEventBus();

            // Set Variant Modified and apply filters only after dialog closed
            if (!(oFilterBar._oFilterDialog && oFilterBar._oFilterDialog.isOpen())) {
                if (this._applyFilters()) {
                    oEventBus.publish("VariantManagement", "SetVariantModified");
                }
            }
        },

        /**
         * Apply filter parameter to mainView model and publish Event
         * @return {boolean} - if filters doesn't changed return false
         * @private
         */
        _applyFilters: function() {
            var oViewModel = this.getModel("mainView"),
                oEventBus = this.getEventBus(),
                sTab,
                aFilters = this._retrieveFilterInstance(this._oFilterBar);
                aFilters = this._addApplicationFilters(aFilters);
            var bEqual = !jQuery.sap.equal(oViewModel.getProperty("/filters"), aFilters),
                bSort  = !oViewModel.getProperty("/sorters"),
                bStandard = this._oFilterBar.bStandardVariant;
            if (bEqual || bStandard || bSort) {
                oViewModel.setProperty("/filters", aFilters);
                sTab = this.getModel("mainView").getProperty("/selectedKey");
                if  (sTab === "Chart"){
                    oEventBus.publish("com.tableViewer", "filtersUpdatedFromChart");
                }else if ( sTab === "Mix" ){
                    oEventBus.publish("com.tableViewer", "filtersUpdatedFromChart");
                    oEventBus.publish("com.tableViewer", "filtersUpdated");
                }else {
                    oEventBus.publish("com.tableViewer", "filtersUpdated");
                }
            }
            return bEqual;
        },

        /**
         * Return filter instance based on Filter Bar Values
         * @param {sap.ui.comp.filterbar.FilterBar} oFilterBar - Filter bar instance
         * @return {Array} - Array of {@link sap.ui.model.Filter}
         * @private
         */
        _retrieveFilterInstance: function(oFilterBar) {
            var aFetchData = this._fetchData.bind(oFilterBar)();
            return this._generateFilters(aFetchData);
        },

        /**
         * Generate Filter instance base on received data object
         * @param {object} oData - Tech Data Names with values
         * @return {Array} - Array of {@link sap.ui.model.Filter}
         * @private
         */
        _generateFilters: function(oData) {
            return generateFilters.generateFilters(Object.keys(oData), oData, {
                dateSettings: {
                    UTC: true
                },
                stringFields: this._aFilterBarStringFieldNames,
                useContainsAsDefault: true,
                stringDates: this._aFilterBarStringDates,
                stringShortDates: this._aFilterBarStringShortDates
            });
        },

        /**
         * Publish Filter Bar data to VariantManagement
         * @return {void}
         * @private
         */
        _getVariantData: function() {
            var oVariant = this._oFilterBar.fetchVariant(),
            oEventBus = this.getEventBus();
            oEventBus.publish("VariantManagement", "FetchVariant", oVariant);
        },

        /**
         * Apply variant data from selected variant
         * @param {string} sChannel - Channel name
         * @param {string} sEvent - Event name
         * @param {object|string} oData - string if selected "Standard" Variant
         * @return {void}
         * @private
         */
        _setVariantData: function(sChannel, sEvent, oData) {
            if (typeof oData === "string") {
                oData = {
                    filterBarVariant: {
                        "*standard*": oData
                    }
                };
                oData.filterbar = this._createStandardVariant();
                this._oFilterBar.bStandardVariant = true;
            }else {
                this._oFilterBar.bStandardVariant = false;
            }
            this._oFilterBar.applyVariant(oData);
        },

        /**
         * Restore Initially loaded properties
         * @return {Array} aTransition - FilterBar controls visibility properties
         * @private
         */
        _createStandardVariant: function() {
            var oFilterModel = this.getModel("filterModel"),
            aFilterProperties = oFilterModel.getProperty("/ServiceToColumnConfig/results");

            return aFilterProperties.reduce(function(aTransition, oFilterProperty) {
                if (oFilterProperty.FILTER) {
                    aTransition.push({
                        group: "__$INTERNAL$",
                        name: oFilterProperty.COLUMN,
                        partOfCurrentVariant: true,
                        visibleInFilterBar: oFilterProperty.ONFILTERBAR === 1
                    });
                }
                return aTransition;
            }, []);
        },

        /**
         * Count in which controls applied filter data
         * @return {Array/Boolen} - controls were data applied
         * @private
         */
        _getFiltersWithValues: function() {
            var oControl,
            aFilters = this.getAllFilterItems(true),
            aFiltersWithValue,
            bAppliedFilterParams;

            aFiltersWithValue = jQuery.grep(aFilters, function(oItem) {
                bAppliedFilterParams = false;
                oControl = this.determineControlByFilterItem(oItem);
                // MultiInput && Input controls
                if (oControl.getValue && oControl.getValue()) {
                    bAppliedFilterParams = true;
                }
                // MultiInput controls
                if (oControl.getTokens && oControl.getTokens().length > 0) {
                    bAppliedFilterParams = true;
                }
                // ComboBox controls
                if (oControl.getSelectedKey && oControl.getSelectedKey()) {
                    bAppliedFilterParams = true;
                }
                // MultiComboBox controls
                if (oControl.getSelectedKeys && oControl.getSelectedKeys().length > 0) {
                    bAppliedFilterParams = true;
                }
                // DatePicker && DateRangeSelection controls
                if (oControl.getDateValue && oControl.getDateValue()) {
                    bAppliedFilterParams = true;
                }
                return bAppliedFilterParams;
            }.bind(this));
            return aFiltersWithValue;
        },

        /**
         * Collect data from FilterBar controls
         * @return {Object} oTransition - TechNames with data
         * @private
         */
        _fetchData: function() {
            var oItems = this.getAllFilterItems(true),
            mParams,
            sName,
            oControl,
            oController = this.getParent().getController(),
            oMainConfig = oController.getOwnerComponent()._cachedConfigData;
            var fnGetTokens = function(oControl, mParams) {
                var aTokens = oControl.getTokens(),
                aPathsHierarchy,
                aDistinctPaths;
                if (oControl.data("type") && oControl.data("type") === "Hierarchy" && oMainConfig.getProperty("/ODATA_SRV") && oMainConfig.getProperty("/IS_HIERARCHY")) {
                    aPathsHierarchy = [];
                    jQuery.each(aTokens, function(iIndex, oToken) {
                        var sPath = oToken.data("path") ? oToken.data("path") : oToken.getText();
                        aPathsHierarchy.push(sPath);
                    });
                    aDistinctPaths = oController._getDistinctPathsForHierarchy(aPathsHierarchy);
                    jQuery.each(aDistinctPaths, function(iIndex, sPath) {
                            mParams.items.push({
                                 key: "Hierarchy",
                                 text: sPath
                             });
                    });
                }else {
                    jQuery.each(aTokens, function(iIndex, oToken) {
                        if (oToken.data("range")) {
                            mParams.ranges.push(oToken.data("range"));
                        } else if (oToken.data("UserEntry")){
                            mParams.items.push({
                                key: oToken.getKey(),
                                text: oToken.getKey()
                            });
                        } else {
                            if (oToken.data("row")) {
                                mParams.items.push({
                                    key: oToken.data("row")[sName],
                                    text: oToken.getText()
                                });
                            }else {
                                mParams.items.push({
                                    key: oToken.getText(),
                                    text: oToken.getText()
                                });
                            }
                        }
                    });
                }
                if (oControl.getValue()) {
                    mParams.value = oControl.getValue();
                }
            };

            return oItems.reduce(function(oTransition, oItem) {
                sName = oItem.getName();
                mParams = {};
                oControl = this.determineControlByFilterItem(oItem);

                if (oControl) {
                    if (oControl.getModel(sName)) { // Static Controls
                        var oObject;
                        mParams.items = [];
                        mParams.ranges = [];
                        if (oControl.getSelectedKeys && oControl.getSelectedKeys().length > 0) {
                            mParams.ranges = oControl.getSelectedItems().map(function(oItem) {
                                oObject = oItem.getBindingContext(sName).getObject();
                                return {
                                    text: oObject.Value,
                                    exclude: false,
                                    keyField: oObject.Column,
                                    operation: oObject.Operator,
                                    value1: oObject.Option1,
                                    value2: oObject.Option2
                                };
                            });
                            sName = oObject.Column;
                        } else if (oControl.getSelectedKey && oControl.getSelectedKey()) {
                            oObject = oControl.getSelectedItem().getBindingContext(sName).getObject();
                            mParams.ranges.push({
                                text: oObject.Value,
                                exclude: false,
                                keyField: oObject.Column,
                                operation: oObject.Operator,
                                value1: oObject.Option1,
                                value2: oObject.Option2
                            });
                            sName = oObject.Column;
                        } else if (oControl.getTokens && oControl.getTokens().length > 0) {
                            fnGetTokens(oControl, mParams);
                        }
                    } else {
                        if (oControl.getDateValue) { // DatePicker && DateRangeSelection
                            mParams.low = oControl.getDateValue();
                            if (oControl.getSecondDateValue) {
                                mParams.high = oControl.getSecondDateValue();
                            }
                        } else {
                            mParams.items = [];
                            mParams.value;
                            if (oControl.getTokens && oControl.getTokens().length > 0) {
                                mParams.ranges = [];
                                fnGetTokens(oControl, mParams);
                            } else if (oControl.getSelectedKeys) {
                                mParams.items = oControl.getSelectedKeys();
                            } else if (oControl.getSelectedKey) {
                                mParams.value = oControl.getSelectedKey();
                            } else {
                                mParams.value = oControl.getValue();
                            }
                        }
                    }
                }

                oTransition[sName] = mParams;
                return oTransition;
            }.bind(this), {});
        },
        /**
         * Method to get the distinct or unique path names of the selected leaf from hierarchy table
         * @param {Array} aPathsHierarchy - Array of hierarchy paths
         * @returns {Array} aPaths - Distinct values of paths
         * @private
         */
        _getDistinctPathsForHierarchy : function (aPathsHierarchy) {
            var aPaths = [],
            iLevels,
            aLevelNames,
            iLastPath;
            jQuery.each(aPathsHierarchy, function(iIndex, sPath) {
                if (sPath.indexOf("]/[") > -1) { //split the path from selected leaf [xx]/[xx].[yy] where yy is the leaf and xx is the node
                    iLevels = sPath.split("]/[").length - 1;
                    aLevelNames = sPath.split("]/[")[iLevels].split("].[");
                    iLastPath = aLevelNames[aLevelNames.length - 1].length;
                    aLevelNames[aLevelNames.length - 1] = aLevelNames[aLevelNames.length - 1].substr(0,iLastPath - 1);
                }else if (sPath.indexOf("/") > -1) {//split the path from selected leaf xx/yy where yy is the leaf and xx is the node
                    iLevels = sPath.split("/").length - 1;
                    aLevelNames = sPath.split("/");
                }else {
                    aLevelNames = aPathsHierarchy;
                }
                for (var i = 0; i < aLevelNames.length; i++) {
                    aPaths.push( aLevelNames[i]);
                }
            });
            aPaths = jQuery.unique(aPaths);
            return aPaths;
        },
        /**
         * @param {object|string} oData - TechNames with data or Standard Variant Name
         * @return {void}
         * @private
         */
        _applyData: function(oData) {
            var oController = this.getParent().getController(),
            oViewModel = this.getModel("mainView"),
            bStandard = oData["*standard*"] === "*standard*",
            oControl;
            if (!bStandard) {
                oViewModel.setProperty("/filters", oController._generateFilters(oData));
            }
            oViewModel.setProperty("/bFilterValueFireChanges", false);
            oController._clearFilterItems(this);

            /**
			 * @ControllerHook Adaptation of FilterBar view
			 * This method is called after the filter bar data has been loaded to be shown on the filter view
			 * @callback com.siemens.tableViewer.controller~extHookOnFilterDataReceived
			 * @param {object} oData data response
			 * @return {void}
			 */
            if (oController.extHookOnFilterDataReceived){
                oController.extHookOnFilterDataReceived(oData);
            }

            if (!bStandard) {
                var fnSetTokens = function(oControl, oValue, sName) {
                    var aTokens = [];
                    if (oValue.hasOwnProperty("ranges")) {
                        aTokens = oValue.ranges.map(function(oRange) {
                            return new Token({
                                text: ValueHelpDialog.prototype._getFormatedRangeTokenText(oRange.operation, oRange.value1, oRange.value2, oRange.exclude, oRange.keyField)
                            }).data("range", oRange);
                        });
                    }

                    aTokens = oValue.items.reduce(function(oTransition, oItem) {
                        var oCustomData = {};
                        oCustomData[sName] = oItem.key;
                        oTransition.push(new Token({
                            key: oItem.key,
                            text: oItem.text
                        }).data("row", oCustomData));

                        return oTransition;
                    }, aTokens);

                    if (aTokens.length > 0) {
                        oControl.setTokens(aTokens);
                    }

                    if (oValue.value) {
                        oControl.setValue(oValue.value);
                    }
                };
                jQuery.each(oData, function(sName, oValue) {
                    oControl = this.determineControlByName(sName);
                    if (oControl.getModel(sName)) {
                        if (oControl.setSelectedKey && oValue.ranges[0]) {
                            oControl.setSelectedKey(oValue.ranges[0].text);
                        } else if (oControl.setSelectedKeys && oValue.ranges[0]) {
                            oControl.setSelectedKeys(oValue.ranges.map(function(oItem) {
                                return oItem.text;
                            }));
                        } else if (oControl.setTokens) {
                            fnSetTokens(oControl, oValue, sName);
                        }
                    } else {
                        if (oValue.hasOwnProperty("low")) {
                            if (oValue.low) {
                                oControl.setDateValue(new Date(oValue.low));
                            }
                            if (oValue.high) {
                                oControl.setSecondDateValue(new Date(oValue.high));
                            }
                        } else if (oControl.setTokens) { // MultiInput field
                            fnSetTokens(oControl, oValue, sName);
                        } else if (oControl.setSelectedKeys && oValue.items.length > 0) { // MultiComboBox
                            oControl.setSelectedKeys(oValue.items);
                        } else if (oControl.setSelectedKey && oValue.value) { // ComboBox
                            oControl.setSelectedKey(oValue.value);
                        } else if (oValue.value) { // Input field
                            oControl.setValue(oValue.value);
                        }
                    }
                }.bind(this));
            }
            oViewModel.setProperty("/bFilterValueFireChanges", true);
        },

        /**
         * Executed when filter bar data has been received
         * @param {object} oData - respond from ODataModel read statement
         * @return {void}
         * @private
         */
        _fnFilterDataLoaded: function(oData) {
            if (oData.VARIANT_HIDDEN) {
                this._setViewBusyAndDelayProperties(false, this._iOriginalBusyDelay);
            }
            this.getView().setModel(new JSONModel(oData), "filterModel");
            this._bindView("filterModel>/");
        },

        /**
         * Set/Remove Busy State from FilterBar
         * @param {string} sChannel - Channel name
         * @param {string} sEvent - Event name
         * @param {object} oData - contains busy and delay properties
         * @return {void}
         * @private
         */
        _setBusyState: function(sChannel, sEvent, oData) {
            this._setViewBusyAndDelayProperties(oData.busy, oData.delay);
        },

        /**
         * Set/Remove busy state from filter view model
         * @param {boolean} bBusy - busy flag for filter bar true or false
         * @param {number} iDelay - delay value in milliseconds
         * @return {void}
         * @private
         */
        _setViewBusyAndDelayProperties: function(bBusy, iDelay) {
            this._oFilterViewModel.setProperty("/busy", bBusy);
            this._oFilterViewModel.setProperty("/delay", iDelay);
        },

        /**
         * Bind context to the view
         * @param {string} sPath - binding path
         * @return {void}
         * @private
         */
        _bindView: function(sPath) {
            this.getView().bindElement({
                path: sPath
            });
        },

        /**
         * Filter Item Factory function. Executed when aggregation is received
         * @param {string} sId - generated filterItem factory id
         * @param {sap.ui.model.Context} oContext - model context
         * @returns {sap.ui.comp.filterbar.FilterItem} Filter Item Control
         * @private
         */
        _filterItemFactory: function(sId, oContext) {
            var oUIControl = new FilterItem(sId, {
                label: "{path: 'filterModel>LABEL'}",
                visibleInFilterBar: "{ path: 'filterModel>ONFILTERBAR', type: 'com.siemens.tableViewer.model.types.hanaBoolean'}",
                name: oContext.getProperty("COLUMN"),
                control: this._createFilterControl(sId, oContext, this.getView())
            });

            this._createFilterBarAdditionalProperties(oContext);

            if (this.extHookFilterItemFactory) {
                this.extHookFilterItemFactory();
            }

            return oUIControl;
        },

        /**
         * Create Addition properties for generating filter parameters
         * @param {sap.ui.model.Context} oContext - model context
         * @return {void}
         * @private
         */
        _createFilterBarAdditionalProperties: function(oContext) {
            var sColumnType = oContext.getProperty("CTYPE"),
            sColumn = oContext.getProperty("COLUMN");
            if (sColumnType === 11) {
                this._aFilterBarStringFieldNames.push(sColumn);
            } else if (sColumnType === 15) {
                this._aFilterBarStringDates.push(sColumn);
            } else if (sColumnType === 17) {
                this._aFilterBarStringShortDates.push(sColumn);
            } else if (sColumnType === 22) {
                this._aFilterBarTimeFieldNames.push(sColumn);
            }
        },

        /**
         * Create Filter Control
         * @param {String} sId- generated filterItem factory id
         * @param {sap.ui.model.Context} oContext - model context
         * @return {sap.m.Control} oFilterControl - control based on context parameters
         * @private
         */
        _createFilterControl: function(sId, oContext) {
            var sFilterType = oContext.getProperty("FILTERTYPE"),
            sFilterControl = !this.filterTypeMapping[sFilterType] ? "Default" : sFilterType,
            oFilterControl = this.filterTypeMapping[sFilterControl].apply(this, arguments);
            return oFilterControl;
        },
        /**
         * Fill filter bar with values and tokens based on filter object
         * @param {String} sChannel - Channel name
         * @param {String} sEvent - Event name
         * @param {Object} oData - Filter values
         * @private
         */
        _fillFilterBar: function(sChannel, sEvent, oData) {
			if (oData.initial) {
				this._addFilterItemsValuesToFilterBar(oData.values);
				return;
			}

			var oFilterBar = this.byId("filterBar"),
				oColumnModelObject,
				aNewTokens,
				sProperty,
				oNewToken,
				oCustomData = {},
				oControl,
				 fnSetTokens = function(sValue) {
					oNewToken = new Token({
						key: oColumnModelObject.CTYPE === 20 || oColumnModelObject.CTYPE === 21 ? new Date(sValue) : sValue,
						text: formatter.formatDataBasedOnColumnType(oColumnModelObject.CTYPE, sValue)
					});
					oCustomData[sProperty] = sValue;
					oNewToken.data("row", oCustomData);
					aNewTokens.push(oNewToken);
                };
              jQuery.each(oData.values, function(sProperty, oValue) {
				oControl = oFilterBar.determineControlByName(sProperty);
				oColumnModelObject = this._retreiveColumnModelObject(sProperty)[0];
				 if (oControl.getModel(sProperty)) {
                     if (oControl.setSelectedKey && oValue.ranges[0]) {
                         oControl.setSelectedKey(oValue.ranges[0].text);
                     } else if (oControl.setSelectedKeys && oValue.ranges[0]) {
                         oControl.setSelectedKeys(oValue.ranges.map(function(oItem) {
                             return oItem.text;
                         }));
                     } else if (oControl.setTokens) {
                        aNewTokens = [];
                        jQuery.grep(oValue, fnSetTokens);
                        oControl.setTokens(aNewTokens);
                     }
                 } else {
                     if (oValue.hasOwnProperty("low")) {
                         if (oValue.low) {
                             oControl.setDateValue(new Date(oValue.low));
                         }
                         if (oValue.high) {
                             oControl.setSecondDateValue(new Date(oValue.high));
                         }
                     } else if (oControl.setTokens) { // MultiInput field
                        aNewTokens = [];
                        jQuery.grep(oValue, fnSetTokens);
                        oControl.setTokens(aNewTokens);
                     } else if (oControl.setSelectedKeys && oValue.items.length > 0) { // MultiComboBox
                         oControl.setSelectedKeys(oValue.items);
                     } else if (oControl.setSelectedKey && oValue.value) { // ComboBox
                         oControl.setSelectedKey(oValue.value);
                     } else if (oValue.value) { // Input field
                         oControl.setValue(oValue.value);
                     }
                 }
              }.bind(this));
		},
		/**
		 * Fill filter bar when the report to report is having Initial report as variant id
		 * @param {Array} aSavedFilters - Array of filters
		 * @private
		 */
		_addFilterItemsValuesToFilterBar: function(aSavedFilters) {
			var oFilterBar = this.byId("filterBar");

			jQuery.grep(aSavedFilters, function(oSavedFilter) {
				var oFilterControl = oFilterBar.determineControlByName(oSavedFilter.sFieldName),
                aValues,
                sSelectedKey,
                aNewTokens;
				if (oFilterControl !== null) {
					if (oSavedFilter.sClassName === "sap.m.MultiInput") {
						if (oSavedFilter.sValue) {
							oFilterControl.setValue(oSavedFilter.sValue);
						} else {
							aNewTokens = [];
							jQuery.grep(JSON.parse(oSavedFilter.aTokens), function(oToken) {
								var oNewToken = new Token({
									key: oToken.sKey,
									text: oToken.sText
								});
								oNewToken.data(oToken.sCustomDataKey, JSON.parse(oToken.sCustomData));
								aNewTokens.push(oNewToken);
							});
							oFilterControl.setTokens(aNewTokens);
						}
					} else if (oSavedFilter.sClassName === "sap.m.Input") {
						oFilterControl.setValue(oSavedFilter.sValue);
					} else if (oSavedFilter.sClassName === "sap.m.DatePicker") {
						oFilterControl.setDateValue(new Date(oSavedFilter.sValue));
					} else if (oSavedFilter.sClassName === "sap.m.DateRangeSelection") {
						aValues = JSON.parse(oSavedFilter.aValues);
						oFilterControl.setDateValue(new Date(aValues[0]));
						// check if second date exist
						if (aValues[1]) {
							oFilterControl.setSecondDateValue(new Date(aValues[1]));
						}
					} else if (oSavedFilter.sClassName === "sap.m.MultiComboBox") {
						aValues = JSON.parse(oSavedFilter.aValues);
						oFilterControl.setSelectedKeys(aValues);
					} else if (oSavedFilter.sClassName === "sap.m.ComboBox") { //set the values for combobox control if it is part of filters
						sSelectedKey = oSavedFilter.sValue;
						oFilterControl.setSelectedKey(sSelectedKey);
					}
				}
			});
		},
		/**
		 * Retrieves column object by selected key
		 * @param {String} sKey - COLUMN Name
		 * @returns {Object} oObject - Column object
		 * @private
		 */
		_retreiveColumnModelObject: function(sKey) {
			var oMainConfig = this.getOwnerComponent()._cachedConfigData;
			return jQuery.grep(oMainConfig.getProperty("/ServiceToColumnConfig/results"), function(oObject) {
				return oObject.COLUMN === sKey;
			});
		},

        /**
		 * Function to add any application filters that are received through extension point
		 * @param {array} - array of original filters that are available in the application
		 * @return {array} - array of filters with Application filters, if any, added
		 * @private
		 */
        _addApplicationFilters:function(aFilters){
            var aAppFilters = this.getModel("mainView").getProperty("/applicationFilters");
            if (aAppFilters && aAppFilters.length >= 1) {
				if (this.checkFilters(aFilters)) {
					for (var iFilter in aAppFilters) {
						aFilters.push(aAppFilters[iFilter]);
					}
				}
			}
			return aFilters;
        }
        /* =========================================================== */
        /* end: internal methods                                       */
        /* =========================================================== */
    });
});