sap.ui.define([
		"sap/ui/test/Opa5"
	],
	function (Opa5) {
		"use strict";

		return Opa5.extend("com.siemens.tableViewer.test.integration.pages.Common", {
			constructor: function (oConfig) {
				Opa5.apply(this, arguments);

				this._oConfig = oConfig;
			},

			_getFrameUrl: function (sHash, sUrlParameters) {
				sHash = sHash || "";
			//	var sUrl = jQuery.sap.getResourcePath("com/siemens/tableViewer/test", ".html");
				var sUrl = "/testService.html";
				//var sUrl = jQuery.sap.getResourcePath("com/siemens/tableViewer/", ".html");
				sUrlParameters = "?" + (sUrlParameters ? sUrlParameters + "&" : "");

				// if the tests are run inside the FLP sandbox we need to add the
				// FLP has delimiter "&" in front of our application hash
				if (this._oConfig.isFLP) {
					sHash = "&" + sHash;
				}

				return sUrl + sUrlParameters + sHash;
			},

			iStartTheApp: function (sHash, sUrlParameters) {
					this.iStartMyAppInAFrame(this._getFrameUrl(sHash, sUrlParameters));
			},

			iStartTheAppWithDelay: function (sHash, iDelay) {
				this.iStartMyAppInAFrame(this._getFrameUrl(sHash, "serverDelay=" + iDelay));
			},

			iLookAtTheScreen: function () {
				return this;
			}

		});
	});
