import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule } from '@angular/forms';
import { of } from 'rxjs';

import { UpdateBookComponent } from './update-book.component';
import { BooksService } from '../_service/books.service';

describe('UpdateBookComponent', () => {
  let component: UpdateBookComponent;
  let fixture: ComponentFixture<UpdateBookComponent>;
  let booksServiceSpy: jasmine.SpyObj<BooksService>;

  beforeEach(async () => {
    booksServiceSpy = jasmine.createSpyObj('BooksService', ['getBookById', 'updateBook']);
    booksServiceSpy.getBookById.and.returnValue(of({ bookId: 3, bookName: 'Livre B', bookAuthor: 'Auteur', bookGenre: 'Roman', noOfCopies: 2 }));

    await TestBed.configureTestingModule({
      // The book form uses ngModel; the component loads by route param on init.
      imports: [RouterTestingModule, FormsModule],
      declarations: [UpdateBookComponent],
      providers: [
        { provide: BooksService, useValue: booksServiceSpy },
        { provide: ActivatedRoute, useValue: { snapshot: { params: { bookId: 3 } } } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(UpdateBookComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load the book from the route param on init', () => {
    expect(component.bookId).toBe(3);
    expect(booksServiceSpy.getBookById).toHaveBeenCalledWith(3);
  });
});
