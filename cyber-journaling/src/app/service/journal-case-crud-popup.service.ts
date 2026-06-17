import {inject, Injectable} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {JournalCase} from 'shared/src/models';
import {firstValueFrom} from 'rxjs';
import {EditCase} from '../case/edit-case/edit-case';

@Injectable({
  providedIn: 'root',
})
export class JournalCaseCrudPopupService {

  #dialog = inject(MatDialog);

  async handleDialogue(oldCase: JournalCase): Promise<JournalCase | undefined> {
    console.debug('Case: opening dialogue with JournalCase:')
    console.debug(oldCase)

    const dialogRef = this.#dialog.open(EditCase, {
      data: {
        oldJournalCase: oldCase,
      },
      width: '70%',
      disableClose: true
    });

    // wait until the dialog was closed and return the new Case
    return await firstValueFrom(dialogRef.afterClosed());
  }
}
