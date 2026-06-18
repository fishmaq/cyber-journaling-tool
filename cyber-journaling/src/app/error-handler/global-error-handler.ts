import {ErrorHandler, inject, Injectable} from '@angular/core';
import {MatSnackBar} from '@angular/material/snack-bar';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  #snackbar = inject(MatSnackBar)

  handleError(error:any): void {
    // show this generic error message
    this.#snackbar.open('Something went wrong :(',
      '',
      {
        duration: 3000,
        panelClass: ['snackbar-error']
      }
    );
    console.error(error)
  }
}
