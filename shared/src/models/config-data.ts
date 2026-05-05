export interface ConfigData {
    caseStateList: string[],
    deviceHealthList: string[],
    eventTypeList: string[],
    ownerList: string[],
    severityLevelList: string[],
    teamList: Team[],
}

export interface Team {
    id: number,
    name: string,
    color_code: string | null,
}