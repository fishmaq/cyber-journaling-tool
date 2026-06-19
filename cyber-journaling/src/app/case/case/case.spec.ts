import {ComponentFixture, TestBed} from '@angular/core/testing';

import {Case} from './case';
import {journalCaseCrudPopupServiceMock, journalCaseServiceMock} from '../../../testing/mocks/service';
import {of} from 'rxjs';
import {dialogMock} from '../../../testing/mocks/material';
import {MatDialog} from '@angular/material/dialog';
import {JournalCaseService} from '../../service/journal-case.service';
import {JournalCaseCrudPopupService} from '../../service/journal-case-crud-popup.service';

describe('Case', () => {
  let component: Case;
  let fixture: ComponentFixture<Case>;

  beforeEach(async () => {
    vi.resetAllMocks();
    await TestBed.configureTestingModule({
      imports: [Case],
      providers: [{
        provide: JournalCaseCrudPopupService,
        useValue: journalCaseCrudPopupServiceMock
      }, {provide: JournalCaseService, useValue: journalCaseServiceMock}, {
        provide: MatDialog,
        useValue: dialogMock
      }]
    }).compileComponents();

    fixture = TestBed.createComponent(Case);
    component = fixture.componentInstance;

    journalCaseServiceMock.getJournalCases.mockReturnValue(of([]));

    await fixture.whenStable();
  });

  it('should load cases on init', async () => {
    const cases = [{id: 1}] as any;

    journalCaseServiceMock.getJournalCases.mockReturnValue(of(cases));

    await component.ngOnInit();

    expect(component.dataSource.data).toEqual(cases);
  });

  it('should save case after create dialog returns data', async () => {
    const newCase = {id: 1} as any;

    journalCaseCrudPopupServiceMock.handleDialogue.mockResolvedValue(newCase);
    journalCaseServiceMock.saveJournalCase.mockReturnValue(of({}));

    await component.create();

    expect(journalCaseServiceMock.saveJournalCase).toHaveBeenCalledWith(newCase);
  });

  it('should save edited case', async () => {
    const oldCase = {id: 1} as any;
    const updated = {id: 1, title: 'new'} as any;

    journalCaseCrudPopupServiceMock.handleDialogue.mockResolvedValue(updated);
    journalCaseServiceMock.saveJournalCase.mockReturnValue(of({}));

    await component.edit(oldCase);

    expect(journalCaseServiceMock.saveJournalCase).toHaveBeenCalledWith(updated);
  });

  it('should not delete when cancelled', async () => {
    dialogMock.open.mockReturnValue({
      afterClosed: () => of(false),
    });

    await component.delete({id: 1} as any);

    expect(journalCaseServiceMock.deleteJournalCase).not.toHaveBeenCalled();
  });

  it('should delete case when confirmed', async () => {
    dialogMock.open.mockReturnValue({
      afterClosed: () => of(true),
    });

    journalCaseServiceMock.deleteJournalCase.mockReturnValue(of({}));

    await component.delete({id: 1} as any);

    expect(journalCaseServiceMock.deleteJournalCase).toHaveBeenCalledWith(1);
  });
});
