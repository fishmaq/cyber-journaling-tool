import express from "express";
import prisma, {serviceInclude} from "../db";


const router = express.Router();

router.get("/", async (req, res) => {

    const services = await prisma.service.findMany(serviceInclude);
    return res.status(200).json(services);
})

export default router