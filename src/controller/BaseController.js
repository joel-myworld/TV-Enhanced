/*!
 * Copyright 2017 Siemens AG
 */
sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/routing/History",
	"sap/ui/core/Fragment"
], function (Controller, JSONModel, History,Fragment) {
	"use strict";

	/**
	 * Constructor for Base Controller
	 *
	 * @class
	 * This is an abstract base class for all view controllers. View controllers are going to extend it.
	 * All class attributes and methods will be shared.
	 * @abstract
	 *
	 * @extends sap.ui.core.mvc.Controller
	 *
	 * @constructor
	 * @public
	 * @alias com.siemens.tableViewer.controller.BaseController
	 */
	return Controller.extend("com.siemens.tableViewer.controller.BaseController", {
		/**
		 * Convenience method for accessing the router.
		 * @public
		 * @returns {sap.ui.core.routing.Router} the router for this component
		 */
		getRouter: function () {
			return sap.ui.core.UIComponent.getRouterFor(this);
		},

		/**
		 * Convenience method for getting the view model by name.
		 * @public
		 * @param {String} sName - the model name
		 * @returns {sap.ui.model.Model} the model instance
		 */
		getModel: function (sName) {
			return this.getView().getModel(sName);
		},

		/**
		 * Return EntityName from main configuration table
		 * @returns {String} Entity name from main model
		 */
		getEntityName: function () {
			return "/" + this.getComponentModel("main").getProperty('/ENTITY_NAME');
		},

		/**
		 * Convenience method for setting the view model.
		 * @public
		 * @param {sap.ui.model.Model} oModel - the model instance
		 * @param {String} sName - the model name
		 * @returns {sap.ui.base.ManagedObject} the view instance
		 */
		setModel: function (oModel, sName) {
			return this.getView().setModel(oModel, sName);
		},

		/**
		 * Getter for the resource bundle.
		 * @public
		 * @returns {sap.ui.model.resource.ResourceModel} the resourceModel of the component
		 */
		getResourceBundle: function () {
			return this.getOwnerComponent().getModel("i18n").getResourceBundle();
		},

		/**
		 * Getter for EventBus.
		 * @public
		 * @returns {sap.ui.core.EventBus} the EventBus of the component
		 */
		getEventBus: function () {
			return this.getOwnerComponent().getEventBus();
		},

		/**
		 * Create view model for busy dialogs
		 * @returns {sap.ui.model.json.JSONModel} view model for busy dialogs
		 */
		createViewModel: function () {
			return new JSONModel({
				busy: true,
				delay: 0,
				enableShowDetailsButton : false
			});
		},
		/**
		 * Method to create view model for table popup dialog
		 * @returns {Object} JSON Model - JSON model for table popup dialog control
		 * @public
		 */
		createTablePopViewModel: function () {
			return new JSONModel({
				title : "",
				subtitle : "",
				filters : ""
			});
		},

		/**
		 * Getter for Control Id
		 * @returns {String} Control Id
		 */
		getControllId: function () {
			return this.getOwnerComponent()._sControlId;
		},

		/**
		 * Getter for model instantiated in Component
		 * @param {string} sModelName - model name
		 * @returns {sap.ui.model.Model} - named component model
		 */
		getComponentModel: function (sModelName) {
			return this.getOwnerComponent().getModel(sModelName);
		},

		/**
		 * Resolve Component promise
		 * @param {com.siemens.tableViewer.controller} oController - Controller instance
		 * @return {void}
		 */
		resolveOnWhenFilterAppliedPromise: function (oController) {
			oController.getOwnerComponent()._onWhenFiltersApplied.resolve(oController.getModel("mainView"), oController.getModel("data"));
		},

		/**
		 * On Full Screen button clicked
		 * @param {sap.ui.base.Event} oEvent - on button clicked
		 * @return {void}
		 */
		onFullScreen: function (oEvent) {
			var oButton = oEvent.getSource(),
			bPressed = oEvent.getParameter("pressed"),
			sIcon;
			// hide filter bar
			this.getModel("mainView").setProperty("/filterVisible", !bPressed);
			sIcon = bPressed ? "sap-icon://exit-full-screen" : "sap-icon://full-screen";
			oButton.setIcon(sIcon);
		},

		/**
		 * Executed when person clicked on back button
		 * @return {void}
		 */
		onNavBack: function () {
			var oHistory, sPreviousHash;
			oHistory = History.getInstance();
			sPreviousHash = oHistory.getPreviousHash();
			if (sPreviousHash !== undefined) {
				window.history.go(-1);
			} else {
				this.getRouter().navTo("tableviewer", {}, true /*no history*/);
			}
		},
		/**
		 * Getter for app language
		 * @public
		 * @return {String}  sLanguage - App language
		 */
        getAppLanguage: function() {
            var sLanguage;
            if (sap.ushell) {
                sLanguage = sap.ushell.Container.getUser().getLanguage();
            } else {
                sLanguage = sap.ui.getCore().getConfiguration().getLanguage();
            }
            return sLanguage.split("-")[0].toUpperCase();
        },

		/**
         *Returns a control from fragment with provided fragment id
         * @param   {string} sFragId - fragment id
         * @param   {string} sControlId - control if to get
         * @returns {sap.ui.core.Control} Control inside fragment
         * @private
         */
        _getFragmentControl: function(sFragId, sControlId) {
            return Fragment.byId(sFragId, sControlId);
        },

		/**
		 * Remove Columns from the Model related to the Static Filters
		 * @private
		 */
		_hideStaticColumns: function () {
			var aColumns = this.getModel("columnModel").getProperty("/ServiceToColumnConfig/results");
			for (var i = aColumns.length - 1; i >= 0; i--) {
				if (aColumns[i].FILTERTYPE === "StaticSingleSelect" || aColumns[i].FILTERTYPE === "StaticMultiSelect" || aColumns[i].FILTERTYPE === "StaticMultiValueHelp") {
					this.getModel("columnModel").getData().ServiceToColumnConfig.results[i].STDRD = 0;
				}
			}
		},
		/**
         * Get Default Value for Input Parameters model from metadata
         * @param {sap.ui.model.odata.ODataModel} oModel - instance of oData model
         * @param {sap.ui.model.json.JSONModel} oInputParametersModel - instance of input parameters model
         * @return {void}
         * @private
         */
        _getMetadataDefaultValues: function(oModel, oInputParametersModel) {
            var aEntities = oModel.getServiceMetadata().dataServices.schema[0].entityType;
            jQuery.grep(aEntities, function(oEntity) {
                // Check if Entity has navigation property
                if (oEntity.hasOwnProperty("navigationProperty") && oEntity.navigationProperty[0].name.search("HierarchyData_") === -1) {
                    var sEntity = oEntity.name.slice(0, oEntity.name.indexOf("Type")),
                        sNavigationProperty = oEntity.navigationProperty[0].name;

                    // Set Entity name
                    oInputParametersModel.setProperty("/entityName", sEntity);
                    // Set Navigation name
                    oInputParametersModel.setProperty("/navigation", sNavigationProperty);

                    oEntity.property.map(function(oProperty) {
                        var sPath = oProperty.name;

                        // Set Value to the input parameters model
                        oInputParametersModel.setProperty("/controls/" + sPath, {
                            label: oProperty.extensions[0].value,
                            value: oProperty.defaultValue,
                            type: oProperty.type,
                            maxLength: oProperty.maxLength
                        });
                    });
                }
            });
        },
		/**
         * Get default values from ENTITY_NAME from configuration table
         * @param {string} sPath - Entity name with keys and without navigation path
         * @param {sap.ui.model.json.JSONModel} oInputParametersModel - instance of input parameters model
         * @return {void}
         * @private
         */
        _getDefaultEntityValues: function(sPath, oInputParametersModel) {
            // Get Keys with values
            var aValues = sPath.slice(sPath.indexOf("(") + 1, sPath.indexOf(")")).split(",");
            aValues.forEach(function(sValue) {
                // Separate Key from Value
                var sKey = sValue.slice(0, sValue.indexOf("=")),
                    oControlProperty = oInputParametersModel.getProperty("/controls/" + sKey),
                    sKeyValue;
                // Check for data type
                switch (oControlProperty.type) {
                    case "Edm.Byte":
                    case "Edm.Int16":
                    case "Edm.Int32":
                    case "Edm.Int64":
                    case "Edm.Decimal":
                    case "Edm.Single":
                    case "Edm.Double":
                        sKeyValue = sValue.slice(sValue.indexOf("=") + 1) * 1;
                        break;
                    case "Edm.DateTime":
                    case "Edm.String":
                    case "Edm.Time":
                    default:
                        sKeyValue = sValue.slice(sValue.indexOf("'") + 1, sValue.length - 1);
                        break;
                }
                // Set Value to the input parameters model
                oInputParametersModel.setProperty("/controls/" + sKey + "/value", sKeyValue);
            });
        },
		/**
         * Create ENTITY_NAME property in Config model based on input
         * parameters model
         * @param {sap.ui.model.json.JSONModel} oInputParametersModel - instance of input parameters model
         * @param {sap.ui.model.json.JSONModel} oConfigModel - instance of config model
         * @return {void}
         */
        _setEntityNameWithInputParams: function(oInputParametersModel, oConfigModel) {
            var sEntityPath = "",
                oControls = oInputParametersModel.getProperty("/controls"),
                iPropertyCount = 0,
                iObjectLength = Object.keys(oInputParametersModel.getProperty("/controls")).length;

            sEntityPath = oInputParametersModel.getProperty("/entityName") + "(";
            for (var sTechName in oInputParametersModel.getProperty("/controls")) {
                iPropertyCount++;
                switch (oControls[sTechName].type) {
                    case "Edm.Byte":
                    case "Edm.Int16":
                    case "Edm.Int32":
                    case "Edm.Int64":
                    case "Edm.Decimal":
                    case "Edm.Single":
                    case "Edm.Double":
                        oControls[sTechName].value = oControls[sTechName].value ? oControls[sTechName].value : 0;
                        sEntityPath += sTechName + "=" + oControls[sTechName].value;
                        break;
                    case "Edm.DateTime":
                        oControls[sTechName].value = oControls[sTechName].value ? oControls[sTechName].value : new Date().toISOString();
                        sEntityPath += sTechName + "=datetime'" + oControls[sTechName].value + "'";
                        break;
                    case "Edm.Time":
                        oControls[sTechName].value = oControls[sTechName].value ? oControls[sTechName].value : new Date().getTime();
                        sEntityPath += sTechName + "=time'" + oControls[sTechName].value + "'";
                        break;
                    case "Edm.String":
                    default:
                        oControls[sTechName].value = oControls[sTechName].value ? oControls[sTechName].value : "";
                        sEntityPath += sTechName + "='" + oControls[sTechName].value + "'";
                        break;
                }
                sEntityPath += iPropertyCount === iObjectLength ? ")" : ",";
            }
            sEntityPath += "/" + oInputParametersModel.getProperty("/navigation");
            oConfigModel.setProperty("/ENTITY_NAME", sEntityPath);
        },
		/**
		 * Attaching requests to model to display busy indicator
		 * @public
		 * @param {sap.ui.model.Model} oModel - the model instance
		 * @param {sap.ui.core.Control} oControl - received control instance
		 */
		attachRequestsForControlBusyIndicator: function (oModel, oControl) {
			if (oControl.getBusyIndicatorDelay() === 1000) {
				oControl.setBusyIndicatorDelay(0);
			}
			// table busy dialog on each request.
			oModel.attachEventOnce("requestSent", jQuery.proxy(function () {
				oControl.setBusy(true);
			}), this);
			oModel.attachEventOnce("requestCompleted", jQuery.proxy(function () {
				oControl.setBusy(false);
			}), this);
			oModel.attachEventOnce("requestFailed", jQuery.proxy(function () {
				oControl.setBusy(false);
			}), this);
		},

		/**
		 * Move to new Dependant report from launchpad or via the
		 * standalone application
		 * @param {String} sDrillDownTarget - CNTRL that should be loaded
		 * @param {Boolean} bDependent - Dependent true or false
		 * @returns {void}
		 */
		handleCrossAppNavigation: function(sDrillDownTarget, bDependent) {
            var oRouter = this.getRouter();
            oRouter.stop();

            if (sap.ushell) {
				var sHash = new sap.ui.core.routing.HashChanger().getHash(),
					sTarget = sHash.split("?")[0].split("-"),
					sSemanticObject = sTarget[0],
					sAction = sTarget[1],
					mParams = {
						dependent: bDependent,
						CNTRL: sDrillDownTarget
					};

				var aHash = sHash.split("/"),
				    sLaunchpadParameters = aHash[0].split("?"),
				    sStartupParameters = sLaunchpadParameters[1];

			    if (sStartupParameters.search("dependent") === -1) {
			        sLaunchpadParameters[1] = sStartupParameters + "dependent=false&";
			    } else if (sStartupParameters.search("dependent=true") !== -1) {
			        sLaunchpadParameters[1] = sStartupParameters.replace("dependent=true", "dependent=false");
			    }

			    aHash[0] = sLaunchpadParameters.join("?");
			    sHash = aHash.join("/");
 /*eslint-disable */
			    location = "#" + sHash;

				sap.ushell.Container.getService("CrossApplicationNavigation").toExternal({
					target: {
						semanticObject: sSemanticObject,
						action: sAction
					},
					params: mParams
				});
			} else {
			    var sNewHref;
			    if (location.href.search("dependent") === -1) {
                    sNewHref = location.href.replace("?", "?dependent=false&");
                    // Change URL without reloading the page
                    history.replaceState({}, "", sNewHref);
			    } else if (location.href.search("dependent=true") !== -1) {
			        sNewHref = location.href.replace("dependent=true", "dependent=false");
                    // Change URL without reloading the page
                    history.replaceState({}, "", sNewHref);
			    }

				var sUrl = location.origin + location.pathname,
				aStartupParameters = location.search.slice(1).split("&");

				aStartupParameters = aStartupParameters.map(function(sParameter) {
                    if (sParameter.search("CNTRL") !== -1) {
                        sParameter = "CNTRL=" + sDrillDownTarget;
                    } else if (sParameter.search("dependent") !== -1) {
                        sParameter = "dependent=" + bDependent;
                    }
                    return sParameter;
				});
				sUrl += "?" + aStartupParameters.join("&");
				location.assign(sUrl);
			}
		},

		 /**
		  * Function to check if the array has proper Filters
		  * @param {array} array of Application Filters
		  * @return {boolean} returns true if all the objects are correct filters
		  */
		  checkFilters: function (aAppFilters){
		      var bAppFilter = true;
		      for (var iFilter in aAppFilters){
		           if (!(aAppFilters[iFilter] instanceof sap.ui.model.Filter)) {
		               bAppFilter = false;
		               break;
		           }
		      }
		      return bAppFilter;
		  }

	});
});
