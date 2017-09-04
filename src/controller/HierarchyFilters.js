sap.ui.define([
	"com/siemens/tableViewer/model/models",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"com/siemens/tableViewer/controller/utilities"
], function (models, JSONModel, Filter, FilterOperator, utilities) {
	"use strict";
	/**
	 * Table Viewer Hierarchy Filters
	 * com.siemens.tableViewer.controller.HierarchyFilters
	 */

	/**
	 * Function to prepare child nodes for the parent node object
	 * @param {Object} oObject - Current node object
	 * @param {String} sCheckedStatus - status of selection "Checked or Unchecked"
	 * @returns {Object} oObject - Node object with added children
	 * @private
	 */
	function _handleHierarchyOdataResultObject (oObject, sCheckedStatus) {
		var aChildrens,
		iChildIndex;

		delete oObject.__metadata;
		oObject["checked"] = sCheckedStatus;
		if (oObject.CHILDREN) {
			aChildrens = oObject.CHILDREN.split("],[");
			oObject["childs"] = [];
			for (iChildIndex = 0; iChildIndex < aChildrens.length; iChildIndex++) {
				oObject["childs"].push({});
			}
		}
		return oObject;
	}
	/**
	 * Function to close the hierarchy dialog
	 * @param {Object} oDialog - Hierarchy dialog
	 * @private
	 */
	function closeHierarchyDialog (oDialog) {
		oDialog.close();
	}
	/**
	 * Retrieves column object by selected key
	 * @param {String} sKey - COLUMN Key
	 * @param {Object} oMainConfig - Main configuration model (cached model)
	 * @returns {Object} oObject - Column
	 * @private
	 */
	function _retreiveColumnModelObject (sKey, oMainConfig) {
		return jQuery.grep(oMainConfig.getProperty("/ServiceToColumnConfig/results"), function(oObject) {
			return oObject.COLUMN === sKey;
		});
	}

	return {
		/* =========================================================== */
		/* Internal/private methods                                    */
		/* =========================================================== */
		/**
		 * Event handler for opening hierarchy dialog for hierarchy filters. Gets the first level of hierarchy
		 * @param {Object} oController - filter bar controller reference
		 * @param {sap.ui.base.Event} oEvent - value help event for multi-input
		 * @private
		 */
		_openHierarchyDialog: function(oController, oEvent) {
			var sHierarchyName = oEvent.getSource().getName(),
			oMainConfig = this.getOwnerComponent()._cachedConfigData,
			sMainService = this.getOwnerComponent().getMetadata().getConfig().serviceUrl.replace("Main.xsodata", ""),
			sUrl = sMainService + "data/" + oMainConfig.getProperty("/SERVICE_NAME"),
			sEntity = "/" + oMainConfig.getProperty('/ENTITY_NAME'),
			oHierarchyDialog,
			aPath,
			oColumnProperties,
			oDialogModel,
			oAdditionalJsonDataModel,
			oModel,
			oTable;
			if (oMainConfig.getProperty("/INPUT_PARAMETERS")) {
			    aPath = sEntity.split("/");
			    aPath[1] = "FilterParams" + aPath[1].substr(aPath[1].indexOf("("));
			    aPath[2] = "HierarchyData_" + sHierarchyName;
			    this._sHierarchyFilterDataPath = aPath.join("/");
			} else {
			    this._sHierarchyFilterDataPath = "/HierarchyData_" + sHierarchyName;
			}
			oHierarchyDialog = this.byId(sHierarchyName + "--siemensUiHierarchyDialog");
			//Check if fragment already exist
			if (!oHierarchyDialog) {
				// associate controller with the fragment
				oHierarchyDialog = sap.ui.xmlfragment(oController.createId(oEvent.getSource().getName()), "com.siemens.tableViewer.view.fragments.HierarchyDialog", this);
				utilities.attachControl(oController.getView(), oHierarchyDialog);
				oColumnProperties = _retreiveColumnModelObject(sHierarchyName, oMainConfig)[0];
				// set Dialog column label
				oDialogModel = new JSONModel({
					COLUMN_LABEL: oColumnProperties.LABEL,
					HIER_PATH : this._sHierarchyFilterDataPath,
					HIER_NAME : sHierarchyName
				});
				oHierarchyDialog.setModel(oDialogModel, "hierarchyDialogViewModel");
			}
			oAdditionalJsonDataModel = new JSONModel({});
			oModel = models.createODataModelWithParameters(sUrl);
			oTable = oHierarchyDialog.getContent()[0].getContent()[0];
			this.attachRequestsForControlBusyIndicator(oModel, oTable);
			oModel.read(this._sHierarchyFilterDataPath, {
				filters: [new Filter("LEVEL", FilterOperator.EQ, 0)], // get 0 level of hierarchy
				success: function(oData) {
					for (var i = 0; i < oData.results.length; i++) {
						oData.results[i] = _handleHierarchyOdataResultObject(oData.results[i], "Unchecked");
					}
					oAdditionalJsonDataModel.setData(oData.results);
					oTable.bindRows("/");
				}
			});
			oTable.setModel(oModel, "hierarchyOData");
			oTable.setModel(oAdditionalJsonDataModel);
			oHierarchyDialog.open();
		},
		/**
		 * Method to prepare Pred and Child filters and apply these filters for HerarchyData read request
		 * @param {Array} aHierarchyNodes - Array of Pred and child nodes
		 * @param {Object} oObject - current object selected from table
		 * @returns {Array} aFilters - Array of Pred filters and child filters
		 * @private
		 */
		_preparePredChildFilters: function(aHierarchyNodes, oObject) {
			var fnGetNodefromLevel, aInitialFilters = [],
				aLevelChild = [],
				iLevel = oObject.LEVEL,
				sQueryNode = oObject.QUERY_NODE,
				aDistinctChild;
			if (aHierarchyNodes.length > 0) {
				//Get the parent and child node for the current level
				fnGetNodefromLevel = function(oObj) {
						//filter with current level and current query node to avoid unnecessary filters to be added from other levels and other pred and child nodes.
						if (oObj.level === iLevel && oObj.node === sQueryNode) {
							aLevelChild.push(oObj.child); //child nodes
						}
					};
					//array of hierarchial nodes with pred and child nodes
				aHierarchyNodes.filter(fnGetNodefromLevel);

				if (aLevelChild.length > 0) {
					//remove duplicates for child nodes
					aDistinctChild = aLevelChild.filter(function(o, i) {
						return aLevelChild.indexOf(o) == i;
					});

					//prepare filters for child nodes
					for (var iChild = 0; iChild < aDistinctChild.length; iChild++) {
						aInitialFilters.push(
							new Filter("RESULT_NODE", FilterOperator.EQ, aDistinctChild[iChild])
						);
					}
				} else {
					//if no nodes, then always take default filter
					aInitialFilters = [new Filter("PRED_NODE", FilterOperator.EQ, oObject.RESULT_NODE)];
				}
			} else {
				//if no nodes, then always take default filter
				aInitialFilters = [new Filter("PRED_NODE", FilterOperator.EQ, oObject.RESULT_NODE)];
			}
			return aInitialFilters;
		},
		/**
		 * Function to update the status of child selected to Checked, Unchecked and Mixed
		 * @param {Object} oObject - Node object from tree table
		 * @private
		 */
		_updateParent: function(oObject) {
			var iChecked = 0,
			iUnchecked = 0,
			oChild;

			for (var iChildIndex = 0; iChildIndex < oObject.childs.length; iChildIndex++) {
				oChild = oObject.childs[iChildIndex];
				//take only the valid child, neglect the object which is undefined
				if (oChild) { //if condition added is a change

					if (oChild.checked === 'Checked') {
						iChecked += 1;
					} else if (oChild.checked === 'Mixed') {
						iChecked += 1;
						iUnchecked += 1;
					} else {
						iUnchecked += 1;
					}
					if (iChecked > 0 && iUnchecked > 0) {
						oObject.checked = 'Mixed';
						return;
					}

					if (iChecked > 0) {
						oObject.checked = 'Checked';
					} else {
						oObject.checked = 'Unchecked';
					}
				}
			}
		},
		/**
		 * Function to set the child states to check box in the tree table at each level
		 * @param {Object} oObject - node or child node for which the checkboxes states need to be applied
		 * @private
		 */
		_setChildState: function(oObject) {
			var sState = oObject.checked;
			//check for only valid object, ignore objects which are undefined
			if (oObject.childs) { //if condition added
				for (var iChildIndex = 0; iChildIndex < oObject.childs.length; iChildIndex++) {
					//for (var iChildIndex = 0; iChildIndex < Object.keys(oObject.childs).length; iChildIndex++) {
					if (Object.keys(oObject.childs[0]).length === 0) {
						return;
					} else {
						//take only the valid child, neglect the object which is undefined
						if (oObject.childs[iChildIndex]) { //if condition added is a change
							oObject.childs[iChildIndex].checked = sState;
							this._setChildState(oObject.childs[iChildIndex]); //recursively
						}
					}
				}
			}
		},
		/**
		 * Method to get the filtered data for "Hierarchy" filter type columns.
		 * @param {String} sHierarchyName - Column name with Hierarchy type filter
		 * @param {Object} oController - reference for filter bar controller
		 * @private
		 */
		_readHierarchyTypeColumnsData: function(sHierarchyName, oController) {
			var aFinalFilters = this._getFilters(oController, sHierarchyName),
			oMainConfig = oController.getOwnerComponent()._cachedConfigData,
			sEntity = oMainConfig.getProperty("/ENTITY_NAME"),
			sMainService = oController.getOwnerComponent().getMetadata().getConfig().serviceUrl.replace("Main.xsodata", ""),
			sUrl = sMainService + "data/" + oMainConfig.getProperty("/SERVICE_NAME"),
			oModel = models.createODataModelWithParameters(sUrl);
			if (aFinalFilters.length > 0) {
				models.requestData(
						oModel,
						sEntity,
						sHierarchyName,
						this._handleReadSuccess.bind.apply(this._handleReadSuccess, [this].concat([oController, sHierarchyName])),
						this._handleReadError.bind(this),
						false,
						aFinalFilters);
			}else {
				if (oController.getModel("HierarchyFilterModel" + sHierarchyName)) {
					oController.getModel("HierarchyFilterModel" + sHierarchyName).setProperty("/aHierarchyNodes", []);
				}
			}
		},
		/**
		 * Success handler for read of main odata service for selected hierarchy enabled columns
		 * on success oData results which are actually the leaf of the hierarchy will be used to compare with the hierarchial data
		 * @param {object} oController - reference to filter bar controller
		 * @param {String} sHierarchyName - Hierarchy name
		 * @param {object} oData - data received on success of odata read request
		 * @private
		 */
		_handleReadSuccess: function(oController, sHierarchyName, oData) {
			var aData = oData.results;
			if (aData.length > 0) {
				this._filterHierarchyValueHelp(aData, oController, sHierarchyName);
			}
		},

		/**
		 * Error handler for read of main odata service for selected hierarchy enabled columns
		 * @param {object} oError - data received on success of odata read request
		 * @private
		 */
		_handleReadError: function(oError) {
			jQuery.sap.log.error(oError);
		},
		/**
		 * Method to get the filters applied excluding filters for which the hierarchy filter dialog is opened
		 * @param {Object} oController - reference to filter bar controller
		 * @param {String} sHierarchyName - Hierarchy Name
		 * @returns {Array} Array of filters - array of filters excluding filters for which the hierarchy filter is opened
		 * @private
		 */
		_getFilters: function(oController, sHierarchyName) {
			var oFilterBar = oController.byId("filterBar"),
			aFetchData = oController._fetchData.bind(oFilterBar)();
			for (var i in aFetchData) {
				if (i === sHierarchyName && aFetchData[sHierarchyName]) {
					delete aFetchData[sHierarchyName];
				}
			}
			return oController._generateFilters(aFetchData);
		},

		/**
		 * Compare values received with the hierarchial data to get the values to prepare the dependent filter
		 * @param {Array} aData - array of data received on success of read request
		 * @param {Object} oController - reference to filter bar controller
		 * @param {String} sHierarchyName - Hierarchy Name
		 * @private
		 */
		_filterHierarchyValueHelp: function(aData, oController, sHierarchyName) {
			var oMainConfig = oController.getOwnerComponent()._cachedConfigData,
			sPath = oController._sHierarchyFilterDataPath,
			sMainService = oController.getOwnerComponent().getMetadata().getConfig().serviceUrl.replace("Main.xsodata", ""),
			sUrl = sMainService + "data/" + oMainConfig.getProperty("/SERVICE_NAME"),
			oModel = models.createODataModelWithParameters(sUrl),
			oFilterModel = new JSONModel(),
			aFilters = [],
			aHierarchyNodes = [],
			aHierachyData,
			sHierarchyPath,
			aNodes,
			iLevel,
			sLeaf;

			//prepare filters for the hierarchy leaf results received from main odata service.
			jQuery.each(aData, function(iIndex, oObj) {
				aFilters.push(new Filter("RESULT_NODE_NAME", FilterOperator.EQ, oObj[sHierarchyName]));
			});
			//also add a filter to get only the leaf with value 1
			aFilters.push(new Filter("IS_LEAF", FilterOperator.EQ, 1));

			oModel.read(sPath, {
				filters: aFilters,
				success: function(oHierarchyData) {
					aHierachyData = oHierarchyData.results;
					if (aHierachyData.length > 0) {
						jQuery.each(aHierachyData, function(j, oHierarchy) {
							//use the path to determine the parent and child nodes
							//split by "/" from PATH to get the hierarchy structure
							sHierarchyPath = oHierarchy.PATH;
							aNodes = sHierarchyPath.split("/");
							iLevel = oHierarchy.LEVEL; //level at which the leaf is matched
							sLeaf = oHierarchy.RESULT_NODE; //leaf level result node

							for (var iNode = 0; iNode < aNodes.length; iNode++) {
								var iChildIndex; //prepare the pointer for the child node, where iChildIndex is the parent node pointer and current level
								if (iLevel > iNode + 1) {
									iChildIndex = iNode + 1;
								} else {
									iChildIndex = iLevel; //child node pointer cannot exceed the level of the leaf
								}
								//for level level node take the value from oData1 to be more accurate.
								if (iChildIndex === iLevel) {
									aNodes[iChildIndex] = sLeaf;
								}
								//array containing level, parent node and child node
								aHierarchyNodes.push({
									level: iNode,
									node: aNodes[iNode],
									child: aNodes[iChildIndex]
								});
							}
						});
					}

					oFilterModel.setProperty("/aHierarchyNodes", aHierarchyNodes);
					//check if the model already exist else set the model with data.
					if (oController.getModel("HierarchyFilterModel" + sHierarchyName)) {
						oController.getModel("HierarchyFilterModel" + sHierarchyName).setProperty("/aHierarchyNodes", aHierarchyNodes);
					} else {
						oController.setModel(oFilterModel, "HierarchyFilterModel" + sHierarchyName);
					}

				}
			});
		},
		/**
		 * Method to reset hierarchy filter model properties during reset of filters
		 * @param {Object} oMainConfig - Main configuration model with cache
		 * @param {Object} oController - reference to filter bar controller
		 * @private
		 */
		_resetHierarchyFilterModel: function(oMainConfig, oController) {
			var aColumns = this._getHierarchyTypeColumns(oMainConfig);

			jQuery.grep(aColumns, jQuery.proxy(function(oObject) {
				if (oController.getModel("HierarchyFilterModel" + oObject)) {
					oController.getModel("HierarchyFilterModel" + oObject).setProperty("/aHierarchyNodes", []);
				}
			}));
		},
		/**
		 * Method to get the columns with filter type hierarchy
		 * @returns {Object} oMainConfig - Main configuration model with cache
		 * @private
		 */
		_getHierarchyTypeColumns: function(oMainConfig) {
			var aHierarchyColumns = [];
			jQuery.grep(oMainConfig.getProperty("/ServiceToColumnConfig/results"), function(oObject) {
				if (oObject.FILTERTYPE === "Hierarchy") {
					aHierarchyColumns.push(oObject.COLUMN);
				}
			});
			return aHierarchyColumns;
		},
		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */
		/**
		 * Event handler for on toggle event of tree table nodes. On close or open event of nodes in tree table.
		 * @param {sap.ui.base.Event} oEvent - toggle event in tree table
		 * @public
		 */
		onToggleState : function (oEvent) {
			var oObject = oEvent.getParameter("rowContext").getObject(),
			oModel = oEvent.getSource().getModel("hierarchyOData"),
			oAdditionalJsonDataModel = oEvent.getSource().getModel(),
			sCkechedStatus = oObject.checked,
			oViewModel = oEvent.getSource().getModel("hierarchyDialogViewModel"),
			sPath = oViewModel.getProperty("/HIER_PATH"),
			sHierarchyName = oViewModel.getProperty("/HIER_NAME"),
			oController = oEvent.getSource().getParent().getParent().getParent().getController(),
			oDependentFiltersModel,
			aHierarchyNodes,
			aFinalFilter = [];

			if (Object.keys(oObject.childs[0]).length !== 0) {
				return;
			}
			//Get the Pred nodes and child nodes from hierarchy filter model
			oDependentFiltersModel = oController.getModel("HierarchyFilterModel" + sHierarchyName);

			if (oDependentFiltersModel) {
				aHierarchyNodes = oDependentFiltersModel.getProperty("/aHierarchyNodes");
				//filter for a current level with pred and child nodes as filters
				aFinalFilter = this._preparePredChildFilters(aHierarchyNodes, oObject);
			} else {
				//default filter
				aFinalFilter = [new Filter("PRED_NODE", FilterOperator.EQ, oObject.RESULT_NODE)];
			}
			oModel.read(sPath, {
				filters: aFinalFilter, //apply filter with pred and child nodes as filter
				success: function(oData) {
					for (var i = 0; i < oData.results.length; i++) {
						oData.results[i] = _handleHierarchyOdataResultObject(oData.results[i], sCkechedStatus);
						oObject.childs[i] = oData.results[i];
					}
					//delete any empty objects to avoid showing blank or empty entry in tree table.
					for (var iChild = 0; iChild < oObject.childs.length; iChild++) {
						if (Object.keys(oObject.childs[iChild]).length === 0) {
							delete oObject.childs[iChild];
						}
					}
					oAdditionalJsonDataModel.updateBindings();
				}
			});
		},
		/**
		 * Event handler for Ok press event in the hierarchy dialog
		 * @param {sap.ui.base.Event} oEvent - Ok press event in hierarchy dialog
		 * @public
		 */
		onConfirmHierarchyFilter: function (oEvent) {
			var oDialog = oEvent.getSource().getParent().getParent(),
			oTable = oDialog.getContent()[0].getContent()[0],
			oModel = oTable.getModel(),
			oData = oModel.getData(),
			oDataModel = oTable.getModel("hierarchyOData"),
			oFilterController = oDialog.getParent().getController(),
			oFilterBar = oFilterController.byId("filterBar"),
			oViewModel = oDialog.getModel("hierarchyDialogViewModel"),
			sPath = oViewModel.getProperty("/HIER_PATH"),
			sHierName = oViewModel.getProperty("/HIER_NAME"),
			aLeafs = [],
			aMissedLeafs = [],
			oControl,
			aFilters;

			var getLeafs = function(oObjects) {
				// Check if object selected
				//get only the object which is valid and other valid properties
				if (oObjects && (oObjects.checked === "Mixed" || oObjects.checked === "Checked")) {
					// Check if object is leaf
					if (oObjects.IS_LEAF === 0) {
						// Check if childs loaded
						if (Object.keys(oObjects.childs[0]).length === 0) {
							aMissedLeafs.push(new Filter("PATH", FilterOperator.Contains, oObjects.PATH));
						} else {
							for (var iChildObject = 0; iChildObject < oObjects.childs.length; iChildObject++) {
								getLeafs(oObjects.childs[iChildObject]); //recursively
							}
						}
					} else {
						aLeafs.push(new sap.m.Token({
							text: oObjects.RESULT_NODE_NAME
						}).data("path", oObjects.PATH));
					}
				}
			};

			// Check hierarchy for data
			for (var iODataObject = 0; iODataObject < oData.length; iODataObject++) {
				getLeafs(oData[iODataObject]);
			}
			oControl = oFilterBar.determineControlByName(sHierName);
			// Get missed leaf data from backend
			if (aMissedLeafs.length > 0) {
				aFilters = [new Filter(aMissedLeafs, false), new Filter("IS_LEAF", FilterOperator.EQ, 1)];

				oDataModel.read(sPath, {
					filters: [new Filter(aFilters, true)],
					success: function(oData) {
						for (var iResult = 0; iResult < oData.results.length; iResult++) {
							aLeafs.push(new sap.m.Token({
								text: oData.results[iResult].RESULT_NODE_NAME
							}).data("path", oData.results[iResult].PATH));
						}
						oControl.setTokens(aLeafs);
						oFilterBar.fireSearch();
						closeHierarchyDialog(oDialog);
					}
				});
			} else {
				oControl.setTokens(aLeafs);
				oFilterBar.fireSearch();
				closeHierarchyDialog(oDialog);
			}
		},
		/**
		 * Event handler for Cancel press event in the hierarchy dialog
		 * @param {sap.ui.base.Event} oEvent - Cancel press event in hierarchy dialog
		 * @public
		 */
		onCancelHierarchyFilter: function (oEvent) {
			var oDialog = oEvent.getSource().getParent().getParent();
			closeHierarchyDialog(oDialog);
		},
		/**
		 * Event handler for change of selection of checkboxes in hierarchy filter dialog
		 * @param {sap.ui.base.Event} oEvent - checkbox change event in tree table in filter dialog
		 * @public
		 */
		onChangeCheckBox : function (oEvent) {
			var oNode = oEvent.getSource(),
			oBinding = oNode.getBindingContext(),
			sPath = oBinding.getPath(),
			sParentPath = sPath.substring(0, sPath.lastIndexOf('/childs')),
			oTable = oNode.getParent().getParent(),
			oObject = oBinding.getObject(),
			sParentObj;
			this._setChildState(oObject);
			while (sParentPath !== "") {
				sParentObj = oTable.getModel().getProperty(sParentPath);
				this._updateParent(sParentObj);
				sParentPath = sParentPath.substring(0, sParentPath.lastIndexOf('/childs'));
			}
		},
		/**
		 * On before open event handler for Hierarchy filter dialog. Before open of hierarchy dialog apply the dependent filters to the tree table
		 * @param {sap.ui.base.Event} oEvent - on before open event
		 * @public
		 */
		onBeforeHierarchy: function(oEvent) {
			var oDialogModel = oEvent.getSource().getModel("hierarchyDialogViewModel"),
			oController = oEvent.getSource().getParent().getController();
			this._readHierarchyTypeColumnsData(oDialogModel.getProperty("/HIER_NAME"), oController);
		}
    };
});