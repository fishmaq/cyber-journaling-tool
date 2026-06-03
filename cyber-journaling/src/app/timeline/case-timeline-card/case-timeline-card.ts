import {Component, input} from '@angular/core';
import {JournalCase} from 'shared/src/models';
import {EventTimelineCard} from '../event-timeline-card/event-timeline-card';

@Component({
  selector: 'case-timeline-card',
  imports: [
    EventTimelineCard
  ],
  templateUrl: './case-timeline-card.html',
  styleUrl: './case-timeline-card.scss',
})
export class CaseTimelineCard {
  journalCase = input.required<JournalCase>();
}
