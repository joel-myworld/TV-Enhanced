sap.ui.define(['sap/ui/test/opaQunit'], function () {
  'use strict';
  QUnit.module('Variant Module');
  
  opaTest('Should open variant', function (Given, When, Then) {
	    // Arrangements
	    Given.iStartTheApp("#/Table", "CNTRL=CTRL1");
	    //Actions
	    When.onTheVariant.iClickOnVariantButton();
	    // Assertions
	    Then.onTheVariant.theVariantPopoverOpens();
	 });
  
  opaTest('Save a variant through Save As button ', function (Given, When, Then) {
	    // Arrangements
//	    Given.iStartTheApp("#/Table", "CNTRL=CTRL1");
	    //Actions
	    When.onTheVariant.iClickOnSaveAsButton();	    
	    // Assertions
	    Then.onTheVariant.iSetTheVariantName();
	 });
 
  opaTest('Set a variant as default', function (Given, When, Then) {
	    // Arrangements
//	    Given.iStartTheApp("#/Table", "CNTRL=CTRL1");
	    //Actions
	    When.onTheVariant.iClickOnVariantButton();
	    When.onTheVariant.iClickOnSaveAsButton1();	    
	    // Assertions
	    Then.onTheVariant.iSelectAsDefaultVariant();
	 });
 
//   opaTest('Save a variant through Save button', function (Given, When, Then) {
// 	    // Arrangements
// //	    Given.iStartTheApp("#/Table", "CNTRL=CTRL1");
// 	    //Actions
// 	    When.onTheVariant.iClickOnVariantButton();    
// 	    When.onTheVariant.iClickOnSaveButton();
// 	    // Assertions
// 	    Then.onTheVariant.iSeeVariantNameIsSaved().and.iTeardownMyAppFrame();
//     });
  
//   opaTest('Manage a variant', function (Given, When, Then) {
// 	    // Arrangements
// 	    Given.iStartTheApp("#/Table", "CNTRL=CTRL1");
// 	    //Actions
// 	    When.onTheVariant.iClickOnVariantButton();  
// 	    When.onTheVariant.iClickOnManageButton();	    
// 	    // Assertions
// 	    Then.onTheVariant.iSetDefaultVariant();
// 	 });

//   opaTest('Delete a variant', function (Given, When, Then) {
// 	    // Arrangements
// 	    Given.iStartTheApp("#/Table", "CNTRL=CTRL1");
// 	    //Actions
// 	    When.onTheVariant.iClickOnVariantButton();  
// 	    When.onTheVariant.iClickOnManageButton();	    
// 	    // Assertions
// 	    Then.onTheVariant.iDeleteVariant().and.iTeardownMyAppFrame();
// 	 });
  
});