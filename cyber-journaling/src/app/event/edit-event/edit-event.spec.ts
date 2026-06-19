import {ComponentFixture, TestBed} from '@angular/core/testing';

import {EditEvent} from './edit-event';
import {matDialogRefMock} from '../../../testing/mocks/material';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {configDataServiceMock} from '../../../testing/mocks/service';
import {ConfigDataService} from '../../service/config-data.service';

describe('EditEvent', () => {
  let component: EditEvent;
  let fixture: ComponentFixture<EditEvent>;


  beforeEach(async () => {
    vi.resetAllMocks();
    await TestBed.configureTestingModule({
      providers: [
        {provide: ConfigDataService, useValue: configDataServiceMock},
        {provide: MatDialogRef, useValue: matDialogRefMock},
        {
          provide: MAT_DIALOG_DATA, useValue: {oldJournalEvent: {}, caseList: [], serviceList: [],},
        },
      ],
      imports: [EditEvent],
    }).compileComponents();

    configDataServiceMock.config.mockReturnValue({
      severityLevelList: [],
      deviceHealthList: [],
      eventTypeList: [],
    });

    fixture = TestBed.createComponent(EditEvent);
    component = fixture.componentInstance;

    await fixture.whenStable();
  });

  it('should close dialog without data', () => {
    const dialogRef = TestBed.inject(MatDialogRef);

    component.close();

    expect(dialogRef.close).toHaveBeenCalled();
  });

  it('should close dialog with updated journalEvent on save', () => {
    const dialogRef = TestBed.inject(MatDialogRef);

    component.formGroup.setValue({
      title: 'new title',
      details: 'x',
      case_id: 1,
      event_type_id: 1,
      severity_level_id: 1,
      device_health_id: 1,
      services_ids: [],
    });

    component.save();

    expect(dialogRef.close).toHaveBeenCalledWith(expect.objectContaining({
      title: 'new title',
    }));
  });

  it('should remove value from services_ids', () => {
    const control = {
      value: [1, 2, 3],
      setValue: vi.fn(),
    };

    (component as any).getAffectedServicesControl = () => control;

    component.removeChip({stopPropagation: vi.fn()} as any, 2);

    expect(control.setValue).toHaveBeenCalledWith([1, 3]);
  });

  it('should return selected services', () => {
    component.serviceList = [
      {id: 1},
      {id: 2},
      {id: 3},
    ] as any;

    (component as any).getAffectedServicesControl = () => ({
      value: [1, 3],
    });

    expect(component.selectedOptions).toEqual([
      {id: 1},
      {id: 3},
    ]);
  });

});

