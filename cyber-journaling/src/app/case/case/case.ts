import {Component, effect, inject, OnInit, signal} from '@angular/core';
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
import {JournalCase} from 'shared';
import {MatIcon} from '@angular/material/icon';
import {JournalCaseCrudPopupService} from '../../service/journal-case-crud-popup.service';
import {MatSnackBar} from '@angular/material/snack-bar';
import {MatDialog} from '@angular/material/dialog';
import {ConfirmationDialog} from '../../ui/confirmation-dialog/confirmation-dialog';
import {ConfigDataService} from '../../service/config-data.service';

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
  #configDataService = inject(ConfigDataService)

  #snackbar = inject(MatSnackBar)
  #dialog = inject(MatDialog);

  #allCases = signal<JournalCase[]>([]);

  applyTeamFilterEffect = effect(() => {
    const selectedTeamId = this.#configDataService.selectedTeamId();
    this.dataSource.data = this.#filterByTeam(this.#allCases(), selectedTeamId);
  });

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

    this.#allCases.set(data);
    this.dataSource.data = this.#filterByTeam(data, this.#configDataService.selectedTeamId());
  }

  #filterByTeam(cases: JournalCase[], selectedTeamId: number | null) {
    return selectedTeamId == null ? cases : cases.filter(journalCase => journalCase.team_id === selectedTeamId);
  }

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

  async delete(journalEvent: JournalCase) {
    console.debug('Case: deleting JournalCase with id: %d...', journalEvent.id)
    // open dialogue with input data
    const dialogRef = this.#dialog.open(ConfirmationDialog, {
      data: {
        title: 'Are you sure?',
        body: 'Are you sure you want to delete this case? All connected events will be removed as well.'
      },
      width: '70%',
      disableClose: true
    });

    // wait until the dialog was closed and return the new Event
    if (!await firstValueFrom(dialogRef.afterClosed())) {
      console.debug('Case: User cancelled deleting')
      return;
    }

    console.debug('Case: User confirmed deleting')

    console.debug('Case: deleting journalCase with id: %d...', journalEvent.id)
    this.#journalCaseService.deleteJournalCase(journalEvent.id).subscribe(async () => {
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
