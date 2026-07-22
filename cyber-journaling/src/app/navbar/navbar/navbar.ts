import {Component, inject} from '@angular/core';
import {RouterLink, RouterLinkActive} from '@angular/router';
import {MatSlideToggle} from '@angular/material/slide-toggle';
import {FormsModule} from '@angular/forms';
import {ConfigDataService} from '../../service/config-data.service';
import {MatIcon} from '@angular/material/icon';
import {MatFormField} from '@angular/material/form-field';
import {MatSelect} from '@angular/material/select';
import {MatOption} from '@angular/material/core';

@Component({
  selector: 'navbar',
  imports: [
    RouterLink,
    RouterLinkActive,
    MatSlideToggle,
    FormsModule,
    MatIcon,
    MatFormField,
    MatSelect,
    MatOption
  ],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar {
  protected readonly configDataService = inject(ConfigDataService)

  protected readonly ALL_TEAMS = -1;

  presenterModeChanged(value: boolean) {
    this.configDataService.presenterMode = value;
  }

  teamChanged(value: number) {
    this.configDataService.selectedTeamId.set(value === this.ALL_TEAMS ? undefined : value);
  }
}
