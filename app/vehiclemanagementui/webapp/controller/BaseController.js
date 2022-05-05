sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/routing/History",
    "ndbs/ui/vehiclemanagementui/model/formatter"
], function (Controller, History, formatter) {
    "use strict";

    return Controller.extend("ndbs.ui.vehiclemanagementui.controller.BaseController", {
        formatter: formatter,
		/**
		 * Convenience method for accessing the router in every controller of the application.
		 * @public
		 * @returns {sap.ui.core.routing.Router} the router for this component
		 */
        getRouter: function () {
            return this.getOwnerComponent().getRouter();
        },

		/**
		 * Convenience method for getting the view model by name in every controller of the application.
		 * @public
		 * @param {string} sName the model name
		 * @returns {sap.ui.model.Model} the model instance
		 */
        getModel: function (sName) {
            return this.getView().getModel(sName);
        },

		/**
		 * Convenience method for setting the view model in every controller of the application.
		 * @public
		 * @param {sap.ui.model.Model} oModel the model instance
		 * @param {string} sName the model name
		 * @returns {sap.ui.mvc.View} the view instance
		 */
        setModel: function (oModel, sName) {
            return this.getView().setModel(oModel, sName);
        },

		/**
		 * Convenience method for getting the resource bundle.
		 * @public
		 * @returns {sap.ui.model.resource.ResourceModel} the resourceModel of the component
		 */
        getResourceBundle: function () {
            return this.getOwnerComponent().getModel("i18n").getResourceBundle();
        },

		/**
		 * Event handler for navigating back.
		 * It there is a history entry or an previous app-to-app navigation we go one step back in the browser history
		 * If not, it will replace the current entry of the browser history with the master route.
		 * @public
		 */
        onNavBack: function () {
            var sPreviousHash = History.getInstance().getPreviousHash(),
                oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");

            if (sPreviousHash !== undefined || !oCrossAppNavigator.isInitialNavigation()) {
                // eslint-disable-next-line sap-no-history-manipulation
                history.go(-1);
            } else {
                this.getRouter().navTo("master", {}, true);
            }
        },
        getTableTemplate: function (oThis) {
            let oTemplate = new sap.m.ColumnListItem({
                cells: [
                    new sap.m.DatePicker({
                        dateValue: "{date}",
                        displayFormat: "dd.MM.yyyy",
                        editable: "{= ${path:'status',targetType:'any'} === 'W' ? true : false}"
                    }),
                    new sap.m.Input({
                        // value: "{projectID}",
                        textFormatMode: "Value",
                        selectedKey: "{projectID}",
                        editable: "{= ${path:'status',targetType:'any'} === 'W' ? true : false}",
                        valueHelpRequest: oThis.onProjectValueHelpRequest.bind(oThis),
                        showValueHelp: true,
                        showSuggestion: true,
                        maxSuggestionWidth: "15rem",
                        suggestionItems: {
                            path: "/Projects",
                            template: new sap.ui.core.ListItem({
                                key: "{projectID}",
                                text: "{projectName}",
                                additionalText: "{projectID}"
                            }),
                            templateShareable: true
                        }
                    }),
                    new sap.m.ComboBox({
                        selectedKey: "{expenseType}",
                        editable: "{= ${path:'status',targetType:'any'} === 'W' ? true : false}",
                        items: [
                            new sap.ui.core.Item({
                                key: "G",
                                text: "{i18n>departure}"
                            }),
                            new sap.ui.core.Item({
                                key: "R",
                                text: "{i18n>returning}"
                            })
                        ]
                    }),
                    new sap.m.Input({
                        value: "{fromLocation}",
                        editable: "{= ${path:'status',targetType:'any'} === 'W' ? true : false}"
                    }),
                    new sap.m.Input({
                        value: "{destination}",
                        editable: "{= ${path:'status',targetType:'any'} === 'W' ? true : false}"
                    }),
                    new sap.m.CheckBox({
                        selected: "{isOutofTown}",
                        editable: "{= ${path:'status',targetType:'any'} === 'W' ? true : false}"
                    }),
                    new sap.m.Input({
                        value: "{path:'distance',type:'sap.ui.model.type.Float', formatOptions:{minFractionDigits:'2',maxFractionDigits:'2'}}",
                        liveChange: oThis.onChangeDistance.bind(oThis),
                        editable: "{= ${path:'status',targetType:'any'} === 'W' ? true : false}"
                    }),
                    new sap.m.Text({
                        text: "{distanceUnit}"
                    }),
                    new sap.m.ObjectNumber({
                        number: "{amount}",
                        unit: "{currency_code}"
                    }),
                    new sap.m.ObjectStatus({
                        state: {
                            path: 'status',
                            formatter: this.formatter.formatExpenseStatusState
                        },
                        icon: {
                            path: 'status',
                            formatter: this.formatter.formatExpenseStatusIcon
                        }
                    }),
                ]
            });
            return oTemplate;
        }

    });

});