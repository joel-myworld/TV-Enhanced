/*global opaTest*/
//declare unusual global vars for JSLint/SAPUI5 validation
sap.ui.define([
	"sap/ui/test/Opa5",
	"com/siemens/tableViewer/test/integration/pages/Common",
], function (Opa5, Common) {
	"use strict";
	
	Opa5.createPageObjects({
		onTheVariant: {
			baseClass: Common,
			actions: {
				iClickOnVariantButton: function () {
					var oVariantBtn;
					return this.waitFor({
						controlType: "sap.ui.comp.variants.VariantManagement",
						viewName: "VariantManagement",
						matchers: function (oVariant) {
							try {
								   oVariantBtn = oVariant.getAggregation("dependents")[0].getAggregation("content")[2];
								   return true;
							} catch (e) {
								   return false;
							}
						},
						success: function () {
							   oVariantBtn.firePress();
						},
						errorMessage: "Variant button is not found"
					});
				},
				
				iClickOnSaveAsButton: function () {
					return this.waitFor({
						searchOpenDialogs: true,
						controlType: "sap.m.Popover",
						viewName: "VariantManagement",
						success: function (aPopover) {
							   if (aPopover[0].getTitle() === "Variants") {
								   var oSAButton = aPopover[0].getAggregation("content")[0].getAggregation("footer").getAggregation("content")[3];
							       oSAButton.$().trigger("tap");
							}
							else{
								   ok(false, "variants popover couldnt be opened");
							}
						},
						errorMessage: "Variant popover couldnt be found"
					});
				},	
				
				iClickOnSaveAsButton1: function () {
					return this.waitFor({
						searchOpenDialogs: true,
						controlType: "sap.m.Popover",
						viewName: "VariantManagement",
						success: function (aPopover) {
							   if (aPopover[0].getTitle() === "Variants") {
								   var oSAButton = aPopover[0].getAggregation("content")[0].getAggregation("footer").getAggregation("content")[3];
							       oSAButton.$().trigger("tap");
							}
							else{
								   ok(false, "variants popover couldnt be opened");
							}
						},
						errorMessage: "Variant popover couldnt be found"
					});
				},
				
				iClickOnSaveButton: function () {
					return this.waitFor({
						searchOpenDialogs: true,
						controlType: "sap.m.Popover",
						viewName: "VariantManagement",
						success: function (aPopover) {
							   if (aPopover[0].getTitle() === "Variants") {
								   var oSButton = aPopover[0].getAggregation("content")[0].getAggregation("footer").getAggregation("content")[2];
							       oSButton.$().trigger("tap");
							}
							else{
								   ok(false, "variants popover couldnt be opened");
							}
						},
						errorMessage: "Variant popover couldnt be found"
					});
				},
				
				iClickOnManageButton: function () {
					return this.waitFor({
						searchOpenDialogs: true,
						controlType: "sap.m.Popover",
						viewName: "VariantManagement",
						success: function (aPopover) {
							   if(aPopover[0].getTitle() === "Variants") {
								   // Clicking on Manage Button
								   var oMButton = aPopover[0].getAggregation("content")[0].getAggregation("footer").getAggregation("content")[1];
								   oMButton.firePress();
							}
							else{
								   ok(false, "variants popover couldnt be opened");
							}
						},
						errorMessage: "Variant popover couldnt be found"
					});
				}
		},
			
			assertions: {
				theVariantPopoverOpens: function () {
					return this.waitFor({
						searchOpenDialogs: true,
						controlType: "sap.m.Popover",
						viewName: "VariantManagement",
						success: function (aPopover) {
						      if (aPopover[0].getTitle() === "Variants") {
							      ok(true, "Variants popover is opened");
							} else {
							       ok(false, "Variants popover couldn't be opened");
							}
						},
						errorMessage: "Variants popover couldnt be found"
					});
			   },
			 				
			   iSetTheVariantName: function () {
					return this.waitFor({
						searchOpenDialogs: true,
						controlType: "sap.m.Dialog",
						viewName: "VariantManagement",
						success: function (aDialogs) {
							   if(aDialogs[0].getTitle() === "Save Variant") {
								   aDialogs[0].getAggregation("content")[1].setValue("DA1");
							       var oSaveBtn = aDialogs[0].getAggregation("_toolbar").getAggregation("content")[1];
							       oSaveBtn.firePress();
								   ok(true, "Variant name is set");
							}else {
								   ok(false, "Could not find Save Variant dialog");
							}
                        },
						errorMessage: "Could not open Save Variant dialog"
					});
				},
				
				iSelectAsDefaultVariant: function () {
						return this.waitFor({
							searchOpenDialogs: true,
							controlType: "sap.m.Dialog",
							viewName: "VariantManagement",
							success: function (aDialogs) {
								   if(aDialogs[0].getTitle() === "Save Variant") {
									   aDialogs[0].getAggregation("content")[1].setValue("FLE");
									   var aCheckBox = aDialogs[0].getAggregation("content")[4].getAggregation("content")[0];
									   aCheckBox.setSelected(true);
									   aCheckBox.fireSelect();	
								       var oSaveBtn1 = aDialogs[0].getAggregation("_toolbar").getAggregation("content")[1];
								       oSaveBtn1.firePress();
									   ok(true, "Variant is set as default");
								}else {
									   ok(false, "Could not find Save Variant dialog");
								}
	                        },
							errorMessage: "Could not open Save Variant dialog"
						});
					},
				
				iSeeVariantNameIsSaved: function () {
						return this.waitFor({
							viewName: "VariantManagement",
							contentType:"sap.ui.comp.variants.VariantManagement",
							success: function (aVariant) {
								var sText = aVariant[1].oVariantText.mProperties.text;
								   if(sText === "FLE"){
									   ok(true,"variant FLE is saved");
								}else {
									   ok(false, "Could not Save Variant FLE");
								}								
	                        },
							errorMessage: "could not save variant"
						});
					},
					
			    iSetDefaultVariant: function () {
							return this.waitFor({
								searchOpenDialogs: true,
								controlType: "sap.m.Dialog",
								viewName: "VariantManagement",
								success: function (aDialogs) {
									if(aDialogs[0].getAggregation("customHeader").getAggregation("contentMiddle")[0].getText() === "Manage Variants") { 
									   var oVariantName =	aDialogs[0].getAggregation("content")[0].getAggregation("items")[0].getAggregation("cells")[0].mProperties.value;
									   var oSelected = aDialogs[0].getAggregation("content")[0].getAggregation("items")[0].getAggregation("cells")[2];  // Getting the corresponding radio button to select
									   var oOkButton = aDialogs[0].getAggregation("_toolbar").getAggregation("content")[1],mArgument={} ; 
									   oSelected.setSelected(true);
									   mArgument.selected = true;
							           oSelected.fireSelect(mArgument);
							           oOkButton.$().trigger("tap");
									   ok(true,"Default variant is set")
									}else {
									   ok(false, "Could not find the Manage Variants dialog");
									}
		                      },
								errorMessage: "Could not open Manage Variants dialog"
						});
					},
					
				 iDeleteVariant: function () {
							return this.waitFor({
								searchOpenDialogs: true,
								controlType: "sap.m.Dialog",
								viewName: "VariantManagement",
								success: function (aDialogs) {
									if(aDialogs[0].getAggregation("customHeader").getAggregation("contentMiddle")[0].getText() === "Manage Variants") { 
									   var oVariantName =	aDialogs[0].getAggregation("content")[0].getAggregation("items")[1].getAggregation("cells")[0].mProperties.value;
									   var oDeleteBtn = aDialogs[0].getAggregation("content")[0].getAggregation("items")[1].getAggregation("cells")[3];  
									   var oOkButton = aDialogs[0].getAggregation("_toolbar").getAggregation("content")[1] // Ok Button
									   oDeleteBtn.setEnabled(true)
									   oDeleteBtn.firePress();
		       						   oOkButton.firePress();
		       						   ok(true,"Variant is deleted");
									}else {
									   ok(false, "Could not delete the variant");
									}
		                      },
								errorMessage: "Could not open Manage Variants dialog"
						});
					},
		        }
		   }
	});
});