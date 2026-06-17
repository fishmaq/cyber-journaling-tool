import {inject, Injectable} from '@angular/core';
import {JournalEvent} from 'shared/src/models';
import {firstValueFrom} from 'rxjs';
import {EditEvent} from '../event/edit-event/edit-event';
import {MatDialog} from '@angular/material/dialog';
import {JournalCaseService} from './journal-case.service';
import {JournalServiceService} from './journal-service.service';

@Injectable({
  providedIn: 'root',
})
export class JournalEventCrudPopupService {
  #dialog = inject(MatDialog);
  #journalCaseService = inject(JournalCaseService);
  #journalServiceService = inject(JournalServiceService);

  async handleDialogue(oldEvent: JournalEvent): Promise<JournalEvent | undefined> {
    console.debug('Event: opening dialogue with JournalEvent:')
    console.debug(oldEvent)

    const caseList = await firstValueFrom(this.#journalCaseService.getJournalCases());
    const serviceList = await firstValueFrom(this.#journalServiceService.getServices());
    // open dialogue with input data
    const dialogRef = this.#dialog.open(EditEvent, {
      data: {
        oldJournalEvent: oldEvent,
        caseList: caseList,
        serviceList: serviceList
      },
      width: '70%',
      disableClose: true
    });

    // wait until the dialog was closed and return the new Event
    return await firstValueFrom(dialogRef.afterClosed());
  }
}
