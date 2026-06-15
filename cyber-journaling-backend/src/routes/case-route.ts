import express from "express";
import prisma, {formatEventServiceList, journalCaseInclude} from "../db";


const router = express.Router();

router.get("/", async (req, res) => {
    let journal_cases = await prisma.journal_case.findMany(journalCaseInclude);
    journal_cases.map(journalCase => journalCase.journal_event = formatEventServiceList(journalCase.journal_event))
    return res.status(200).json(journal_cases);
})

router.post("/", async (req, res) => {
    await prisma.journal_case.create({data: req.body});
    return res.status(200).send();
})

router.put("/", async (req, res) => {

    await prisma.journal_case.update({
        data: removeFkFieldsCase(req.body),
        where: {
            id: req.body.id
        }
    });
    return res.status(200).send();
})

router.delete("/:id", async (req, res) => {
    await prisma.journal_case.delete({
        where: {
            id: Number(req.params.id)
        }
    });
    return res.status(200).send();
})

function removeFkFieldsCase(data: any) {
    // remove all unnecessary fk fields, as prisma can't handle them
    delete data.journal_event;
    delete data.team;
    return data;
}

export default router