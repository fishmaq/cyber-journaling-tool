import {Component, effect, input} from '@angular/core';
import {DeviceHealth, Service} from 'shared';
import {NetplanCard} from '../../ui/netplan-card/netplan-card';
import {MatIcon} from '@angular/material/icon';
import {NgOptimizedImage, NgStyle} from '@angular/common';
import {MatTooltip} from '@angular/material/tooltip';

@Component({
  selector: 'netplan-service-card',
  imports: [
    NetplanCard,
    MatIcon,
    NgStyle,
    NgOptimizedImage,
    MatTooltip
  ],
  templateUrl: './netplan-service-card.html',
  styleUrl: './netplan-service-card.scss',
})
export class NetplanServiceCard {
  service = input<Service>()
  latestDeviceHealth: DeviceHealth | undefined = undefined;

  updateLatestDeviceHealthEffect = effect(() => {
    if (this.service()) {
      this.latestDeviceHealth = this.#latestDeviceHealth(this.service()!)
    }
  })

  #latestDeviceHealth(service: Service): DeviceHealth | undefined {
    if (service.journal_events && service.journal_events!.length > 0) {
      // take the latest journal_event and return the color_code of the deviceHealth
      return service!.journal_events!.at(0)!.device_health
    }

    return undefined;
  }
}
