sap.ui.define([
        "sap/ui/core/Element"
    ],
    function(Element) {
        "use strict";
        return Element.extend("com.siemens.tableViewer.control.ChartBorderColorData", {
            metadata : {
                properties: {
                    "color": {type: "string", defaultValue: ""}
                }
            }
        });
    }
);
