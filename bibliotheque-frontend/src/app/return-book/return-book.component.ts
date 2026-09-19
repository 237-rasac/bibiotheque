import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { Books } from '../_model/books';
import { Borrow } from '../_model/borrow';
import { BooksService } from '../_service/books.service';
import { BorrowService } from '../_service/borrow.service';
import { UserAuthService } from '../_service/user-auth.service';

@Component({
  standalone: false,
  selector: 'app-return-book',
  templateUrl: './return-book.component.html',
  styleUrls: ['./return-book.component.css']
})
export class ReturnBookComponent implements OnInit {

  books: Books[] = [];
  borrow: Borrow[] = [];
  loading = true;

  constructor(
    private borrowService: BorrowService,
    private booksService: BooksService,
    private userAuthService: UserAuthService
  ) { }

  userId = this.userAuthService.getUserId();

  ngOnInit(): void {
    this.getBooks();
    this.getBooksByUser();
  }

  private getBooks() {
    this.booksService.getBooksList().subscribe({
      next: (data) => { this.books = data; }
    });
  }

  getBooksByUser() {
    this.loading = true;
    this.borrowService.getBooksBorrowedByUser(this.userId).subscribe({
      next: (data) => { this.borrow = data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  brw: Borrow = new Borrow();

  returnBook(borrowId: number) {
    this.brw.borrowId = borrowId;
    this.borrowService.returnBook(this.brw).subscribe({
      next: () => { this.getBooksByUser(); },
      error: () => { /* toast handled by interceptor */ }
    });
  }

}
