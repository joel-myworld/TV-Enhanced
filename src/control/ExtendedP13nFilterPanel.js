/*!
 * Copyright 2017 Siemens AG
 */
sap.ui.define([
    "sap/m/P13nFilterPanel",
    "com/siemens/tableViewer/control/ExtendedP13nConditionPanel"
], function(P13nFilterPanel, P13nConditionPanel) {
    "use strict";

    return P13nFilterPanel.extend("com.siemens.tableViewer.control.ExtendedP13nFilterPanel", {
        metadata: {
            properties: {
                columnName: "string",
                entitySet: "string",
                columnType: "float"
            }
        },

        /**
         * Overwritten standard function
         * @private
         * @override
         */
        _updatePanel: function() {
            var iMaxIncludes = this.getMaxIncludes() === "-1" ? 1000 : parseInt(this.getMaxIncludes(), 10);
            var iMaxExcludes = this.getMaxExcludes() === "-1" ? 1000 : parseInt(this.getMaxExcludes(), 10);

            // Siemens changes
            this._oIncludeFilterPanel.setColumnName(this.getColumnName());
            this._oIncludeFilterPanel.setEntitySet(this.getEntitySet());
            this._oIncludeFilterPanel.setColumnType(this.getColumnType());

            this._oExcludeFilterPanel.setColumnName(this.getColumnName());
            this._oExcludeFilterPanel.setEntitySet(this.getEntitySet());
            this._oExcludeFilterPanel.setColumnType(this.getColumnType());
            // End of changes

            if (iMaxIncludes > 0) {
                if (iMaxExcludes <= 0) {
                    // in case we do not show the exclude panel remove the include panel header text and add an extra top margin
                    this._oIncludePanel.setHeaderText(null);
                    this._oIncludePanel.setExpandable(false);
                    this._oIncludePanel.addStyleClass("panelTopMargin");
                }
            }

            if (iMaxExcludes === 0) {
                this._oExcludePanel.setHeaderText(null);
                this._oExcludePanel.setExpandable(false);
            }

        },

        /**
         * Overwritten standard function
         * Initialize the control
         * @private
         * @override
         */
        init: function() {
            sap.ui.getCore().loadLibrary("sap.ui.layout");
            jQuery.sap.require("sap.ui.layout.Grid");

            sap.ui.layout.Grid.prototype.init.apply(this);

            this._aKeyFields = [];
            this.addStyleClass("sapMFilterPanel");

            // init some resources
            this._oRb = sap.ui.getCore().getLibraryResourceBundle("sap.m");

            if (!this._aIncludeOperations) {
                this.setIncludeOperations([
                    sap.m.P13nConditionOperation.Contains, sap.m.P13nConditionOperation.EQ, sap.m.P13nConditionOperation.BT, sap.m.P13nConditionOperation.StartsWith, sap.m.P13nConditionOperation.EndsWith, sap.m.P13nConditionOperation.LT, sap.m.P13nConditionOperation.LE, sap.m.P13nConditionOperation.GT, sap.m.P13nConditionOperation.GE
                ]);
            }

            if (!this._aExcludeOperations) {
                this.setExcludeOperations([
                    sap.m.P13nConditionOperation.EQ
                ]);
            }

            this._oIncludePanel = new sap.m.Panel({
                expanded: true,
                expandable: true,
                headerText: this._oRb.getText("FILTERPANEL_INCLUDES"),
                width: "auto"
            }).addStyleClass("sapMFilterPadding");

            this._oIncludeFilterPanel = new P13nConditionPanel({
                maxConditions: this.getMaxIncludes(),
                autoAddNewRow: true,
                alwaysShowAddIcon: false,
                layoutMode: this.getLayoutMode(),
                dataChange: this._handleDataChange()
            });
            this._oIncludeFilterPanel.setOperations(this._aIncludeOperations);
            this._oIncludeFilterPanel.setOperations([
                sap.m.P13nConditionOperation.Contains, sap.m.P13nConditionOperation.EQ, sap.m.P13nConditionOperation.BT, sap.m.P13nConditionOperation.StartsWith, sap.m.P13nConditionOperation.EndsWith, sap.m.P13nConditionOperation.LT, sap.m.P13nConditionOperation.LE, sap.m.P13nConditionOperation.GT, sap.m.P13nConditionOperation.GE
            ], "string");
            this._oIncludeFilterPanel.setOperations([
                sap.m.P13nConditionOperation.EQ, sap.m.P13nConditionOperation.BT, sap.m.P13nConditionOperation.LT, sap.m.P13nConditionOperation.LE, sap.m.P13nConditionOperation.GT, sap.m.P13nConditionOperation.GE
            ], "date");
            this._oIncludeFilterPanel.setOperations([
                sap.m.P13nConditionOperation.EQ, sap.m.P13nConditionOperation.BT, sap.m.P13nConditionOperation.LT, sap.m.P13nConditionOperation.LE, sap.m.P13nConditionOperation.GT, sap.m.P13nConditionOperation.GE
            ], "numeric");

            this._oIncludePanel.addContent(this._oIncludeFilterPanel);

            this.addAggregation("content", this._oIncludePanel);

            this._oExcludePanel = new sap.m.Panel({
                expanded: false,
                expandable: true,
                headerText: this._oRb.getText("FILTERPANEL_EXCLUDES"),
                width: "auto"
            }).addStyleClass("sapMFilterPadding");

            this._oExcludeFilterPanel = new P13nConditionPanel({
                exclude: true,
                maxConditions: this.getMaxExcludes(),
                autoAddNewRow: true,
                alwaysShowAddIcon: false,
                layoutMode: this.getLayoutMode(),
                dataChange: this._handleDataChange()
            });
            this._oExcludeFilterPanel.setOperations(this._aExcludeOperations);

            this._oExcludePanel.addContent(this._oExcludeFilterPanel);

            this.addAggregation("content", this._oExcludePanel);

            this._updatePanel();
        },

        renderer: {}
    });
});
