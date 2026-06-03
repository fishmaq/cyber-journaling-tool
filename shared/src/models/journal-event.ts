import {BasicDbModel} from "./basic-models/basic-db-model";
import {Service} from "./service";
import {DeviceHealth, EventType, SeverityLevel} from "./config-data";

export interface JournalEvent extends BasicDbModel {
    severity_level: SeverityLevel,
    device_health: DeviceHealth,
    event_type: EventType,
    timestamp: Date,
    title: string,
    details: string,
    services: Service[],
}
