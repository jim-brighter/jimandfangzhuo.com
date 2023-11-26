import { TestBed } from '@angular/core/testing';

import { ChristmasService } from './christmas.service';

describe('ChristmasService', () => {
  let service: ChristmasService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ChristmasService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
