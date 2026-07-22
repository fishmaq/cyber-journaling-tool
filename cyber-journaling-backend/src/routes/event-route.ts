import express from "express";
import prisma, {journalEventInclude} from "../db";
import {mapToJournalEvent} from "../mappings";


const router = express.Router();

router.get("/", async (req, res) => {
    let journal_events = (await prisma.journal_event.findMany(journalEventInclude)).map(mapToJournalEvent);
    return res.status(200).json(journal_events);
});

router.post("/", async (req, res) => {
    const {services_ids, ...event} = req.body;

    await prisma.journal_event.create({
        data: {
            ...event,
            timestamp: event.timestamp ? new Date(event.timestamp) : new Date(),
            journal_events_services: {
                // create fk connections to service
                create: (services_ids ?? []).map((id: number) => ({
                    service: {
                        connect: {id}
                    }
                }))
            }
        }
    });

    return res.status(200).send();
});

router.put("/", async (req, res) => {
    let event = req.body;
    let services_ids = req.body.services_ids;

    if (event.timestamp) {
        event.timestamp = new Date(event.timestamp);
    }

    // update fields
    await prisma.journal_event.update({
        data: removeFkFieldsEvent(event),
        where: {
            id: req.body.id
        }
    });

    //clear all fk connection
    await prisma.journal_events_services.deleteMany({
        where: {event_id: event.id}
    });

    // create fk connections
    if (services_ids?.length) {
        await prisma.journal_events_services.createMany({
            data: services_ids.map((id: number) => ({
                event_id: event.id,
                service_id: id
            }))
        });
    }

    return res.status(200).send();
});

router.delete("/:id", async (req, res) => {
    await prisma.journal_event.delete({
        where: {
            id: Number(req.params.id)
        }
    });
    return res.status(200).send();
});

function removeFkFieldsEvent(data: any) {
    // remove all unnecessary fk fields, as prisma can't handle them
    delete data.journal_case;
    delete data.severity_level;
    delete data.severity_level_id;
    delete data.device_health;
    delete data.device_health_id;
    delete data.event_type;
    delete data.event_type_id;
    delete data.journal_events_services;
    delete data.services;
    delete data.services_ids;
    return data;
}

export default router;