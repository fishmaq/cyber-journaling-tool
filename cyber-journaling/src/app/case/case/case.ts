import {Component, inject, OnInit} from '@angular/core';
import {
  MatCell,
  MatCellDef,
  MatColumnDef,
  MatHeaderCell,
  MatHeaderCellDef,
  MatHeaderRow,
  MatHeaderRowDef,
  MatNoDataRow,
  MatRow,
  MatRowDef,
  MatTable,
  MatTableDataSource
} from '@angular/material/table';
import {JournalCaseService} from '../../service/journal-case.service';
import {firstValueFrom} from 'rxjs';
import {JournalCase} from 'shared/src/models';
import {MatIcon} from '@angular/material/icon';
import {JournalCaseCrudPopupService} from '../../service/journal-case-crud-popup.service';
import {MatSnackBar} from '@angular/material/snack-bar';

@Component({
  selector: 'case',
  imports: [
    MatTable,
    MatColumnDef,
    MatHeaderCellDef,
    MatHeaderCell,
    MatCellDef,
    MatCell,
    MatHeaderRow,
    MatHeaderRowDef,
    MatRowDef,
    MatRow,
    MatIcon,
    MatNoDataRow
  ],
  templateUrl: './case.html',
  styleUrl: './case.scss',
})
export class Case implements OnInit {
  displayedColumns = ['id', 'title', 'team', 'actions'];
  dataSource = new MatTableDataSource<JournalCase>();

  #journalCaseService = inject(JournalCaseService)
  #journalCaseCrudPopupService = inject(JournalCaseCrudPopupService)
  #snackbar = inject(MatSnackBar)

  async ngOnInit() {
    // load data from the service on component init
    await this.loadData();
  }

  async loadData() {
    const data = await firstValueFrom(
      this.#journalCaseService.getJournalCases()
    );
    console.debug('Case: #journalCaseService.getJournalCases()')
    console.debug(data)

    this.dataSource.data = data;
  }

  // TODO: add alerts for error and success

  async create() {
    console.debug('Case: create new')
    // use new empty JournalCase
    const oldEvent = {} as JournalCase;
    const newCase = await this.#journalCaseCrudPopupService.handleDialogue(oldEvent)

    this.handleDialogOutput(newCase);
  }

  async edit(oldCase: JournalCase) {
    console.debug('Case: edit id: %d', oldCase.id)
    // use selected JournalCase
    const newCase = await this.#journalCaseCrudPopupService.handleDialogue(oldCase)

    this.handleDialogOutput(newCase);
  }

  delete(element: JournalCase) {
    // TODO: add confirmation dialogue
    console.debug('Case: deleting journalCase with id: %d...', element.id)
    this.#journalCaseService.deleteJournalCase(element.id).subscribe(async () => {
      // wait until the data is saved and then refresh the list
      console.debug('Case: Data was deleted')
      await this.loadData()
      this.#snackbar.open('Case was deleted successfully!',
        '',
        {
          duration: 3000,
          panelClass: ['snackbar-success']
        }
      );
    });
  }

  handleDialogOutput(newCase: JournalCase | undefined) {
    if (newCase !== undefined) {
      console.debug('Case: The dialogue was closed with data:');
      console.debug(newCase)

      console.debug('Case: Sending data to backend...')
      this.#journalCaseService
        .saveJournalCase(newCase)
        .subscribe(async () => {
          // wait until the data is saved and then refresh the list
          console.debug('Case: Data was saved:')
          console.debug(newCase)
          await this.loadData()
          this.#snackbar.open('Case was saved successfully!',
            '',
            {
              duration: 3000,
              panelClass: ['snackbar-success']
            }
          );
        });
    } else {
      console.debug('Case: The dialogue was canceled!');
    }
  }
}
