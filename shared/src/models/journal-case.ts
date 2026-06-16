import {BasicDbModel} from "./basic-models/basic-db-model";
import {JournalEvent} from "./journal-event";
import {JournalCaseState, Owner} from "./config-data";
import {Team} from "./team";

export interface JournalCase extends BasicDbModel {
    journal_event: JournalEvent[] | undefined,
    team: Team | undefined,
    team_id: number | undefined,
    case_state: JournalCaseState | undefined,
    case_state_id: number | undefined,
    owner: Owner | undefined,
    owner_id: number | undefined,
    title: string | undefined,
    details: string | undefined,
}