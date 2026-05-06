import {BasicConfigModel} from "./basic-models/basic-config-models";
import {Host} from "./host";

export interface Service extends BasicConfigModel {
    description: string,
    port: string,
    icon_name: string,
    exposed: boolean
    host: Host,
    events: Event[],
}
