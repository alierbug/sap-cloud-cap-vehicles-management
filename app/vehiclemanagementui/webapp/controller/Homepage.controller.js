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
        let sUpdateGroupId = "batchRequest";
        "use strict";

        return BaseController.extend("ndbs.ui.vehiclemanagementui.controller.Homepage", {
            formatter: formatter,

            /* =========================================================== */
            /* lifecycle methods                                           */
            /* =========================================================== */

            onInit: function () {
                let oView = this.getView(),
                    oMessageManager = sap.ui.getCore().getMessageManager();

                this.getOwnerComponent().getModel("generalJsonModel").setProperty("/busy", true);
                oView.byId("dpPeriod").setDateValue(new Date());
                oView.setModel(oMessageManager.getMessageModel(), "message");
                oMessageManager.registerObject(oView, true);
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
                    oResourceBundle = this.getResourceBundle(),
                    oPeriod = this.getView().byId("dpPeriod");

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
                                    sPeriod = this._getCurrentPeriod(oPeriod.getDateValue()),
                                    sFormattedPeriod = `${sPeriod.substring(5, 7)}/${sPeriod.substring(0, 4)}`,
                                    bFetchData = false;

                                this._iPersonnelNo = oData.personnelNo;

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
                    sPeriod = this._getCurrentPeriod(oView.byId("dpPeriod").getDateValue()),
                    oFilter = new Filter({
                        filters: [
                            new Filter("personnelNo", FilterOperator.EQ, sPersonnelNo),
                            new Filter("period", FilterOperator.EQ, sPeriod)
                        ],
                        and: true
                    }),
                    oTemplate = this.getTableTemplate(this),
                    oGeneralModel = this.getView().getModel("generalJsonModel");

                oView.byId("tblExpenses").bindItems({
                    path: "/KilometerExpenses",
                    template: oTemplate,
                    templateShareable: true,
                    filters: oFilter,
                    parameters: {
                        "$select": "*",
                        "$$updateGroupId": sUpdateGroupId
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
            _getCurrentPeriod: function (oDate = new Date()) {
                let sMonth = (oDate.getMonth() + 1).toString().length < 2 ? `0${oDate.getMonth() + 1}` : `${oDate.getMonth() + 1}`,
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
            _getMessagePopover: function () {
                var oView = this.getView();

                if (!this._pMessagePopover) {
                    this._pMessagePopover = sap.ui.core.Fragment.load({
                        id: oView.getId(),
                        name: "ndbs.ui.vehiclemanagementui.fragments.MessagePopover",
                        controller: this
                    }).then(function (oMessagePopover) {
                        oView.addDependent(oMessagePopover);
                        return oMessagePopover;
                    });
                }
                return this._pMessagePopover;
            },

            /* =========================================================== */
            /* event handlers                                              */
            /* =========================================================== */

            onAddNewRow: function () {
                this.getView().byId("tblExpenses").getBinding("items").create({
                    personnelNo: this._iPersonnelNo,
                    date: this._getCurrentDate(),
                    distance: 0,
                    distanceUnit: "KM",
                    amount: 0,
                    currency_code: "TRY",
                    period: this._getCurrentPeriod(this.getView().byId("dpPeriod").getDateValue()),
                    status: "W"
                });
            },
            onChangeDistance: function (oEvent) {
                let sNewValue = oEvent.getParameter("newValue"),
                    oAmountItem = oEvent.getSource().getParent().getCells()[7],
                    fAmount = sNewValue ? parseFloat(sNewValue.replaceAll(",", ".")) : 0;

                oAmountItem.setNumber(fAmount);
                // oContext.setProperty("/amount", sAmount, "batchRequest");
            },
            onSaveExpenses: function () {
                let oDataModel = this.getView().getModel(),
                    bPendingChanges = oDataModel.hasPendingChanges(),
                    oGeneralModel = this.getView().getModel("generalJsonModel");

                oGeneralModel.setProperty("/busy", true);
                if (bPendingChanges) {
                    oDataModel.submitBatch(sUpdateGroupId).then(() => {
                        oGeneralModel.setProperty("/busy", false);
                    }).catch((oError) => {
                        var test = "x";
                    }).finally((oeee) => {
                        var test = "x";
                    });
                }
            },
            onMessagePopoverPress: function (oEvent) {
                let oSourceControl = oEvent.getSource();

                this._getMessagePopover().then(function (oMessagePopover) {
                    oMessagePopover.openBy(oSourceControl);
                });
            },
            onChangePeriod: function (oEvent) {
                this._getExpenses();
            },
            onDuplicateRows: function () {
                let oExpenseTable = this.getView().byId("tblExpenses"),
                    aSelectedContexts = oExpenseTable.getSelectedContexts();

                aSelectedContexts.forEach((context) => {
                    let oDuplicatedRow = context.getObject();
                    delete oDuplicatedRow.expenseID;
                    oDuplicatedRow.status = "W";
                    oDuplicatedRow.period = this._getCurrentPeriod(this.getView().byId("dpPeriod").getDateValue());

                    oExpenseTable.getBinding("items").create(oDuplicatedRow);
                });
            }
        });
    });
