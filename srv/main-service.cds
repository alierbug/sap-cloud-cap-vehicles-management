using {ndbs.db.vehicle as v} from '../db/main.cds';

service VehicleManagement @(impl : './main-service.js') {
    entity KilometerExpenses    as projection on v.KilometerExpenses {
        *,
        toPersonnels,
        toProjects
    };

    entity Personnels           as projection on v.Personnels {
        *,
        toDepartments,
        toLevels,
        toProjects,
        toVehicles
    };

    entity Departments          as projection on v.Departments {
        *,
        toPersonnels
    };

    entity Levels               as projection on v.Levels;

    entity Projects             as projection on v.Projects {
        *,
        toPersonnels
    };

    entity Vehicles             as projection on v.Vehicles;

    entity PersonnelsofProjects as projection on v.PersonnelsofProjects {
        *,
        toPersonnels,
        toProjects
    };

    entity PersonnelInformation as projection on Personnels {
        key email,
            personnelNo,
            firstName,
            lastName,
            departmentID,
            levelID,
            birthCity,
            birthDate,
            vehicleID,
            toDepartments,
            toLevels,
            toProjects,
            toVehicles
    };
};
