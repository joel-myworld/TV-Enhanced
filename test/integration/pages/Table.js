sap.ui.define([
	"sap/ui/test/Opa5",
	"com/siemens/tableViewer/test/integration/pages/Common",
	"sap/ui/test/matchers/AggregationFilled",
	"sap/ui/test/matchers/PropertyStrictEquals"

], function (Opa5, Common, AggregationFilled, PropertyStrictEquals) {
	"use strict";

	var config = {
		ui: {
			elements: {
				table: "siemens.ui.analyticaltable",
				treetable: "siemens.ui.treetable",
				measures: "siemens.ui.measure.select",
				dimensions: "siemens.ui.dimension.select",
				filterbar: "siemens.ui.filterbar",
				chartSettings: "siemensUiChartSettings",
				rowSlider: "siemensUiRowCountSlider",
				rowInput: "siemensUiRowCountInput",
				toggleSettings: "siemensUiToggleFullScreen"
			},
			defaultChartType: "siemensUiBarChart"
		},
		viewName: "TableViewer"
	};

	this._oChartSettingsPanel = "";


	Opa5.createPageObjects({
		onTheTableViewerPage: {
			baseClass: Common,
			actions: {
				iFoundButton: function () {
					return this.waitFor({
						controlType: "sap.m.Button",
						viewName: "tabs.Table",
						success: function (aButtons) {
							var oPersoButton = aButtons[4];
							oPersoButton.$().trigger("tap");
						},
						errorMessage: "Did not find the download Button"
					});
				},
				iFindGlobalVariantButton: function() {
					return this.waitFor({
						controlType: "sap.m.Button",
						viewName: "VariantManagement",
						success: function(aButtons) {
							var oGlobalVariantButton = aButtons[1];
							oGlobalVariantButton.fireEvent("press");
						},
						errorMessage: "Did not find the Global Variant Management Button"
					});
				},
				iFindSortButton: function () {
					return this.waitFor({
						controlType: "sap.m.Button",
						viewName: "tabs.Table",
						success: function (aButtons) {
							var oSortButton = aButtons[2];
							oSortButton.fireEvent("press");
						},
						errorMessage: "Did not find the sort Button"
					});
				},
				iFindClearButton: function() {
					return this.waitFor({
						controlType: "sap.m.Button",
						viewName: "FilterBar",
						success: function(aButtons) {
							var oClearButton = aButtons[1];
							var oFilter = oClearButton.getParent().getParent().getParent().getParent().getFilterItems()[0];
							if (oFilter.getProperty("visibleInFilterBar") === true){

							}
							oClearButton.fireEvent("press");
						},
						errorMessage: "Did not find the Clear Button"
					});
				},
				iFindTheHideFiltersButton: function() {
					return this.waitFor({
						controlType: "sap.m.Button",
						viewName: "FilterBar",
						success: function(aButtons) {
							var oHideFilterButton = aButtons[0];
							oHideFilterButton.firePress();
						},
						errorMessage : "Did not find the Hide Filter Button"
					});
				},

				iClickFiltersButton: function() {
					return this.waitFor({
						controlType: "sap.m.Button",
						viewName: "FilterBar",
						success: function(aButtons) {
							var oFiltersButton = aButtons[2];
							oFiltersButton.firePress();
						},
						errorMessage: "Did not find the Filters Button"
					});
				},

				iSelectMaterialField: function () {
					return this.waitFor({
						controlType: "sap.m.Dialog",
						viewName: "FilterBar",
						success: function (aDialogs) {
							   if (aDialogs[0].getTitle() === "Filters") {
								   //take material as example
								   var oMaterialValueInputCheck = aDialogs[0].getAggregation("content")[0].getAggregation("formContainers")[1].getAggregation("formElements")[1].getAggregation("fields")[1];
								   oMaterialValueInputCheck.setEnabled(true);
							} else {
								   ok(false, "Filter options dialog couldnt be opened");
							}
						},
						errorMessage: "Filter option dialog is not opened"
					});
				},

				iSelectMultiInputFilterControl: function () {
					return this.waitFor({
						controlType: "sap.m.Dialog",
						viewName: "FilterBar",
						success: function (aDialogs) {
							   if (aDialogs[0].getTitle() === "Filters") {
								   //take calmonth as example
								   var oNUCAFValueInput = aDialogs[0].getAggregation("content")[0].getAggregation("formContainers")[1].getAggregation("formElements")[6].getAggregation("fields")[0];
								   oNUCAFValueInput.fireValueHelpRequest();
							} else {
								   ok(false, "Filter options dialog couldnt be opened");
							}
						},
						errorMessage: "Filter option dialog is not opened"
					});
				},

				iEnterIncludeData: function () {
					return this.waitFor({
						searchOpenDialogs: true,
						controlType: "sap.ui.comp.valuehelpdialog.ValueHelpDialog",
						viewName: "FilterBar",
						success: function (aValueHelpDialogs) {
							var mArgs = {},
							   oInput = aValueHelpDialogs[0].getAggregation("content")[0].getContent()[0].getContent()[0].getAggregation("content")[0].getAggregation("content")[0].getAggregation("content")[0].getAggregation("content")[0].getAggregation("content")[5];
							   mArgs.value = "FLE";
							   oInput.setValue("FLE-");
							   oInput.focus();
							   oInput.setShowSuggestion(true);
							   oInput.setValueLiveUpdate(true);
							   oInput.fireSuggest({suggestValue : "FLE-1"});
							//    oInput.fireLiveChange();
							//    oInput._oSuggestionPopup.open();
						},
						errorMessage: "Selected value help dialog couldnt be opened for entering Include condition data"
					});
				},

				iSetIncludeExcludeCondition: function () {
					return this.waitFor({
						searchOpenDialogs: true,
						controlType: "sap.ui.comp.valuehelpdialog.ValueHelpDialog",
						viewName: "FilterBar",
						success: function (aValueHelpDialogs) {
							   //Include
							   aValueHelpDialogs[0].getAggregation("content")[0].getAggregation("content")[0].getAggregation("content")[0].getAggregation("content")[0].getAggregation("content")[0].getAggregation("content")[0].getAggregation("content")[0].getAggregation("content")[5].setValue("2010");
							   aValueHelpDialogs[0].getAggregation("content")[0].getAggregation("content")[0].getAggregation("content")[0].getAggregation("content")[0].getAggregation("content")[0].getAggregation("content")[0].getAggregation("content")[0].getAggregation("content")[5].fireChange();
							   //Exclude
							   aValueHelpDialogs[0].getAggregation("content")[0].getAggregation("content")[0].getAggregation("content")[0].getAggregation("content")[1].getAggregation("content")[0].getAggregation("content")[0].getAggregation("content")[0].getAggregation("content")[5].setValue("2016");
							   aValueHelpDialogs[0].getAggregation("content")[0].getAggregation("content")[0].getAggregation("content")[0].getAggregation("content")[1].getAggregation("content")[0].getAggregation("content")[0].getAggregation("content")[0].getAggregation("content")[5].fireChange();

							   aValueHelpDialogs[0].getButtons()[0].firePress();
							   ok(true, "Defined include and exclude conditions");
						},
						errorMessage: "Selected value help dialog couldnt be opened"
					});
				},

				iPressCancelOnFiltersDialog: function () {
					return this.waitFor({
						searchOpenDialogs: true,
						controlType: "sap.m.Dialog",
						viewName: "FilterBar",
						success: function (aDialogs) {
							if (aDialogs[0].getTitle() === "Filters") {
								var oCancelButton = aDialogs[0].getButtons()[3];
								oCancelButton.firePress();
							}
						},
						errorMessage: "Filter option dialog couldnt be found"
					});
							
			},

			 theFiltersDialogShouldBeClosed: function () {
				    return this.waitFor({
					searchOpenDialogs: true,
					controlType: "sap.m.Dialog",
					viewName: "FilterBar",
					success: function (aDialogs) {
						if(aDialogs[0].getTitle() === "Filters") {
							aDialogs[0].close();
							ok(true, "Filter dialog closed");
						}else {
							ok(false, "Could not close filter dialog");
						}
					},
					errorMessage: "Could not close dialog"
				});
			},

			iOpenValueHelp: function() {
					return this.waitFor({
						id: "filterBar",
						viewName: "FilterBar",
						success: function (oFilterBar) {
							   var oValueHelp = oFilterBar.getAggregation("content")[1].getAggregation("content")[0].getAggregation("content")[1];
							   oValueHelp.fireValueHelpRequest();
						},
						errorMessage: "Couldnt find any filters pre-selected"
					});
				},

				iClickTheVariantName: function() {
					return this.waitFor({
						controlType: "sap.m.Button",
						viewName: "VariantManagement",
						success: function(aButtons) {
							var oVariantManagementButton = aButtons[0];
							oVariantManagementButton.firePress();
						},
						errorMessage: "Did not find the Variant List"
					});
				},
				iClickOnExportToExcel: function() {
					return this.waitFor({
						controlType: "sap.m.Button",
						viewName: "tabs.Table",
						success: function(aButtons) {
							var oExportButton = aButtons[4];
							oExportButton.firePress();
						},
						errorMessage: "Did not find the Export to Excel button"
					});
				},
				iClickCellColoringButton: function() {
					return this.waitFor({
						controlType: "sap.m.Button",
						viewName: "tabs.Table",
						success: function(aButtons) {
							var cellColorButton = aButtons[0];
							cellColorButton.firePress();
						},
						errorMessage: "Did not find the Cell color Button"
					});
				},
				iSetValuesRange: function () {
					return this.waitFor({
						controlType: "sap.m.Input",
						viewName: "tabs.Table",						
						success: function (aInput) {
						    var oMinRange,oMaxRange;
						    oMinRange = aInput[2];
						    oMaxRange = aInput[3];
						    oMinRange.setValue(2000.00);
						    oMaxRange.setValue(25000000.00);
						}
					});
				},
				iClickColumnSettingsButton: function() {
					return this.waitFor({
						controlType: "sap.m.Button",
						viewName: "tabs.Table",
						success: function(aButtons) {
							var columnSorting = aButtons[3];
							columnSorting.firePress();
						},
						errorMessage: "Did not find the Column Setting Button"
					});
				},

				iMoveSlider: function () {
					return this.waitFor({
						controlType: "sap.ui.commons.RangeSlider",
						viewName: "tabs.Table",						
						success: function (oRangeSlider) {
						    oRangeSlider[0].setValue(parseFloat(12953610.03));
						    oRangeSlider[0].setValue2(parseFloat(17103370.50));
						},
						errorMessage: "could not move the slider"
					});
				},

				iMoveSlider1: function () {
					return this.waitFor({
						controlType: "sap.ui.commons.RangeSlider",
						viewName: "tabs.Table",						
						success: function (oRangeSlider) {
						    oRangeSlider[0].setValue(parseFloat(12953610.03));
						    oRangeSlider[0].setValue2(parseFloat(17103370.50));
						    oRangeSlider[0].getCustomData()[0].setValue("NUCAF");
						    // oRangeSlider[0].getCustomData()[0].setValue("0:12953610.03&12953610.03:17103370.50&17103370.50:25000000");
						    // oRangeSlider[0].fireLiveChange({value:12953610.03});
						    oRangeSlider[0].fireChange({value:12953610.03});
						},
						errorMessage: "could not move the slider"
					});
				},

				iSetDefaultColorForDropDown: function () {
					return this.waitFor({
						controlType: "sap.m.HBox",
						viewName: "tabs.Table",						
						success: function (oHLayout) {
						    var oDropdown1 =  oHLayout[4].getItems()[0].setSelectedKey("#e34352");
						},
						errorMessage: "Default color is set for first dropdown"
					});
				},

				iWaitUntilTheTableIsLoaded: function () {
					return this.waitFor({
						id: "table",
						viewName: "tabs.Table",
						matchers: [new AggregationFilled({name: "rows"})],
						errorMessage: "The Table has not been loaded"
					});
				},
				iClickOnChartTab: function() {
					return this.waitFor({
						controlType: "sap.m.IconTabBar",
						viewName: "Main",
						success: function(aIconTabBars) {
							var IconTabBar = aIconTabBars[0];
							var mArguments = {};
							mArguments.item = IconTabBar.getItems()[1];
							mArguments.selectedItem = IconTabBar.getItems()[1];
							mArguments.key = "Chart";
							mArguments.selectedKey = "Chart";
							IconTabBar.fireSelect(mArguments);
						},
						errorMessage: "Did not find the chart tab"
					});
				},
				iClickChartTypeButton: function () {
					return this.waitFor({
						viewName: "tabs.Chart",
						controlType: "sap.m.Panel",
						success: function (aPanel) {
							
						   var oChartPanel = aPanel[0];
						   oChartPanel.getHeaderToolbar().getContent()[2].firePress();
						 },
						errorMessage: "Couldnt find change chart type button in chart tab"
					});
				},
				iOpenFilterByDialog: function () {
					return this.waitFor({
						viewName: "tabs.Chart",
						controlType: "sap.m.Panel",
						success: function (aPanel) {
							
						   var oChartPanel = aPanel[0];
						   oChartPanel.getHeaderToolbar().getContent()[3].firePress();
						 },
						errorMessage: "Couldnt find Toggle Legend button in chart tab"

					});
				}


			}, // end of actions

            assertions: {
                iShouldSeeResult: function () {
					return this.waitFor({
						controlType: "sap.m.Button",
						viewName: "tabs.Table",
						success: function (aButtons) {
							if (aButtons[4].getIcon() === "sap-icon://download")
								ok(true, "found the download button");
						}
					});
				},
				iShouldSeeVariantManagementDialog: function () {
					var that = this;
					return this.waitFor({
						controlType: "sap.m.Dialog",
						viewName: "VariantManagement",
						success: function(aDialogs) {
							if (aDialogs[0].getContent()["0"].getPages()["0"].getProperty("title") === aDialogs[0].getParent().getController().getResourceBundle().getText("sharedVariantMngt.Dialog.Title")){
								ok(true, "Variant Management Dialog open")
							}
							aDialogs[0].close();
						}
					});
				},
				iShouldSeeSortDialog: function () {
					return this.waitFor({
						controlType: "sap.m.Dialog",
						viewName: "tabs.Table",
						success: function(aDialogs) {
							if (aDialogs[0].getId().includes("Table--sortingDialog")){
								ok(true, "Sort Management Dialog open")
							}
							aDialogs[0].close();
						}
					});
				},
				allFiltersShouldBeCleared: function() {
					return this.waitFor({
						controlType: "sap.ui.comp.filterbar.FilterBar",
						viewName: "FilterBar",
						success: function(aFilterBar) {
							var aFilters = aFilterBar[0]._getFiltersWithValues();
							if (!aFilters.length){
								ok(true, "All Filters are clear");
							} 

						}
					});
				},
				theFiltersDialogOpens: function () {
					return this.waitFor({
						controlType: "sap.m.Dialog",
						viewName: "FilterBar",
						success: function (aDialogs) {
							if (aDialogs[0].getTitle() === "Filters") {
								ok(true, "Filter options dialog opened");
							} else {
								ok(false, "Filter options dialog couldnt be opened");
							}
							// aDialogs[0].close();
						},
						errorMessage: "Filter option dialog couldnt be found"
					});
				},

				iShouldSeeSelectedValueHelpDialog: function () {
					return this.waitFor({
						searchOpenDialogs: true,
						controlType: "sap.ui.comp.valuehelpdialog.ValueHelpDialog",
						viewName: "FilterBar",
						success: function (aValueHelpDialogs) {
							var oDefineConditionButton = aValueHelpDialogs[0].getAggregation("customHeader").getAggregation("contentRight")[0];
							oDefineConditionButton.firePress();
							ok(true, "Value help dialog define conditions button triggered");
							// aDialogs[0].close();
						},
						errorMessage: "Selected value help dialog couldnt be opened"
					});
				},

				iShouldSeeSuggestionList: function () {
					return this.waitFor({
						searchOpenDialogs: true,
						controlType: "sap.m.Popover",
						viewName: "FilterBar",
						success: function (aPopover) {
							ok(true, "Suggestion list is visible");
							aPopover[0].close();
						},
						errorMessage: "Suggestion list is not found"
					});
				},

				iShouldSeeConditionsInFilterDialog: function () {
				   	return this.waitFor({
						searchOpenDialogs: true,
						controlType: "sap.m.Dialog",
						viewName: "FilterBar",
						success: function (aDialogs) {
							var oNUCAFValueInput = aDialogs[0].getAggregation("content")[0].getAggregation("formContainers")[1].getAggregation("formElements")[6].getAggregation("fields")[0].getAggregation("tokenizer");
							if (oNUCAFValueInput.getTokens().length > 0) {
//								aDialogs[0].getButtons()[0].firePress();
								ok(true, "Include Exclude conditions set successfully");
							} else {
								ok(false, "Include Exclude conditions not set successfully");
							}
							aDialogs[0].close();
						},
						errorMessage: "Selected value help dialog couldnt be opened"
					});
				},

				iShouldSeeMaterialFieldChecked: function () {
					return this.waitFor({
						controlType: "sap.m.Dialog",
						viewName: "FilterBar",
						success: function (aDialogs) {
							var oMaterialValueInputCheck = aDialogs[0].getAggregation("content")[0].getAggregation("formContainers")[1].getAggregation("formElements")[1].getAggregation("fields")[1]; 
							  if(oMaterialValueInputCheck.getEnabled() === true){
								ok(true,"Material field is checked");
							  }
							  else{
								  ok(true,"Material field is not checked");
							  }
							},
						errorMessage: "couldn't find the material field"
					});
				},

				iSeeBusyIndicator: function() {
					return this.waitFor({
						searchOpenDialogs: true,
						controlType: "sap.ui.comp.valuehelpdialog.ValueHelpDialog",
						viewName: "FilterBar",
						visible: true,
						timeout: 45,
						pollingInterval : 600,
						check : function (aValueHelpDialogs) {
				              if(aValueHelpDialogs[0].getContent()[0].getAggregation("content")[0].getAggregation("content")[0].getBusy()) {
				             	return true;
				             }else {
				             	return false;
				             }
				        },
						success: function (aValueHelpDialogs) {
							ok(true, "busy indicator shown");
						},
						errorMessage: "couldnt show busy indicator"
					});
				},

				allFiltersShouldBeHidden: function() {
					return this.waitFor({
						controlType: "sap.ui.comp.filterbar.FilterBar",
						viewName: "FilterBar",
						success: function(aFilterBar) {
							if (!aFilterBar[0].getFilterBarExpanded()) {
								ok(true, "All Filters hidden");
							}
						}
					});
				},
				iShouldSeeTheVariantList: function() {
					return this.waitFor({
						controlType: "com.siemens.tableViewer.control.ExtendedVariantManagement",
						viewName: "VariantManagement",
						success: function(aDialogs) {
							if (aDialogs[0].oVariantPopOver.getTitle() === "Variants") {
								ok(true, "Variant List is shown");
							}
							aDialogs[0].oVariantPopOver.close();
						}
					});
				},
				iSelectTheFileFormat: function() {
					return this.waitFor({
						controlType: "sap.m.Popover",
						viewName: "tabs.Table",
						success: function(aPopover) {
							if (aPopover[0].getContent()[0].getItems()[0].getIcon() === "sap-icon://excel-attachment") {
								aPopover[0].getContent()[0].getItems()[0].firePress();
								ok(true, "Export to excel successfully done");
							}
							aPopover[0].close();
						}
					});
				},
				iSeeCellColoringDialog: function() {
					return this.waitFor({
						controlType: "sap.m.Dialog",
						viewName: "tabs.Table",
						success: function(aDialogs) {
							if (aDialogs[0].getTitle() === "Cell color configuration" ){
								ok(true, "Cell Color Dialog opened");
							}
							// aDialogs[0].close();
						}
					});
				},
				iSeeTheColumnSettingsDialog: function() {
					var dialog;
					return this.waitFor({
						controlType: "com.siemens.tableViewer.control.ExtendedTablePersoController",
						viewName: "Main",
						success: function(aDialogs) {
							dialog = aDialogs[0];
							if (aDialogs[0].getTitle() === "Columns" ) {
								ok(true, "Column Settings Dialog found");
							}
							aDialogs[0].close();
						},
						errorMessage: "Could not find the Column Settings Dialog"
					});
				},

				theTitleShouldDisplayTheTotalAmountOfItems: function () {
					return this.waitFor({
						id: "table",
						viewName: "tabs.Table",
						matchers: new AggregationFilled({name: "rows"}),
						success: function (oTable) {
							   var iObjectCount = oTable.getBinding("rows").iLength;
							   var sTitleId = oTable.getAggregation("toolbar").getAggregation("content")[0].sId;
							   this.waitFor({
								   controlType: "sap.m.Title",
								   viewName: "tabs.Table",
								   matchers: function (aTitle) {
									   if (aTitle.length > 1) {
										   for (var iTitle in aTitle) {
											   if (aTitle[iTitle].sId === sTitleId) {
												   var oTitle = aTitle[iTitle];
												   break;
											}
										}
									} else {
										   var oTitle = aTitle;
									}
									   var sExpectedText = oTitle.getModel("mainView").getData()["TABLE_TITLE"] + " " + "[" + oTitle.getModel("tableView").getData()["rowCount"] + "]";
									   return new PropertyStrictEquals({
										   name: "text",
										   value: sExpectedText
									}).isMatching(oTitle);
								},
								success: function () {
									//check the count for no threshold condition
									    if (oTable.getThreshold() > iObjectCount) {
										    ok(true, "Row count shown when the no. of records in the table is less than " + oTable.getThreshold());
									}
									//check the count for threshold condition
									    else if (oTable.getThreshold() < iObjectCount) {
										    ok(true, "Row count shown when the no. of records in the table is more than " + oTable.getThreshold());
									}
									//check the count for no data condition
									    else if (oTable.getShowNoData()) {
										   ok(true, "Row count shown when there are no records found in the table");
									}

								},
								errorMessage: "The Title does not contain the number of items " + iObjectCount
							});
						},
						errorMessage: "The table has no items."
					});
				},

				iClickShowDetailsButton: function () {
					return this.waitFor({
						id: "table",
						viewName: "tabs.Table",
						visible:true,
						matchers: function (oTable) {
							return oTable.getBinding("rows").iLength > 0;
						},
						success: function (oTable) {
							oTable.setSelectedIndex(1);	
							var sDetailsBtn = oTable.getAggregation("toolbar").getAggregation("content")[2]; 
					        sDetailsBtn.firePress();
							ok(true,"Report is generated on click of Show Details Button");
						},
						errorMessage: "Show Details button couldn't be found"
					});
				},

				iSeeChangeInInputValues: function () {
					return this.waitFor({
						searchOpenDialogs: true,
						controlType: "sap.m.Dialog",
						viewName: "tabs.Table",
						success: function (oDialog) {
							for ( var i=0; i< oDialog.length; i++) {
								if ( oDialog[i].getTitle() === "Cell color configuration") {
									break;
								}
							}
						    var oRangeSlider = oDialog[i].getAggregation("content")[0].getAggregation("formContainers")[0].getAggregation("formElements")[0].getAggregation("fields")[0].getAggregation("items")[0].getAggregation("items")[0].getAggregation("items")[0];
						    var oSliderVal1 = oDialog[i].getAggregation("content")[0].getAggregation("formContainers")[0].getAggregation("formElements")[0].getAggregation("fields")[0].getAggregation("items")[0].getAggregation("items")[0].getAggregation("items")[1].getAggregation("items")[0];
						    var oSliderVal2 = oDialog[i].getAggregation("content")[0].getAggregation("formContainers")[0].getAggregation("formElements")[0].getAggregation("fields")[0].getAggregation("items")[0].getAggregation("items")[0].getAggregation("items")[1].getAggregation("items")[1];
                               if(oSliderVal1.getValue() != oRangeSlider.getValue() && oSliderVal2.getValue() != oRangeSlider.getValue2()){
                            	  oSliderVal1.setValue(oRangeSlider.getValue());
                            	  oSliderVal2.setValue(oRangeSlider.getValue2());
                            	  ok(true,"Can see change in input values");
                            }
                            else{
                            	  ok(true,"Can see Slider end values changed")
                            }
							// oDialog[0].close();
						},
					});
				},

				iSeeDropdownFields: function () {
					return this.waitFor({
						searchOpenDialogs: true,
						controlType: "sap.m.Dialog",
						viewName: "tabs.Table",
						success: function (oDialog) {
							for ( var i=0; i< oDialog.length; i++) {
								if ( oDialog[i].getTitle() === "Cell color configuration") {
									break;
								}
							}
						    var sRanges = oDialog[i].getAggregation("content")[0].getAggregation("formContainers")[0].getAggregation("formElements")[0].getAggregation("fields")[0].getAggregation("items")[0].getAggregation("items")[0].getAggregation("items")[0].getAggregation("customData")[1].getValue();
						    var oHLayout =  oDialog[i].getAggregation("content")[0].getAggregation("formContainers")[0].getAggregation("formElements")[0].getAggregation("fields")[0].getAggregation("items")[1];
						    var aRanges = sRanges.split("&");
						      if(aRanges.length === oHLayout.getItems().length){
						    	  ok(true,"Dropdowns generated is as per the number of conditions");
						      }
						      else{
						    	  ok(true,"Dropdowns generated is not per the number of conditions")
						      }
							//   oDialog[0].close();
						},
						errorMessage: "Required number of dropdowns couldn't be generated"
					});
				},

				iSeeDefaultColorForDropDown: function () {
					return this.waitFor({
						searchOpenDialogs: true,
						controlType: "sap.m.Dialog",
						viewName: "tabs.Table",
						success: function (oDialog) { 
							for ( var i=0; i< oDialog.length; i++) {
								if ( oDialog[i].getTitle() === "Cell color configuration") {
									break;
								}
							}
							var oHLayout =  oDialog[i].getAggregation("content")[0].getAggregation("formContainers")[0].getAggregation("formElements")[0].getAggregation("fields")[0].getAggregation("items")[1];
							if(oHLayout.getItems()[0].getSelectedKey() === "#e34352"){
								ok(true,"Default red color is set for first dropdown")
							}
							else{
								ok(true,"Default red color couldn't be set for first dropdown")
							}
							oDialog[0].close();
						},
						errorMessage: "Couldn't set default color for first dropdown"
					});
				},

				iCheckColorForTableValues: function () {
					return this.waitFor({
						viewName: "tabs.Table",
						id: "table",
						visible:true,
						matchers: function (oTable) {
							return oTable.getBinding("rows").iLength > 0;
						},
						success: function (oTable) {
							 for(var i=0 ; i<oTable.getAggregation("rows").length ;i++){
								 if (parseFloat(oTable.getAggregation("rows")[i].getCells()[2].getText()) > parseFloat(oTable.getAggregation("rows")[i].getCells()[2].getAggregation("customData")[0].getValue().split(":")[0]) && parseFloat(oTable.getAggregation("rows")[i].getCells()[2].getText()) < parseFloat(oTable.getAggregation("rows")[i].getCells()[2].getAggregation("customData")[0].getValue().split(":")[1]) && ((oTable.getAggregation("rows")[i].getCells()[2].getCustomData()[0].getProperty("key") === "#e34352"))){
									  ok(true,"The Value lies in the range " + oTable.getAggregation("rows")[i].getCells()[2].getAggregation("customData")[0].getValue().split(":") +" and the background color is " + oTable.getAggregation("rows")[i].getCells()[2].getCustomData()[0].getProperty("key"));
								   }
								 else if (parseFloat(oTable.getAggregation("rows")[i].getCells()[2].getText()) > parseFloat(oTable.getAggregation("rows")[i].getCells()[2].getAggregation("customData")[1].getValue().split(":")[0]) && parseFloat(oTable.getAggregation("rows")[i].getCells()[2].getText()) < parseFloat(oTable.getAggregation("rows")[i].getCells()[2].getAggregation("customData")[1].getValue().split(":")[1]) && ((oTable.getAggregation("rows")[i].getCells()[2].getCustomData()[1].getProperty("key") === "#e17b24"))){
									  ok(true,"The Value lies in the range " + oTable.getAggregation("rows")[i].getCells()[2].getAggregation("customData")[1].getValue().split(":") +" and the background color is " + oTable.getAggregation("rows")[i].getCells()[2].getCustomData()[1].getProperty("key"));
							 }
								 else{
									  ok(true,"The Value lies in the range " + oTable.getAggregation("rows")[i].getCells()[2].getAggregation("customData")[2].getValue().split(":") +" and the background color is " + oTable.getAggregation("rows")[i].getCells()[2].getCustomData()[2].getProperty("key"));
								   }
								}
						 },
						errorMessage: "Default background color is not set for particular range of values"
					});
				},

				iSeeTheChartTab: function() {
					return this.waitFor({
						controlType: "sap.m.IconTabBar",
						viewName: "Main",
						success: function(aIconTab) {
							if (aIconTab[0].getSelectedKey() === "Chart") {
								ok(true, "Chart tab opened");
							}
						}
					})
				},
				thePopUpOpens: function () {
					return this.waitFor({
						controlType: "sap.m.Popover",
						viewName: "tabs.Chart",
						success: function (aPopover) {
							var oChartTypePopUp = aPopover[0].isOpen();
							if (oChartTypePopUp === true) {
                               ok(true, "Popup is opening on button click");
							}
							aPopover[0].close();
						},
						errorMessage: "No popup on button click"
					});
				},

				iSetBarChart: function () {
					return this.waitFor({
						controlType: "sap.m.Popover",
						viewName: "tabs.Chart",
						success: function (aPopover) {
							var oChartTypePopUp = aPopover[0].isOpen();
							if (oChartTypePopUp === true) {
								var oBarChart = aPopover[0].getContent()[0].getAggregation("items")[0].getTitle();
								ok(true, oBarChart + " is set");
							}
							aPopover[0].close();
						},
						errorMessage: "Bar chart is not set"
					});
				},

				iSetLineChart: function () {
					return this.waitFor({
						controlType: "sap.m.Popover",
						viewName: "tabs.Chart",
						success: function (aPopover) {
							var oChartTypePopUp = aPopover[0].isOpen();
							if (oChartTypePopUp === true) {
								var oLineChart = aPopover[0].getContent()[0].getAggregation("items")[1].getTitle();
								aPopover[0].getContent()[0].getAggregation("items")[1].firePress();
								ok(true, oLineChart + " is set");
							}
							aPopover[0].close();
						},
						errorMessage: "Line chart is not set"
					});
				},
				
				iSetPieChart: function () {
					return this.waitFor({
						controlType: "sap.m.Popover",
						viewName: "tabs.Chart",
						success: function (aPopover) {
							var oChartTypePopUp = aPopover[0].isOpen();
							if (oChartTypePopUp === true) {
								var oPieChart = aPopover[0].getContent()[0].getAggregation("items")[2].getTitle();
								aPopover[0].getContent()[0].getAggregation("items")[2].firePress();
								ok(true, oPieChart + " is set");
							}
							aPopover[0].close();
						},
						errorMessage: "Pie chart is not set"
					});
				},
				
				iSetRadarChart: function () {
					return this.waitFor({
						controlType: "sap.m.Popover",
						viewName: "tabs.Chart",
						success: function (aPopover) {
							var oChartTypePopUp = aPopover[0].isOpen();
							if (oChartTypePopUp === true) {
								var oRadarChart = aPopover[0].getContent()[0].getAggregation("items")[3].getTitle();
								aPopover[0].getContent()[0].getAggregation("items")[3].firePress();
								ok(true, oRadarChart + " is set");
							}
							aPopover[0].close();
						},
						errorMessage: "Radar chart is not set"
					});
				},
				iSeeSliderEndValuesChange: function () {
					return this.waitFor({
						searchOpenDialogs: true,
						controlType: "sap.m.Dialog",
						viewName: "tabs.Table",
						success: function (oDialog) {
							for ( var i=0; i< oDialog.length; i++) {
								if ( oDialog[i].getTitle() === "Cell color configuration") {
									break;
								}
							}							
						    var oRangeSlider = oDialog[i].getAggregation("content")[0].getAggregation("formContainers")[0].getAggregation("formElements")[0].getAggregation("fields")[0].getAggregation("items")[0].getAggregation("items")[0].getAggregation("items")[0];
						    
						    var oMinRange = oDialog[i].getAggregation("content")[0].getAggregation("formContainers")[0].getAggregation("formElements")[0].getAggregation("fields")[0].getAggregation("items")[0].getAggregation("items")[1].getAggregation("items")[1];
						    var oMaxRange = oDialog[i].getAggregation("content")[0].getAggregation("formContainers")[0].getAggregation("formElements")[0].getAggregation("fields")[0].getAggregation("items")[0].getAggregation("items")[1].getAggregation("items")[2];
                            if(oRangeSlider.getMin() != oMinRange.getValue() && oRangeSlider.getMax() != oMaxRange.getValue()){
                            	oRangeSlider.setMin(parseFloat(oMinRange.getValue()));
                            	oRangeSlider.setMax(parseFloat(oMaxRange.getValue()));
                            	ok(true,"Can see Slider end values changed");
                            }
                            else{
                            	ok(true,"Can see Slider end values changed");
							}
							// oDialog[0].close();
						},
					});
				},
				iSeeDefaultDimensionMeasure: function () {
					return this.waitFor({
						searchOpenDialogs: true,
						controlType: "sap.m.Dialog",
						viewName: "tabs.Chart",
						success: function (aDialogs) {
							var sTitle = aDialogs[0].getContent()[0].getAggregation("pages")[0].getAggregation("customHeader").getAggregation("contentMiddle")[0].getText(),
								oMeasuresItem, oDimensionsItem;
							if (sTitle === "Filter By") {
								//get the dimension and measures item
								oMeasuresItem = aDialogs[0].getContent()[0].getAggregation("pages")[0].getAggregation("content")[1].getAggregation("items")[0];
								oDimensionsItem = aDialogs[0].getContent()[0].getAggregation("pages")[0].getAggregation("content")[1].getAggregation("items")[1];
								//check the counter value to decide if the measures are selected or not.
								if (oMeasuresItem.getCounter() > 0) {
									ok(true, "Default measures are selected");
								} else {
									ok(false, "Default measures are not selected");
								}
							}
							aDialogs[0].close();
						},
						errorMessage: "Couldnt open Dialog for Filter chart settings"
					});
				}

            } // end of Assertions
		}
	});
});
