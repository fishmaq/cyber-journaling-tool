import {Component, inject} from '@angular/core';
import {FormBuilder, FormControl, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatFormField, MatInput, MatLabel} from '@angular/material/input';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {DeviceHealth, EventType, JournalCase, JournalEvent, Service, SeverityLevel} from 'shared/src/models';
import {ConfigDataService} from '../../service/config-data.service';
import {MatOption} from '@angular/material/core';
import {MatSelect, MatSelectTrigger} from '@angular/material/select';
import {MatChipRow, MatChipSet} from '@angular/material/chips';
import {MatIcon} from '@angular/material/icon';

@Component({
  selector: 'edit-event',
  imports: [
    FormsModule,
    MatFormField,
    MatInput,
    MatLabel,
    ReactiveFormsModule,
    MatOption,
    MatSelect,
    MatChipRow,
    MatChipSet,
    MatSelectTrigger,
    MatIcon
  ],
  templateUrl: './edit-event.html',
  styleUrl: './edit-event.scss',
})
export class EditEvent {
  // TODO: comment this
  private data = inject(MAT_DIALOG_DATA);

  // the case is passed through MAT_DIALOG_DATA
  journalEvent: JournalEvent = this.data.oldJournalEvent;
  caseList: JournalCase[] = this.data.caseList ?? [];
  serviceList: Service[] = this.data.serviceList ?? [];

  #configDataService = inject(ConfigDataService);
  #dialogRef = inject(MatDialogRef);

  severityLevelList: SeverityLevel[] = this.#configDataService.config()!.severityLevelList;
  deviceHealthList: DeviceHealth[] = this.#configDataService.config()!.deviceHealthList;
  eventTypeList: EventType[] = this.#configDataService.config()!.eventTypeList;

  private formBuilder = inject(FormBuilder);
  formGroup = this.formBuilder.group({
    title: [this.journalEvent.title, [Validators.required, Validators.maxLength(255)]],
    details: [this.journalEvent.details, Validators.maxLength(2048)],
    case_id: [this.journalEvent.case_id, Validators.required],
    event_type_id: [this.journalEvent.event_type_id, Validators.required],
    severity_level_id: [this.journalEvent.severity_level_id, Validators.required],
    services_ids: this.formBuilder.control<number[]>(this.journalEvent.services_ids),
    device_health_id: [this.journalEvent.device_health_id, Validators.required]
  });


  close() {
    this.#dialogRef.close();
  }

  save() {
    this.extractFormData()
    this.#dialogRef.close(this.journalEvent);
  }

  extractFormData() {
    this.journalEvent = {...this.journalEvent, ...this.formGroup.getRawValue(),} as JournalEvent;
  }

  removeChip($event: Event, value: string | number): void {
    // use stopPropagation() to avoid reopening the dropdown
    $event.stopPropagation();
    const current = this.getAffectedServicesControl().value;
    this.getAffectedServicesControl().setValue(current.filter(v => v !== value));
  }

  get selectedOptions(): Service[] {
    const selectedValues = this.getAffectedServicesControl().value;
    if (selectedValues && selectedValues.length > 0) {
      return this.serviceList.filter(option =>
        selectedValues.includes(option.id)
      );
    } else {
      return []
    }
  }

  private getAffectedServicesControl() {
    return this.formGroup.get('services_ids') as FormControl<number[]>;
  }
}
