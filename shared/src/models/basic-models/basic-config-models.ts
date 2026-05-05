import {BasicDbModel} from "./basic-db-model";

export interface BasicConfigModel extends BasicDbModel{
    name: string
}
export interface ExtendedBasicConfigModel extends BasicConfigModel {
    color_code: string | null
}