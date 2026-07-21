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
import {MatIcon} from '@angular/material/icon';
import {JournalEvent} from 'shared';
import {JournalEventService} from '../../service/journal-event.service';
import {firstValueFrom} from 'rxjs';
import {JournalEventCrudPopupService} from '../../service/journal-event-crud-popup.service';
import {MatSnackBar} from '@angular/material/snack-bar';
import {MatDialog} from '@angular/material/dialog';
import {ConfirmationDialog} from '../../ui/confirmation-dialog/confirmation-dialog';
import {ConfigDataService} from '../../service/config-data.service';

@Component({
  selector: 'event',
  imports: [
    MatCell,
    MatCellDef,
    MatColumnDef,
    MatHeaderCell,
    MatHeaderRow,
    MatHeaderRowDef,
    MatIcon,
    MatRow,
    MatRowDef,
    MatTable,
    MatHeaderCellDef,
    MatNoDataRow
  ],
  templateUrl: './event.html',
  styleUrl: './event.scss',
})
export class Event implements OnInit {
  displayedColumns = ['id', 'title', 'team', 'actions'];
  dataSource = new MatTableDataSource<JournalEvent>();

  #journalEventService = inject(JournalEventService)
  #journalEventCrudPopupService = inject(JournalEventCrudPopupService)
  #configDataService = inject(ConfigDataService)

  #snackbar = inject(MatSnackBar)
  #dialog = inject(MatDialog);

  #allEvents = signal<JournalEvent[]>([]);

  applyTeamFilterEffect = effect(() => {
    const selectedTeamId = this.#configDataService.selectedTeamId();
    this.dataSource.data = this.#filterByTeam(this.#allEvents(), selectedTeamId);
  });

  async ngOnInit() {
    await this.loadData();
  }

  async loadData() {
    const data = await firstValueFrom(
      this.#journalEventService.getJournalEvents()
    );
    console.debug('Event: #JournalEventService.getJournalEvents()')
    console.debug(data)

    this.#allEvents.set(data);
    this.dataSource.data = this.#filterByTeam(data, this.#configDataService.selectedTeamId());
  }

  #filterByTeam(events: JournalEvent[], selectedTeamId: number | null) {
    return selectedTeamId == null ? events : events.filter(event => event.journal_case?.team?.id === selectedTeamId);
  }

  async create() {
    console.debug('Event: create new')
    // use new empty JournalEvent
    const oldEvent = {} as JournalEvent;
    const newEvent = await this.#journalEventCrudPopupService.handleDialogue(oldEvent)

    this.handleDialogOutput(newEvent);
  }

  async edit(oldEvent: JournalEvent) {
    console.debug('Event: edit id: %d', oldEvent.id)
    // use selected JournalEvent
    const newEvent = await this.#journalEventCrudPopupService.handleDialogue(oldEvent)

    this.handleDialogOutput(newEvent);
  }

  async delete(event: JournalEvent) {
    console.debug('Event: deleting JournalEvent with id: %d...', event.id)
    // open dialogue with input data
    const dialogRef = this.#dialog.open(ConfirmationDialog, {
      data: {
        title: 'Are you sure?',
        body: 'Are you sure you want to delete this event?'
      },
      width: '70%',
      disableClose: true
    });

    // wait until the dialog was closed and return the new Event
    if (!await firstValueFrom(dialogRef.afterClosed())) {
      console.debug('Event: User cancelled deleting')
      return;
    }

    console.debug('Event: User confirmed deleting')

    this.#journalEventService.deleteJournalEvent(event.id).subscribe(async () => {
      // wait until the data is saved and then refresh the list
      console.debug('Event: Data was deleted')
      await this.loadData()
      this.#snackbar.open('Event was deleted successfully!',
        '',
        {
          duration: 3000,
          panelClass: ['snackbar-success']
        }
      );
    });
  }

  handleDialogOutput(newEvent: JournalEvent | undefined) {
    if (newEvent !== undefined) {
      console.debug('Event: The dialogue was closed with data:');
      console.debug(newEvent)

      console.debug('Event: Sending data to backend...')
      this.#journalEventService
        .saveJournalEvent(newEvent)
        .subscribe(async () => {
          // wait until the data is saved and then refresh the list
          console.debug('Event: Data was saved:')
          console.debug(newEvent)
          await this.loadData();
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
      console.debug('Event: The dialogue was canceled!');
    }
  }
}

