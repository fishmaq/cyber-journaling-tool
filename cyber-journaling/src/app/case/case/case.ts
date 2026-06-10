import {Component, inject, OnInit} from '@angular/core';
import {
  MatCell,
  MatCellDef,
  MatColumnDef,
  MatHeaderCell,
  MatHeaderCellDef,
  MatHeaderRow,
  MatHeaderRowDef, MatNoDataRow,
  MatRow,
  MatRowDef,
  MatTable,
  MatTableDataSource
} from '@angular/material/table';
import {JournalCaseService} from '../../service/journal-case.service';
import {firstValueFrom} from 'rxjs';
import {JournalCase} from 'shared/src/models';
import {MatIcon} from '@angular/material/icon';
import {MatDialog} from '@angular/material/dialog';
import {EditCase} from '../edit-case/edit-case';

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
  #dialog = inject(MatDialog);

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

  create() {
    console.debug('Case: create new')
    // create new empty JournalCase
    this.handleDialogue({} as JournalCase)
  }

  edit(element: JournalCase) {
    console.debug('Case: edit id: %d', element.id)
    // use selected JournalCase
    this.handleDialogue(element)
  }

  delete(element: JournalCase) {
    // TODO: add confirmation dialogue
    console.debug('Case: deleting journalCase with id: %d...', element.id)
    this.#journalCaseService.deleteJournalCase(element.id).subscribe(async () => {
      // wait until the data is saved and then refresh the list
      console.debug('Case: Data was deleted')
      await this.loadData()
    });
  }

  handleDialogue(oldCase: JournalCase) {
    console.debug('Case: opening dialogue with journalCase:')
    console.debug(oldCase)

    const dialogRef = this.#dialog.open(EditCase, {
      data: {oldJournalCase: oldCase},
      width: '70%',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      const newCase: JournalCase = result;
      if (newCase !== undefined) {
        console.debug('Case: The dialogue was closed with data:');
        console.debug(newCase)

        console.debug('Case: Sending data to backend...')
        this.#journalCaseService
          .saveJournalCase(newCase)
          .subscribe(async () => {
            // wait until the data is saved and then refresh the list
            console.debug('Case: Data was saved')
            await this.loadData()
          });
      } else {
        console.debug('Case: The dialogue was canceled!');
      }
    });
  }
}
