namespace ndbs.db.vehicle;

using {Currency} from '@sap/cds/common';

entity KilometerExpenses {
    key expenseID    : UUID;
        personnelNo  : Personnels:personnelNo;
        projectID    : Projects:projectID;
        date         : Date;
        @assert.range : true
        expenseType  : String(10) enum {
            G;
            R;
        };
        fromLocation : String(50);
        destination  : String(50);
        isOutofTown  : Boolean;
        distance     : Decimal(15, 2);
        @assert.range : true
        distanceUnit : String(20) enum {
            KM;
            M;
        };
        amount       : Decimal(15, 2);
        currency     : Currency;
        period       : String(7);
        @assert.range : true
        status       : String(30) enum {
            A;
            W;
            R;
        };
        toPersonnels : Association to Personnels
                           on toPersonnels.personnelNo = $self.personnelNo;
        toProjects   : Association to Projects
                           on toProjects.projectID = $self.projectID;
};

entity Personnels {
    key personnelNo   : Integer;
        firstName     : String(50);
        lastName      : type of firstName;
        departmentID  : Departments:departmentID;
        levelID       : Levels:levelID;
        birthCity     : type of firstName;
        birthDate     : Date;
        email         : String(160);
        vehicleID     : Vehicles:vehicleID;
        toVehicles    : Association to Vehicles
                            on toVehicles.vehicleID = $self.vehicleID;
        toDepartments : Association to Departments
                            on toDepartments.departmentID = $self.departmentID;
        toLevels      : Association to Levels
                            on toLevels.levelID = $self.levelID;
        toProjects    : Association to many PersonnelsofProjects
                            on toProjects.toPersonnels = $self;
};

entity Departments {
    key departmentID   : String(4);
        departmentName : String(100);
        toPersonnels   : Association to many Personnels
                             on toPersonnels.toDepartments = $self;
};

entity Levels {
    key levelID    : String(2);
        levelDescr : String(50);
};

entity Projects {
    key projectID    : Integer;
        projectName  : String(100);
        toPersonnels : Association to many PersonnelsofProjects
                           on toPersonnels.toProjects = $self;
};

entity Vehicles {
    key vehicleID    : Integer;
        serialNo     : Integer;
        licencePlate : String(10);
        brand        : String(50);
        model        : type of brand;
        age          : Integer;
};

entity PersonnelsofProjects {
    key personnelNo  : Personnels:personnelNo;
    key projectID    : Projects:projectID;
        toPersonnels : Association to Personnels
                           on toPersonnels.personnelNo = $self.personnelNo;
        toProjects   : Association to Projects
                           on toProjects.projectID = $self.projectID;
};
