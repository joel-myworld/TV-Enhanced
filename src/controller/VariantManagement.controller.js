/*!
 * Copyright 2017 Siemens AG
 */
sap.ui.define([
	"./BaseController",
	"./ValueHelpDialog",
	"com/siemens/tableViewer/model/formatter",
	"sap/ui/comp/variants/VariantItem",
	"sap/ui/core/Fragment",
	"sap/ui/core/ValueState",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/model/Sorter",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageToast",
	"sap/m/Token"
], function (BaseController, ValueHelpDialog, formatter, VariantItem, Fragment, ValueState, Filter, FilterOperator, Sorter, JSONModel, MessageToast, Token) {
	"use strict";

	/**
	 * Constructor for Variant Management Controller
	 *
	 * @class
	 * This is an controller class for Variant Management View .
	 * @abstract
	 *
	 * @extends com.siemens.tableViewer.controller.BaseController
	 *
	 * @constructor
	 * @public
	 * @alias com.siemens.tableViewer.controller.VariantManagement
	 */
	return BaseController.extend("com.siemens.tableViewer.controller.VariantManagement", {
		formatter: formatter,
		config: {
			ui: {
				elements: {
					variantManagement: "variantManagement"
				}
			},
			fragment: {
				sharedVariantMngt: {
					id: "manageSharedVariants",
					path: "com.siemens.tableViewer.view.fragments.ManageSharedVariants"
				}
			},
			paths: {
				variantManagement: "/VariantManagement",
				userVariants: "/UserVariants"
			}
		},

		_iOriginalBusyDelay: null,
		_oVariantMngtModel: null,
		_oVariantMngt: null,
		_oVariantData: null,
		_sLastDefaultKey: null,
		_oDialog: null,

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		/**
		 * Called when the view is instantiated. It sets up the event handling and other lifecycle tasks.
		 * @public
		 */
		onInit: function () {
			var oEventBus = this.getEventBus();

			oEventBus.subscribe("VariantManagement", "FetchVariant", this._getVariantData, this);
			oEventBus.subscribe("VariantManagement", "SetVariantModified", this._setVariantModified, this);
			oEventBus.subscribe("VariantManagement", "SaveVisibleColumns", this._saveVisibleColumns, this);
			oEventBus.subscribe("VariantManagement", "SaveChartConfig", this._saveChartConfig, this);

			this._iOriginalBusyDelay = this.getView().getBusyIndicatorDelay();

			this._oVariantMngtModel = this.createViewModel();

			this._setViewProperties(this._oVariantMngtModel);

			this._oVariantMngt = this.getView().byId("variantManagement");

			this._bindVariantItems();

			// initialize the application view
			this.setModel(this._oVariantMngtModel, "variantManagementView");

			var aDefferedBatchGroups = ["onManageStandardVariants", "onCreateSharedVariants", "onUpdateSharedVariants"];
			this.getComponentModel("main").setDeferredBatchGroups(aDefferedBatchGroups);
		},

		/**
		 * Called when controller going to be destroyed.
		 * @public
		 */
		onExit: function () {
			var oEventBus = this.getEventBus();

			oEventBus.unsubscribe("VariantManagement", "FetchVariant", this._getVariantData, this);
			oEventBus.unsubscribe("VariantManagement", "SetVariantModified", this._setVariantModified, this);
			oEventBus.unsubscribe("VariantManagement", "SaveVisibleColumns", this._saveVisibleColumns, this);
			oEventBus.unsubscribe("VariantManagement", "SaveChartConfig", this._saveChartConfig, this);
		},

		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */

		/* ------------ Standard Variant Management -------------------*/

		/**
		 * Select Standard Variant Item
		 * @return {void}
		 * @public
		 */
		onSelectStandardVariant: function () {
			var sSelectedKey = this._oVariantMngt.getSelectionKey();
			var oVariant;
			var aVariantTableColumns;
			var aChartConfig;

			if (sSelectedKey === "*standard*") {
				oVariant = sSelectedKey;
				aVariantTableColumns = [];
				aChartConfig = [];
			} else {
				var oSelectedItem = this._oVariantMngt.getItemByKey(sSelectedKey);
				var oContext = oSelectedItem.getBindingContext("main");
				var sVariantData = oContext.getProperty("FILTER_OBJECT");
				var sVariantTableColumns = oContext.getProperty("TABLE_COLUMNS");
				var sChartConfig = oContext.getProperty("CHART_CONFIG");

				oVariant = sVariantData === "" ? {} : JSON.parse(decodeURI(sVariantData));
				aVariantTableColumns = sVariantTableColumns === null ? [] : JSON.parse(decodeURI(sVariantTableColumns));
				aChartConfig = sChartConfig === "" ? [] : JSON.parse(decodeURI(sChartConfig));
			}

			this._saveVisibleColumns("", "", aVariantTableColumns);
			this._saveChartConfig("", "", aChartConfig);
			this._setVariantData(oVariant, aVariantTableColumns, aChartConfig);
		},

		/**
		 * Handle click on "Save" or "Save As" button.
		 * If variant exist - update, otherwise - create a new one
		 * @param {sap.ui.base.Event} oEvent -
		 * @return {void}
		 * @public
		 */
		onSaveStandardVariant: function (oEvent) {
			var oEventBus = this.getEventBus();

			oEventBus.publish("FilterBar", "FetchVariant");

			if (oEvent.getParameter("overwrite")) {
				this._updateStandardVariant(oEvent);
			} else {
				this._createStandardVariant(oEvent);
			}
		},

		/**
		 * Update or delete standard variants in database
		 * @param {sap.ui.base.Event} oEvent -
		 * @return {void}
		 * @public
		 */
		onManageStandardVariant: function (oEvent) {
			var sDefaultKey = oEvent.getParameter("def");
			var aDeletedVariants = oEvent.getParameter("deleted");
			var aRenamedVariants = oEvent.getParameter("renamed");
			var bAnyChanges = false;

			this._createDeleteBatchOperation(aDeletedVariants, sDefaultKey);
			this._createUpdateBatchOperation(aRenamedVariants, sDefaultKey);

			if (aDeletedVariants.length > 0 || aRenamedVariants.length > 0) {
				bAnyChanges = true;
			}

			if (sDefaultKey !== this._sLastDefaultKey) {
				bAnyChanges = true;
				var sKey = sDefaultKey === "*standard*" ? this._sLastDefaultKey : sDefaultKey;
				var aFakeRenamedVariants = [{
					key: sKey,
					name: ""
				}];
				this._createUpdateBatchOperation(aFakeRenamedVariants, sDefaultKey);
			}

			if (bAnyChanges) {
				var oModel = this.getModel("main");
				oModel.setUseBatch(true);
				oModel.attachEventOnce("batchRequestCompleted", this._attachBatchRequestCompleted.bind(this));

				oModel.submitChanges({
					batchGroupId: "onManageStandardVariants"
				});
			}
		},

		/* ------------ Shared Variant Management ---------------------*/

		/**
		 * Delete shared variant
		 * @param {sap.ui.base.Event} oEvent - list item delete button click
		 * @return {void}
		 * @public
		 */
		onDeleteSharedVariant: function (oEvent) {
			var oModel = this.getModel("main");
			var oList = oEvent.getSource();
			var oContext = oEvent.getParameter("listItem").getBindingContext("main");
			var sContextPath = oContext.getPath();
			var aUsers = oContext.getProperty("FOR_USERS").split(",");
			this.getModel("main").setUseBatch(false);

			oList.attachEventOnce("updateFinished", oList.focus, oList);
			oModel.remove(sContextPath);

			jQuery.each(aUsers, function (iIndex, sUser) {
				oModel.remove(sContextPath.replace("Admin", sUser));
			});
		},

		/**
		 * Edit existing shared variant
		 * @param {sap.ui.base.Event} oEvent - list item click
		 * @return {void}
		 * @public
		 */
		onEditSharedVariant: function (oEvent) {
			var sContextPath = oEvent.getSource().getBindingContextPath();

			this._onNavToManagePage(sContextPath);
		},

		/**
		 * Handle "Create New" button on shared dialog
		 * @return {void}
		 * @public
		 */
		onCreateSharedVariant: function () {
			this._onNavToManagePage();
		},

		/**
		 * Refresh Shared Variants button handler
		 * @return {void}
		 * @public
		 */
		onRefreshSharedVariants: function () {
			var oBindings = this._oDialog._oList.getBinding("items");

			if (oBindings) {
				oBindings.refresh(true);
			}
		},

		/**
		 * Check if inputed Shared variant name exist
		 * @param {sap.ui.base.Event} oEvent - on typing shared variant name
		 * @return {void}
		 * @public
		 */
		onLiveChangeSharedVariantName: function (oEvent) {
			var oInputField = oEvent.getSource();
			var sValue = oInputField.getValue().trim();
			var oViewModel = this.getModel("variantManagementView");

			if (sValue === "") {
				oInputField.setValueState(ValueState.Error);
				oInputField.setValueStateText(this.getResourceBundle().getText("sharedVariantMngt.Dialog.ValueState.MissingName"));
			} else {
				oInputField.setValueState(ValueState.None);
				oInputField.setValueStateText(null);
			}

			if (oInputField.getValueState() !== ValueState.Error) {
				this._checkIsDuplicate(oInputField, sValue);
			}

			if (oInputField.getValueState() === ValueState.Error) {
				oViewModel.setProperty("/inputFieldPassedCheck", false);
			} else {
				oViewModel.setProperty("/inputFieldPassedCheck", true);
			}
		},

		/**
		 * On publish shared variant pressed
		 * @param {sap.ui.base.Event} oEvent - Button pressed
		 * @return {void}
		 * @public
		 */
		onPublishSharedVariants: function (oEvent) {
			var oEventBus = this.getEventBus();
			var oContext = oEvent.getSource().getBindingContext("main");

			oEventBus.publish("FilterBar", "FetchVariant");

			if (oContext) {
				this._updateSharedVariant(oContext);
			} else {
				this._createSharedVariant();
			}
		},

		/**
		 * Handle open Shared Variants dialog
		 * @return {void}
		 * @public
		 */
		onManageSharedVariants: function () {
			var oDialog = this._getDialog();
			oDialog._oNavContainer.back();
			oDialog.open();
		},

		/**
		 * Navigate back from manage dialog page to main dialog page
		 * @return {void}
		 * @public
		 */
		onNavBack: function () {
			this._oDialog._oNavContainer.back();
		},

		/**
		 * Handle Close button
		 * @return {void}
		 * @public
		 */
		onCloseSharedVariants: function () {
			this._getDialog().close();
		},

		/**
		 * Before opening dialog assign control in filter
		 * @param {Object} oEvent - standard event
		 * @return {void}
		 * @public
		 */
		onBeforeDialogOpen: function (oEvent) {
			var oDialog = oEvent.getSource(),
				oListBinding = oDialog._oList.getBinding("items");
			oListBinding.filter(new Filter("CTRLID", FilterOperator.EQ, this.getOwnerComponent()._sControlId));
		},

		/* =========================================================== */
		/* begin: internal methods                                     */
		/* =========================================================== */

		/**
		 * Refresh variants
		 * @param {sap.ui.model.json.JSONModel} oViewModel -
		 * @return {void}
		 * @private
		 */
		_refreshVariants: function () {
			if (this._oVariantMngt) {
				this._oVariantMngt.getBinding("variantItems").refresh(true);
				this._oVariantMngt.updateBindings(true);
			}
		},

		/**
		 * Set addition view properties for Shared Variant Dialog
		 * @param {sap.ui.model.json.JSONModel} oViewModel -
		 * @return {void}
		 * @private
		 */
		_setViewProperties: function (oViewModel) {
			oViewModel.setProperty("/inputFieldPassedCheck", false);
			oViewModel.setProperty("/multiInputFieldPassedCheck", false);
		},

		/**
		 * Set current variant modified when filter parameters changed
		 * @return {void}
		 * @private
		 */
		_setVariantModified: function () {
			var bModified = this._oVariantMngt.currentVariantGetModified();

			if (!bModified) {
				this._oVariantMngt.currentVariantSetModified(!bModified);
			}
		},

		/**
		 * Get Variant data from Filter Bar
		 * @param {string} sEvent -
		 * @param {string} sChannel -
		 * @param {object} oData - data from Filter Bar
		 * @return {void}
		 * @private
		 */
		_getVariantData: function (sEvent, sChannel, oData) {
			this._oVariantData = encodeURI(JSON.stringify(oData));
		},

		/**
		 * Set selected variant data to Filter Bar
		 * @param {object} oVariant - Variant data received from backend
		 * @param {array} aVariantTableColumns - Visible column array
		 * @return {void}
		 * @private
		 */
		_setVariantData: function (oVariant, aVariantTableColumns, aChartConfig) {
			var oEventBus = this.getEventBus();
			oEventBus.publish("com.tableViewer", "SetVisibleColumns", aVariantTableColumns);
			oEventBus.publish("com.tableViewer", "SetChartConfig", aChartConfig);
			oEventBus.publish("FilterBar", "ApplyVariant", oVariant);
		},

		/* ------------ Standard Variant Management -------------------*/

		/**
		 * Bind Variant Management items
		 * @return {void}
		 * @private
		 */
		_bindVariantItems: function () {
			var oVariantItemsTemplate = new VariantItem({
				text: "{main>VARIANT_NAME}",
				key: "{main>VARIANTID}",
				global: "{path: 'main>IS_GLOBAL', type: 'com.siemens.tableViewer.model.types.hanaBoolean'}",
				readOnly: "{path: 'main>IS_GLOBAL', type: 'com.siemens.tableViewer.model.types.hanaBoolean'}"
			});

			var aFilters = [new Filter("CTRLID", FilterOperator.EQ, this.getControllId()), new Filter("IS_HIDDEN", FilterOperator.EQ, 0)];

			this._oVariantMngt.bindAggregation("variantItems", {
				path: "main>" + this.config.paths.userVariants,
				template: oVariantItemsTemplate,
				sorter: new Sorter("IS_DEFAULT", true),
				filters: [new Filter(aFilters, true)],
				events: {
					dataReceived: this._standardVariantItemsDataReceived.bind(this)
				}
			});
		},

		/**
		 * Data received event in Standard Variant Management
		 * @param {sap.ui.base.Event} oEvent - dataReceived event
		 * @return {void}
		 * @private
		 */
		_standardVariantItemsDataReceived: function (oEvent) {
			var oDefVariant = oEvent.getParameter("data").results[0];
			var oEventBus = this.getEventBus();

			if (oDefVariant && !oDefVariant.IS_DEFAULT) {
				oDefVariant = undefined;
			}

			if (oDefVariant) {
				var sDefaultVariant = oDefVariant.VARIANTID;
				this._sLastDefaultKey = sDefaultVariant;
				this._oVariantMngt.setDefaultVariantKey(sDefaultVariant);
				this._oVariantMngt.setInitialSelectionKey(sDefaultVariant);
				this._oVariantMngt.fireSelect({
					key: sDefaultVariant
				});
			} else {
				this.resolveOnWhenFilterAppliedPromise(this);
			}

			oEventBus.publish("FilterBar", "SetBusyState", {
				busy: false,
				delay: this._iOriginalBusyDelay
			});
		},

		/**
		 * Create new variant record
		 * @param {sap.ui.base.Event} oEvent - on Save new Variant
		 * @return {void}
		 * @private
		 */
		_createStandardVariant: function (oEvent) {
			var iGlobal = oEvent.getParameter("global") ? 1 : 0;
			var iDefault = oEvent.getParameter("def") ? 1 : 0;
			var sKey = oEvent.getParameter("key");
			var sName = oEvent.getParameter("name");
			var sCTRLID = this.getControllId();

			var oPayload = {
				CTRLID: sCTRLID,
				VARIANTID: sKey,
				USERID: "",
				VARIANT_NAME: sName,
				IS_DEFAULT: iDefault,
				IS_GLOBAL: iGlobal,
				IS_HIDDEN: 0,
				FILTER_OBJECT: this._oVariantData,
				FOR_USERS: "",
				TABLE_COLUMNS: encodeURI(JSON.stringify(this._getVisibleColumns())),
				CHART_CONFIG: encodeURI(JSON.stringify(this._getChartConfig()))
			};

			this.getModel("main").create(this.config.paths.variantManagement, oPayload, {
				success: function () {
					var sMessage = this.getResourceBundle().getText("variantMngt.Create.One.Success", ["\"" + sName + "\""]);
					MessageToast.show(sMessage);
					this._refreshVariants();
				}.bind(this),
				error: function () {
					//TODO: Error Handler
					jQuery.sap.log.error("Failed to create new Variant");
				}
			});
		},

		/**
		 * Update existing variant record
		 * @param {sap.ui.base.Event} oEvent - on Save for existing Variant
		 * @return {void}
		 * @private
		 */
		_updateStandardVariant: function (oEvent) {
			var sKey = oEvent.getParameter("key");
			var sName = oEvent.getParameter("name");
			var oVariant = this._oVariantMngt.getItemByKey(sKey);
			var oContext = oVariant.getBindingContext("main");
			var sPath = this._getEntityPath(oContext);
			var oVariantData = oContext.getObject();

			oVariantData["FILTER_OBJECT"] = this._oVariantData;
			oVariantData["TABLE_COLUMNS"] = encodeURI(JSON.stringify(this._getVisibleColumns()));
			oVariantData["CHART_CONFIG"] = encodeURI(JSON.stringify(this._getChartConfig()));

			this.getModel("main").update(sPath, oVariantData, {
				success: function () {
					var sMessage = this.getResourceBundle().getText("variantMngt.Update.One.Success", ["\"" + sName + "\""]);
					MessageToast.show(sMessage);
					this._refreshVariants();
				}.bind(this),
				error: function () {
					//TODO: Error Handler
					jQuery.sap.log.error("Failed to update existing Variant");
				}
			});
		},

		/**
		 * Attach after Manage dialog submit changes done
		 * @param {sap.ui.base.Event} oEvent - batchRequestCompleted
		 * @return {void}
		 * @private
		 */
		_attachBatchRequestCompleted: function (oEvent) {
			var aRequests = oEvent.getParameter("requests");
			var sMessage = "";
			var sText;
			var oResourceBundle = this.getResourceBundle();
			this.getModel("main").setUseBatch(false);

			var mRequestsCount = aRequests.reduce(function (oTransition, oRequest) {
				if (oRequest.method === "MERGE" || oRequest.method === "PUT") {
					if (!oTransition["updated"]) {
						oTransition["updated"] = 0;
					}
					oTransition["updated"]++;
				} else if (oRequest.method === "DELETE") {
					if (!oTransition["deleted"]) {
						oTransition["deleted"] = 0;
					}
					oTransition["deleted"]++;
				}
				return oTransition;
			}, {});

			for (var sMethod in mRequestsCount) {
				if (sMethod === "updated") {
					sText = oResourceBundle.getText("variantMngt.Update.Multiple.Success", [mRequestsCount["updated"]]);
					sMessage += sMessage === "" ? sText : "; " + sText;
				} else if (sMethod === "deleted") {
					sText = oResourceBundle.getText("variantMngt.Delete.Multiple.Success", [mRequestsCount["deleted"]]);
					sMessage += sMessage === "" ? sText : "; " + sText;
				}
			}

			MessageToast.show(sMessage);
			this._refreshVariants();
		},

		/**
		 * Create deferred update request(s)
		 * @param {array} aRenamedVariants - objects that should be renamed
		 * @param {string} sDefaultKey - Default Key
		 * @return {void}
		 * @private
		 */
		_createUpdateBatchOperation: function (aRenamedVariants, sDefaultKey) {
			var oModel = this.getModel("main");

			aRenamedVariants.map(function (oRenamed) {
				var oVariantItem = this._oVariantMngt.getItemByKey(oRenamed.key);
				if (!oVariantItem) {
					return;
				}
				var oContext = oVariantItem.getBindingContext("main");
				var sPath = this._getEntityPath(oContext);
				var oPayload = jQuery.extend({}, oContext.getObject());

				oPayload.VARIANT_NAME = oRenamed.name === "" ? oPayload.VARIANT_NAME : oRenamed.name;
				if (oRenamed.key === sDefaultKey) {
					oPayload.IS_DEFAULT = 1;
				} else {
					oPayload.IS_DEFAULT = 0;
				}
				this._sLastDefaultKey = sDefaultKey;

				oModel.update(sPath, oPayload, {
					batchGroupId: "onManageStandardVariants"
				});
			}.bind(this));
		},

		/**
		 * Create deferred delete request(s)
		 * @param {array} aDeletedVariants - variant keys that should be deleted
		 * @param {string} sDefaultKey - Default Key
		 * @return {void}
		 * @private
		 */
		_createDeleteBatchOperation: function (aDeletedVariants, sDefaultKey) {
			var oModel = this.getModel("main");

			aDeletedVariants.map(function (sDeletedVariant) {
				var oVariantItem = this._oVariantMngt.getItemByKey(sDeletedVariant);
				var oContext = oVariantItem.getBindingContext("main");
				var sPath = this._getEntityPath(oContext);

				if (sDeletedVariant === this._sLastDefaultKey) {
					this._sLastDefaultKey = sDefaultKey;
				}

				oModel.remove(sPath, {
					batchGroupId: "onManageStandardVariants"
				});
			}.bind(this));
		},

		/* ------------ Shared Variant Management ---------------------*/

		/**
		 * Creates Value Help Dialog for Selecting Users from List
		 * @param {sap.ui.base.Event} oEvent - Value Help Request
		 * @return {void}
		 * @private
		 */
		_createUserListDialog: function (oEvent) {
			var oControl = oEvent.getSource();
			var oJson = oControl.getModel();
			if (!oJson) {
				oJson = this._setFakeJsonModel(oControl);
			}

			var oValueHelpDialog = new ValueHelpDialog(oJson.getContext("/data"), oControl, this.getResourceBundle(), "UserList", this.getModel("main"), oJson, false);

			oValueHelpDialog.attachOk(function (oEvent) {
				var iColumnType = this.getColumnType();
				var aTokens = oEvent.getParameter("tokens");

				oControl.setTokens(aTokens.map(function (oToken) {
					if (oToken.getKey().indexOf("range") > -1) {
						return oToken;
					}
					return oToken.setText(formatter.formatDataBasedOnColumnType(iColumnType, oToken.getText()));
				}));

				this.close();
			});

			oValueHelpDialog.open();
		},

		/**
		 * Format binded user for Multi Input field. Parse them to Tokens
		 * @param {string} sValue - Users divided by , sign
		 * @return {void}
		 * @private
		 */
		_formatSavedUsers: function (sValue) {
			var aUsers = sValue ? sValue.split(",") : [];
			if (aUsers[0]) {
				var aTokens = aUsers.map(function (sUser) {
					return new Token({
						key: sUser,
						text: sUser
					}).data("row", {
						USER_NAME: sUser
					});
				});

				Fragment.byId(this.config.fragment.sharedVariantMngt.id, "inputForSelectedUsers").setTokens(aTokens);
			}
		},

		/**
		 * Check if inputed value have duplicates
		 * @param {sap.m.Input} oInputField - Input field for Variant Name
		 * @param {string} sValue - Variant Name value
		 * @return {void}
		 * @private
		 */
		_checkIsDuplicate: function (oInputField, sValue) {
			var bFlag = this._isDuplicate(oInputField, sValue);

			if (bFlag) {
				oInputField.setValueState(ValueState.Error);
				oInputField.setValueStateText(this.getResourceBundle().getText("sharedVariantMngt.Dialog.ValueState.ExistingName"));
			} else {
				oInputField.setValueState(ValueState.None);
				oInputField.setValueStateText(null);
			}
		},

		/**
		 * Check if List have items with the same name
		 * @param {sap.m.Input} oInputField - Input field for Variant Name
		 * @param {string} sValue - Variant Name value
		 * @return {boolean} - duplicate or not
		 * @private
		 */
		_isDuplicate: function (oInputField, sValue) {
			var sTrimName = sValue.trim();
			if (!sTrimName) {
				return true;
			}

			var oList = this._oDialog._oList;
			var aItems = oList.getItems();
			var sText;
			var sBoundValue = oInputField.getBindingContext("main") && oInputField.getBindingContext("main").getProperty("VARIANT_NAME");

			for (var iCount = 0; iCount < aItems.length; iCount++) {
				sText = aItems[iCount].getTitle().trim();
				if (sText === sTrimName) {
					if (sBoundValue && sBoundValue === sTrimName) {
						continue;
					} else {
						return true;
					}
				}
			}

			return false;
		},

		/**
		 * Create support json model for selecting users to reuse ValueHelpDialog control
		 * @param {sap.m.MultiInput} oControl - Multi input for selected users
		 * @return {sap.ui.model.json.JSONModel} - support json model
		 * @private
		 */
		_setFakeJsonModel: function (oControl) {
			var oJson = new JSONModel([{
					CTYPE: 11,
					LABEL: this.getResourceBundle().getText("sharedVariantMngt.Dialog.VHD.Title"),
					COLUMN: "USER_NAME"
				},
				{
					CTYPE: 11,
					LABEL: this.getResourceBundle().getText("sharedVariantMngt.Dialog.VHD.FirstName"),
					COLUMN: "GIVENNAME"
				},
				{
					CTYPE: 11,
					LABEL: this.getResourceBundle().getText("sharedVariantMngt.Dialog.VHD.LastName"),
					COLUMN: "LASTNAME"
				},
				{
					CTYPE: 11,
					LABEL: this.getResourceBundle().getText("sharedVariantMngt.Dialog.VHD.Dept"),
					COLUMN: "DEPARTMENT"
				},
				{
					CTYPE: 11,
					LABEL: this.getResourceBundle().getText("sharedVariantMngt.Dialog.VHD.Email"),
					COLUMN: "EMAIL"
				}
			]);
			//            oControl.data("properties", "{/data}");
			oControl.data("properties", "{/}");
			oControl.setModel(oJson);
			return oJson;
		},

		/**
		 * Navigate to Manage Shared Variants Page
		 * @param {string} sContextPath - Shared variant item context path
		 * @return {void}
		 * @private
		 */
		_onNavToManagePage: function (sContextPath) {
			var oPage = this._oDialog._oManagePage;
			var oViewModel = this.getModel("variantManagementView");
			var bButtonEnabled = false;

			oPage.unbindElement("main");

			this._oDialog._oInputField.setValueState(ValueState.None);
			this._oDialog._oMultiInputField.setValueState(ValueState.None);
			this._oDialog._oNavContainer.to(oPage);

			if (sContextPath) {
				oPage.bindElement("main>" + sContextPath);
				bButtonEnabled = true;
			} else {
				this._oDialog._oInputField.setValue("");
				this._oDialog._oCheckBox.setSelected(false);
				this._oDialog._oMultiInputField.setTokens([]);
				this._oDialog._oMultiInputField.setValueState(ValueState.None);
			}

			oViewModel.setProperty("/inputFieldPassedCheck", bButtonEnabled);
			oViewModel.setProperty("/multiInputFieldPassedCheck", bButtonEnabled);
		},

		/**
		 * Enable/Disable Publish button based on inserted/deleted tokens
		 * @param {sap.ui.base.Event} oEvent - token Change event
		 * @return {void}
		 * @private
		 */
		_attachSharedUsersTokenChange: function (oEvent) {
			var oMultiInputField = oEvent.getSource();
			var oViewModel = this.getModel("variantManagementView");
			var sType = oEvent.getParameter("type");

			if (sType === "removed" && oMultiInputField.getTokens().length === 0) {
				oMultiInputField.setValueState(ValueState.Error);
				oViewModel.setProperty("/multiInputFieldPassedCheck", false);
			} else if (sType === "added") {
				oMultiInputField.setValueState(ValueState.None);
				oViewModel.setProperty("/multiInputFieldPassedCheck", true);
			}
		},

		/**
		 * Create and return Shared Variants Dialog
		 * @return {sap.m.Dialog} - Dialog for Shared Variants
		 * @private
		 */
		_getDialog: function () {
			if (!this._oDialog) {
				var sFragmentId = this.config.fragment.sharedVariantMngt.id;
				var sFragmentPath = this.config.fragment.sharedVariantMngt.path;

				this._oDialog = sap.ui.xmlfragment(sFragmentId, sFragmentPath, this);
				this.getView().addDependent(this._oDialog);

				this._oDialog._oInputField = Fragment.byId(sFragmentId, "inputSharedVariantName");
				this._oDialog._oMultiInputField = Fragment.byId(sFragmentId, "inputForSelectedUsers");
				this._oDialog._oCheckBox = Fragment.byId(sFragmentId, "checkboxIsGlobal");
				this._oDialog._oList = Fragment.byId(sFragmentId, "listSharedVariants");
				this._oDialog._oNavContainer = Fragment.byId(sFragmentId, "navContainer");
				this._oDialog._oManagePage = Fragment.byId(sFragmentId, "managePage");
			}
			return this._oDialog;
		},

		/**
		 * Update existing shared variant
		 * @param {sap.ui.model.Context} oContext - bound page context
		 * @return {void}
		 * @private
		 */
		_updateSharedVariant: function (oContext) {
			var aUsers = oContext.getProperty("FOR_USERS").split(",");
			var aCreatedUsers = [];
			var aSharedUser = [];
			var sUsers = "";

			this._oDialog._oMultiInputField.getTokens().map(function (oToken) {
				var sTokenText = oToken.getProperty("text");
				var iUserIndex = aUsers.indexOf(sTokenText);
				if (iUserIndex !== -1) {
					aSharedUser.push(sTokenText);
					aUsers.splice(iUserIndex, 1);
				} else {
					aCreatedUsers.push(sTokenText);
				}
				sUsers += sUsers === "" ? sTokenText : "," + sTokenText;
			});

			var oModel = this.getModel("main");
			oModel.setUseBatch(true);
			var sPath = oContext.getPath();
			var aDevidedPath = sPath.split(",");
			var oPayload = {
				CTRLID: oContext.getProperty("CTRLID"),
				VARIANTID: oContext.getProperty("VARIANTID"),
				USERID: oContext.getProperty("USERID"),
				VARIANT_NAME: this._oDialog._oInputField.getValue().trim(),
				IS_DEFAULT: this._oDialog._oCheckBox.getSelected() ? 1 : 0,
				IS_GLOBAL: 1,
				IS_HIDDEN: 0,
				FILTER_OBJECT: this._oVariantData,
				FOR_USERS: sUsers,
				TABLE_COLUMNS: encodeURI(JSON.stringify(this._getVisibleColumns())),
				CHART_CONFIG: encodeURI(JSON.stringify(this._getChartConfig()))
			};

			oModel.update(sPath, oPayload, {
				batchGroupId: "onUpdateSharedVariants"
			});

			jQuery.each(aSharedUser, function (iIndex, sSharedUser) {
				var oPayLoadCpy = jQuery.extend({}, oPayload);
				aDevidedPath[2] = aDevidedPath[2].substr(0, aDevidedPath[2].indexOf("'")) + "'" + sSharedUser.toUpperCase() + "'";
				oPayLoadCpy.USERID = sSharedUser.toUpperCase();
				oPayLoadCpy.FOR_USERS = "";
				oModel.update((aDevidedPath + "" + ")"), oPayLoadCpy, {
					batchGroupId: "onUpdateSharedVariants"
				});
			});

			jQuery.each(aCreatedUsers, function (iIndex, sSharedUser) {
				var oPayLoadCpy = jQuery.extend({}, oPayload);
				oPayLoadCpy.USERID = sSharedUser.toUpperCase();
				oPayLoadCpy.FOR_USERS = "";
				oModel.create(this.config.paths.variantManagement, oPayLoadCpy, {
					batchGroupId: "onUpdateSharedVariants"
				});
			}.bind(this));

			jQuery.each(aUsers, function (iIndex, sSharedUser) {
				var oPayLoadCpy = jQuery.extend({}, oPayload);
				aDevidedPath[2] = aDevidedPath[2].substr(0, aDevidedPath[2].indexOf("'")) + "'" + sSharedUser.toUpperCase() + "'";
				oPayLoadCpy.USERID = sSharedUser.toUpperCase();
				oPayLoadCpy.FOR_USERS = "";
				oModel.remove((aDevidedPath + "" + ")"), {
					batchGroupId: "onUpdateSharedVariants"
				});
			});

			var oResourceBundle = this.getResourceBundle();
			oModel.submitChanges({
				batchGroupId: "onUpdateSharedVariants",
				success: function () {
					oModel.setUseBatch(false);
					MessageToast.show(oResourceBundle.getText("variantMngt.Create.One.Success", ["\"" + oPayload.VARIANT_NAME + "\""]));
					this._oDialog._oList.getBinding("items").refresh();
					this._oDialog._oNavContainer.back();
					this._refreshVariants();
				}.bind(this),
				error: function () {
					oModel.setUseBatch(false);
					// TODO: Error Handler
					jQuery.sap.log.error("Failed to update shared Variant");
				}
			});
		},

		/**
		 * Create new Shared Variant
		 * @return {void}
		 * @private
		 */
		_createSharedVariant: function () {
			var oMultiInputField = this._oDialog._oMultiInputField;
			var sUsers = "";

			var aUsers = oMultiInputField.getTokens().map(function (oToken) {
				var sTokenText = oToken.getProperty("text");
				sUsers += sUsers === "" ? sTokenText : "," + sTokenText;
				return sTokenText;
			});
			var sSharedVariantName = this.byId(this.config.ui.elements.variantManagement).getSelectionKey();
			var bPrivateVariantCopy = sSharedVariantName === "*standard*" ? true : false;

			var oModel = this.getModel("main");
			oModel.setUseBatch(true);
			var oPayload = {
				CTRLID: this.getControllId(),
				VARIANTID: "SV" + new Date().getTime().toString(),
				USERID: "Admin",
				VARIANT_NAME: this._oDialog._oInputField.getValue().trim(),
				IS_DEFAULT: this._oDialog._oCheckBox.getSelected() ? 1 : 0,
				IS_GLOBAL: 1,
				IS_HIDDEN: 0,
				FILTER_OBJECT: this._oVariantData,
				FOR_USERS: sUsers,
				TABLE_COLUMNS: encodeURI(JSON.stringify(this._getVisibleColumns())),
				CHART_CONFIG: encodeURI(JSON.stringify(this._getChartConfig()))
			};

			oModel.create(this.config.paths.variantManagement, oPayload, {
				batchGroupId: "onCreateSharedVariants"
			});

			//Push blank user for creating private copy of variant
			if (bPrivateVariantCopy) {
				aUsers.push("");
			}

			jQuery.each(aUsers, function (iIndex, sSharedUser) {
				var oPayloadCopy = jQuery.extend({}, oPayload);
				oPayloadCopy.USERID = sSharedUser.toUpperCase();
				oPayloadCopy.FOR_USERS = "";
				if (bPrivateVariantCopy && sSharedUser === "") {
					oPayloadCopy.IS_GLOBAL = 0;
				}
				oModel.create(this.config.paths.variantManagement, oPayloadCopy, {
					batchGroupId: "onCreateSharedVariants"
				});
			}.bind(this));

			var oResourceBundle = this.getResourceBundle();
			oModel.submitChanges({
				batchGroupId: "onCreateSharedVariants",
				success: function () {
					oModel.setUseBatch(false);
					MessageToast.show(oResourceBundle.getText("variantMngt.Create.One.Success", ["\"" + oPayload.VARIANT_NAME + "\""]));
					this._oDialog._oList.getBinding("items").refresh();
					this._oDialog._oNavContainer.back();
					this._refreshVariants();
				}.bind(this),
				error: function () {
					oModel.setUseBatch(false);
					// TODO: Error Handler
					jQuery.sap.log.error("Failed to create shared Variant");
				}
			});
		},

		/**
		 * Create new Shared Variant
		 * @param  {object} oContext : object reference of context entry
		 * @return {string} sPath Return entity path
		 * @private
		 */
		_getEntityPath: function (oContext) {
			var sPath = oContext.getPath().replace(this.config.paths.userVariants, this.config.paths.variantManagement);
			sPath = sPath.replace(",IS_GLOBAL=0", "");
			sPath = sPath.replace(",IS_GLOBAL=1", "");
			return sPath;
		},

		/**
		 * Save visible columns in main view model
		 * @param {string} sChannel - Channel Name
		 * @param {string} sEvent - Event Name
		 * @param {object} oData - Odata Objects
		 * @return {void}
		 * @private
		 */
		_saveVisibleColumns: function (sChannel, sEvent, oData) {
			var oMainViewModel = this.getView().getModel("mainView");
			oMainViewModel.setProperty("/visibleColumns", oData);
		},

		/**
		 * Get visible columns from main view model
		 * @return {array} Visible columns array
		 * @private
		 */
		_getVisibleColumns: function () {
			return this.getView().getModel("mainView").getProperty("/visibleColumns") || [];
		},

		/**
		 * Get chart config from main view model
		 * @return {array} Visible columns array
		 * @private
		 */
		_getChartConfig: function () {
			return this.getView().getModel("mainView").getProperty("/chartConfig") || [];
		},

		/**
		 * Save chart configs in main view model
		 * @param {string} sChannel - Channel Name
		 * @param {string} sEvent - Event Name
		 * @param {object} oData - Odata Objects
		 * @return {void}
		 * @private
		 */
		_saveChartConfig: function (sChannel, sEvent, oData) {
			var oMainViewModel = this.getView().getModel("mainView");
			oMainViewModel.setProperty("/chartConfig", oData);
		}

	});
});
