import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Netplan } from './netplan';

describe('Netplan', () => {
  let component: Netplan;
  let fixture: ComponentFixture<Netplan>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Netplan],
    }).compileComponents();

    fixture = TestBed.createComponent(Netplan);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
