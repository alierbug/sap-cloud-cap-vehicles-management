sap.ui.define([
    "ndbs/ui/vehiclemanagementui/controller/BaseController",
    "sap/ui/model/json/JSONModel"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (BaseController, JSONModel) {
        "use strict";

        return BaseController.extend("ndbs.ui.vehiclemanagementui.controller.Homepage", {

            /* =========================================================== */
            /* lifecycle methods                                           */
            /* =========================================================== */

            onInit: function () {
                this.getOwnerComponent().getModel("generalJsonModel").setProperty("/busy", true);
            },
            onAfterRendering: function () {
                this._getUserVehicleData();
            },

            /* =========================================================== */
            /* internal methods                                            */
            /* =========================================================== */

            _getUserVehicleData: async function () {
                await this._getUserInfo();
                this._getPersonnelInfo();
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

                this.getView().byId("ophcExpensesHeader").bindContext({
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
                        }
                    }
                });
            },
            _getExpenses: function () {

            }
        });
    });
