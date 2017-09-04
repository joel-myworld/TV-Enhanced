/*!
 * Copyright 2017 Siemens AG
 */
sap.ui.define([
    "./ValueHelpDialog",
    "sap/ui/core/Item",
    "sap/ui/model/Sorter",
    "com/siemens/tableViewer/model/formatter",
    "com/siemens/tableViewer/model/models",
    "./HierarchyFilters"
], function(ValueHelpDialog, Item, Sorter, formatter, models, hierarchyFilters) {
    "use strict";

    return {
        formatter: formatter,

        /**
         * If no FILTERTYPE defined, by default will be created MultiInputControl
         * @param {String} sId - generated ID by filterFactory
         * @param {sap.ui.model.Context} oContext - bound factory context
         * @param {sap.ui.core.mvc.XMLView} oView - Filter Bar View instance
         * @return {sap.m.MultiInput} - Default control
         * @public
         */
        Default: function(sId, oContext, oView) {
            return this.filterTypeMapping._createMultiInput(sId, oContext, oView);
        },

        /**
         * Create DatePicker UI5 control
         * @param {String} sId - generated ID by filterFactory
         * @param {sap.ui.model.Context} oContext - bound factory context
         * @param {sap.ui.core.mvc.XMLView} oView - Filter Bar View instance
         * @return {sap.m.DatePicker} - DatePicker control
         * @public
         */
        DatePicker: function(sId, oContext, oView) {
            jQuery.sap.require("sap.m.DatePicker");

            return new sap.m.DatePicker({
                valueFormat: "dd.MM.yyyy",
                displayFormat: "dd.MM.yyyy",
                change: function() {
                    if (this.data("bFilterValueFireChanges")) {
                        oView.byId("filterBar").fireFilterChange(this);
                    }
                }
            }).bindElement("filterModel>" + oContext.getPath()).
            data("bFilterValueFireChanges", "{mainView>/bFilterValueFireChanges}");
        },

        /**
         * Create DateRangeSelection UI5 control
         * @param {String} sId - generated ID by filterFactory
         * @param {sap.ui.model.Context} oContext - bound factory context
         * @param {sap.ui.core.mvc.XMLView} oView - Filter Bar View instance
         * @return {sap.m.DateRangeSelection} - DateRangeSelection control
         * @public
         */
        DateRangeSelection: function(sId, oContext, oView) {
            jQuery.sap.require("sap.m.DateRangeSelection");

            return new sap.m.DateRangeSelection({
                delimiter: "-",
                valueFormat: "dd.MM.yyyy",
                displayFormat: "dd.MM.yyyy",
                change: function() {
                    if (this.data("bFilterValueFireChanges")) {
                        oView.byId("filterBar").fireFilterChange(this);
                    }
                }
            }).bindElement("filterModel>" + oContext.getPath()).
            data("bFilterValueFireChanges", "{mainView>/bFilterValueFireChanges}");
        },

        /**
         * Create MultiComboBox UI5 control
         * @param {String} sId - generated ID by filterFactory
         * @param {sap.ui.model.Context} oContext - bound factory context
         * @param {sap.ui.core.mvc.XMLView} oView - Filter Bar View instance
         * @return {sap.m.MultiComboBox} - MultiComboBox control
         * @public
         */
        MultiComboBox: function(sId, oContext, oView) {
            jQuery.sap.require("sap.m.MultiComboBox");

            var sColumn = oContext.getProperty("COLUMN"),
            sPath = "data>/" + oView.getModel("mainView").getProperty("/ENTITY_NAME");

            return new sap.m.MultiComboBox({
                items: {
                    path: sPath,
                    parameters: {
                        select: sColumn
                    },
                    template: new Item({
                        key: "{data>" + sColumn + "}",
                        text: "{data>" + sColumn + "}"
                    })
                },
                selectionFinish: function() {
                    if (this.data("bFilterValueFireChanges")) {
                        oView.byId("filterBar").fireFilterChange(this);
                    }
                }
            }).bindElement("filterModel>" + oContext.getPath()).
            data("bFilterValueFireChanges", "{mainView>/bFilterValueFireChanges}");
        },

        /**
         * Create ComboBox UI5 control
         * @param {String} sId - generated ID by filterFactory
         * @param {sap.ui.model.Context} oContext - bound factory context
         * @param {sap.ui.core.mvc.XMLView} oView - Filter Bar View instance
         * @return {sap.m.ComboBox} - ComboBox control
         * @public
         */
        ComboBox: function(sId, oContext, oView) {
            jQuery.sap.require("sap.m.ComboBox");

            var sPath = "data>/" + oView.getModel("mainView").getProperty("/ENTITY_NAME"),
            sColumn = oContext.getProperty("COLUMN");

            return new sap.m.ComboBox({
                items: {
                    path: sPath,
                    templateShareable: false,
                    parameters: {
                        select: sColumn
                    },
                    template: new Item({
                        key: "{data>" + sColumn + "}",
                        text: "{data>" + sColumn + "}"
                    })
                },
                selectionChange: function() {
                    if (this.data("bFilterValueFireChanges")) {
                        oView.byId("filterBar").fireFilterChange(this);
                    }
                }
            }).bindElement("filterModel>" + oContext.getPath()).
            data("bFilterValueFireChanges", "{mainView>/bFilterValueFireChanges}");
        },

        /**
         * Create Input UI5 control
         * @param {String} sId - generated ID by filterFactory
         * @param {sap.ui.model.Context} oContext - bound factory context
         * @param {sap.ui.core.mvc.XMLView} oView - Filter Bar View instance
         * @return {sap.m.Input} - Input control
         * @public
         */
        Input: function(sId, oContext, oView) {
            jQuery.sap.require("sap.m.Input");

            return new sap.m.Input({
                change: function() {
                    if (this.data("bFilterValueFireChanges")) {
                        oView.byId("filterBar").fireFilterChange(this);
                    }
                }
            }).bindElement("filterModel>" + oContext.getPath()).
            data("bFilterValueFireChanges", "{mainView>/bFilterValueFireChanges}");
        },

        /**
         * Create Input UI5 control
         * @param {String} sId - generated ID by filterFactory
         * @param {sap.ui.model.Context} oContext - bound factory context
         * @param {sap.ui.core.mvc.XMLView} oView - Filter Bar View instance
         * @return {sap.m.Input} - Input control with possibility to type only digits
         * @public
         */
        InputInteger: function(sId, oContext, oView) {
            jQuery.sap.require("sap.m.Input");

            return new sap.m.Input({
                type: "Number",
                change: function() {
                    if (this.data("bFilterValueFireChanges")) {
                        oView.byId("filterBar").fireFilterChange(this);
                    }
                }
            }).bindElement("filterModel>" + oContext.getPath()).
            data("bFilterValueFireChanges", "{mainView>/bFilterValueFireChanges}");
        },

        /**
         * Create MultiInput UI5 control with Static Data
         * @param {String} sId - generated ID by filterFactory
         * @param {sap.ui.model.Context} oContext - bound factory context
         * @param {sap.ui.core.mvc.XMLView} oView - Filter Bar View instance
         * @return {sap.m.MultiInput} - MultiInput control for Static Data
         * @public
         */
        StaticMultiValueHelp: function(sId, oContext, oView) {
            jQuery.sap.require("sap.m.MultiInput");

            var sTechName = oContext.getProperty("COLUMN"),
            sFilterPath = "staticFilters/" + oView.getController().getControllId() + "_" + sTechName + ".xsodata",
            sServiceUrl = oView.getModel("mainView").getProperty("/SERVICE_URL_ABSOLUTE") + sFilterPath;

            oView.setModel(models.createODataModelWithParameters(sServiceUrl), sTechName);

            return new sap.m.MultiInput({
                enableMultiLineMode: false,
                change: function() {
                    if (this.data("bFilterValueFireChanges")) {
                        oView.byId("filterBar").fireFilterChange(this);
                    }
                },
                tokenChange: function(oEvent) {
                    if (this.data("bFilterValueFireChanges")) {
                        if (oEvent.getParameter("type") === "tokensChanged") {
                            oView.byId("filterBar").fireFilterChange(this);
                        }
                    }
                },
                valueHelpRequest: this.filterTypeMapping._createStaticValueHelpDialog.bind({
                    oView: oView,
                    oContext: oContext
                })
            }).bindElement("filterModel>" + oContext.getPath()).
            data("bFilterValueFireChanges", "{mainView>/bFilterValueFireChanges}");
        },

        /**
         * Create MultiComboBox UI5 control with Static Data
         * @param {String} sId - generated ID by filterFactory
         * @param {sap.ui.model.Context} oContext - bound factory context
         * @param {sap.ui.core.mvc.XMLView} oView - Filter Bar View instance
         * @return {sap.m.MultiComboBox} - MultiComboBox control for Static Data
         * @public
         */
        StaticMultiSelect: function(sId, oContext, oView) {
            jQuery.sap.require("sap.m.MultiComboBox");

            var mControlParams = this.filterTypeMapping._createStaticConrolParameters(oContext, oView);
            mControlParams["selectionFinish"] = this.filterTypeMapping._fireFilterChange.bind(oView);

            return new sap.m.MultiComboBox(mControlParams).
            bindElement("filterModel>" + oContext.getPath()).
            data("bFilterValueFireChanges", "{mainView>/bFilterValueFireChanges}");
        },

        /**
         * Create ComboBox UI5 control with Static Data
         * @param {String} sId - generated ID by filterFactory
         * @param {sap.ui.model.Context} oContext - bound factory context
         * @param {sap.ui.core.mvc.XMLView} oView - Filter Bar View instance
         * @return {sap.m.ComboBox} - ComboBox control for Static Data
         * @public
         */
        StaticSingleSelect: function(sId, oContext, oView) {
            jQuery.sap.require("sap.m.ComboBox");

            var mControlParams = this.filterTypeMapping._createStaticConrolParameters(oContext, oView);
            mControlParams["selectionChange"] = this.filterTypeMapping._fireFilterChange.bind(oView);

            return new sap.m.ComboBox(mControlParams).
            bindElement("filterModel>" + oContext.getPath()).
            data("bFilterValueFireChanges", "{mainView>/bFilterValueFireChanges}");
        },
        /**
         * Create hierarchy dialog with tree table
         * @param {String} sId - generated ID by filterFactory
         * @param {sap.ui.model.Context} oContext - bound factory context
         * @return {sap.m.MultiInput} - MultiInput control for Hierarchy
         * @public
         */
        Hierarchy: function (sId, oContext) {
            jQuery.sap.require("sap.m.MultiInput");
            return new sap.m.MultiInput({
				showValueHelp: true,
				name: oContext.getProperty("COLUMN"),
				valueHelpRequest: hierarchyFilters._openHierarchyDialog.bind.apply(hierarchyFilters._openHierarchyDialog, [this].concat([this]))
			}).data("type", "Hierarchy");
        },

        /**
         * Return properties map for static controls
         * @param {sap.ui.model.Context} oContext - bound factory context
         * @param {sap.ui.core.mvc.XMLView} oView - Filter Bar View instance
         * @return {map} - common properties for Multi(ComboBox) controls
         * @private
         */
        _createStaticConrolParameters: function(oContext, oView) {
            var sTechName = oContext.getProperty("COLUMN"),
            sFilterPath = "staticFilters/" + oView.getController().getControllId() + "_" + sTechName + ".xsodata",
            sServiceUrl = oView.getModel("mainView").getProperty("/SERVICE_URL_ABSOLUTE") + sFilterPath;

            oView.setModel(models.createODataModelWithParameters(sServiceUrl), sTechName);

            var sPath = sTechName + ">/Data",
            sValue = "{" + sTechName + ">Value}",
            mControlParams;

            mControlParams = {
                name: sTechName,
                items: {
                    path: sPath,
                    sorter: new Sorter("Id"),
                    template: new Item({
                        key: sValue,
                        text: sValue
                    })
                }
            };
            return mControlParams;
        },

        /**
         * Create MultiInput UI5 control
         * @param {String} sId - generated ID by filterFactory
         * @param {sap.ui.model.Context} oContext - bound factory context
         * @param {sap.ui.core.mvc.XMLView} oView - Filter Bar View instance
         * @return {sap.m.MultiInput} - MultiInput control
         * @private
         */
        _createMultiInput: function(sId, oContext, oView) {
            jQuery.sap.require("sap.m.MultiInput");

            return new sap.m.MultiInput({
                enableMultiLineMode: false,
                showSuggestion: false,
                change: this.onChangeMultiputControl.bind.apply(this.onChangeMultiputControl, [this].concat([oContext, oView])),
                tokenChange: function(oEvent) {
                    if (this.data("bFilterValueFireChanges")) {
                        if (oEvent.getParameter("type") === "tokensChanged") {
                            oView.byId("filterBar").fireFilterChange(this);
                        }
                    }
                },
                valueHelpRequest: this._createValueHelpDialog.bind({
                    oView: oView,
                    oContext: oContext
                })
            }).bindElement("filterModel>" + oContext.getPath()).
            data("bFilterValueFireChanges", "{mainView>/bFilterValueFireChanges}");
        },
        /**
         * On change of MultiInput control event
         * @param {Object} oContext - Model context
         * @param {Object} oView - Instance of view
         * @param {sap.ui.base.Event} oEvent - Change event
         * @public
         */
        onChangeMultiputControl: function(oContext, oView, oEvent) {
            var sColumnType = oContext.getObject("CTYPE"),
            sColumn = oContext.getObject("COLUMN"),
            sValue = oEvent.getSource().getValue(),
            aTokens = [];
            oEvent.getSource().setValue("");
            if (oEvent.getSource().getTokens()) {
                for (var i = 0; i < oEvent.getSource().getTokens().length; i++) {
                    aTokens.push(oEvent.getSource().getTokens()[i]);
                }
            }
            if (formatter.getFormattedToken(sColumnType, sColumn, sValue)) {
                aTokens.push(formatter.getFormattedToken(sColumnType, sColumn, sValue));
            }
            oEvent.getSource().setTokens(aTokens);
            if (oEvent.getSource().data("bFilterValueFireChanges")) {
                if (oEvent.getParameter("type") === "tokensChanged") {
                    oView.byId("filterBar").fireFilterChange(this);
                }
            }
        },
        /**
         * Create Value Help Dialog for MultiInput Control and open it
         * @param {sap.ui.base.Event} oEvent - Value Help Dialog request
         * @return {void}
         * @private
         */
        _createValueHelpDialog: function(oEvent) {
            var oControl = oEvent.getSource(),
            oView = this.oView,
            sEntityName = oView.getModel("mainView").getProperty("/ENTITY_NAME"),
            oController = oView.getController(),
            oFilterData = oController._fetchData.apply(oView.byId("filterBar"));
            delete oFilterData[this.oContext.getProperty("COLUMN")];
            var oFilters = oController._generateFilters(oFilterData),
            oValueHelpDialog = new ValueHelpDialog(this.oContext, oControl, oView.getController().getResourceBundle(), sEntityName, oView.getModel("data"), oView.getModel("filterModel"), true, oFilters);

            oValueHelpDialog.attachOk(function(oEvent) {
                var iColumnType = this.getColumnType();
                var aTokens = oEvent.getParameter("tokens");

                oControl.setTokens(aTokens.map(function(oToken) {
                    //column type 17 requires reformatting of values when selected from define conditions tab
                    if (oToken.data("range") && iColumnType === 17) {
                        if (typeof oToken.data("range").value1 === "object") {
                            //reformat date to string
                            oToken.data("range").value1 = formatter.convertDatetoString(oToken.data("range").value1);
                         }
                    }
                    if (oToken.getKey().indexOf("range") > -1) {
                        return oToken;
                    }
                    return oToken.setText(formatter.formatDataBasedOnColumnType(iColumnType, oToken.getText()));
                }));

                this.close();
            });

            oValueHelpDialog.open();
        },

        /**
         * Create Value Help Dialog for Static MultiInput Control and open it
         * @param {sap.ui.base.Event} oEvent - Value Help Dialog request
         * @return {void}
         * @private
         */
        _createStaticValueHelpDialog: function(oEvent) {
            var oControl = oEvent.getSource(),
            oView = this.oView,
            oContext = this.oContext,
            oValueHelpDialog = new ValueHelpDialog(oContext, oControl, oView.getController().getResourceBundle(), "Data", oView.getModel(oContext.getProperty("COLUMN")), oView.getModel("filterModel"), true);

            oValueHelpDialog.attachOk(function(oEvent) {
                var iColumnType = this.getColumnType(),
                aTokens = oEvent.getParameter("tokens");

                oControl.setTokens(aTokens.map(function(oToken) {
                    if (oToken.getKey().indexOf("range") > -1) {
                        return oToken;
                    }
                    return oToken.setText(formatter.formatDataBasedOnColumnType(iColumnType, oToken.getText()));
                }));

                this.close();
            });

            oValueHelpDialog.open();
        },

        /**
         * Fire Filter change event
         * @param {sap.ui.base.Event} oEvent - on Change Event
         * @return {void}
         * @private
         */
        _fireFilterChange: function(oEvent) {
            if (oEvent.getSource().data("bFilterValueFireChanges")) {
                this.byId("filterBar").fireFilterChange();
            }
        }
    };
});