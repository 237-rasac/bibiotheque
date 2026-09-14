import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule } from '@angular/forms';

import { CreateBookComponent } from './create-book.component';
import { BooksService } from '../_service/books.service';

describe('CreateBookComponent', () => {
  let component: CreateBookComponent;
  let fixture: ComponentFixture<CreateBookComponent>;
  let booksServiceSpy: jasmine.SpyObj<BooksService>;

  beforeEach(async () => {
    booksServiceSpy = jasmine.createSpyObj('BooksService', ['createBook', 'getBooksList']);

    await TestBed.configureTestingModule({
      // The book form uses ngModel.
      imports: [RouterTestingModule, FormsModule],
      declarations: [CreateBookComponent],
      providers: [{ provide: BooksService, useValue: booksServiceSpy }]
    }).compileComponents();

    fixture = TestBed.createComponent(CreateBookComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
