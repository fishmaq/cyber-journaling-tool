import {Component, inject} from '@angular/core';
import {JournalCase} from 'shared/src/models';
import {ConfigDataService} from '../../service/config-data.service';
import {MatFormField, MatInput, MatLabel} from '@angular/material/input';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';
import {FormBuilder, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';

@Component({
  selector: 'edit-case',
  imports: [
    MatFormField,
    MatLabel,
    MatInput,
    FormsModule,
    ReactiveFormsModule
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
    // TODO: add remaining fields
    title: ['', Validators.required],
    details: ['']
  });

  teamList = this.#configDataService.config()!.teamList;
  caseStateList = this.#configDataService.config()!.caseStateList;
  ownerList = this.#configDataService.config()!.caseStateList;

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
