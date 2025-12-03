import { TestBed } from '@angular/core/testing';

import { Reposicao } from './reposicao';

describe('Reposicao', () => {
  let service: Reposicao;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Reposicao);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
