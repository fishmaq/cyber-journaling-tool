import express from "express";
import prisma, {formatServiceEventList, netplanInclude} from "../db";

const router = express.Router();

router.get("/", async (req, res) => {
    // TODO: comment this
    let netplans = await prisma.team.findMany(netplanInclude);
    netplans.forEach(team =>
        team.netplan_group.forEach(netplanGroup =>
            netplanGroup.host.forEach(host =>
                host.service = host.service.map(service =>
                    formatServiceEventList(service)
                )
            )
        )
    )

    return res.status(200).json(netplans);
})

export default router