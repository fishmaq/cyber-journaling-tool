import {BasicConfigModel} from "./basic-models/basic-config-models";
import {NetplanGroup} from "./netplan-group";

export interface Host extends BasicConfigModel {
    ipDescription: string,
    description: string,
    backgroundColorCode: string
    netplanGroup: NetplanGroup,
}
