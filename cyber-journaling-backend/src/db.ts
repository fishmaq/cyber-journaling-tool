import {Prisma, PrismaClient} from "./generated/prisma/client";
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
        netplan_group: netplanGroupInclude
    }
}

export const serviceInclude = {
    include: {
        host: hostInclude
    }
}

export const journalEventInclude = {
    orderBy: {timestamp: 'asc' as const},
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
    orderBy: {id: 'asc' as const},
    include: {
        journal_event: journalEventInclude,
        team: true,
        case_state: true,
        owner: true
    }
}

export const serviceIncludeEvents = {
    include: {
        journal_events_services: {
            include: {
                journal_event: {
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
            }
        }
    }
};

export const netplanInclude = {
    include: {
        netplan_group: {
            include: {
                host: {
                    include: {
                        service: serviceIncludeEvents
                    }
                }
            }
        }
    }
}

export function formatEventServiceList(journal_events: Prisma.journal_eventGetPayload<typeof journalEventInclude>[]) {
    // TODO: comment this
    return journal_events.map(event => ({
        ...event,
        services: event.journal_events_services.map(j => j.service),
        services_ids: event.journal_events_services.map(j => j.service.id)
    }));
}

export function formatServiceEventList(service: Prisma.serviceGetPayload<typeof serviceIncludeEvents>) {
    // TODO: comment this
    return {
        ...service,
        journal_events: service.journal_events_services
            .map(j => j.journal_event)
            .sort((a, b) => {
                if(a.timestamp === null || b.timestamp === null){
                    return 0;
                }
                return a.timestamp!.getTime() - b.timestamp!.getTime()
            }),
    };
}