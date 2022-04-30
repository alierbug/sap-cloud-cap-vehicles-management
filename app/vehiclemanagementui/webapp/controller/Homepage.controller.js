sap.ui.define([
    "ndbs/ui/vehiclemanagementui/controller/BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (BaseController, JSONModel, Filter, FilterOperator) {
        "use strict";

        return BaseController.extend("ndbs.ui.vehiclemanagementui.controller.Homepage", {

            /* =========================================================== */
            /* lifecycle methods                                           */
            /* =========================================================== */

            onInit: function () {
                this.getOwnerComponent().getModel("generalJsonModel").setProperty("/busy", true);
                this.getView().byId("dpPeriod").setDateValue(new Date());
            },
            onAfterRendering: function () {
                this._getUserVehicleData();
            },

            /* =========================================================== */
            /* internal methods                                            */
            /* =========================================================== */

            _getUserVehicleData: async function () {
                await this._getUserInfo();
                await this._getPersonnelInfo();
                this._getExpenses();
            },
            _getUserInfo: function () {
                let sAppId = this.getOwnerComponent().getManifestEntry("/sap.app/id"),
                    sAppPath = sAppId.replaceAll(".", "/"),
                    sAppModulePath = `${jQuery.sap.getModulePath(sAppPath)}/user-api/currentUser`,
                    oUserModel = new JSONModel();

                return new Promise((fnResolve, fnReject) => {
                    oUserModel.loadData(sAppModulePath);
                    oUserModel.dataLoaded().then(() => {
                        if (!oUserModel.getData().email) { //For local test
                            let sMockUser = {
                                firstname: "Hasan",
                                lastname: "Çiftçi",
                                email: "hasan.ciftci@nttdata.com",
                                name: "hasan.ciftci@nttdata.com",
                                displayName: "Hasan Çiftçi (hasan.ciftci@nttdata.com)"
                            };
                            oUserModel.setData(sMockUser);
                        }
                        this.getView().setModel(oUserModel, "userInfo");
                        fnResolve();
                    });
                });
            },
            _getPersonnelInfo: function () {
                let sUserEmail = this.getView().getModel("userInfo").getProperty("/email"),
                    oGeneralModel = this.getView().getModel("generalJsonModel"),
                    oResourceBundle = this.getResourceBundle();

                return new Promise((fnResolve, fnReject) => {
                    this.getView().byId("ophcExpensesHeader").bindElement({
                        path: `/PersonnelInformation('${sUserEmail}')`,
                        parameters: {
                            "$select": "*",
                            "$expand": "toVehicles"
                        },
                        events: {
                            dataReceived: (oEvent) => {
                                let oData = oEvent.getSource().getBoundContext().getObject(),
                                    sStatusText = "",
                                    sStatus = "",
                                    sPeriod = "04/2022";

                                if (oData.toVehicles) {
                                    sStatusText = oResourceBundle.getText("updatable");
                                    sStatus = "Success";
                                } else {
                                    sStatusText = oResourceBundle.getText("noVehicle", [oData.personnelNo, sPeriod]);
                                    sStatus = "Error";
                                }
                                oGeneralModel.setProperty("/expenseStatusText", sStatusText);
                                oGeneralModel.setProperty("/expenseStatus", sStatus);
                                oGeneralModel.setProperty("/busy", false);
                                fnResolve();
                            }
                        }
                    });
                });
            },
            _getExpenses: function () {
                let oView = this.getView(),
                    sPersonnelNo = oView.byId("ophcExpensesHeader").getBindingContext().getProperty("personnelNo"),
                    sPeriod = this._getCurrentPeriod(),
                    oFilter = new Filter({
                        filters: [
                            new Filter("personnelNo", FilterOperator.EQ, sPersonnelNo),
                            new Filter("period", FilterOperator.EQ, sPeriod)
                        ]
                    }),
                    oTemplate = oView.byId("cliExpenses"),
                    oGeneralModel = this.getView().getModel("generalJsonModel");

                oView.byId("tblExpenses").bindItems({
                    path: "/KilometerExpenses",
                    template: oTemplate,
                    templateShareable: true,
                    filters: oFilter,
                    parameters: {
                        "$select": "*"
                    },
                    events: {
                        dataReceived: (oEvent) => {
                            let aContext = oEvent.getSource().getCurrentContexts(),
                                fTotalTrip = 0,
                                fTotalAmount = 0;

                            aContext.forEach((expense) => {
                                fTotalTrip += Number(expense.getObject().distance);
                                fTotalAmount += Number(expense.getObject().amount)
                            });

                            oGeneralModel.setProperty("/totalAmount", fTotalAmount);
                            oGeneralModel.setProperty("/currency_code", "TRY");
                            oGeneralModel.setProperty("/totalTrip", fTotalTrip);
                            oGeneralModel.setProperty("/distanceUnit", "KM");
                        }
                    }
                });
            },
            _getCurrentPeriod: function () {
                let oDate = new Date(),
                    sMonth = (oDate.getMonth() + 1).toString().length < 2 ? `0${oDate.getMonth() + 1}` : `${oDate.getMonth() + 1}`,
                    sYear = oDate.getFullYear().toString(),
                    sPeriod = `${sYear}-${sMonth}`;

                return sPeriod;
            }
        });
    });
