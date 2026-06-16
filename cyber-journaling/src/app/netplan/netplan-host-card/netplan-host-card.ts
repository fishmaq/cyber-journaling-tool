import {Component, input} from '@angular/core';
import {Host} from 'shared/src/models';
import {NgStyle} from '@angular/common';
import {NetplanServiceCard} from '../netplan-service-card/netplan-service-card';

@Component({
  selector: 'netplan-host-card',
  imports: [
    NgStyle,
    NetplanServiceCard
  ],
  templateUrl: './netplan-host-card.html',
  styleUrl: './netplan-host-card.scss',
})
export class NetplanHostCard {
  host = input<Host>()
}
