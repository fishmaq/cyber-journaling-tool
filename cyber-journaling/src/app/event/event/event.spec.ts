import {ComponentFixture, TestBed} from '@angular/core/testing';

import {Event} from './event';
import {JournalEvent} from 'shared/src/models';
import {journalEventCrudPopupServiceMock, journalEventServiceMock} from '../../../testing/mocks/service';
import {of} from 'rxjs';
import {dialogMock} from '../../../testing/mocks/material';
import {JournalEventService} from '../../service/journal-event.service';
import {MatDialog} from '@angular/material/dialog';

describe('Event', () => {
  let component: Event;
  let fixture: ComponentFixture<Event>;

  beforeEach(async () => {
    vi.resetAllMocks();
    await TestBed.configureTestingModule({
      imports: [Event],
      providers: [{provide: JournalEventService, useValue: journalEventServiceMock}, {
        provide: MatDialog,
        useValue: dialogMock
      }]
    }).compileComponents();

    fixture = TestBed.createComponent(Event);
    component = fixture.componentInstance;

    journalEventServiceMock.getJournalEvents.mockReturnValue(of([]));

    await fixture.whenStable();
  });

  it('should load events into table', async () => {
    const events = [{id: 1}] as JournalEvent[];

    journalEventServiceMock.getJournalEvents.mockReturnValue(of(events));

    await component.loadData();

    expect(component.dataSource.data).toEqual(events);
  });

  it('should save event from dialog result', () => {
    const event = {id: 1} as JournalEvent;

    journalEventCrudPopupServiceMock.handleDialogue.mockResolvedValue(event);
    journalEventServiceMock.saveJournalEvent.mockReturnValue(of({}));

    component.handleDialogOutput(event);

    expect(journalEventServiceMock.saveJournalEvent).toHaveBeenCalledWith(event);
  });

  it('should not save when dialog is cancelled', () => {
    component.handleDialogOutput(undefined);

    expect(journalEventServiceMock.saveJournalEvent).not.toHaveBeenCalled();
  });

  it('should delete event when confirmed', async () => {
    dialogMock.open.mockReturnValue({
      afterClosed: () => of(true),
    });

    journalEventServiceMock.deleteJournalEvent.mockReturnValue(of({}));

    await component.delete({id: 1} as JournalEvent);

    expect(journalEventServiceMock.deleteJournalEvent).toHaveBeenCalledWith(1);
  });

  it('should not delete when cancelled', async () => {
    dialogMock.open.mockReturnValue({
      afterClosed: () => of(false),
    });

    await component.delete({id: 1} as JournalEvent);

    expect(journalEventServiceMock.deleteJournalEvent).not.toHaveBeenCalled();
  });
});
