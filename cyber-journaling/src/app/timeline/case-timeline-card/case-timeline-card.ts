import {Component, inject, input, output} from '@angular/core';
import {JournalCase, JournalEvent} from 'shared';
import {EventTimelineCard} from '../event-timeline-card/event-timeline-card';
import {MatIcon} from '@angular/material/icon';
import {JournalEventCrudPopupService} from '../../service/journal-event-crud-popup.service';
import {JournalEventService} from '../../service/journal-event.service';
import {MatSnackBar} from '@angular/material/snack-bar';

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
  eventCreated = output();

  #journalEventCrudPopupService = inject(JournalEventCrudPopupService)
  #journalEventService = inject(JournalEventService)
  #snackbar = inject(MatSnackBar)

  async createEvent(id: number) {
    console.debug('createEvent() %d', id)

    // use new empty JournalEvent
    const newEvent: JournalEvent | undefined =
      await this.#journalEventCrudPopupService.handleDialogue(
        {case_id:this.journalCase()!.id} as JournalEvent
      )

    if (newEvent !== undefined) {
      console.debug('Timeline: The dialogue was closed with data:');
      console.debug(newEvent)

      console.debug('Timeline: Sending data to backend...')
      this.#journalEventService
        .saveJournalEvent(newEvent)
        .subscribe(async () => {
          // wait until the data is saved and then refresh the list
          console.debug('Timeline: Data was saved:')
          console.debug(newEvent)
          this.eventCreated.emit();

          this.#snackbar.open('Event was saved successfully!',
            '',
            {
              duration: 3000,
              panelClass: ['snackbar-success']
            }
          );
        });
    } else {
      // do nothing and just log
      console.debug('Timeline: The dialogue was canceled!');
    }
  }
}
