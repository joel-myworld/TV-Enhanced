/*!
 * Copyright 2017 Siemens AG
 */
sap.ui.define([
    "com/siemens/tableViewer/controller/BaseController",
    "sap/ui/core/routing/History"
], function(BaseController, History) {
    "use strict";

    return BaseController.extend("com.siemens.tableViewer.controller.NotFound", {
        /**
         * Override the parent's onNavBack (inherited from BaseController)
         * @return {void}
         * @public
         */
        onNavBack: function() {
            var oHistory = History.getInstance();
            var sPreviousHash = oHistory.getPreviousHash();

            if (sPreviousHash !== undefined) {
                // The history contains a previous entry
                history.go(-1);
            } else {
                if (sap.ushell) {
                    // Navigate back to FLP home
                    var oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");
                    oCrossAppNavigator.toExternal({
                        target: {
                            shellHash: "#"
                        }
                    });
                } else {
                    this.getRouter().navTo("tableviewer", {}, true /*no history*/ );
                }
            }
        }
    });
});