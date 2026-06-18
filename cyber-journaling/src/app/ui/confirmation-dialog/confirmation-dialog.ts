import {Component, inject} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material/dialog';

@Component({
  selector: 'confirmation-dialog',
  imports: [],
  templateUrl: './confirmation-dialog.html',
  styleUrl: './confirmation-dialog.scss',
})
export class ConfirmationDialog {
  data = inject(MAT_DIALOG_DATA);
  #dialogRef = inject(MatDialogRef);

  cancel(){
    this.#dialogRef.close(false)
  }

  confirm() {
    this.#dialogRef.close(true)
  }
}
