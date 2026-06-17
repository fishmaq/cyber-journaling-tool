import {Component, inject} from '@angular/core';
import {RouterLink, RouterLinkActive} from '@angular/router';
import {MatSlideToggle} from '@angular/material/slide-toggle';
import {FormsModule} from '@angular/forms';
import {ConfigDataService} from '../../service/config-data.service';
import {MatIcon} from '@angular/material/icon';

@Component({
  selector: 'navbar',
  imports: [
    RouterLink,
    RouterLinkActive,
    MatSlideToggle,
    FormsModule,
    MatIcon
  ],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar {
  #configDataService = inject(ConfigDataService)

  presenterModeChanged(value: boolean) {
    this.#configDataService.presenterMode = value;
  }
}
