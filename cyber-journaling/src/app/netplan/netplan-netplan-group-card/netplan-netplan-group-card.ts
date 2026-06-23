import {Component, input} from '@angular/core';
import {NetplanGroup} from 'shared';
import {NetplanHostCard} from '../netplan-host-card/netplan-host-card';
import {NetplanCard} from '../../ui/netplan-card/netplan-card';

@Component({
  selector: 'netplan-netplan-group-card',
  imports: [
    NetplanHostCard,
    NetplanCard
  ],
  templateUrl: './netplan-netplan-group-card.html',
  styleUrl: './netplan-netplan-group-card.scss',
})
export class NetplanNetplanGroupCard {
  netplanGroup = input<NetplanGroup>()
}
