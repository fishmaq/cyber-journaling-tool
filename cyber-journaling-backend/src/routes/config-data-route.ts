import express from "express";
import prisma from "../db";
import {ConfigData, Team} from "../../../shared/src/models";

const router = express.Router()

router.get('/', async (req, res) => {
    const teams:Team[] = await prisma.team.findMany();
    // TODO
    const configData: ConfigData = {
        caseStateList:[],
        deviceHealthList:[],
        eventTypeList:[],
        ownerList:[],
        severityLevelList:[],
        teamList: teams
    }
    return res.status(200).json(configData)
});

export default router