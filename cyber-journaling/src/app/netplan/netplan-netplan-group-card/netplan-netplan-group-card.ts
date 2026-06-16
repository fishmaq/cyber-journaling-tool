import {Component, input} from '@angular/core';
import {NetplanGroup} from 'shared/src/models';
import {NgStyle} from '@angular/common';
import {NetplanHostCard} from '../netplan-host-card/netplan-host-card';

@Component({
  selector: 'netplan-netplan-group-card',
  imports: [
    NgStyle,
    NetplanHostCard
  ],
  templateUrl: './netplan-netplan-group-card.html',
  styleUrl: './netplan-netplan-group-card.scss',
})
export class NetplanNetplanGroupCard {
  netplanGroup = input<NetplanGroup>()

}
