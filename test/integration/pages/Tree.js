/*global opaTest*/
//declare unusual global vars for JSLint/SAPUI5 validation
sap.ui.define([
	"sap/ui/test/Opa5",
	"com/siemens/tableViewer/test/integration/pages/Common",
], function (Opa5, Common) {
	"use strict";
	
	Opa5.createPageObjects({
		onTreeTable: {
			baseClass: Common,
			actions: {
					iClickOnExpandButton: function () {
                    var oExpandBtn;
					return this.waitFor({
						controlType: "sap.ui.layout.FixFlex",
						viewName: "tabs.TreeXS",
						matchers: function (aFixFlex) {
							try {
								oExpandBtn = aFixFlex.getAggregation("fixContent")[1].getAggregation("fixContent")[0];
								return true;
							} catch (e) {
								return false;
							}
						},
						success: function () {
							oExpandBtn.firePress();
						},
						errorMessage: "Expand button is not found"
					});
				},
					iClickOnCollapseButton: function () {
					var oCollapseBtn;
					return this.waitFor({
						controlType: "sap.ui.layout.FixFlex",
						viewName: "tabs.TreeXS",
						matchers: function (aFixFlex) {
							try {
								oCollapseBtn = aFixFlex.getAggregation("fixContent")[1].getAggregation("fixContent")[1];	
								return true;
							} catch (e) {
								return false;
							}
						},
						success: function () {
							oCollapseBtn.$().trigger("tap");
						},
						errorMessage: "Collapse button is not found"
					});
				}
				  
						
		    },
			
			assertions: {
				    iShouldSeeNodesExpand: function () {
					    return this.waitFor({
						    controlType: "sap.ui.table.TreeTable",
						    viewName: "tabs.TreeXS",
						    success: function (aTable) {
							   var aRows = aTable[0].getRows();
							   var oflag;
							      for(var i=0;i<aRows.length;i++){
								       if(aTable[0].isExpanded(i)==="true"){
									   oflag=0;
								    }
							           else{
									   oflag=-1;
								}
							}
							if(oflag===-1){
									errorMessage:"expanded property of rows is false"
								}else{
								ok(true,"expanded property of rows is true")	
								}
							ok(true,"Hierarchy is expanded")
						},
						errorMessage: "Hierarchy Table couldnt be expanded"
					}); 
			   },
                    iShouldSeeNodesCollapse: function () {
					    return this.waitFor({
						    controlType: "sap.ui.table.TreeTable",
						    viewName: "tabs.TreeXS",
						    success: function (aTable) {
							    var aRows = aTable[0].getRows();
							    var oflag;
							       for(var i=0;i<aRows.length;i++){
								     if(aTable[0].isExpanded(i)==="false"){
									   oflag=-1;
								}
							    else{
									   oflag=0;
								}
							}
							if(oflag===0){
									errorMessage:"collapsed property of rows is false"
								}else{
								ok(true,"collapsed property of rows is true")	
								}
							ok(true,"Hierarchy is collapsed")
						},
						errorMessage: "Hierarchy Table couldnt be collapsed"
					}); 
			   }			   
		     }
		 }
	});
});