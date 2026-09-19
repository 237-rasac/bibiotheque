import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';

import { BookDetailsComponent } from './book-details.component';
import { BooksService } from '../_service/books.service';
import { BorrowService } from '../_service/borrow.service';
import { UsersService } from '../_service/users.service';

describe('BookDetailsComponent', () => {
  let component: BookDetailsComponent;
  let fixture: ComponentFixture<BookDetailsComponent>;

  let booksServiceSpy: jasmine.SpyObj<BooksService>;
  let borrowServiceSpy: jasmine.SpyObj<BorrowService>;
  let usersServiceSpy: jasmine.SpyObj<UsersService>;

  beforeEach(async () => {
    booksServiceSpy = jasmine.createSpyObj('BooksService', ['getBookById']);
    borrowServiceSpy = jasmine.createSpyObj('BorrowService', ['getBookBorrowHistory']);
    usersServiceSpy = jasmine.createSpyObj('UsersService', ['getUserById']);

    booksServiceSpy.getBookById.and.returnValue(of({ bookId: 5, bookName: 'Livre A', bookAuthor: 'Auteur', bookGenre: 'Roman', noOfCopies: 3 }));
    borrowServiceSpy.getBookBorrowHistory.and.returnValue(of([]));
    usersServiceSpy.getUserById.and.returnValue(of({ userId: 1, username: 'alice', name: 'Alice', password: '', role: [] }));

    await TestBed.configureTestingModule({
      // The template navigates via routerLink.
      imports: [RouterTestingModule],
      declarations: [BookDetailsComponent],
      providers: [
        { provide: BooksService, useValue: booksServiceSpy },
        { provide: BorrowService, useValue: borrowServiceSpy },
        { provide: UsersService, useValue: usersServiceSpy },
        { provide: ActivatedRoute, useValue: { snapshot: { params: { bookId: 5 } } } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(BookDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load the book and its borrow history from the route param', () => {
    expect(component.id).toBe(5);
    expect(booksServiceSpy.getBookById).toHaveBeenCalledWith(5);
    expect(borrowServiceSpy.getBookBorrowHistory).toHaveBeenCalledWith(5);
    expect(component.book.bookName).toBe('Livre A');
  });
});

import { ActivatedRoute } from '@angular/router';
