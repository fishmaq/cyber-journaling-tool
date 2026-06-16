import {ExtendedBasicConfigModel} from "./basic-models/basic-config-models";
import {Team} from "./config-data";

export interface NetplanGroup extends ExtendedBasicConfigModel {
    team: Team,
    priority: string | undefined,
}
