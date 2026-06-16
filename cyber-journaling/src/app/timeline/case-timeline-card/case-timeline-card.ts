import {Component, input} from '@angular/core';
import {JournalCase} from 'shared/src/models';
import {EventTimelineCard} from '../event-timeline-card/event-timeline-card';
import {MatIcon} from '@angular/material/icon';

@Component({
  selector: 'case-timeline-card',
  imports: [
    EventTimelineCard,
    MatIcon
  ],
  templateUrl: './case-timeline-card.html',
  styleUrl: './case-timeline-card.scss',
})
export class CaseTimelineCard {
  journalCase = input.required<JournalCase>();

  createEvent(id: number) {
    // TODO: implement this
    // TODO: move this to a service or some kind
    console.debug('createEvent() %d', id)
  }
}
