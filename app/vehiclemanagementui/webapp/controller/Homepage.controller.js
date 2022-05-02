sap.ui.define([
    "ndbs/ui/vehiclemanagementui/controller/BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "ndbs/ui/vehiclemanagementui/model/formatter"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (BaseController, JSONModel, Filter, FilterOperator, formatter) {
        "use strict";

        return BaseController.extend("ndbs.ui.vehiclemanagementui.controller.Homepage", {
            formatter: formatter,

            /* =========================================================== */
            /* lifecycle methods                                           */
            /* =========================================================== */

            onInit: function () {
                this.getOwnerComponent().getModel("generalJsonModel").setProperty("/busy", true);
                // this.getView().byId("dpPeriod").setDateValue(new Date());
            },
            onAfterRendering: function () {
                this._getUserVehicleData();
            },

            /* =========================================================== */
            /* internal methods                                            */
            /* =========================================================== */

            _getUserVehicleData: async function () {
                await this._getUserInfo();
                let bFetchData = await this._getPersonnelInfo();
                if (bFetchData) {
                    this._getExpenses();
                }
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
                                    sPeriod = this._getCurrentPeriod(),
                                    sFormattedPeriod = `${sPeriod.substring(5, 7)}/${sPeriod.substring(0, 4)}`,
                                    bFetchData = false;

                                if (oData.toVehicles) {
                                    sStatusText = oResourceBundle.getText("updatable");
                                    sStatus = "Success";
                                    bFetchData = true;
                                } else {
                                    sStatusText = oResourceBundle.getText("noVehicle", [oData.personnelNo, sFormattedPeriod]);
                                    sStatus = "Error";
                                }
                                oGeneralModel.setProperty("/expenseStatusText", sStatusText);
                                oGeneralModel.setProperty("/expenseStatus", sStatus);
                                oGeneralModel.setProperty("/busy", false);
                                fnResolve(bFetchData);
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
                        ],
                        and: true
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
            },
            _getCurrentDate: function () {
                let oDate = new Date(),
                    sDay = oDate.getDate().toString().length < 2 ? `0${oDate.getDate().toString()}` : oDate.getDate().toString(),
                    sMonth = (oDate.getMonth() + 1).toString().length < 2 ? `0${oDate.getMonth() + 1}` : `${oDate.getMonth() + 1}`,
                    sYear = oDate.getFullYear().toString();

                return `${sYear}-${sMonth}-${sDay}`;
            },

            /* =========================================================== */
            /* event handlers                                              */
            /* =========================================================== */

            onAddNewRow: function () {
                this.getView().byId("tblExpenses").getBinding("items").create({
                    date: this._getCurrentDate(),
                    distanceUnit: "KM",
                    amount: 0,
                    currency_code: "TRY",
                    status: "W"
                });
            },
            onChangeDistance: function (oEvent) {
                let sNewValue = oEvent.getParameter("newValue"),
                    oContext = oEvent.getSource().getBindingContext();

                oContext.setProperty("/amount", parseFloat(sNewValue.replace(",", ".")));
            }
        });
    });
