sap.ui.define([
    "sap/m/TablePersoDialog",
    "sap/m/InputListItem"
], function(TablePersoDialog, InputListItem) {
    "use strict";

    return TablePersoDialog.extend("com.siemens.tableViewer.control.ExtendedTablePersoDialog", {
        init: function() {
            TablePersoDialog.prototype.init.apply(this, arguments);

            var that = this;

            this._fnUpdateCheckBoxes = jQuery.proxy(function(oEvent) {
                var bSelected = oEvent.getParameter('selected'),
                    oData = this._oP13nModel.getData();
                if (oEvent.getSource().getId() === this._getSelectAllCheckboxId()) {
                    // 'Select All' checkbox has been changed
                    oData.aColumns.forEach(function(oColumn) {
                        if (oColumn.supportHidden) {
                            oColumn.visible = bSelected;
                        }
                    });
                } else {
                    // One of the list checkboxes has been modified
                    // Update the state of the 'Select All' checkbox
                    var bSelectAll = !oData.aColumns.some(function(oColumn) {
                        return !oColumn.visible;
                    });

                    oData.aHeader.visible = bSelectAll;
                }
                // Call setData to trigger update of bound controls
                this._oP13nModel.setData(oData);
            }, this);

            // Template for list inside the dialog - 1 item per column
            this._oColumnItemTemplate = new InputListItem({
                label: "{Personalization>text}",
                content: new sap.m.CheckBox({
                    enabled: '{Personalization>supportHidden}',
                    selected: "{Personalization>visible}",
                    select: this._fnUpdateCheckBoxes
                })
            }).addStyleClass("sapMPersoDialogLI");

            this._oList.detachSelectionChange(this._fnUpdateArrowButtons);

            this._fnUpdateArrowButtons = function() {
                // Initialisation of the enabled property
                var bButtonDownEnabled = true,
                    bButtonUpEnabled = true,
                    sValue = that._oSearchField.getValue(),
                    iItemCount = that._oList.getItems().length;
                if (!!sValue || that._oList.getSelectedItems().length === 0) {
                    // Disable buttons if search filters the list or if list is empty
                    bButtonUpEnabled = false;
                    bButtonDownEnabled = false;
                } else {
                    // Data available (1 or more items)
                    if (that._oList.getItems()[0].getSelected()) {
                        // Disable "arrow top" and "arrow bottom" buttons
                        bButtonDownEnabled = false;
                        bButtonUpEnabled = false;
                        jQuery.sap.focus(that._oButtonDown.getDomRef());
                    }
                    if (that._oList.getItems()[1].getSelected()) {
                        // Second item selected: disable button "arrow top" and focus button "arrow bottom"
                        bButtonUpEnabled = false;
                        jQuery.sap.focus(that._oButtonDown.getDomRef());
                    }
                    if (that._oList.getItems()[iItemCount - 1].getSelected()) {
                        // Last item selected: disable button "arrow bottom" and focus button "arrow top"
                        bButtonDownEnabled = false;
                        jQuery.sap.focus(that._oButtonUp.getDomRef());
                    }
                }

                that._oButtonUp.setEnabled(bButtonUpEnabled);
                that._oButtonDown.setEnabled(bButtonDownEnabled);
            };

            this._oList.attachSelectionChange(this._fnUpdateArrowButtons, this);
        }
    });
});