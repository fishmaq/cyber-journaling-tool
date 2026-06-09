import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditCase } from './edit-case';

describe('EditCase', () => {
  let component: EditCase;
  let fixture: ComponentFixture<EditCase>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditCase],
    }).compileComponents();

    fixture = TestBed.createComponent(EditCase);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
