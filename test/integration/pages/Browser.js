sap.ui.require([
		"sap/ui/test/Opa5",
		"com/siemens/tableViewer/test/integration/pages/Common"
	],
	function(Opa5, Common) {
		"use strict";

		Opa5.createPageObjects({
			onTheBrowserPage: {
				baseClass: Common,
				actions: {
					iChangeTheHashToObjectN : function (iObjIndex) {
						return this.waitFor({
							success : function () {
								sap.ui.test.Opa5.getWindow().location.hash = "CNTRL=CTRL1#/" + iObjIndex;
							}
						});
					},

					iChangeTheHashToSomethingInvalid : function () {
						return this.waitFor({
							success : function () {
								sap.ui.test.Opa5.getWindow().location.hash = "#/somethingInvalid";
							}
						});
					}
				},
				assertions: {
					iShouldSeeTheHashForObjectN : function (iObjIndex) {
						return this.waitFor({
							success : function () {
								var oHashChanger = Opa5.getHashChanger(),
									sHash = oHashChanger.getHash();
								QUnit.strictEqual(sHash, "CNTRL=CTRL1#/" + iObjIndex, "The Hash is not correct");
							},
							errorMessage : "The Hash is not Correct!"
						});
					},

					iShouldSeeAnEmptyHash : function () {
						return this.waitFor({
							success : function () {
								var oHashChanger = Opa5.getHashChanger(),
									sHash = oHashChanger.getHash();
								QUnit.strictEqual(sHash, "", "The Hash should be empty");
							},
							errorMessage : "The Hash is not Correct!"
						});
					}
				}
			}
		});
	});
