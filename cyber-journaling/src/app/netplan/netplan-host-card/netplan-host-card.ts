import {Component, input} from '@angular/core';
import {Host} from 'shared';
import {NetplanServiceCard} from '../netplan-service-card/netplan-service-card';
import {NetplanCard} from '../../ui/netplan-card/netplan-card';

@Component({
  selector: 'netplan-host-card',
  imports: [
    NetplanServiceCard,
    NetplanCard
  ],
  templateUrl: './netplan-host-card.html',
  styleUrl: './netplan-host-card.scss',
})
export class NetplanHostCard {
  host = input<Host>()
}
