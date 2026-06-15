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
import {MatIcon} from '@angular/material/icon';
import {JournalEvent} from 'shared/src/models';
import {JournalEventService} from '../../service/journal-event.service';
import {MatDialog} from '@angular/material/dialog';
import {firstValueFrom} from 'rxjs';
import {EditEvent} from '../edit-event/edit-event';
import {JournalCaseService} from '../../service/journal-case.service';
import {JournalServiceService} from '../../service/journal-service.service';

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
  // TODO: comment this
  displayedColumns = ['id', 'title', 'team', 'actions'];
  dataSource = new MatTableDataSource<JournalEvent>();

  #journalEventService = inject(JournalEventService)
  #dialog = inject(MatDialog);
  #journalCaseService = inject(JournalCaseService);
  #journalService = inject(JournalServiceService);

  async ngOnInit() {
    // load data from the service on component init
    await this.loadData();
  }

  async loadData() {
    const data = await firstValueFrom(
      this.#journalEventService.getJournalEvents()
    );
    console.debug('Event: #JournalEventService.getJournalEvents()')
    console.debug(data)

    this.dataSource.data = data;
  }

  // TODO: add alerts for error and success

  create() {
    console.debug('Event: create new')
    // create new empty JournalEvent
    this.handleDialogue({} as JournalEvent)
  }

  edit(element: JournalEvent) {
    console.debug('Event: edit id: %d', element.id)
    // use selected JournalEvent
    this.handleDialogue(element)
  }

  delete(element: JournalEvent) {
    // TODO: add confirmation dialogue
    console.debug('Event: deleting JournalEvent with id: %d...', element.id)
    this.#journalEventService.deleteJournalEvent(element.id).subscribe(async () => {
      // wait until the data is saved and then refresh the list
      console.debug('Event: Data was deleted')
      await this.loadData()
    });
  }

  async handleDialogue(oldEvent: JournalEvent) {
    console.debug('Event: opening dialogue with JournalEvent:')
    console.debug(oldEvent)


    const caseList = await firstValueFrom(this.#journalCaseService.getJournalCases());
    const serviceList = await firstValueFrom(this.#journalService.getServices());
    const dialogRef = this.#dialog.open(EditEvent, {
      data: {
        oldJournalEvent: oldEvent,
        caseList: caseList,
        serviceList: serviceList
      },
      width: '70%',
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      const newEvent: JournalEvent = result;
      if (newEvent !== undefined) {
        console.debug('Event: The dialogue was closed with data:');
        console.debug(newEvent)

        console.debug('Event: Sending data to backend...')
        this.#journalEventService
          .saveJournalEvent(newEvent)
          .subscribe(async () => {
            // wait until the data is saved and then refresh the list
            console.debug('Event: Data was saved')
            await this.loadData()
          });
      } else {
        console.debug('Event: The dialogue was canceled!');
      }
    });
  }
}

