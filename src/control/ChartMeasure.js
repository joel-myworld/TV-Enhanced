sap.ui.define([
        "sap/ui/core/Element"
    ],
    function(Element) {
        "use strict";
        return Element.extend("com.siemens.tableViewer.control.ChartMeasure", {
            metadata : {
                properties: {
                    "column": {type: "string", defaultValue: null},
                    "label": {type: "string", defaultValue: null},
                    "ctype": {type: "float", defaultValue: 0},
                    "values": {type: "object", defaultValue: []}
                }
            }
        });
    }
);
