import {BasicConfigModel} from "./basic-models/basic-config-models";
import {NetplanGroup} from "./netplan-group";
import {Service} from "./service";

export interface Host extends BasicConfigModel {
    ip_description: string,
    description: string,
    background_color_code: string
    netplan_group: NetplanGroup,
    service: Service[] |undefined,
    priority: number | undefined,
}
