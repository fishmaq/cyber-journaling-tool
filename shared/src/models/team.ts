import {ExtendedBasicConfigModel} from "./basic-models/basic-config-models";
import {NetplanGroup} from "./netplan-group";

export interface Team extends ExtendedBasicConfigModel {
    netplan_group: NetplanGroup[] | undefined,
}
