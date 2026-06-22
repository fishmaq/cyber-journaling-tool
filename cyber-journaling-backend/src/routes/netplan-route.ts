import express from "express";
import prisma, {netplanInclude} from "../db";
import {mapToTeam} from "../mappings";

const router = express.Router();

router.get("/", async (req, res) => {
    let netplans = (await prisma.team.findMany(netplanInclude)).map(mapToTeam);
    return res.status(200).json(netplans);
})

export default router