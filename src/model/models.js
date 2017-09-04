sap.ui.define([
    "sap/ui/model/json/JSONModel",
    "sap/ui/Device",
    "sap/ui/model/resource/ResourceModel",
    "sap/ui/model/odata/v2/ODataModel"
], function(JSONModel, Device, ResourceModel, ODataModel) {
    "use strict";

    function extendMetadataUrlParameters(aUrlParametersToAdd, oMetadataUrlParams, sServiceUrl) {
        var oExtensionObject = {},
            oServiceUri = new URI(sServiceUrl);

        aUrlParametersToAdd.forEach(function(sUrlParam) {
            var oUrlParameters,
                sParameterValue;

            if (sUrlParam === "sap-language") {
                var fnGetuser = jQuery.sap.getObject("sap.ushell.Container.getUser");

                if (fnGetuser) {
                    // for sap-language we check if the launchpad can provide it.
                    oMetadataUrlParams["sap-language"] = fnGetuser().getLanguage();
                }
            } else {
                oUrlParameters = jQuery.sap.getUriParameters();
                sParameterValue = oUrlParameters.get(sUrlParam);
                if (sParameterValue) {
                    oMetadataUrlParams[sUrlParam] = sParameterValue;
                    oServiceUri.addSearch(sUrlParam, sParameterValue);
                }
            }
        });

        jQuery.extend(oMetadataUrlParams, oExtensionObject);
        return oServiceUri.toString();
    }

    /**
     * Table Viewer model utilities
     * com.siemens.tableViewer.model.models
     */
    return {

        /**
         * Create device model for Component
         * @returns {sap.ui.model.json.JSONModel} Device Model
         * @private
         */
        createDeviceModel: function() {
            return new JSONModel(Device).setDefaultBindingMode("OneWay");
        },

        /**
         * Create resource model using name of Resource specified in Component's metadata
         * @param {string} sBundleName - name of Resource Bundle
         * @returns {sap.ui.model.resource.ResourceModel} Resource Bundle
         * @public
         */
        createResourceModel: function(sBundleName) {
            return new ResourceModel({
                "bundleName": sBundleName
            });
        },

        /**
         * Create OData Model with parameters
         * @param {string} sServiceUrl - Service Url
         * @returns {*|sap.ui.model.odata.v2.ODataModel} New OData model
         * @public
         */
        createODataModelWithParameters: function(sServiceUrl) {
            var oModel = this.createODataModel({
                urlParametersForEveryRequest: [
                    "sap-server",
                    "sap-client",
                    "sap-language"
                ],
                url: sServiceUrl,
                config: {
                    metadataUrlParams: {
                        "sap-documentation": "heading"
                    },
                    json: true,
                    defaultBindingMode: "OneWay",
                    defaultCountMode: "Inline",
                    useBatch: false
                }
            });

            return oModel;
        },

        /**
         * Read Data from backend based on received parameters
         * @param {sap.ui.model.odata.v2.ODataModel} oModel - Data model
         * @param {string} sEntity - Entity set for data request
         * @param {select} sSelect - $select parameters for request
         * @param {function} fnSuccess - on successfully request function
         * @param {function} fnError - on failed request function
         * @param {boolean} bOrder - is order should be applied for request
         * @param {array} aFilters - array of {@link sap.ui.model.Filter}
         * @param {array} aSorters - array of {@link sap.ui.model.Sorter}
         * @return {*}
         * @public
         */
        requestData: function(oModel, sEntitySet, sSelect, fnSuccess, fnError, bOrder, aFilters, aSorters) {
            var oUriParams = {
                "$select": sSelect
            };

            if (bOrder) {
                oUriParams["$orderby"] = sSelect;
            }
            sEntitySet = "/" + sEntitySet;
            oModel.read(sEntitySet, {
                urlParameters: oUriParams,
                filters: aFilters,
                sorters: aSorters,
                success: fnSuccess,
                error: fnError
            });
        },

        /**
         * Create Promise for getting configuration model
         * @param {string} sControlId - Control Id
         * @param {sap.ui.model.odata.v2.ODataModel} oModel - Main Configuration OData model
         * @returns {Promise} - Resolved/Rejected Promise with oData/oError
         * @public
         */
        createRequestConfigurationModelPromise: function(sControlId, oModel) {
            var sPath = "/Service('" + sControlId + "')";
            var mParameters = {};
            var oMainConfig,oUserAuth;
            return new Promise(function(fnResolve) {

                oModel.setUseBatch(true);
                //Set deferred batch group
                oModel.setDeferredBatchGroups(["mainConfigBatchId"]);
                mParameters.batchGroupId = "mainConfigBatchId";
                mParameters.urlParameters = "$expand=ServiceToColumnConfig";
                oModel.read(sPath, mParameters);
                mParameters.urlParameters = "";
                oModel.read("/UserAuth",mParameters);

                var sDateTime = new Date();
                var oPayLoad = {
                "CTRLID": sControlId,
                "USERID": "dummy",
                "DATE_TIME": sDateTime
                };

                oModel.create('/UserStatistics',oPayLoad,mParameters);

                // Submit batch
                oModel.submitChanges({
                    batchGroupId: "mainConfigBatchId",
                    success: function (oData) {
                        oModel.setUseBatch(false);
                        oMainConfig = oData.__batchResponses[1].data;
                        oMainConfig.ServiceToColumnConfig.results.forEach(function(oItem) {
                             if (oItem.COLUMN_SORTING > 0) {
                                 oItem.COLUMN_SORTED = true;
                             } else {
                                 oItem.COLUMN_SORTED = false;
                             }
                         });
                        oUserAuth = oData.__batchResponses[2].data.results;
                        if (oUserAuth.length > 0){
                            oMainConfig.ADMIN_CELL_COLOR = oUserAuth[0].ADMIN_CELL_COLOR;
                            oMainConfig.ADMIN_SHARE_VARIANT = oUserAuth[0].ADMIN_SHARE_VARIANT;
                        }else {
                            oMainConfig.ADMIN_CELL_COLOR = 0;
                            oMainConfig.ADMIN_SHARE_VARIANT = 0;
                        }
                            fnResolve(oMainConfig);
                    },
                    error: function () {
                        jQuery.sap.log.error("Failed to extecute main config", "com.siemens.tableViewer.models.createRequestConfigurationModelPromise");
                        oModel.setUseBatch(false);
                    }
                });

            });
        },

        /**
         * Request data for Tree Table based on XSJS
         * @param {string} sPath - URL for data request
         * @param {Deferred} oDeferred - jQuery.Deffered object
         * @return {*|} - Async resolve or reject with data
         * @public
         */
        requestTreeData: function(sPath, oDeffered) {
            var sEntityName = location.hostname === "localhost" ? '/localService/tree/mockdata/getHierarchyV4_2.json' : sPath;
            jQuery.ajax({
                type: "GET",
                url: sEntityName,
                async: true,
                dataType: "json",
                success: function(oData) {
                    oDeffered.resolve(new JSONModel(oData));
                },
                error: function(XMLHttpRequest, sStatus, sTextStatus) {
                    jQuery.sap.log.error("Failed to load tree xs data", "com.siemens.tableViewer.models.requestTreeData");
                    oDeffered.reject(XMLHttpRequest, sTextStatus);
                }
            }, this);
        },

        /**
         *
         * @param oOptions {object} a map which contains the following parameter properties
         * @param oOptions.url {string} see {@link sap.ui.model.odata.v2.ODataModel#constructor.sServiceUrl}.
         * @param [oOptions.urlParametersForEveryRequest] {object} If the parameter is present in the URL or in case of language the UShell can provide it,
         * it is added to the odata models metadataUrlParams {@link sap.ui.model.odata.v2.ODataModel#constructor.mParameters.metadataUrlParams}, and to the service url.
         * If you provided a value in the config.metadataUrlParams this value will be overwritten by the value in the url.
         *
         * Example: the app is started with the url query, and the user has an us language set in the launchpad:
         *
         * ?sap-server=serverValue&sap-host=hostValue
         *
         * The createODataModel looks like this.
         *
         * models.createODataModel({
         *     urlParametersToPassOn: [
         *         "sap-server",
         *         "sap-language",
         *         "anotherValue"
         *     ],
         *     url : "my/Url"
         * });
         *
         * then the config will have the following metadataUrlParams:
         *
         * metadataUrlParams: {
         *     // retrieved from the url
         *     "sap-server" : "serverValue"
         *     // language is added from the launchpad
         *     "sap-language" : "us"
         *     // anotherValue is not present in the url and will not be added
         * }
         *
         * @param [oOptions.config] {object} see {@link sap.ui.model.odata.v2.ODataModel#constructor.mParameters}
         * it is the exact same object, the metadataUrlParams are enrichted by the oOptions.urlParametersToPassOn
         * @returns {sap.ui.model.odata.v2.ODataModel}
         * @public
         */
        createODataModel: function(oOptions) {
            var aUrlParametersForEveryRequest,
                sUrl,
                oConfig = {};

            oOptions = oOptions || {};

            if (!oOptions.url) {
                jQuery.sap.log.error("Please provide a url when you want to create an ODataModel","com.siemens.tableViewer.models.createODataModel");
                return null;
            }

            // create a copied instance since we modify the config
            oConfig = jQuery.extend(true, {}, oOptions.config);

            aUrlParametersForEveryRequest = oOptions.urlParametersForEveryRequest || [];
            oConfig.metadataUrlParams = oConfig.metadataUrlParams || {};

            sUrl = extendMetadataUrlParameters(aUrlParametersForEveryRequest, oConfig.metadataUrlParams, oOptions.url);

            return this._createODataModel(sUrl, oConfig);

        },

        /**
         * Create OData Model
         * @param {string} sUrl - Service URL
         * @param {object} oConfig - OData Configuration
         * @returns {sap.ui.model.odata.v2.ODataModel} OData v2 model
         * @private
         */
        _createODataModel: function(sUrl, oConfig) {
            var oModel = new ODataModel(sUrl, oConfig);
            return oModel;
        },

        requestChartsDimensionsMeasures: function(oModel, sEntitySet, oUriParams, aFilters, fnSuccess, fnError) {
            oModel.read(sEntitySet, {
                urlParameters: oUriParams,
                filters: aFilters,
                success: fnSuccess,
                error: fnError,
                async: false
            });
        },

        /**
         * To create chart model
         * @returns {Object} JSONModel - Json model for input parameters
         */
        createChartModel: function () {
            return new JSONModel({
                measures: [],
                dimensions: [],
                backgroundColorData: [],
                size: 0
            });
        },

        /**
         * Prepare model for data binding - storing all chart measures and
         * dimensions
         *
         * @param oConfigModel
         * @param sPath
         * @returns {{dimensions: Array, measures: Array}}
         */
        createDimensionMeasures: function(aDimensionsMeasures, sChartId) {
            var oMeasuresDimensions = {
                dimensions: [],
                measures: []
            };

            // Sorting dimension and measures
            aDimensionsMeasures.sort(function(oDm1, oDm2) {
                return oDm1.SORTORDER - oDm2.SORTORDER;
            });

            jQuery.grep(aDimensionsMeasures, function(oDimensionsMeasures) {
                if (sChartId === oDimensionsMeasures.CHARTID) {
                    var sNameOfArray = null;
                    var sLabel = oDimensionsMeasures.LABEL;
                    var sColumn = oDimensionsMeasures.COLUMN;
                    var bSelected = oDimensionsMeasures.IS_KFG === 1 || oDimensionsMeasures.IS_KFG === 2;
                    var sChartType = oDimensionsMeasures.CHARTYPE;

                    if (oDimensionsMeasures.IS_KFG === 1) {
                        sNameOfArray = "measures";
                    } else {
                        sNameOfArray = "dimensions";
                    }
                    oMeasuresDimensions[sNameOfArray].push({
                        LABEL: sLabel,
                        COLUMN: sColumn,
                        SELECTED: bSelected,
                        CTYPE: oDimensionsMeasures.CTYPE,
                        CHARTYPE: sChartType
                    });
                }
            });

            return oMeasuresDimensions;
        },

        createChartButtonsModel: function(oResourceBundle) {
            return new JSONModel({
                buttons: [{
                    "id": "bar",
                    "title": oResourceBundle.getText("chart.barChartText"),
                    "icon": "sap-icon://bar-chart",
                    "enabled": true,
                    "type": "Active"
                }, {
                    "id": "line",
                    "title": oResourceBundle.getText("chart.lineChartText"),
                    "icon": "sap-icon://line-chart",
                    "enabled": true,
                    "type": "Active"
                }, {
                    "id": "pie",
                    "title": oResourceBundle.getText("chart.pieChartText"),
                    "icon": "sap-icon://pie-chart",
                    "enabled": true,
                    "type": "Active"

                }, {
                    "id": "radar",
                    "title": oResourceBundle.getText("chart.radarChartText"),
                    "icon": "sap-icon://radar-chart",
                    "enabled": true,
                    "type": "Active"

                }, {
                    "id": "bubble",
                    "title": oResourceBundle.getText("chart.bubbleChartText"),
                    "icon": "sap-icon://bubble-chart",
                    "enabled": false,
                    "type": "Active"
                }, {
                    "id": "line_bar",
                    "title": oResourceBundle.getText("chart.multipleChartText"),
                    "icon": "sap-icon://line-chart-dual-axis",
                    "enabled": true,
                    "type": "Active"
                }, {
                    "id": "combine",
                    "title": oResourceBundle.getText("chart.combineChartText"),
                    "icon": "sap-icon://multiple-line-chart",
                    "enabled": true,
                    "type": "Active"
                }, {
                    "id": "stacked",
                    "title": oResourceBundle.getText("chart.stackedChartText"),
                    "icon": "sap-icon://upstacked-chart",
                    "enabled": true,
                    "type": "Active"
                }]
            });
        },
        /**
         * To create input parameters model
         * @returns {Object} JSONModel - Json model for input parameters
         */
        createInputParametersModel: function() {
            return new JSONModel({
                controls: {},
                entityName: "",
                navigation: "Results"
            });
        }

    };
});