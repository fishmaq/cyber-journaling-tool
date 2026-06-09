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

@Component({
  selector: 'app-case',
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
  protected displayedColumns = ['id', 'title', 'team', 'actions'];
  protected dataSource = new MatTableDataSource<JournalCase>();

  #journalCaseService = inject(JournalCaseService)

  async ngOnInit() {
    // load data from the service on component init
    const data = await firstValueFrom(
      this.#journalCaseService.getJournalCases()
    );
    console.debug('Case: #journalCaseService.getJournalCases()')
    console.debug(data)

    this.dataSource.data = data;
  }

  protected edit(element: JournalCase) {
    console.debug('Case: edit id: %d', element.id)
  }

  protected delete(element: JournalCase) {
    console.debug('Case: delete id: %d', element.id)
  }

  protected create() {
    console.debug('Case: create new')

  }
}
