/* global Highcharts, Chart */
sap.ui.define([
    "sap/ui/core/Control",
    "com/siemens/tableViewer/model/formatter",
    "com/siemens/tableViewer/control/ChartDimension",
    "com/siemens/tableViewer/control/ChartMeasure",
    "com/siemens/tableViewer/control/ChartBackgroundColor",
    "com/siemens/tableViewer/control/ChartBorderColorData",
    "com/siemens/tableViewer/libs/Chart.min",
    "com/siemens/tableViewer/libs/highcharts/accounting.min",
    "com/siemens/tableViewer/libs/highcharts/highcharts",
    "com/siemens/tableViewer/libs/highcharts/no-data-to-display"
], function(Control, formatter) {
    "use strict";

    return Control.extend("com.siemens.tableViewer.control.Chart", {
        formatter: formatter,
        oChart: null,
        metadata: {
            properties: {
                width: {
                    type: "string",
                    defaultValue: null
                },
                height: {
                    type: "string",
                    defaultValue: null
                },
                type: {
                    type: "string",
                    defaultValue: "bar"
                },
                title: {
                    type: "string",
                    defaultValue: ""
                },
                nodata: {
                    type: "string",
                    defaultValue: ""
                },
                yaxisLabel: {
                    type: "string",
                    defaultValue: null
                },
                expanded: {
                    type: "boolean",
                    defaultValue: false
                }
            },

            aggregations: {
                dimensions: {
                    type: "com.siemens.tableViewer.control.ChartDimension",
                    multiple: true
                },
                measures: {
                    type: "com.siemens.tableViewer.control.ChartMeasure",
                    multiple: true
                },
                backgroundColorData: {
                    type: "com.siemens.tableViewer.control.ChartBackgroundColor",
                    multiple: true
                },
                borderColorData: {
                    type: "com.siemens.tableViewer.control.ChartBorderColorData",
                    multiple: true
                }
            },
            events: {}
        },

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */
        init: function() {
            sap.ui.Device.resize.attachHandler(function() {
                // Set chart container width to chart
                this.setWidth(jQuery.sap.byId(this.getParent().sId).width());
            }, this);
        },

        renderer: function(oRm, oControl) {
            var sWidth = oControl.getWidth();
            var sHeight = oControl.getHeight();
            oRm.write("<div");
            oRm.writeControlData(oControl);
            oRm.writeClasses();
            oRm.write(">");

            oRm.write("<canvas");
            // set user defined width
            if (sWidth !== "" || sWidth.toLowerCase() === "auto") {
                oRm.write(" width=\"" + sWidth + "\"");
            }

            // set user defined width
            if (sHeight !== "" || sHeight.toLowerCase() === "auto") {
                oRm.write(" height=\"" + sHeight + "\"");
            }

            oRm.write(">");
            oRm.write("</canvas></div>");

        },

        onAfterRendering: function() {
            var oChartContext = this.getDomRef().children[0].getContext("2d");

            // Check if Dimensions and Measures set
            if (this.getDimensions().length === 0 || this.getMeasures().length === 0) {
                this._setNoChartData(oChartContext);
                return null;
            }

            var sChartType = this.getType();
            this._iMeasures = 0;
            var aDimensions = this._getDimensions();
            var aDataset = this._getDataset(sChartType, aDimensions);

            //Get options based on chart types
            var $IconTab = this.getParent().getParent().getParent().getParent().getParent().getParent().getParent().$();
            var oOptions = this._getChartOptions(sChartType, aDimensions, aDataset, $IconTab);

            switch (sChartType) {
                case "stacked":
                    oOptions.plotOptions = this._getPlotOptions();
                    // falls through
                case "line_bar":
                case "combine":
                    oOptions.series = aDataset;
                    this.oChart = new Highcharts.Chart(this.sId, oOptions);
                    break;
                case "pie":
                case "radar":
                case "line":
                case "bar":
                    if (this.oChart && this.oChart.destroy) {
                        this.oChart.destroy();
                    }

                    oChartContext.canvas.height = this.getExpanded() ? $IconTab.height() - 32 - 34 - 16 : 250;
                    oChartContext.canvas.width = this.getExpanded() ? $IconTab.width() - 32 - 32 : this.getWidth();
                    this.oChart = new Chart(oChartContext, {
                        type: sChartType,
                        data: {
                            labels: aDimensions,
                            datasets: aDataset
                        },
                        options: oOptions
                    });
                    break;
                default:
                    break;
            }
            return this.oChart;
        },

        /**
         * Get Data set
         * @param {string} sChartType - Chart type {line, bar, pie ... }
         * @param {array} aDimensions - Dimensions values
         * @return {array} - Data set for different chart types
         * @private
         */
        _getDataset: function(sChartType, aDimensions) {
            var sChartId = this.sId.substring(14) + "Data";
            var sChartNumber = this.sId.substring(14);
            var aMeasureGroup = [];
            var aAverageData = [];
            var aTotalData = [];
            var iDataLength;

            var aColorScheme = this.getModel(sChartNumber).getProperty("/colorScheme");
            var aDataset = this.getMeasures().reduce(function(aTransition, oMeasure, iMeasureIndex) {
                var mDataset = {
                    backgroundColor: this.getBackgroundColorData()[iMeasureIndex].getColor() || "",
                    color: this.getBackgroundColorData()[iMeasureIndex].getColor() || "",
                    data: []
                };
                this._iMeasures++;

                mDataset.data = oMeasure.getValues().map(function(iValue) {
                    return (iValue * 1).toFixed(2) * 1;
                });

                //Get only first 20 entries
                if (location.hostname === "localhost") {
                    mDataset.data = mDataset.data.splice(mDataset.data.length - 20, mDataset.data.length);
                }

                switch (sChartType) {
                    case "pie":
                        mDataset.backgroundColor = this._getRandomColors(mDataset.data.length,aColorScheme);
                        // falls through
                    case "radar":
                    case "line":
                    case "bar":
                        mDataset.label = oMeasure.getLabel();
                        mDataset.borderWidth = 1;
                        break;
                    case "stacked":
                        mDataset.name = oMeasure.getLabel();
                        break;
                    case "line_bar":
                        mDataset.name = oMeasure.getLabel();
                        var sMeasureType = oMeasure.getBindingContext(sChartId).getProperty("CHARTTYPE");
                        var sMeasureGroup = oMeasure.getBindingContext(sChartId).getProperty("CHARTGROUP");
                        sMeasureType = (sMeasureType === "Column Chart") ? "column" : "spline";
                        sMeasureGroup = (sMeasureGroup && sMeasureGroup !== undefined && sMeasureGroup !== "") ? parseInt(sMeasureGroup.substring(0, 1), 10) : 0;
                        if (!this.includes(aMeasureGroup,sMeasureGroup)) {
                            aMeasureGroup.push(sMeasureGroup);
                            var iMeasureNewIndex = aMeasureGroup.indexOf(sMeasureGroup);
                            this._iMeasures = aMeasureGroup.length;
                        }
                        mDataset.yAxis = (iMeasureNewIndex === "") ? 0 : iMeasureNewIndex;
                        mDataset.type = (sMeasureType === "") ? "column" : sMeasureType;
                        break;
                    case "combine":
                        mDataset.name = oMeasure.getLabel();
                        mDataset.type = "column";
                        mDataset.yAxis = iMeasureIndex;

                        iDataLength = mDataset.data.length;
                        var iTotal = 0,
                            oTotalData = {y:0,color:""};

                        for (var i = 0; i < iDataLength; i++) {
                            iTotal += mDataset.data[i];
                        }
                        oTotalData.y = iTotal;
                        oTotalData.color = mDataset.color;
                        aTotalData.push(oTotalData);
                        aAverageData.push((iTotal / aDimensions.length).toFixed(2) * 1);
                        break;
                    default:
                        break;
                }
                aTransition.push(mDataset);
                return aTransition;
            }.bind(this), []);

            if (sChartType === "combine") {
                aDataset.push(this._getAvgMas(aAverageData));
                aDataset.push(this._getTotalMas(aTotalData));
            }

            return aDataset;
        },

        /**
         * Array.include alternative
         * Checking element existence in arraay
         * @param {array} aContainer - Element array
         * @param {string} sValue - Single element
         * @returns {boolean} bReturnValue - true/false
         * @private
         */
        includes: function(aContainer, sValue) {
            var bReturnValue = false;
            var iPos = aContainer.indexOf(sValue);
            if (iPos >= 0) {
                bReturnValue = true;
            }
            return bReturnValue;
        },

        /**
         * Get Dimensions array
         * @returns {array} - Dimensions
         * @private
         */
        _getDimensions: function() {
            var iColumnType;
            var oDateFormatter;
            var fnPushValue = function(aTransition, sValue) {
                return aTransition.push(sValue);
            };
            var fnConcatValue = function(aTransition, sValue, iIndex) {
                aTransition[iIndex] += " /// " + sValue;
                return aTransition;
            };
            var fMapFunction;

            var aDimensions = this.getDimensions().reduce(function(aTransition, oDimension) {
                iColumnType = oDimension.getCtype();
                oDateFormatter = formatter.getDateTimeInstanceBasedOnColumnType(iColumnType);

                fMapFunction = aTransition.length === 0 ? fnPushValue : fnConcatValue;

                oDimension.getValues().map(function(sValue, iValueIndex) {
                    if (iColumnType === 20 || iColumnType === 21) {
                        sValue = oDateFormatter.format(sValue);
                    }
                    return fMapFunction(aTransition, sValue, iValueIndex);
                });

                return aTransition;
            }, []);

            // Get only first 100 entries
            if (location.hostname === "localhost") {
                aDimensions = aDimensions.splice(aDimensions.length - 20, aDimensions.length);
            }

            return aDimensions;
        },

        /**
         * Set no chart data text to canvas
         * @param {object} oChartContext - Chart canvas context
         * @returns {void}
         * @private
         */
        _setNoChartData: function(oChartContext) {
            var iWidth = jQuery.sap.byId(this.sId).width();
            this.setWidth(iWidth);
            oChartContext.textAlign = "center";
            oChartContext.textBaseline = "middle";
            this._wrapCanasText(oChartContext, this.getNodata(), iWidth / 2, this.getHeight() / 2, iWidth, 25);
        },

        /**
         * Returns plot options for Stacked Charts (Highcharts)
         * @return {object} - Plot options
         * @private
         */
        _getPlotOptions: function() {
            var oPlotOptions = {
                column: {
                    stacking: 'normal',
                    dataLabels: {
                        enabled: true,
                        color: (Highcharts.theme && Highcharts.theme.dataLabelsColor) || 'white'
                    }
                }
            };
            return oPlotOptions;
        },

        /**
         * Returns floor value for Highcharts
         * @param {array} aDataset -
         * @return {float} - Floor Value
         * @private
         */
        _getFloorValue: function(aDataset) {
            var aAbsMinMas = [];
            var aValues = [];
            for (var i = 0; i < aDataset.length; i++) {
                if (aDataset[i].type === "pie"){
                    aValues = this._getPieChartValue(aDataset[i].data);
                } else {
                    aValues = aDataset[i].data;
                }
                var iAbsMin;
                var iMin = Math.min.apply(null, aValues);
                iAbsMin = (iMin >= 0) ? 0 : iMin;
                aAbsMinMas.push(iAbsMin);
            }
            return Math.min.apply(null, aAbsMinMas);
        },

        /**
         * Returns ceiling value for Highcharts
         * @param {array} aDataset -
         * @return {float} - Ceiling Value
         * @private
         */
        _getCeilingValue: function(aDataset) {
            var aAbsMaxMas = [];
            var aValues = [];
            for (var i = 0; i < aDataset.length; i++) {
                if (aDataset[i].type === "pie"){
                    aValues = this._getPieChartValue(aDataset[i].data);
                } else {
                    aValues = aDataset[i].data;
                }
                var iAbsMax;
                var iMax = Math.max.apply(null, aValues);
                iAbsMax = (iMax >= 0) ? iMax : 0;
                aAbsMaxMas.push(iAbsMax);
            }
            return Math.max.apply(null, aAbsMaxMas);
        },

        /**
         * Returns object with chart options for Total consumption
         * @param {array} aTotalData - total values
         * @return {object} - Chart options for Total consumption
         * @private
         */
        _getTotalMas: function(aTotalData) {
            var oTotalMas = {};
            oTotalMas = {
                type: 'pie',
                name: 'Total consumption',
                data: aTotalData,
                center: [20, 20],
                size: 80,
                showInLegend: false,
                dataLabels: {
                    enabled: false
                }
            };
            return oTotalMas;
        },

        /**
         * Returns object with chart options for Average line
         * @param {array} aAverageData - Data for counting averages
         * @return {object} - Chart options for average
         * @private
         */
        _getAvgMas: function(aAverageData) {
            var oAverageMas = {};
            oAverageMas = {
                visible: false,
                type: 'spline',
                name: 'Average',
                data: aAverageData,
                marker: {
                    lineWidth: 2,
                    lineColor: Highcharts.getOptions().colors[3],
                    fillColor: 'white'
                }
            };
            return oAverageMas;
        },

        /**
         * Returns Y axis for Highcharts
         * @param {string} sChartType - Chart type {line, bar, pie ... }
         * @param {float} iFloorValue - yAxis Floor value
         * @param {float} iCeilingValue - yAxis Ceiling value
         * @return {object|array} - of all yAxis
         * @private
         */
        _getChartYAxisOptions: function(sChartType, iFloorValue, iCeilingValue) {
            var oYAxis = {};

            if (sChartType !== "stacked") {
                var aYAxis = [];
                var oNumberFormat = this.formatter.getFloatInstance("Chart");
                var fFormatter = function() {
                    return oNumberFormat.format(this.value);
                };
                for (var i = 1; i < this._iMeasures + 1; i++) {
                    oYAxis = {
                        title: {
                            margin: 5,
                            text: null
                        },
                        floor: iFloorValue,
                        min: iFloorValue,
                        ceiling: iCeilingValue,
                        labels: {
                            format: '{value} M',
                            formatter: fFormatter,
                            maxStaggerLines: 1,
                            //distance: 15,
                            style: {
                                color: Highcharts.getOptions().colors[i - 1]
                            }
                        },
                        opposite: (parseFloat(i % 2) === 0) ? true : false
                    };
                    aYAxis.push(oYAxis);
                }
                return aYAxis;
            } else {
                oYAxis = {
                    title: {
                        margin: 5,
                        text: null
                    },
                    floor: iFloorValue,
                    min: iFloorValue,
                    stackLabels: {
                        enabled: true,
                        style: {
                            color: (Highcharts.theme && Highcharts.theme.textColor) || 'gray'
                        }
                    }
                };
                return oYAxis;
            }
        },

        /**
         * Returns object with chart options, depends on chart type
         * @param {string} sChartType - Chart type {line, bar, pie ... }
         * @param {array} aDimensions - for X axis (Highcharts)
         * @param {array} aDataset - for "Stacked" charts
         * @param {DOM} $IconTab - Counts height for Highcharts
         * @return {object} - Chart options for different types
         * @private
         */
        _getChartOptions: function(sChartType, aDimensions, aDataset, $IconTab) {
            var oOptions = {};
            var oNumberFormat = this.formatter.getFloatInstance("Chart");

            switch (sChartType) {
                case "pie":
                case "radar":
                    break;
                case "line":
                case "bar":
                    oOptions = {
                        scale: {
                            ticks: {
                                beginAtZero: true
                            }
                        },
                        scales: {
                            yAxes: [{
                                scaleLabel: {
                                    display: true,
                                    labelString: this.getYaxisLabel()
                                },
                                ticks: {
                                    beginAtZero: true,
                                    // Create scientific notation labels
                                    callback: function(value) {
                                        return oNumberFormat.format(value);
                                    }
                                }
                            }],
                            xAxes: [{
                                afterTickToLabelConversion: function(data) {
                                    if (data.ticks.length > 2000) {
                                        data.options.ticks.fontSize = 10;
                                    } else if (data.ticks.length > 1000) {
                                        data.options.ticks.fontSize = 11;
                                    }
                                }
                            }]
                        }
                    };
                    break;
                case "line_bar":
                case "combine":
                case "stacked":
                    oOptions = {
                        chart: {
                            zoomType: "x",
                            spacingBottom: 10,
                            spacingTop: 10,
                            spacingLeft: 10,
                            spacingRight: 10,
                            // Explicitly tell the width and height of a chart
                            height: this.getExpanded() ? $IconTab.height() - 32 - 33 - 16 : 250,
                            type: (sChartType === "stacked") ? "column" : ""
                        },
                        title: {
                            text: null
                        },
                        xAxis: [{
                            categories: aDimensions,
                            crosshair: true
                        }],
                        // Creating yAxis based on measures amount
                        yAxis: this._getChartYAxisOptions(sChartType, this._getFloorValue(aDataset), this._getCeilingValue(aDataset)),
                        tooltip: {
                            shared: true
                        },
                        credits: {
                            enabled: false
                        },
                        legend: {
                            layout: 'horizontal', //'vertical',
                            //align: 'left',
                            align: 'center',
                            verticalAlign: 'top',
                            //floating: true,
                            floating: false,
                            backgroundColor: (Highcharts.theme && Highcharts.theme.legendBackgroundColor) || '#FFFFFF'
                        },
                        responsive: {
                            maxWidth: 422,
                            minWidth: 241
                        }
                    };
                    break;
                default:
                    break;
            }
            return oOptions;
        },

        /**
         * Returns array of random colors passing number of colors
         * @param {integer} iCount - number of random colors
         * @return {array} - of random colors
         * @private
         */
        _getRandomColors: function(iCount,aColorScheme) {
            //https://experience.sap.com/fiori-design-web/values-and-names/
            var aColors = ['#f09ca4', '#e9707b', '#e34352', '#d32030', '#a71926', '#911621', '#f3caab',
                '#edb17e', '#e79651', '#e17b24', '#b96319', '#a25716', '#bedbba', '#9fca98',
                '#80b877', '#61a656', '#4d8445', '#44743c', '#d5dadc', '#bac1c4', '#9ea8ad',
                '#848f94', '#69767c', '#5e696e', '#abdbf2', '#84caec', '#5cbae5', '#27a3dd',
                '#1b7eac', '#156489', '#d7eaa2', '#c6e17d', '#b6d957', '#9dc62d', '#759422',
                '#5b731a', '#fde5bd', '#fbd491', '#fac364', '#f8ac29', '#dd8e07', '#b57506'
            ];

            aColorScheme = aColorScheme ? aColorScheme : [];

            var iLength = aColors.length;
            var aRetColors = [];

            var i = 0;
                for (i; i < iCount; i++) {
                    aColorScheme[i] ? aRetColors.push(aColorScheme[i]) :
                    aRetColors.push(aColors[Math.floor(Math.random() * iLength)]) ;
                }

            return aRetColors;
        },

        /**
         * Fill canvas with text param when chart is empty
         * @param {object} context - canvas context
         * @param {string} text - that should be set on the canvas
         * @param {float} x - where starts to write text
         * @param {float} y - where starts to write text
         * @param {float} maxWidth - max canvas width
         * @param {integer} lineHeight - wrap text if it's length more than this param
         * @returns {void}
         * @private
         */
        _wrapCanasText: function(context, text, x, y, maxWidth, lineHeight) {
            var words = text.split(";");
            var line = '';

            for (var n = 0; n < words.length; n++) {
                var testLine = line + words[n] + ' ';
                var metrics = context.measureText(testLine);
                var testWidth = metrics.width;

                if (testWidth > maxWidth && n > 0) {
                    context.fillText(line, x, y);
                    line = words[n] + ' ';
                    y += lineHeight;
                } else {
                    line = testLine;
                }
            }
            context.fillText(line, x, y);
        },

        /**
         * Get value plain value array for pie chart data
         * @param {array} aPieValue - Pie chart object array
         * @returns {array} aValues - Plain pie chart  value array
         * @private
         */
        _getPieChartValue : function(aPieValue){
            var aValues = [];
            jQuery.each(aPieValue, function( index, oPieValue ) {
				aValues.push(oPieValue.y);
			});
            return aValues;
        }
    });
});