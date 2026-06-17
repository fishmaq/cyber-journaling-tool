import {Component, input} from '@angular/core';
import {Team} from 'shared/src/models';
import {NgStyle} from '@angular/common';
import {NetplanNetplanGroupCard} from '../netplan-netplan-group-card/netplan-netplan-group-card';
import {NetplanCard} from '../../ui/netplan-card/netplan-card';

@Component({
  selector: 'netplan-team-card',
  imports: [
    NgStyle,
    NetplanNetplanGroupCard,
    NetplanCard
  ],
  templateUrl: './netplan-team-card.html',
  styleUrl: './netplan-team-card.scss',
})
export class NetplanTeamCard {
  team = input<Team>()
}
