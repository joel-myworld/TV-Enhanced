sap.ui.define(['sap/ui/test/opaQunit'], function () {
  'use strict';
  QUnit.module('Test Module');

  opaTest('Should find a Button with an id', function (Given, When, Then) {
    // Arrangements
    Given.iStartTheApp("#/Table", "CNTRL=CTRL1");
    //Actions
    When.onTheTableViewerPage.iFoundButton();
    // Assertions
    // Then.onTheTableViewerPage.iShouldSeeResult().and.iTeardownMyAppFrame();
    Then.onTheTableViewerPage.iShouldSeeResult();
    
  });

  opaTest('Should find the Global variant management button', function (Given, When, Then) {
    // Arrangements
    // Given.iStartTheApp("#/Table", "CNTRL=CTRL1");
    //Actions
    When.onTheTableViewerPage.iFindGlobalVariantButton();
    // Assertions
    // Then.onTheTableViewerPage.iShouldSeeVariantManagementDialog().and.iTeardownMyAppFrame();
    Then.onTheTableViewerPage.iShouldSeeVariantManagementDialog();
    
  });

  opaTest('Should find the Table sort button', function (Given, When, Then) {
    // Arrangements
    // Given.iStartTheApp("#/Table", "CNTRL=CTRL1");
    //Actions
    When.onTheTableViewerPage.iFindSortButton();
    // Assertions
    // Then.onTheTableViewerPage.iShouldSeeSortDialog().and.iTeardownMyAppFrame();
    Then.onTheTableViewerPage.iShouldSeeSortDialog();
    
  });

  opaTest('Should find the filter clear button', function (Given, When, Then) {
    // Arrangements
    // Given.iStartTheApp("#/Table", "CNTRL=CTRL1");
    //Actions
    When.onTheTableViewerPage.iFindClearButton();
    // Assertions
    // Then.onTheTableViewerPage.allFiltersShouldBeCleared().and.iTeardownMyAppFrame();
    Then.onTheTableViewerPage.allFiltersShouldBeCleared();
    
  });

  opaTest('On click of Filters button in filter bar, should open filter options', function (Given, When, Then) {
    // Arrangements
    // Given.iStartTheApp("#/Table", "CNTRL=CTRL1");
    //Actions
    When.onTheTableViewerPage.iClickFiltersButton();
    // Assertions
    Then.onTheTableViewerPage.theFiltersDialogOpens();
  });

  opaTest('To open value help dialog and select define conditions button should show Define Condition dialog', function (Given, When, Then) {
    //Arrangements
    //Actions
    When.onTheTableViewerPage.iSelectMultiInputFilterControl();
    //Assertions
    Then.onTheTableViewerPage.iShouldSeeSelectedValueHelpDialog();
  });

  // opaTest('To check suggestion list is available for Include or exclude condition', function (Given, When, Then) {
  //   //Arrangements
  //   //Actions
  //   When.onTheTableViewerPage.iEnterIncludeData();
  //   //Assertions
  //   Then.onTheTableViewerPage.iShouldSeeSuggestionList();
  // });

  opaTest('To define Include and exclude conditions in the define conditions dialog', function (Given, When, Then) {
    //Arrangements
    //Actions
    When.onTheTableViewerPage.iSetIncludeExcludeCondition();
    //Assertions
    Then.onTheTableViewerPage.iShouldSeeConditionsInFilterDialog();
  });

  opaTest('Selecting a Field under Filters Dialog', function (Given, When, Then) {
		// Arrangements
	// Given.iStartTheApp("#/Table", "CNTRL=CTRL1");
	//Actions
	When.onTheTableViewerPage.iClickFiltersButton();
	When.onTheTableViewerPage.iSelectMaterialField();
	// Assertions
	Then.onTheTableViewerPage.iShouldSeeMaterialFieldChecked();
  });

  opaTest('Local busy indicator should be displayed while loading data in filter value help', function (Given, When, Then) {
	// Arrangements
//	Given.iStartTheApp("#/Table", "CNTRL=CTRL1");
	//Actions
	When.onTheTableViewerPage.iOpenValueHelp();
	// Assertions
	Then.onTheTableViewerPage.iSeeBusyIndicator();
  }); 

  opaTest('Should hide the filters in the Filter Bar', function (Given, When, Then){
    //Arrangements
    // Given.iStartTheApp("#/Table", "CNTRL=CTRL1");
    //Actions
    When.onTheTableViewerPage.iFindTheHideFiltersButton();
    //Assertions
    // Then.onTheTableViewerPage.allFiltersShouldBeHidden().and.iTeardownMyAppFrame();
    Then.onTheTableViewerPage.allFiltersShouldBeHidden();
    
  });

  opaTest('Should see the List of Variants', function(Given, When, Then){
    //Arrangements
    // Given.iStartTheApp("#/Table", "CNTRL=CTRL1");
    //Actions
    When.onTheTableViewerPage.iClickTheVariantName();
    //Assertions
    Then.onTheTableViewerPage.iShouldSeeTheVariantList();
    
  });

  opaTest('Should export to excel', function(Given, When, Then){
    //Arrangements
    // Given.iStartTheApp("#/Table", "CNTRL=CTRL1");
    //Actions
    When.onTheTableViewerPage.iClickOnExportToExcel();
    //Assertions
    Then.onTheTableViewerPage.iSelectTheFileFormat();
    
  });

  opaTest('Should open cell color dialog', function(Given, When, Then){
    //Arrangements
    // Given.iStartTheApp("#/Table", "CNTRL=CTRL1");
    //Actions
    When.onTheTableViewerPage.iClickCellColoringButton();
    //Assertions
    Then.onTheTableViewerPage.iSeeCellColoringDialog();
    
  });

   opaTest('Test min and max range values on slider', function (Given, When, Then) {
	  // Arrangements
//	    Given.iStartTheApp("#/Table", "CNTRL=CTRL1");
	  //Actions
	    When.onTheTableViewerPage.iSetValuesRange();
	  // Assertions
	    Then.onTheTableViewerPage.iSeeSliderEndValuesChange();
	});

  opaTest('Test change in input Value1 and Value2 on movement of slider', function (Given, When, Then) {
	  // Arrangements
//	    Given.iStartTheApp("#/Table", "CNTRL=CTRL1");
	  //Actions
	    When.onTheTableViewerPage.iMoveSlider();
	  // Assertions
	    Then.onTheTableViewerPage.iSeeChangeInInputValues();
	});

  opaTest('Test dropdown fields based on the available condition range in slider', function (Given, When, Then) {
	  // Arrangements
//	    Given.iStartTheApp("#/Table", "CNTRL=CTRL1");
	  //Actions
	    When.onTheTableViewerPage.iMoveSlider1();
	  // Assertions
	    Then.onTheTableViewerPage.iSeeDropdownFields();
	});

  // opaTest('Should open Column Settings dialog', function(Given, When, Then){
  //   //Arrangements
  //   // Given.iStartTheApp("#/Table", "CNTRL=CTRL1");
  //   //Actions
  //   When.onTheTableViewerPage.iClickColumnSettingsButton();
  //   //Assertions
  //   Then.onTheTableViewerPage.iSeeTheColumnSettingsDialog();
    
  // });

  opaTest("Should see total count in table header", function(Given, When, Then){
    // Actions
    When.onTheTableViewerPage.iWaitUntilTheTableIsLoaded();
    // Assertions
    Then.onTheTableViewerPage.theTitleShouldDisplayTheTotalAmountOfItems();
  });

opaTest('Test Report to report', function (Given, When, Then) {
	  // Arrangements
	    Given.iStartTheApp("#/Table", "CNTRL=CTRL1");
	  //Actions
	    When.onTheTableViewerPage.iWaitUntilTheTableIsLoaded();
	  // Assertions
	    Then.onTheTableViewerPage.iClickShowDetailsButton();
	});

  opaTest('Test set default red color for first dropdown', function (Given, When, Then) {
	  // Arrangements
//	    Given.iStartTheApp("#/Table", "CNTRL=CTRL1");
	  //Actions
	    When.onTheTableViewerPage.iSetDefaultColorForDropDown();
	  // Assertions
	    Then.onTheTableViewerPage.iSeeDefaultColorForDropDown();
	});

  opaTest('Test color for each range of values in table', function (Given, When, Then) {
	  // Arrangements
//	    Given.iStartTheApp("#/Table", "CNTRL=CTRL1");
	  //Actions
	    When.onTheTableViewerPage.iWaitUntilTheTableIsLoaded();  
	  // Assertions
	    Then.onTheTableViewerPage.iCheckColorForTableValues().and.iTeardownMyAppFrame();
	});

  opaTest('Should open chart tab', function(Given, When, Then){
    //Arrangements
    Given.iStartTheApp("#/Table", "CNTRL=CTRL1");
    //Actions
    When.onTheTableViewerPage.iWaitUntilTheTableIsLoaded();
    When.onTheTableViewerPage.iClickOnChartTab();
    //Assertions
    Then.onTheTableViewerPage.iSeeTheChartTab();
    
  });

  opaTest('Test Pop up on "Change Chart Type" button click', function (Given, When, Then) {
    //Arrangements
    //Given.iStartMyApp();
    //Actions
    When.onTheTableViewerPage.iClickChartTypeButton();
    //Assertions
    Then.onTheTableViewerPage.thePopUpOpens();
  });

  opaTest('Test Bar chart on opening of pop up', function (Given, When, Then) {
    //Arrangements
    //Given.iStartMyApp();
    //Actions
    When.onTheTableViewerPage.iClickChartTypeButton();
    //Assertions
    Then.onTheTableViewerPage.iSetBarChart();
  });
  
  opaTest('Test Line chart on opening of pop up', function (Given, When, Then) {
    //Arrangements
    //Given.iStartMyApp();
    //Actions
    When.onTheTableViewerPage.iClickChartTypeButton();
    //Assertions
    Then.onTheTableViewerPage.iSetLineChart();
  });

  opaTest('Test Pie chart on opening of pop up', function (Given, When, Then) {
	 //Arrangements
	 //Given.iStartMyApp();
	 //Actions
	 When.onTheTableViewerPage.iClickChartTypeButton();
	 //Assertions
	 Then.onTheTableViewerPage.iSetPieChart();
  });
  
  opaTest('Test Radar chart on opening of pop up', function (Given, When, Then) {
	  //Arrangements
	  //Given.iStartMyApp();
	  //Actions
	  When.onTheTableViewerPage.iClickChartTypeButton();
	  //Assertions
	  Then.onTheTableViewerPage.iSetRadarChart();
  });

  opaTest('Test default dimension and measure', function (Given, When, Then) {
    //Arrangements
    //Given.iStartMyApp();
    //Actions
    When.onTheTableViewerPage.iOpenFilterByDialog();
    //Assertions
    Then.onTheTableViewerPage.iSeeDefaultDimensionMeasure().and.iTeardownMyAppFrame();
  }); 
  

});
