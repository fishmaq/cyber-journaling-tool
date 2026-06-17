import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NetplanCard } from './netplan-card';

describe('NetplanCard', () => {
  let component: NetplanCard;
  let fixture: ComponentFixture<NetplanCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NetplanCard],
    }).compileComponents();

    fixture = TestBed.createComponent(NetplanCard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
