import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NetplanHostCard } from './netplan-host-card';

describe('NetplanHostCard', () => {
  let component: NetplanHostCard;
  let fixture: ComponentFixture<NetplanHostCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NetplanHostCard],
    }).compileComponents();

    fixture = TestBed.createComponent(NetplanHostCard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  // no tests needed for now
});
