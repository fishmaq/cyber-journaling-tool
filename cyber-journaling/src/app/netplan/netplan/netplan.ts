import {Component, computed, effect, inject, OnDestroy, OnInit, signal} from '@angular/core';
import {Team} from 'shared';
import {firstValueFrom} from 'rxjs';
import {NetplanService} from '../../service/netplan.service';
import {NetplanTeamCard} from '../netplan-team-card/netplan-team-card';
import {ConfigDataService} from '../../service/config-data.service';

@Component({
  selector: 'netplan',
  imports: [NetplanTeamCard],
  templateUrl: './netplan.html',
  styleUrl: './netplan.scss',
})
export class Netplan implements OnInit, OnDestroy {
  intervalReference = 0;

  netplanList = signal<Team[]>([]);

  #netplanService = inject(NetplanService);
  #configDataService = inject(ConfigDataService);

  async ngOnInit() {
    this.intervalReference = setInterval(async () => {
      if (this.#configDataService.presenterMode) {
        await this.loadData();
      }
    }, 10000);

    // load data from the service on component init
    await this.loadData();
  }

  teamFilterChangedEffect = effect(async () => {
    this.#configDataService.selectedTeamId();
    console.debug('Netplan: #configDataService.selectedTeamId changed, reloading data...');
    await this.loadData();
  });

  async loadData() {
    const data = await firstValueFrom(this.#netplanService.getNetplans());
    console.debug('Netplan: #netplanService.getNetplans():');
    console.debug(data);

    this.sortData(data);

    this.netplanList.set(data);
  }

  sortData(list: Team[]) {
    list.map((team) => {
      if (team.netplan_group) {
        team.netplan_group!.sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0));
        team.netplan_group.map((netplanGroup) => {
          if (netplanGroup.host) {
            netplanGroup.host!.sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0));
          }
        });
      }
    });
  }

  ngOnDestroy(): void {
    // cleanup interval
    if (this.intervalReference) {
      clearInterval(this.intervalReference);
    }
  }
}
