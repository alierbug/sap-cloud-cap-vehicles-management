sap.ui.define([], function () {
    "use strict";

    return {
		/**
		 * Rounds the currency value to 2 digits
		 *
		 * @public
		 * @param {string} sValue value to be formatted
		 * @returns {string} formatted currency value with 2 digits
		 */
        formatExpenseStatusIcon: function (sValue) {
            let sIcon = "";

            switch (sValue) {
                case "A":
                    sIcon = "sap-icon://sys-enter-2";
                    break;
                case "W":
                    sIcon = "sap-icon://alert";
                    break;
                case "R":
                    sIcon = "sap-icon://error";
                    break;
            }
            return sIcon;
        },
        formatExpenseStatusState: function (sValue) {
            let sState = "";

            switch (sValue) {
                case "A":
                    sState = "Success";
                    break;
                case "W":
                    sState = "Warning";
                    break;
                case "R":
                    sState = "Error";
                    break;
            }
            return sState;
        }
    };
});