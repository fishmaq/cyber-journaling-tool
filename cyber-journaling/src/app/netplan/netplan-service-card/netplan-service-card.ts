import {Component, input} from '@angular/core';
import {Service} from 'shared/src/models';
import {NgStyle} from '@angular/common';

@Component({
  selector: 'netplan-service-card',
  imports: [
    NgStyle
  ],
  templateUrl: './netplan-service-card.html',
  styleUrl: './netplan-service-card.scss',
})
export class NetplanServiceCard {
  service = input<Service>()
}
