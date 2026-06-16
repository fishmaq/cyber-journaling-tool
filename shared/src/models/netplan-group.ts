import {ExtendedBasicConfigModel} from "./basic-models/basic-config-models";
import {Team} from "./team";
import {Host} from "./host";

export interface NetplanGroup extends ExtendedBasicConfigModel {
    team: Team,
    host: Host[] | undefined,
    priority: number | undefined,
}
