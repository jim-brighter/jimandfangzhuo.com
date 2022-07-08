import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { AdminComponentComponent } from './admin.component';

describe('AdminComponentComponent', () => {
  let component: AdminComponentComponent;
  let fixture: ComponentFixture<AdminComponentComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ AdminComponentComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
