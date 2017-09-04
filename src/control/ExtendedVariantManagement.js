sap.ui.define([
    "sap/ui/comp/variants/VariantManagement",
    "sap/ui/core/ValueState",
    "sap/ui/comp/variants/EditableVariantItem",
    "sap/ui/comp/variants/VariantItem"
], function(VariantManagement, ValueState, EditableVariantItem, VariantItem) {
    "use strict";
    return VariantManagement.extend("com.siemens.tableViewer.control.ExtendedVariantManagement", {
        renderer: {},
        exit: function() {
            VariantManagement.prototype.exit.apply(this, arguments);
            // Add missing VariantManagement objects which is not destroyed
            if (this.oActionSheet) {
                this.oActionSheet.destroy();
                this.oActionSheet = undefined;
            }
            if (this.oExecuteOnSelect) {
                this.oExecuteOnSelect.destroy();
                this.oExecuteOnSelect = undefined;
            }
            if (this.oVariantManage) {
                this.oVariantManage.destroy();
                this.oVariantManage = undefined;
            }
        },

        init: function() {
            VariantManagement.prototype.init.apply(this, arguments);

            /* begin changes */
            var that = this;
            // Detach old liveChange function
            this.oInputName.detachLiveChange(this.oInputName.mEventRegistry.liveChange[0].fFunction);
            // Attach new live change function to Input Field in Save Dialog
            this.oInputName.attachLiveChange(function() {
                that._checkVariantNameConstraints(this, that.oSaveSave);
            });
            // Attach event before dialog open to enable/disable save button based on Input Field Value
            this.oSaveDialog.attachBeforeOpen(function() {
                var sValue = this.oInputName ? this.oInputName.getValue() : "";
                this.oSaveSave.setEnabled(!this._isDuplicate(this.oInputName, sValue));
            }.bind(this));
            /* end changes */
        },

        /**
         * Overwritten standard function to handle duplicates Variant names
         * @override
         */
        _openVariantManagementDialog: function() {
            var oItem;
            var oItems = null;
            var iItemNo = 0;
            var oManageItem;
            var oNameCell;
            var oTypeCell;
            var oDefaultCell;
            var oExecuteCell;
            var oDeleteCell;
            var sTypeText;
            var sTooltip;
            var fLiveChange;
            var fChange;
            var fSelectRB;
            var fSelectCB;
            var fPress;
            var that = this;
            this.oManagementTable.destroyItems();
            fLiveChange = function() {
                /* begin changes */
                that._checkVariantNameConstraints(this, that.oManagementSave, that.oManagementTable);
                /* end changes */
            };
            fChange = function() {
                var oEvent = that._createEvent("inputfieldChange", that._checkManageItemNameChange);
                oEvent.args.push(this.getParent());
                that._addEvent(oEvent);
            };
            fSelectRB = function(oControlEvent) {
                if (oControlEvent.getParameters().selected === true) {
                    var oItem = this.getParent();
                    that.sNewDefaultKey = oItem.getKey();
                }
            };
            fSelectCB = function() {
                var oEvent = that._createEvent("executeOnSelectionChange", that._handleManageExecuteOnSelectionChanged);
                oEvent.args.push(this);
                that._addEvent(oEvent);
            };
            fPress = function() {
                var oEvent = that._createEvent("manageDeletePressed", that._handleManageDeletePressed);
                oEvent.args.push(this);
                that._addEvent(oEvent);
            };
            this._initalizeManagementTableColumns();
            this.sNewDefaultKey = this.getDefaultVariantKey();
            if (this.oVariantList.getItems()[0].getKey() !== this.STANDARDVARIANTKEY && this.bVariantItemMode == false) {
                oItem = new VariantItem(this.oVariantManage.getId() + "-item-standard", {
                    key: this.STANDARDVARIANTKEY,
                    text: this.oResourceBundle.getText("VARIANT_MANAGEMENT_DEFAULT"),
                    readOnly: true,
                    executeOnSelection: false
                });
                this.oVariantList.insertItem(oItem, 0);
            }
            oItems = this.oVariantList.getItems();
            for (var iH = 0; iH < oItems.length; iH++) {
                if (oItems[iH].getReadOnly() || oItems[iH].getLabelReadOnly()) {
                    var sOptions = oItems[iH].getAccessOptions();
                    sTooltip = this._accessOptionsText(sOptions);
                } else {
                    sTooltip = null;
                }
                if (oItems[iH].getReadOnly()) {
                    sTooltip = this.oResourceBundle.getText("VARIANT_MANAGEMENT_WRONG_LAYER");
                } else if (oItems[iH].getLabelReadOnly() === true) {
                    sTooltip = this.oResourceBundle.getText("VARIANT_MANAGEMENT_WRONG_LANGUAGE");
                }
                if (oItems[iH].getKey() === this.STANDARDVARIANTKEY) {
                    sTooltip = null;
                }
                oManageItem = new EditableVariantItem(this.oVariantManage.getId() + "-edit-" + iItemNo, {
                    key: oItems[iH].getKey(),
                    global: oItems[iH].getGlobal(),
                    lifecyclePackage: oItems[iH].getLifecyclePackage(),
                    lifecycleTransportId: oItems[iH].getLifecycleTransportId(),
                    namespace: oItems[iH].getNamespace(),
                    labelReadOnly: oItems[iH].getLabelReadOnly(),
                    vAlign: sap.ui.core.VerticalAlign.Middle
                });
                if (oItems[iH].getKey() === this.STANDARDVARIANTKEY || oItems[iH].getReadOnly() === true || oItems[iH].getLabelReadOnly() === true) {
                    oNameCell = new sap.m.Text(this.oVariantManage.getId() + "-text-" + iItemNo, {
                        text: oItems[iH].getText()
                    });
                    oNameCell.addStyleClass("sapUICompVarMngmtLbl");
                    if (sTooltip) {
                        oNameCell.setTooltip(sTooltip);
                    }
                } else {
                    oNameCell = new sap.m.Input(this.oVariantManage.getId() + "-input-" + iItemNo, {
                        value: oItems[iH].getText(),
                        liveChange: fLiveChange,
                        change: fChange
                    });
                }
                oManageItem.addCell(oNameCell);
                if (oItems[iH].getGlobal()) {
                    sTypeText = this.oResourceBundle.getText("VARIANT_MANAGEMENT_SHARED");
                } else {
                    sTypeText = this.oResourceBundle.getText("VARIANT_MANAGEMENT_PRIVATE");
                }
                oTypeCell = new sap.m.Text(this.oVariantManage.getId() + "-type-" + iItemNo, {
                    text: sTypeText
                });
                oTypeCell.addStyleClass("sapUICompVarMngmtType");
                oManageItem.addCell(oTypeCell);
                oDefaultCell = new sap.m.RadioButton(this.oVariantManage.getId() + "-def-" + iItemNo, {
                    groupName: this.oVariantManage.getId(),
                    select: fSelectRB
                });
                if (this.sNewDefaultKey === oItems[iH].getKey() || oItems[iH].getKey() === this.STANDARDVARIANTKEY && this.sNewDefaultKey === "") {
                    oDefaultCell.setSelected(true);
                }
                oManageItem.addCell(oDefaultCell);
                if (this.getShowExecuteOnSelection()) {
                    oExecuteCell = new sap.m.CheckBox(this.oVariantManage.getId() + "-exe-" + iItemNo, {
                        selected: false,
                        enabled: false,
                        select: fSelectCB
                    });
                    if (oItems[iH].getExecuteOnSelection) {
                        oExecuteCell.setEnabled(!oItems[iH].getReadOnly());
                        oExecuteCell.setSelected(oItems[iH].getExecuteOnSelection());
                        if (sTooltip) {
                            oExecuteCell.setTooltip(sTooltip);
                        }
                    }
                    oManageItem.addCell(oExecuteCell);
                }
                oDeleteCell = new sap.m.Button(this.oVariantManage.getId() + "-del-" + iItemNo, {
                    icon: "sap-icon://sys-cancel",
                    enabled: true,
                    type: sap.m.ButtonType.Transparent,
                    press: fPress,
                    tooltip: this.oResourceBundle.getText("VARIANT_MANAGEMENT_DELETE")
                });
                if (oManageItem.getKey() === this.STANDARDVARIANTKEY || (oItems[iH].getReadOnly && oItems[iH].getReadOnly())) {
                    oDeleteCell.setEnabled(false);
                }
                oDeleteCell.addStyleClass("sapUiCompVarMngmtDel");
                oManageItem.addCell(oDeleteCell);
                this.oManagementTable.addItem(oManageItem);
                iItemNo++;
            }
            this.aRemovedVariants = [];
            this.aRemovedVariantTransports = [];
            this.aRenamedVariants = [];
            this.aExeVariants = [];
            this._setDialogCompactStyle(this, this.oManagementDialog);
            oItem = this.oVariantList.getSelectedItem();
            if (oItem) {
                this.lastSelectedVariantKey = oItem.getKey();
            }
            this.oVariantPopOver.close();
            this.oManagementDialog.open();
        },

        /* =========================================================== */
        /* Standard functions from new SAPUI5 libraries                */
        /* Copied from 1.42.7 version                                  */
        /* =========================================================== */

        _isDuplicate: function(oInputField, sValue, oManagementTable) {
            if (oManagementTable) {
                return this._isDuplicateManaged(oInputField, sValue, oManagementTable);
            } else {
                return this._isDuplicateSaveAs(sValue);
            }
        },

        _isDuplicateManaged: function(oInputField, sValue, oManagementTable) {
            var oItems, oInput, i;

            if (oManagementTable) { //
                oItems = oManagementTable.getItems();
                if (oItems) {
                    for (i = 0; i < oItems.length; i++) {
                        oInput = oItems[i].getCells()[0];

                        if (oInput === oInputField) {
                            continue;
                        }

                        if (oInput) {
                            if (oInput.getValue && (sValue === oInput.getValue().trim())) {
                                return true;
                            } else if (oInput.getText && (sValue === oInput.getText().trim())) {
                                return true;
                            }
                        }
                    }
                }
            }

            return false;
        },

        _isDuplicateSaveAs: function(sValue) {
            var sTrimName = sValue.trim();
            if (!sTrimName) {
                return true;
            }

            var sText = this._determineStandardVariantName();
            if (sText === sTrimName) {
                return true;
            }

            var oItems = this._getItems();
            for (var iCount = 0; iCount < oItems.length; iCount++) {
                sText = oItems[iCount].getText().trim();
                if (sText === sTrimName) {
                    return true;
                }
            }

            return false;
        },

        _determineStandardVariantName: function() {
            var sText = this.oResourceBundle.getText("VARIANT_MANAGEMENT_STANDARD");

            if (this.bVariantItemMode === false) {
                sText = this.oResourceBundle.getText("VARIANT_MANAGEMENT_DEFAULT");
            }

            if (this.getDefaultVariantKey() === this.STANDARDVARIANTKEY) {
                if (this.getStandardItemText() !== null && this.getStandardItemText() != "") {
                    sText = this.getStandardItemText();
                }
            }

            return sText;
        },

        _checkVariantNameConstraints: function(oInputField, oSaveButton, oManagementTable) {
            if (!oInputField) {
                return;
            }

            var sValue = oInputField.getValue().trim();
            if (sValue === "") {
                oInputField.setValueState(ValueState.Error);
                oInputField.setValueStateText(this.oResourceBundle.getText("VARIANT_MANAGEMENT_ERROR_EMPTY"));
            } else {
                oInputField.setValueState(ValueState.None);
                oInputField.setValueStateText(null);
            }

            if (oSaveButton) {

                if (oInputField.getValueState() !== ValueState.Error) {
                    this._checkIsDuplicate(oInputField, sValue, oManagementTable);
                }

                if (oInputField.getValueState() === ValueState.Error) {
                    oSaveButton.setEnabled(false);
                } else {
                    oSaveButton.setEnabled(true);
                }
            }
        },

        _checkIsDuplicate: function(oInputField, sValue, oManagementTable) {
            var bFlag = this._isDuplicate(oInputField, sValue, oManagementTable);

            if (bFlag) {
                oInputField.setValueState(ValueState.Error);
                oInputField.setValueStateText(this.oResourceBundle.getText("VARIANT_MANAGEMENT_ERROR_DUPLICATE"));
            } else {
                oInputField.setValueState(ValueState.None);
                oInputField.setValueStateText(null);
            }

            return bFlag;
        }
    });
});