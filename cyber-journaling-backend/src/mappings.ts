import {JournalCase, JournalEvent, Service, Team} from "shared/src/models";

export function mapToJournalCase(input: any) {
    let journalCase: JournalCase = {
        ...input,
    };

    formatServiceListCase(journalCase);

    return journalCase;
}

export function mapToJournalEvent(input: any) {
    let journalEvent: JournalEvent = {
        ...input,
    };

    journalEvent = formatServiceList(journalEvent);

    return journalEvent;
}

export function mapToTeam(input: any) {
    let team: Team = {
        ...input,
    };

    // map the service_event lookup table
    if (team.netplan_group !== undefined) {
        team.netplan_group.forEach(netplanGroup => {
            if (netplanGroup.host !== undefined) {
                netplanGroup.host.forEach(host => {
                    if (host.service !== undefined) {
                        host.service = formatEventList(host.service);
                    }
                })
            }
        })
    }

    return team;
}

export function formatServiceList(journalEvent: JournalEvent) {
    return ({
        ...journalEvent,
        // take the journal_events_services mapping data and put it in arrays, for simpler use
        services: (journalEvent as any).journal_events_services.sort(sortByEventsServicesTimeStamp).map((j: any) => j.service),
        services_ids: (journalEvent as any).journal_events_services.sort(sortByEventsServicesTimeStamp).map((j: any) => j.service.id)
    });
}

export function formatEventList(input: Service[]) {
    return input!.map(service => {
        console.log(service as any)
        if ((service as any).journal_events_services !== undefined) {
            return ({
                ...service,
                // take the journal_events_services mapping data and put it in arrays, for simpler use
                journal_events: (service as any).journal_events_services.sort(sortByEventsServicesTimeStamp).map((j: any) => j.journal_event),
            })
        }
        return service;
    });
}

export function formatServiceListCase(journalCase: JournalCase) {
    if (journalCase.journal_event !== undefined) {
        journalCase.journal_event = journalCase.journal_event.map(formatServiceList)
    }
}

function sortByEventsServicesTimeStamp(a: any, b: any) {
    if (a.journal_event === undefined || b.journal_event === undefined) {
        return 0;
    }
    return b.journal_event!.timestamp.getTime() - a.journal_event!.timestamp.getTime()
}