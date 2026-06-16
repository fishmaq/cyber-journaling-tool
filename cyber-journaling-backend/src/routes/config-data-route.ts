import express from "express";
import prisma from "../db";
import {ConfigData, DeviceHealth, EventType, JournalCaseState, Owner, SeverityLevel, Team} from "shared/src/models";


const router = express.Router()

router.get('/', async (req, res) => {
    // TODO: fix this and use types from shared models
    // @ts-ignore
    const teams: Team[] = await prisma.team.findMany();
    const caseStates: JournalCaseState[] = await prisma.case_state.findMany();
    const deviceHealths: DeviceHealth[] = await prisma.device_health.findMany();
    const eventTypes: EventType[] = await prisma.event_type.findMany();
    const owners: Owner[] = await prisma.owner.findMany();
    const severityLevels: SeverityLevel[] = await prisma.severity_level.findMany();
    const configData: ConfigData = {
        caseStateList: caseStates,
        deviceHealthList: deviceHealths,
        eventTypeList: eventTypes,
        ownerList: owners,
        severityLevelList: severityLevels,
        teamList: teams
    }
    return res.status(200).json(configData)
});

export default router