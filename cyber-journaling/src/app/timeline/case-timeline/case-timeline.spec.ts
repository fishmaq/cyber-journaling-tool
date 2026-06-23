import {ComponentFixture, TestBed} from '@angular/core/testing';

import {CaseTimeline} from './case-timeline';
import {JournalCase} from 'shared';
import {of} from 'rxjs';
import {JournalCaseService} from '../../service/journal-case.service';
import {ConfigDataService} from '../../service/config-data.service';
import {configDataServiceMock, journalCaseServiceMock} from '../../../testing/mocks/service';

describe('CaseTimeline', () => {
  let component: CaseTimeline;
  let fixture: ComponentFixture<CaseTimeline>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [{provide: JournalCaseService, useValue: journalCaseServiceMock},
        {provide: ConfigDataService, useValue: configDataServiceMock},],
      imports: [CaseTimeline],
    }).compileComponents();

    fixture = TestBed.createComponent(CaseTimeline);
    component = fixture.componentInstance;

    journalCaseServiceMock.getJournalCases.mockReturnValue(of([]));

    await fixture.whenStable();
  });

  it('should load data on init', async () => {
    vi.spyOn(component, 'loadData').mockResolvedValue()

    await component.ngOnInit();

    expect(component.loadData).toHaveBeenCalled();
  });

  it('should reload data in presenter mode', async () => {
    configDataServiceMock.presenterMode = true;

    vi.spyOn(component, 'loadData').mockResolvedValue();

    await component.refreshForPresenterMode();

    expect(component.loadData).toHaveBeenCalled();
  });

  it('should not reload data when presenter mode is disabled', async () => {
    configDataServiceMock.presenterMode = false;

    vi.spyOn(component, 'loadData').mockResolvedValue()

    await component.refreshForPresenterMode();

    expect(component.loadData).not.toHaveBeenCalled();
  });

  it('should update journalCases after loading', async () => {
    const cases = [
      {id: 1},
      {id: 2}
    ] as JournalCase[];

    journalCaseServiceMock.getJournalCases.mockReturnValue(of(cases));

    await component.loadData();

    expect(component.journalCases()).toEqual(cases);
  });

  it('should clear interval on destroy', () => {
    const spy = vi.spyOn(globalThis, 'clearInterval');
    component.intervalReference = 123;

    component.ngOnDestroy();

    expect(spy).toHaveBeenCalledWith(123);
  });
});
