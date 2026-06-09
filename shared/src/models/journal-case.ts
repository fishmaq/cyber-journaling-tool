import {BasicDbModel} from "./basic-models/basic-db-model";
import {JournalEvent} from "./journal-event";
import {Team} from "./config-data";

export interface JournalCase extends BasicDbModel {
    journal_event: JournalEvent[] | undefined,
    team: Team | undefined,
    title: string | undefined,
    details: string | undefined,
}