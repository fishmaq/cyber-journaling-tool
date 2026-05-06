import {BasicDbModel} from "./basic-models/basic-db-model";
import {Service} from "./service";
import {DeviceHealth, EventType, SeverityLevel} from "./config-data";

export interface JournalEvent extends BasicDbModel {
    severityLevel: SeverityLevel,
    deviceHealth: DeviceHealth,
    eventType: EventType,
    timestamp: Date,
    title: string,
    details: string,
    services: Service[],
}
