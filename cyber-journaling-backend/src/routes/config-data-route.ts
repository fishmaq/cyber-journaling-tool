import express from "express";
import prisma from "../db";
import {ConfigData, Team} from "../../../shared/src/models";
import {Case, DeviceHealth, EventType, Owner, SeverityLevel} from "shared/dist/models/config-data";

const router = express.Router()

router.get('/', async (req, res) => {
    const teams:Team[] = await prisma.team.findMany();
    const caseState:Case[] = await prisma.case_state.findMany();
    const deviceHealth:DeviceHealth[] = await prisma.device_health.findMany();
    const eventType:EventType[] = await prisma.event_type.findMany();
    const owner:Owner[] = await prisma.owner.findMany();
    const severityLevel:SeverityLevel[] = await prisma.severity_level.findMany();
    const configData: ConfigData = {
        caseStateList:caseState,
        deviceHealthList: deviceHealth,
        eventTypeList:eventType,
        ownerList:owner,
        severityLevelList:severityLevel,
        teamList: teams
    }
    return res.status(200).json(configData)
});

export default router