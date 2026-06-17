import {Component, input} from '@angular/core';
import {Service} from 'shared/src/models';
import {NetplanCard} from '../../ui/netplan-card/netplan-card';

@Component({
  selector: 'netplan-service-card',
  imports: [
    NetplanCard
  ],
  templateUrl: './netplan-service-card.html',
  styleUrl: './netplan-service-card.scss',
})
export class NetplanServiceCard {
  service = input<Service>()

  latestDeviceHealthColorCode(): string {
    if (this.service()!.journal_events && this.service()!.journal_events!.length > 0) {
      // take the latest journal_event and return the color_code of the deviceHealth
      const colorCode = this.service()!.journal_events!.at(0)!.device_health.color_code;

      // null check
      if (colorCode) {
        return colorCode;
      }
    }

    // TODO: take this from db
    return '#a7c957';
  }
}
