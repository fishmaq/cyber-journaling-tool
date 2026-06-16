import express from "express";
import prisma, {netplanInclude} from "../db";

const router = express.Router();

router.get("/", async (req, res) => {

    const netplans = await prisma.team.findMany(netplanInclude);
    return res.status(200).json(netplans);
})

export default router