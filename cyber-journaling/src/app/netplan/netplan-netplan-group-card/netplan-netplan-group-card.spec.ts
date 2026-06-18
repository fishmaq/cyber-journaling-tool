import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NetplanNetplanGroupCard } from './netplan-netplan-group-card';

describe('NetplanNetplanGroupCard', () => {
  let component: NetplanNetplanGroupCard;
  let fixture: ComponentFixture<NetplanNetplanGroupCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NetplanNetplanGroupCard],
    }).compileComponents();

    fixture = TestBed.createComponent(NetplanNetplanGroupCard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  // no tests needed for now
});
