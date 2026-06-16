import {BasicConfigModel} from "./basic-models/basic-config-models";
import {Host} from "./host";
import {JournalEvent} from "./journal-event";

export interface Service extends BasicConfigModel {
    description: string,
    port: string,
    icon_name: string,
    exposed: boolean
    host: Host,
    journal_events: JournalEvent[] | undefined,
}
