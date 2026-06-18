import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NetplanServiceCard } from './netplan-service-card';

describe('NetplanServiceCard', () => {
  let component: NetplanServiceCard;
  let fixture: ComponentFixture<NetplanServiceCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NetplanServiceCard],
    }).compileComponents();

    fixture = TestBed.createComponent(NetplanServiceCard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  // no tests needed for now
});
