import {ComponentFixture, TestBed} from '@angular/core/testing';

import {CaseTimelineCard} from './case-timeline-card';
import {JournalCase, JournalEvent} from 'shared';
import {journalEventCrudPopupServiceMock, journalEventServiceMock} from '../../../testing/mocks/service';
import {snackbarMock} from '../../../testing/mocks/material';
import {of} from 'rxjs';
import {JournalEventCrudPopupService} from '../../service/journal-event-crud-popup.service';
import {JournalEventService} from '../../service/journal-event.service';
import {MatSnackBar} from '@angular/material/snack-bar';

describe('CaseTimelineCard', () => {
  let component: CaseTimelineCard;
  let fixture: ComponentFixture<CaseTimelineCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CaseTimelineCard],

      providers: [
        {
          provide: JournalEventCrudPopupService,
          useValue: journalEventCrudPopupServiceMock,
        },
        {
          provide: JournalEventService,
          useValue: journalEventServiceMock,
        },
        {
          provide: MatSnackBar,
          useValue: snackbarMock,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CaseTimelineCard);
    component = fixture.componentInstance;

    // default value as the input is required
    fixture.componentRef.setInput(
      'journalCase',
      {
        id: 42,
        team: {
          name: 'test'
        }
      } as JournalCase
    );

    await fixture.whenStable();
  });

  it('should open dialog with new event', async () => {
    journalEventCrudPopupServiceMock.handleDialogue.mockResolvedValue(undefined);

    await component.createEvent(42);

    expect(
      journalEventCrudPopupServiceMock.handleDialogue
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        case_id: 42,
      })
    );
  });

  it('should not save when dialog is cancelled', async () => {
    journalEventCrudPopupServiceMock.handleDialogue.mockResolvedValue(undefined);

    await component.createEvent(42);

    expect(
      journalEventServiceMock.saveJournalEvent
    ).not.toHaveBeenCalled();
  });


  it('should save returned event', async () => {
    const event = {id: 1} as JournalEvent;

    journalEventCrudPopupServiceMock.handleDialogue.mockResolvedValue(event);
    journalEventServiceMock.saveJournalEvent.mockReturnValue(of({}));

    fixture.detectChanges();

    await component.createEvent(42);

    expect(
      journalEventServiceMock.saveJournalEvent
    ).toHaveBeenCalledWith(event);
  });

  it('should emit eventCreated after save', async () => {
    const event = { id: 1 } as JournalEvent;

    journalEventCrudPopupServiceMock.handleDialogue.mockResolvedValue(event);
    journalEventServiceMock.saveJournalEvent.mockReturnValue(of({}));

    const emitSpy = vi.spyOn(component.eventCreated, 'emit');

    await component.createEvent(42);

    expect(emitSpy).toHaveBeenCalled();
  });

  it('should show success snackbar after save', async () => {
    const event = { id: 1 } as JournalEvent;

    journalEventCrudPopupServiceMock.handleDialogue.mockResolvedValue(event);
    journalEventServiceMock.saveJournalEvent.mockReturnValue(of({}));


    await component.createEvent(42);

    expect(snackbarMock.open).toHaveBeenCalledWith(
      'Event was saved successfully!',
      '',
      expect.objectContaining({
        duration: 3000,
      })
    );
  });
});
