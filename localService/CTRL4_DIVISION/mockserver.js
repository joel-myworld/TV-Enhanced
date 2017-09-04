sap.ui.define([
		"sap/ui/core/util/MockServer"
	], function (MockServer) {
		"use strict";
		var oMockServer,
			_sAppModulePath = "com/siemens/tableViewer/service/",
			_sJsonFilesModulePath = _sAppModulePath + "CTRL4_DIVISION/mockdata",
			_sMetadataUrl = _sAppModulePath + "CTRL4_DIVISION/metadata",
			_sMainDataSourceUrl = "/siemens/COMMON_DEV/TableViewer3/xs/services/staticFilters/CTRL4_DIVISION.xsodata/";

		return {

			/**
			 * Initializes the mock server.
			 * You can configure the delay with the URL parameter "serverDelay".
			 * The local mock data in this folder is returned instead of the real data for testing.
			 * @public
			 */
			init: function () {
				var oUriParameters = jQuery.sap.getUriParameters(),
					sJsonFilesUrl = jQuery.sap.getModulePath(_sJsonFilesModulePath),
					sEntity = "Service",
					sErrorParam = oUriParameters.get("errorType"),
					iErrorCode = sErrorParam === "badRequest" ? 400 : 500,
					sMetadataUrl = jQuery.sap.getModulePath(_sMetadataUrl, ".xml");

				oMockServer = new MockServer({
					rootUri: _sMainDataSourceUrl
				});


				// configure mock server with a delay of 1s
				MockServer.config({
					autoRespond: true,
					autoRespondAfter: (oUriParameters.get("serverDelay") || 2000)
				});

				// load local mock data
				oMockServer.simulate(sMetadataUrl, {
					sMockdataBaseUrl: sJsonFilesUrl,
					bGenerateMissingMockData: false
				});

				oMockServer.start();

				jQuery.sap.log.info("Running the app with mock data");
			},

			/**
			 * @public returns the mockserver of the app, should be used in integration tests
			 * @returns {sap.ui.core.util.MockServer} the mockserver instance
			 */
			getMockServer: function () {
				return oMockServer;
			}
		};

	}
);
