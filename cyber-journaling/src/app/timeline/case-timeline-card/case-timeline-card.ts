import {Component, inject, input, output} from '@angular/core';
import {JournalCase, JournalCaseState, JournalEvent} from 'shared';
import {EventTimelineCard} from '../event-timeline-card/event-timeline-card';
import {MatIcon} from '@angular/material/icon';
import {JournalEventCrudPopupService} from '../../service/journal-event-crud-popup.service';
import {JournalEventService} from '../../service/journal-event.service';
import {JournalCaseService} from '../../service/journal-case.service';
import {ConfigDataService} from '../../service/config-data.service';
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
  caseStateChanged = output();

  #journalEventCrudPopupService = inject(JournalEventCrudPopupService)
  #journalEventService = inject(JournalEventService)
  #journalCaseService = inject(JournalCaseService)
  #configDataService = inject(ConfigDataService)
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

  closeCase() {
    console.debug('closeCase() %d', this.journalCase()!.id)
    const closedState = this.#configDataService.config()?.caseStateList
      .find(state => state.name === 'Closed');

    if (closedState === undefined) {
      console.debug('Timeline: Could not find the "Closed" case state')
      this.#snackbar.open('Could not find the "Closed" case state.', '', {duration: 3000});
      return;
    }

    this.#saveCaseWithState(closedState, 'Case was closed successfully!');
  }

  reopenCase() {
    console.debug('reopenCase() %d', this.journalCase()!.id)

    const openState = this.#configDataService.config()?.caseStateList
      .find(state => state.name !== 'Closed');

    if (openState === undefined) {
      console.debug('Timeline: Could not find a state to reopen the case with')
      this.#snackbar.open('Could not find a state to reopen the case with.', '', {duration: 3000});
      return;
    }

    this.#saveCaseWithState(openState, 'Case was reopened successfully!');
  }

  #saveCaseWithState(caseState: JournalCaseState, successMessage: string) {
    const updatedCase: JournalCase = {
      ...this.journalCase(),
      case_state_id: caseState.id,
      case_state: caseState
    };

    this.#journalCaseService.saveJournalCase(updatedCase).subscribe(() => {
      console.debug('Timeline: Case state was updated to %s', caseState.name)
      this.caseStateChanged.emit();

      this.#snackbar.open(successMessage,
        '',
        {
          duration: 3000,
          panelClass: ['snackbar-success']
        }
      );
    });
  }
}
