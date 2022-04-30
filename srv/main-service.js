const cds = require('@sap/cds');

class VehicleManagement extends cds.ApplicationService {
    async init() {
        const db = await cds.connect.to("db");
        const { Personnels } = db.entities("ndbs.db.vehicle");
        let oI18nFolder = {
            _i18nfolders: [__dirname + "/i18n"]
        };

        this.after("READ", "KilometerExpenses", async (oData, req) => {
            oData.forEach((item) => {
                let sExpenseTypeKey = item.expenseType == "G" ? "departure" : "returning";
                item.expenseType = cds.localize(oI18nFolder, req.user.locale, `{i18n>${sExpenseTypeKey}}`);
            });
        });

        await super.init();
    }
}

module.exports = { VehicleManagement };
