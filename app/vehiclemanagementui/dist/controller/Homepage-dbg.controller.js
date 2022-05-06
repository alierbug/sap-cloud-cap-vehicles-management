sap.ui.define([
    "ndbs/ui/vehiclemanagementui/controller/BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "ndbs/ui/vehiclemanagementui/model/formatter",
    "sap/m/MessageToast",
    "sap/ui/model/Sorter"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (BaseController, JSONModel, Filter, FilterOperator, formatter, MessageToast, Sorter) {
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
                            "$expand": "toVehicles($select=*),toProjects"
                        },
                        events: {
                            dataReceived: (oEvent) => {
                                let oData = oEvent.getSource().getBoundContext().getObject(),
                                    sStatusText = "",
                                    sStatus = "",
                                    sPeriod = this._getCurrentPeriod(oPeriod.getDateValue()),
                                    sFormattedPeriod = `${sPeriod.substring(5, 7)}/${sPeriod.substring(0, 4)}`,
                                    bFetchData = false,
                                    bButtonEnabled = true;

                                this._iPersonnelNo = oData.personnelNo;

                                if (oData.toVehicles) {
                                    sStatusText = oResourceBundle.getText("updatable");
                                    sStatus = "Success";
                                    bFetchData = true;
                                } else {
                                    sStatusText = oResourceBundle.getText("noVehicle", [oData.personnelNo, sFormattedPeriod]);
                                    sStatus = "Error";
                                    bButtonEnabled = false;
                                }
                                oGeneralModel.setProperty("/expenseStatusText", sStatusText);
                                oGeneralModel.setProperty("/expenseStatus", sStatus);
                                oGeneralModel.setProperty("/busy", false);
                                oGeneralModel.setProperty("/buttonEnabled", bButtonEnabled);
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
                    oGeneralModel = this.getView().getModel("generalJsonModel"),
                    oSorter = new Sorter({
                        path: "date",
                        descending: true,
                        group: false
                    });

                oView.byId("tblExpenses").bindItems({
                    path: "/KilometerExpenses",
                    template: oTemplate,
                    templateShareable: true,
                    filters: oFilter,
                    sorters: oSorter,
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
                                if (expense) {
                                    fTotalTrip += Number(expense.getObject().distance);
                                    fTotalAmount += Number(expense.getObject().amount)
                                }
                            });

                            oGeneralModel.setProperty("/totalAmount", fTotalAmount.toFixed(2));
                            oGeneralModel.setProperty("/currency_code", "TRY");
                            oGeneralModel.setProperty("/totalTrip", fTotalTrip.toFixed(2));
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
                let oView = this.getView();

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
            _deleteExpenses: function (oContext) {
                return new Promise((fnResolve) => {
                    oContext.delete("$direct").then(() => {
                        fnResolve();
                    });
                });
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
                    fFuelFactor = this.getView().byId("ophcExpensesHeader").getBindingContext().getProperty("toVehicles/fuelFactor"),
                    fAmount = sNewValue ? parseFloat(sNewValue.replaceAll(",", ".")) : 0,
                    oContext = oEvent.getSource().getBindingContext(),
                    sPath = oContext.getPath();

                //Yakıt çarpanıyla mesafeyi çarp
                fAmount *= fFuelFactor;
                fAmount = fAmount.toFixed(2);
                oContext.setProperty(`${sPath}/amount`, fAmount);
            },
            onSaveExpenses: function () {
                let oDataModel = this.getView().getModel(),
                    bPendingChanges = oDataModel.hasPendingChanges(),
                    oGeneralModel = this.getView().getModel("generalJsonModel");

                if (bPendingChanges) {
                    oGeneralModel.setProperty("/busy", true);
                    oDataModel.submitBatch(sUpdateGroupId).then(() => {
                        oGeneralModel.setProperty("/busy", false);
                        if (!this.getView().getModel().hasPendingChanges()) {
                            MessageToast.show(this.getResourceBundle().getText("savedSuccessfully"));
                        }
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
                if (this.getView().getModel().hasPendingChanges()) {
                    this.getView().getModel().resetChanges(sUpdateGroupId);
                }
                this._getExpenses();
            },
            onDuplicateRows: function () {
                let oExpenseTable = this.getView().byId("tblExpenses"),
                    aSelectedContexts = oExpenseTable.getSelectedContexts();

                if (!aSelectedContexts.length) {
                    MessageToast.show(this.getResourceBundle().getText("atLeastOneRow"));
                    return;
                }

                aSelectedContexts.forEach((context) => {
                    let oDuplicatedRow = context.getObject();
                    delete oDuplicatedRow.expenseID;
                    oDuplicatedRow.status = "W";
                    oDuplicatedRow.period = this._getCurrentPeriod(this.getView().byId("dpPeriod").getDateValue());

                    oExpenseTable.getBinding("items").create(oDuplicatedRow);
                });
            },
            onDeleteRow: function () {
                let oExpenseTable = this.getView().byId("tblExpenses"),
                    aSelectedContexts = oExpenseTable.getSelectedContexts(),
                    aDeletedContexts = [];

                if (!aSelectedContexts.length) {
                    MessageToast.show(this.getResourceBundle().getText("atLeastOneRow"));
                    return;
                }

                aSelectedContexts.forEach((context) => {
                    aDeletedContexts.push(this._deleteExpenses(context));
                });

                Promise.all(aDeletedContexts).then(() => {
                    oExpenseTable.getBinding("items").refresh();
                });
            },
            onProjectValueHelpRequest: function (oEvent) {
                this._oProjectInput = oEvent.getSource();

                if (!this._oProjectValueHelp) {
                    this._oProjectValueHelp = sap.ui.core.Fragment.load({
                        id: this.getView().getId(),
                        name: "ndbs.ui.vehiclemanagementui.fragments.ValueHelp",
                        controller: this
                    }).then(function (oDialog) {
                        this.getView().addDependent(oDialog);
                        return oDialog;
                    }.bind(this));
                }
                this._oProjectValueHelp.then(function (oDialog) {
                    oDialog.open();
                });
            },
            onValueProjectSearch: function (oEvent) {
                let sValue = oEvent.getParameter("value"),
                    oFilter = new Filter("projectName", FilterOperator.Contains, sValue);

                oEvent.getSource().getBinding("items").filter(oFilter);
            },
            onValueProjectConfirm: function (oEvent) {
                let iSelectedProject = + oEvent.getParameter("selectedItem").getDescription().replaceAll(".", "");
                this._oProjectInput.setSelectedKey(iSelectedProject);
            }
        });
    });
