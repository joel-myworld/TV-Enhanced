sap.ui.define(
	[
	"com/siemens/tableViewer/model/formatter",
    "sap/ui/model/type/Integer",
    "sap/ui/model/type/Float",
    "sap/ui/model/type/Date",
    "sap/ui/model/odata/type/DateTime",
    "sap/ui/model/odata/type/Time",
    "sap/ui/core/format/DateFormat",
    "sap/ui/core/HorizontalAlign",
    "sap/ui/core/TextAlign",
    "sap/m/LabelDesign",
    "sap/ui/core/format/NumberFormat"
	],
	function(formatter, IntegerType, FloatType, DateType, DateTimeType, TimeType, DateFormat, HorizontalAlign, TextAlign, LabelDesign,NumberFormat) {
		"use strict";
		QUnit.module("Table Viewer Formatter tests");

		QUnit.test("Formatter loaded", function() {
			ok(formatter, "formatter loaded");
		});

        QUnit.test("Get Data Type Instance", function() {
			var value1 = 3;

			var formatValue = formatter.getDataTypeInstance(value1);
			equal(formatValue.sName,  "Integer");
		});
		
		 QUnit.test("Get Date Time Instance", function() {
			var value1 = new Date();

			var formatValue = formatter.getDateTimeInstance(value1);
			equal(formatValue.oFormatOptions.pattern,  value1.toString(), "Time format accepted");
		});

         QUnit.test("Get Format Options", function() {
			var value1 = "Integer";
            var result =    { 
                                groupingEnabled: true
                            };

			var formatValue = formatter.formatOptions(value1);
			equal(formatValue.groupingEnabled,  result.groupingEnabled, "Formatting Options passed");
		});

         QUnit.test("Format Range Slider Label", function() {
			var value1 = 3;
			var formatValue = formatter.formatRangeSliderLabel(value1);
			equal(formatValue,  3, "Range Slider Label Formatted");

			value1 = -1;
			formatValue = formatter.formatRangeSliderLabel(value1);
			equal(formatValue,  -1, "Range Slider Label Formatted");

			value1 = 1000000000;
			formatValue = formatter.formatRangeSliderLabel(value1);
			equal(formatValue,  "1G", "Range Slider Label Formatted");

			value1 = 1000000;
			formatValue = formatter.formatRangeSliderLabel(value1);
			equal(formatValue,  "1M", "Range Slider Label Formatted");

			value1 = 1000;
			formatValue = formatter.formatRangeSliderLabel(value1);
			equal(formatValue,  "1K", "Range Slider Label Formatted");
		});

         QUnit.test("Format Data Based On Column Type", function() {
			var value1=17, value2 = new Date("11.05.2016");
			var formatValue = formatter.formatDataBasedOnColumnType(value1, value2);
			equal(formatValue, "11.2016", "Value formatted based on String column type" );

			value1 = 20, value2 = "11.05.2016";
			formatValue = formatter.formatDataBasedOnColumnType(value1, value2);
			equal(formatValue, "05.11.2016", "Value formatted based on Date Column type" );

			value1=22;
			formatValue = formatter.formatDataBasedOnColumnType(value1, value2);
			equal(formatValue, "00:00:00", "Value formatted based on Time column type" );
		});

        QUnit.test("Get Formatted Token", function() {
			var value1 = 17, value2 = "ColumnName", value3 = "11.05.2016";
			var formatValue = formatter.getFormattedToken(value1, value2, value3);
			equal(formatValue.getText(), "11.05.2016", "Token Formatted");

			value1 = 20, value2 = "ColumnName", value3 = "11.05.2016";
			formatValue = formatter.getFormattedToken(value1, value2, value3);
			equal(formatValue.getText(), "11.05.2016", "Token Formatted");

			value1 = 22, value2 = "ColumnName", value3 = "11:05:20";
			formatValue = formatter.getFormattedToken(value1, value2, value3);
			equal(formatValue.getText(), "11:05:20", "Token Formatted");

			value1 = 11, value2 = "ColumnName", value3 = "11.05.2016";
			formatValue = formatter.getFormattedToken(value1, value2, value3);
			equal(formatValue.getText(), "11.05.2016", "Token Formatted");
		});

        QUnit.test("Convert Date to String", function() {
			var value1 = new Date(), result;

			var formatValue = formatter.convertDatetoString(value1);

            if (value1.toLocaleDateString().split("/")[0].length === 1) { 
                result = "0" + value1.toLocaleDateString().split("/")[0]; 
            }
            result = value1.getFullYear() + result;

			equal(formatValue, result, "Date converted to string");
		});

        QUnit.test("Get Date Time Instance Based On Column Type", function() {
			var value1 = 20;
			var formatValue = formatter.getDateTimeInstanceBasedOnColumnType(value1);
			equal(formatValue.oFormatOptions.pattern,  "dd.MM.yyyy", "Date Time instance received");

			value1 = 21;
			formatValue = formatter.getDateTimeInstanceBasedOnColumnType(value1);
			equal(formatValue.oFormatOptions.pattern,  "MM.yyyy", "Date Time instance received");

			value1 = 1;
			formatValue = formatter.getDateTimeInstanceBasedOnColumnType(value1);
			equal(formatValue.oFormatOptions.pattern,  "dd.MM.yyyy", "Date Time instance received");
		});

        QUnit.test("Get Float Instance", function() {
			var value1 = "Float";

			var formatValue = formatter.getFloatInstance(value1);
			equal(formatValue.oFormatOptions.type, "float", "Float Instance received" );
		});

        QUnit.test("Set Button Enabled", function() {
			var value1 = true, value2 = false;

			var formatValue = formatter.setButtonEnabled(value1, value2);
			equal(formatValue, false, "Button enabled" );
		});

        QUnit.test("Hide Table Tab", function() {
			var value1 = 0, value2 = 1, value3 = 0;

			var formatValue = formatter.hideTableTab(value1, value2, value3);
			equal(formatValue, true, "Table Tab is hidden" );
		});

        QUnit.test("Hide Chart Tab", function() {
			var value1 = 0, value2 = 1, value3 = 0, value4 = 0;

			var formatValue = formatter.hideChartTab(value1, value2, value3, value4);
			equal(formatValue, true, "Chart Tab is hidden" );
		});

        QUnit.test("Hide TreeXS Tab", function() {
			var value1 = 1, value2 = 0;

			var formatValue = formatter.hideTreeXSTab(value1, value2);
			equal(formatValue, true, "TreeXS Tab is hidden" );
		});

        QUnit.test("Hide Tree Tab", function() {
			var value1 = 1, value2 = 1;

			var formatValue = formatter.hideTreeTab(value1, value2);
			equal(formatValue, true, "Tree Tab is hidden" );
		});

        QUnit.test("Hide Mix Tab", function() {
			var value1 = 1, value2 = 1, value3 = 0;

			var formatValue = formatter.hideMixTab(value1, value2, value3);
			equal(formatValue, true, "Mix Tab is hidden" );
		});

        QUnit.test("Align Column", function() {
			var value1 = 1;

			var formatValue = formatter.alignColumn(value1);
			equal(formatValue, HorizontalAlign.Right, "Column texts are aligned correctly" );
		});

        QUnit.test("Column Label design", function() {
			var value1 = 1;
			var formatValue = formatter.labelDesign(value1);
			equal(formatValue, LabelDesign.Bold, "Column Label design are received correctly" );
		});

        QUnit.test("Align Column Label", function() {
			var value1 = 1;

			var stubFn = {
				addStyleClass: sinon.stub().returns({})
			};
			var formatValue = formatter.alignColumnLabel.bind(stubFn);
			assert.strictEqual(formatValue(value1), "Right","Column Labels are aligned correctly");
			assert.strictEqual(formatValue(""), "Left", "By default column labels are left aligned");
		});

        QUnit.test("Format Aggregated Column Text", function() {
			var value1 = "SampleText\nforFormatting";

			var formatValue = formatter.formatAggregatedColumnText(value1);
			equal(formatValue, "SampleText", "Aggregated Column Texts formatted" );
		});

        QUnit.test("Set True If Value Equals One", function() {
			var value1 = 1;

			var formatValue = formatter.setTrueIfValueEqOne(value1);
			equal(formatValue, true, "True When Value Equals One" );
		});

	});