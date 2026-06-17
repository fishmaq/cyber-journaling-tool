import {Component, input} from '@angular/core';
import {NgStyle} from '@angular/common';

@Component({
  selector: 'netplan-card',
  imports: [
    NgStyle
  ],
  templateUrl: './netplan-card.html',
  styleUrl: './netplan-card.scss',
})
export class NetplanCard {
  backgroundColor = input<string>('white')
  title = input.required<string>()
  titleFontSize = input<string>('small')
  childPaddingTop = input<number>(24)

  transparentBackgroundColor(opacity: number = 15) {
    return 'color-mix(in srgb, ' + this.backgroundColor() + ' ' + opacity + '%, white)'
  }
}
