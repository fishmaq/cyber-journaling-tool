import {PrismaClient} from "./generated/prisma/client";
import {PrismaPg} from "@prisma/adapter-pg";

const adapter = new PrismaPg({
    connectionString: "postgresql://cyber-journaling:cyber-journaling@localhost:5433/cyber-journaling",
});

const prisma = new PrismaClient({adapter: adapter})
export default prisma

// (helper) constants to make including the foreign key references in prisma easier
export const netplanGroupInclude = {
    include: {
        team: true
    }
}

export const hostInclude = {
    include: {
        netplan: netplanGroupInclude
    }
}

export const serviceInclude = {
    include: {
        host: hostInclude
    }
}

export const journalEventInclude = {
    include: {
        severity_level: true,
        device_health: true,
        event_type: true,
        journal_events_services: {
            include: {
                service: serviceInclude
            }
        }
    }
}

export const journalCaseInclude = {
    include: {
        journal_event: journalEventInclude
    }
}