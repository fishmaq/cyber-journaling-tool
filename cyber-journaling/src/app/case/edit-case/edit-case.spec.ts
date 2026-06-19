import {ComponentFixture, TestBed} from '@angular/core/testing';

import {EditCase} from './edit-case';
import {ConfigDataService} from '../../service/config-data.service';
import {configDataServiceMock} from '../../../testing/mocks/service';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {matDialogRefMock} from '../../../testing/mocks/material';

describe('EditCase', () => {
  let component: EditCase;
  let fixture: ComponentFixture<EditCase>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditCase],
      providers: [
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            oldJournalCase: {
              journal_event: [],
              team: {name: ''},
              team_id: 0,
              case_state: {},
              case_state_id: 0,
              owner: {
                name: ''
              },
              owner_id: 0,
              title: '',
              details: ''
            },
          },
        },
        {provide: ConfigDataService, useValue: configDataServiceMock},
        {provide: MatDialogRef, useValue: matDialogRefMock},
      ],
    }).compileComponents();

    configDataServiceMock.config.mockReturnValue({
      severityLevelList: [],
      deviceHealthList: [],
      eventTypeList: [],
    });

    fixture = TestBed.createComponent(EditCase);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should close dialog', () => {
    const dialogRef = TestBed.inject(MatDialogRef);

    component.close();

    expect(dialogRef.close).toHaveBeenCalled();
  });

  it('should close dialog with updated case on save', () => {
    const dialogRef = TestBed.inject(MatDialogRef);

    component.formGroup.setValue({
      title: 'new title',
      team_id: 1,
      case_state_id: 2,
      owner_id: 3,
      details: 'changed',
    });

    component.save();

    expect(dialogRef.close).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'new title',
        details: 'changed',
      })
    );
  });

  it('should merge form data into journalCase', () => {
    component.formGroup = {
      getRawValue: () => ({
        title: 'new',
        team_id: 1,
        case_state_id: 2,
        owner_id: 3,
        details: 'x',
      }),
    } as any;

    component.journalCase = {
      title: 'old',
    } as any;

    component.extractFormData();

    expect(component.journalCase.title).toBe('new');
  });

});
