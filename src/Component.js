/*!
 * Copyright 2017 Siemens AG
 */
sap.ui.define([
    "sap/ui/core/UIComponent",
    "./model/models",
    "./controller/utilities"
], function(UIComponent, models, utilities) {
    "use strict";

    return UIComponent.extend("com.siemens.tableViewer.Component", {
        metadata: {
            "name": "TableViewer",
            "version": "3.1.0",
            "rootView": {
                "viewName": "com.siemens.tableViewer.view.App",
                "type": "XML"
            },
            "includes": ["css/style.css", "model/types/hanaBoolean.js", "model/types/columnSorter.js"],
            "dependencies": {
                "libs": ["sap.m", "sap.ui.layout", "sap.ui.comp"]
            },
            "config": {
                "i18nBundle": "com.siemens.tableViewer.i18n.i18n",
                "serviceUrl": "/siemens/COMMON_DEV/TableViewer3/xs/services/Main.xsodata",
                "fullWidth": "true"
            },
            "routing": {
                "config": {
                    "routerClass": "sap.m.routing.Router",
                    "viewType": "XML",
                    "viewPath": "com.siemens.tableViewer.view",
                    "controlId": "app",
                    "controlAggregation": "pages",
                    "clearTarget:": true,
                    "bypassed": {
                        "target": "notFound"
                    }
                },
                "routes": [{
                    "pattern": ":tab:",
                    "name": "tableviewer",
                    "target": "tableviewer"
                }],
                "targets": {
                    "tableviewer": {
                        "viewName": "Main",
                        "viewId": "tableviewer",
                        "viewLevel": 1
                    },
                    "filterBar": {
                        "parent": "tableviewer",
                        "viewName": "FilterBar",
                        "viewId": "FilterBar",
                        "viewPath": "com.siemens.tableViewer.view",
                        "controlId": "filterBarContainer",
                        "controlAggregation": "content"
                    },
                    "variantManagement": {
                        "parent": "tableviewer",
                        "viewName": "VariantManagement",
                        "viewId": "VariantManagement",
                        "viewPath": "com.siemens.tableViewer.view",
                        "controlId": "idVariantMngtPanel",
                        "controlAggregation": "content"
                    },

                    "Table": {
                        "parent": "tableviewer",
                        "viewName": "Table",
                        "viewId": "Table",
                        "viewPath": "com.siemens.tableViewer.view.tabs",
                        "controlId": "tableTab",
                        "controlAggregation": "content"
                    },
                    "Chart": {
                        "parent": "tableviewer",
                        "viewName": "Chart",
                        "viewId": "Chart",
                        "viewPath": "com.siemens.tableViewer.view.tabs",
                        "controlId": "chartTab",
                        "controlAggregation": "content"
                    },
                    "TreeXS": {
                        "parent": "tableviewer",
                        "viewName": "TreeXS",
                        "viewId": "TreeXS",
                        "viewPath": "com.siemens.tableViewer.view.tabs",
                        "controlId": "treeXSTab",
                        "controlAggregation": "content"
                    },
                    "Tree": {
                        "parent": "tableviewer",
                        "viewName": "Tree",
                        "viewId": "Tree",
                        "viewPath": "com.siemens.tableViewer.view.tabs",
                        "controlId": "treeTab",
                        "controlAggregation": "content"
                    },
                    "Mix" : {
                        "parent": "tableviewer",
                        "viewName": "Mix",
                        "viewId": "Mix",
                        "viewPath": "com.siemens.tableViewer.view.tabs",
                        "controlId": "mixTab",
                        "controlAggregation": "content"
                    },
                    "notFound": {
                        "viewName": "NotFound",
                        "transition": "show",
                        "viewPath": "com.siemens.tableViewer.view"
                    }
                }
            }
        },

        _sControlId: null,
        _sServicePath: null,
        _oWhenMetadataIsLoaded: null,
        _onWhenConfigModelDataIsLoaded: null,
        _cachedConfigData: null,
        _onWhenFiltersApplied: null,

        /**
         * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
         * In this function, the FLP and device models are set and the router is initialized.
         * @public
         * @override
         */
        init: function() {
            // reads Component's metadata configuration
            var mConfig = this.getMetadata().getConfig();

            // initialize the resource bundle with the component
            this.setModel(models.createResourceModel(mConfig.i18nBundle), "i18n");

            // initialize the device model with the component
            this.setModel(models.createDeviceModel(), "device");

            // set control id from URI
            this._sControlId = this._getUriParams("CNTRL");

            // set service path
            this._sServicePath = mConfig.serviceUrl.replace("Main.xsodata", "");

            // initialize main XSOData service for column and table viewer configuration data
            var oMainModel = models.createODataModelWithParameters(mConfig.serviceUrl);
            this.setModel(oMainModel, "main");

            // create promise which is resolved when metadata is loaded
            this._createMetadataPromise(oMainModel);

            // error when metadata has been not loaded
            oMainModel.attachMetadataFailed(function() {
                jQuery.sap.log.error("Failed to load metadata", "com.siemens.tableViewer.Component");
            });

            // initialize configuration model
            this._onWhenConfigModelDataIsLoaded = models.createRequestConfigurationModelPromise(this._sControlId, oMainModel);

            this._onWhenFiltersApplied = jQuery.Deferred();

            // call the base component's init function
            UIComponent.prototype.init.apply(this, arguments);

            // create the views based on the url/hash
            this.getRouter().initialize();
        },

        /**
         * In this function, the rootView is initialized and stored.
         * @returns {sap.ui.core.mvc.XMLView} - the root view of the component
         * @public
         * @override
         */
        createContent: function() {
            // call the base component's createContent function
            var oRootView = UIComponent.prototype.createContent.apply(this, arguments);
            oRootView.addStyleClass(utilities.getContentDensityClass());
            return oRootView;
        },

        /**
         * The component is destroyed by UI5 automatically.
         * In this method, the ErrorHandler is destroyed.
         * @public
         * @override
         */
        destroy: function() {
            if (this._oErrorHandler) {
                this._oErrorHandler.destroy();
            }
			try {
				this.getModel("main").destroy();
			} catch (e) {
				jQuery.sap.log.info("failed to destroy model");
			}
            this.getModel("i18n").destroy();
            //this.getModel("device").destroy();
            // this.getModel("FLP").destroy();
            UIComponent.prototype.destroy.apply(this, arguments);
        },

        /**
         * Creates a promise which is resolved when the metadata is loaded.
         * @param {sap.ui.model.odata.v2.ODataModel} oModel - the app model
         * @private
         */
        _createMetadataPromise: function(oModel) {
            this.oWhenMetadataIsLoaded = new Promise(function(fnResolve, fnReject) {
                oModel.attachEventOnce("metadataLoaded", fnResolve);
                oModel.attachEventOnce("metadataFailed", fnReject);
            });
        },

		/**
		 * This method can be called to get startup parameters depend on property
		 * that should be passed to function
		 * @public
		 * @param {string} sProperty - startup parameter property
		 * @return {string} startup parameter property value
		 */
		_getUriParams: function (sProperty) {
			var oStartUpParams = this.getComponentData() ? this.getComponentData().startupParameters : null, sResult;

			if (!oStartUpParams) {
				// check CNTRL via URL
				var oUriParams = jQuery.sap.getUriParameters().mParams;
				sResult = oUriParams[sProperty] ? oUriParams[sProperty][0] : null;
			} else {
				sResult = oStartUpParams[sProperty] ? oStartUpParams[sProperty][0] : undefined;
			}

			return sResult;
		}

    });
});