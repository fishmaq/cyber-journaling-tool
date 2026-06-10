import {BasicConfigModel, ExtendedBasicConfigModel} from "./basic-models/basic-config-models";

export interface ConfigData {
    caseStateList: JournalCaseState[],
    deviceHealthList: DeviceHealth[],
    eventTypeList: EventType[],
    ownerList: Owner[],
    severityLevelList: SeverityLevel[],
    teamList: Team[],
}

export interface JournalCaseState extends BasicConfigModel{}
export interface DeviceHealth extends ExtendedBasicConfigModel {}
export interface EventType extends BasicConfigModel{}
export interface Owner extends BasicConfigModel{}
export interface SeverityLevel extends ExtendedBasicConfigModel{}
export interface Team extends ExtendedBasicConfigModel{}
