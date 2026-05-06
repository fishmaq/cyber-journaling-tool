import express from "express";
import prisma, {journalCaseInclude} from "../db";


const router = express.Router();

router.get("/", async (req, res) => {

    const journal_cases = await prisma.journal_case.findMany(journalCaseInclude);
    return res.status(200).json(journal_cases);
})

export default router