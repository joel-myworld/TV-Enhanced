sap.ui.define([
    "sap/ui/table/Column"
], function(Column) {
    "use strict";

    return Column.extend("com.siemens.tableViewer.control.ExtendedColumn", {
        metadata: {
            properties: {
                supportHidden: {
                    type: "boolean",
                    defaultValue: true
                }
            }
        }
    });
});