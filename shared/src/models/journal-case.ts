import {BasicDbModel} from "./basic-models/basic-db-model";
import {JournalEvent} from "./journal-event";

export interface JournalCase extends BasicDbModel {
    journal_event: JournalEvent[],
    title: string,
    details: string,
}