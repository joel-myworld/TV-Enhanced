sap.ui.define(['sap/ui/base/Object'], function (Ui5Object) {
	'use strict';
	return Ui5Object.extend('com.siemens.tableViewer.test.integration.AllJourneys', {
		start: function (oConfig) {
			oConfig = oConfig || {};
			jQuery.sap.require('sap.ui.qunit.qunit-css');
			jQuery.sap.require('sap.ui.thirdparty.qunit');
			jQuery.sap.require('sap.ui.qunit.qunit-junit');
			jQuery.sap.require('sap.ui.test.opaQunit');
			jQuery.sap.require('sap.ui.test.Opa5');
			jQuery.sap.require("sap.ui.qunit.qunit-coverage");
			jQuery.sap.require('com.siemens.tableViewer.test.integration.pages.Common');
			// jQuery.sap.require('com.siemens.tableViewer.test.integration.pages.App');
			// jQuery.sap.require('com.siemens.tableViewer.test.integration.pages.Browser');
			jQuery.sap.require("com.siemens.tableViewer.test.integration.pages.Table");
			jQuery.sap.require("com.siemens.tableViewer.test.integration.pages.Tree");
			// jQuery.sap.require("com.siemens.tableViewer.test.integration.pages.Variant");
			sap.ui.test.Opa5.extendConfig({
				arrangements: new com.siemens.tableViewer.test.integration.pages.Common(oConfig),
				viewNamespace: 'com.siemens.tableViewer.view.'
			});
			jQuery.sap.require("com.siemens.tableViewer.test.integration.TableJourney");
			jQuery.sap.require("com.siemens.tableViewer.test.integration.TreeJourney");
			// jQuery.sap.require("com.siemens.tableViewer.test.integration.VariantJourney");
		}
	});
});
