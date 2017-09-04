/*!
 * Copyright 2017 Siemens AG
 */
sap.ui.define([
	"sap/ui/base/Object",
	"sap/m/MessageBox",
	"./utilities"
], function (Object, MessageBox, utilities) {
	"use strict";

	/**
	 * Constructor for Error Handler
	 *
	 * @class
	 * Creates error handler. All there methods should be used in case of error message should be displayed.
	 * @abstract
	 *
	 * @extends sap.ui.base.Object
	 *
	 * @constructor
	 * @public
	 * @alias com.siemens.tableViewer.controller.ErrorHandler
	 */
	return Object.extend("com.siemens.tableViewer.controller.ErrorHandler", {

		/**
		 * Handles application errors by automatically attaching to the model events and displaying errors when needed.
		 * @class
		 * @param {sap.ui.core.mvc.Controller} oController - Controller Instance
		 * @public
		 * @alias com.siemens.tableViewer.controller.ErrorHandler
		 */
		constructor: function (oController) {
			this._oResourceBundle = oController.getModel("i18n").getResourceBundle();
			this._oModel = oController.getModel("data");
			this._bMessageOpen = false;
			this._sErrorText = this._oResourceBundle.getText("errorHandler.Text");
			this._sErrorTitle = this._oResourceBundle.getText("errorHandler.Title");

			this._oModel.attachMetadataFailed(function (oEvent) {
				var oParams = oEvent.getParameters();
				this._showMetadataError(oParams.response);
			}, this);

			this._oModel.attachRequestFailed(function (oEvent) {
				var oParams = oEvent.getParameters();

				// An entity that was not found in the service is also throwing a 404 error in oData.
				// We already cover this case with a notFound target so we skip it here.
				// A request that cannot be sent to the server is a technical error that we have to handle though
				if (oParams.response.statusCode !== "404" ||
					(oParams.response.statusCode === 404 && oParams.response.responseText.indexOf("Cannot POST") === 0)) {
						var sMessage = oParams.response.statusText;
						try {
							if (JSON.parse(oParams.response.responseText).error && JSON.parse(oParams.response.responseText).error.message) {
								sMessage = JSON.parse(oParams.response.responseText).error.message.value;
						}
				} catch (exception) {
					sMessage = this._oResourceBundle.getText("errorHandler.Title") + " : " + sMessage;
				}
				this._showServiceError(sMessage);
			}
			}, this);
		},

		/**
		 * Shows a {@link sap.m.MessageBox} when the metadata call has failed.
		 * The user can try to refresh the metadata.
		 * @param {string} sDetails - a technical error to be displayed on request
		 * @return {void}
		 * @private
		 */
		_showMetadataError: function (sDetails) {
			MessageBox.show(
				this._sErrorText, {
					id: "metadataErrorMessageBox",
					icon: MessageBox.Icon.ERROR,
					title: this._sErrorTitle,
					details: sDetails,
					styleClass: utilities.getContentDensityClass(),
					actions: [MessageBox.Action.RETRY, MessageBox.Action.CLOSE],
					onClose: function (sAction) {
						if (sAction === MessageBox.Action.RETRY) {
							this._oModel.refreshMetadata();
						}
					}.bind(this)
				}
			);
		},

		/**
		 * Shows a {@link sap.m.MessageBox} when a service call has failed.
		 * Only the first error message will be displayed.
		 * @param {string} sMessage a technical error to be displayed on request
		 * @private
		 */
		_showServiceError: function (sMessage) {
			if (this._bMessageOpen) {
				return;
			}
			this._bMessageOpen = true;
			MessageBox.show(
				sMessage, {
					id: "serviceErrorMessageBox",
					styleClass: utilities.getContentDensityClass(),
					actions: [MessageBox.Action.CLOSE],
					icon: MessageBox.Icon.ERROR,
					title: this._sErrorTitle,
					onClose: function() {
						this._bMessageOpen = false;
					}.bind(this)
				}
			);
		}
	});
});