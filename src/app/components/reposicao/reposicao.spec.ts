import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Reposicao } from './reposicao';

describe('Reposicao', () => {
  let component: Reposicao;
  let fixture: ComponentFixture<Reposicao>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Reposicao]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Reposicao);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
