using {ndbs.db.vehicle as v} from './main';

annotate v.KilometerExpenses with {
    personnelNo  @Common.Label : '{i18n>personnelNo}';
    projectID    @Common.Label : '{i18n>projectID}';
    date         @Common.Label : '{i18n>date}';
    expenseType  @Common.Label : '{i18n>expenseType}';
    fromLocation @Common.Label : '{i18n>fromLocation}';
    destination  @Common.Label : '{i18n>destination}';
    isOutofTown  @Common.Label : '{i18n>isOutofTown}';
    distance     @Common.Label : '{i18n>distance}';
    distanceUnit @Common.Label : '{i18n>distanceUnit}';
    amount       @Common.Label : '{i18n>amount}'  @Measures.ISOCurrency : currency.code;
    currency     @Common.Label : '{i18n>currency}';
    status       @Common.Label : '{i18n>status}';
};

annotate v.Personnels with {
    personnelNo  @Common.Label : '{i18n>personnelNo}';
    firstName    @Common.Label : '{i18n>firstName}';
    lastName     @Common.Label : '{i18n>lastName}';
    departmentID @Common.Label : '{i18n>departmentID}';
    levelID      @Common.Label : '{i18n>levelID}';
    birthCity    @Common.Label : '{i18n>birthCity}';
    birthDate    @Common.Label : '{i18n>birthDate}';
    vehicleID    @Common.Label : '{i18n>vehicleID}';
};

annotate v.Departments with {
    departmentID   @Common.Label : '{i18n>departmentID}';
    departmentName @Common.Label : '{i18n>departmentName}';
};

annotate v.Levels with {
    levelID    @Common.Label : '{i18n>levelID}';
    levelDescr @Common.Label : '{i18n>levelDescr}';
};

annotate v.Projects with {
    projectID   @Common.Label : '{i18n>projectID}';
    projectName @Common.Label : '{i18n>projectName}';
};

annotate v.Vehicles with {
    vehicleID @Common.Label : '{i18n>vehicleID}';
    serialNo  @Common.Label : '{i18n>serialNo}';
    brand     @Common.Label : '{i18n>brand}';
    model     @Common.Label : '{i18n>model}';
    age       @Common.Label : '{i18n>age}';
};

annotate v.PersonnelsofProjects with {
    personnelNo @Common.Label : '{i18n>personnelNo}';
    projectID   @Common.Label : '{i18n>projectID}';
};
