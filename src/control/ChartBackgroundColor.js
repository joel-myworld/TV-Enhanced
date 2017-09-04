sap.ui.define([
        "sap/ui/core/Element"
    ],
    function(Element) {
        "use strict";
        return Element.extend("com.siemens.tableViewer.control.ChartBackgroundColor", {
            metadata : {
                properties: {
                    "color": {type: "string", defaultValue: ""}
                }
            }
        });
    }
);
