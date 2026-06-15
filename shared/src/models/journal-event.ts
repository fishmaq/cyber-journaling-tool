import {BasicDbModel} from "./basic-models/basic-db-model";
import {Service} from "./service";
import {DeviceHealth, EventType, SeverityLevel} from "./config-data";

export interface JournalEvent extends BasicDbModel {
    severity_level: SeverityLevel,
    severity_level_id: number | undefined
    device_health: DeviceHealth,
    device_health_id: number | undefined
    event_type: EventType,
    event_type_id: number | undefined,
    case_id: number | undefined,
    timestamp: Date,
    title: string,
    details: string,
    services: Service[],
    services_ids: number[],
}
