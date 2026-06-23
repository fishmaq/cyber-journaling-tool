import {Component, input} from '@angular/core';
import {JournalEvent} from 'shared';
import {DatePipe, NgStyle} from '@angular/common';

@Component({
  selector: 'event-timeline-card',
  imports: [
    DatePipe,
    NgStyle
  ],
  templateUrl: './event-timeline-card.html',
  styleUrl: './event-timeline-card.scss',
})
export class EventTimelineCard {
  journalEvent = input.required<JournalEvent>();
  index = input(0);
  isLast = input(false);
}
