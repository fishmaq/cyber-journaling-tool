import {Component, inject} from '@angular/core';
import {JournalCase, JournalCaseState, Owner, Team} from 'shared';
import {ConfigDataService} from '../../service/config-data.service';
import {MatFormField, MatInput, MatLabel} from '@angular/material/input';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {FormBuilder, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {MatOption, MatSelect} from '@angular/material/select';

@Component({
  selector: 'edit-case',
  imports: [
    MatFormField,
    MatLabel,
    MatInput,
    FormsModule,
    ReactiveFormsModule,
    MatSelect,
    MatOption
  ],
  templateUrl: './edit-case.html',
  styleUrl: './edit-case.scss',
})
export class EditCase {
  private data = inject(MAT_DIALOG_DATA);
  // the case is passed through MAT_DIALOG_DATA
  journalCase: JournalCase = this.data.oldJournalCase;

  #configDataService = inject(ConfigDataService);
  #dialogRef = inject(MatDialogRef);

  private formBuilder = inject(FormBuilder);
  formGroup = this.formBuilder.group({
    title: [this.journalCase.title, [Validators.required, Validators.maxLength(255)]],
    team_id: [this.journalCase.team_id],
    case_state_id: [this.journalCase.case_state_id],
    owner_id: [this.journalCase.owner_id],
    details: [this.journalCase.details, Validators.maxLength(2048)]
  });

  teamList: Team[] = this.#configDataService.config()!.teamList;
  caseStateList: JournalCaseState[] = this.#configDataService.config()!.caseStateList;
  ownerList: Owner[] = this.#configDataService.config()!.ownerList;

  close() {
    this.#dialogRef.close();
  }

  save() {
    this.extractFormData()
    this.#dialogRef.close(this.journalCase);
  }

  extractFormData() {
    this.journalCase = {...this.journalCase, ...this.formGroup.getRawValue(),} as JournalCase;
  }
}
