sap.ui.define(['sap/ui/test/opaQunit'], function () {
  'use strict';
  QUnit.module('Tree Table Module');
  
  opaTest('Should expand hierarchy', function (Given, When, Then) {
	    // Arrangements
	    Given.iStartTheApp("#/TreeXS", "CNTRL=CTRL6");
	    //Actions
	    When.onTreeTable.iClickOnExpandButton();
	    // Assertions
	    Then.onTreeTable.iShouldSeeNodesExpand();
	 });
	 
   opaTest('Should collapse hierarchy', function (Given, When, Then) {
	    // Arrangements
	//  Given.iStartTheApp("#/Tree", "CNTRL=CTRL6");
	    //Actions
	    When.onTreeTable.iClickOnCollapseButton();
	    // Assertions
	    Then.onTreeTable.iShouldSeeNodesCollapse().and.iTeardownMyAppFrame();
	 });


});