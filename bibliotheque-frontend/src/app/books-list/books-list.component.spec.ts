import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule } from '@angular/forms';
import { of } from 'rxjs';

import { BooksListComponent } from './books-list.component';
import { BooksService } from '../_service/books.service';

describe('BooksListComponent', () => {
  let component: BooksListComponent;
  let fixture: ComponentFixture<BooksListComponent>;
  let booksServiceSpy: jasmine.SpyObj<BooksService>;

  beforeEach(async () => {
    booksServiceSpy = jasmine.createSpyObj('BooksService', ['getBooksList', 'deleteBook', 'createBook']);
    booksServiceSpy.getBooksList.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      // The create-book modal form uses ngModel; rows navigate via the Router.
      imports: [RouterTestingModule, FormsModule],
      declarations: [BooksListComponent],
      providers: [{ provide: BooksService, useValue: booksServiceSpy }]
    }).compileComponents();

    fixture = TestBed.createComponent(BooksListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load books on init', () => {
    expect(booksServiceSpy.getBooksList).toHaveBeenCalled();
    expect(component.books).toEqual([]);
    expect(component.loading).toBeFalse();
  });
});
