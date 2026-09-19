import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { BorrowBookComponent } from './borrow-book.component';
import { BooksService } from '../_service/books.service';
import { BorrowService } from '../_service/borrow.service';
import { UserAuthService } from '../_service/user-auth.service';

describe('BorrowBookComponent', () => {
  let component: BorrowBookComponent;
  let fixture: ComponentFixture<BorrowBookComponent>;

  let booksServiceSpy: jasmine.SpyObj<BooksService>;
  let borrowServiceSpy: jasmine.SpyObj<BorrowService>;

  beforeEach(async () => {
    booksServiceSpy = jasmine.createSpyObj('BooksService', ['getBooksList']);
    borrowServiceSpy = jasmine.createSpyObj('BorrowService', ['borrowBook']);
    booksServiceSpy.getBooksList.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      declarations: [BorrowBookComponent],
      providers: [
        { provide: BooksService, useValue: booksServiceSpy },
        { provide: BorrowService, useValue: borrowServiceSpy },
        { provide: UserAuthService, useValue: { getUserId: () => 42 } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(BorrowBookComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load the books list on init', () => {
    expect(booksServiceSpy.getBooksList).toHaveBeenCalled();
    expect(component.books).toEqual([]);
    expect(component.loading).toBeFalse();
  });
});
