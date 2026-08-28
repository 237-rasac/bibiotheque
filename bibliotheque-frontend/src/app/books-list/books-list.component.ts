import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Books } from '../_model/books'
import { BooksService } from '../_service/books.service';

@Component({
  standalone: false,
  selector: 'app-books-list',
  templateUrl: './books-list.component.html',
  styleUrls: ['./books-list.component.css']
})
export class BooksListComponent implements OnInit {

  books: Books[] = [];
  loading = true;

  constructor(private booksService: BooksService,
    private router: Router) { }

  ngOnInit(): void {
    this.getBooks();
  }

  private getBooks() {
    this.loading = true;
    this.booksService.getBooksList().subscribe({
      next: (data) => { this.books = data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  updateBook(bookId: number) {
    this.router.navigate(['update-book', bookId ]);
  }

  deleteBook(bookId: number) {
    this.booksService.deleteBook(bookId).subscribe( data=> {
      this.getBooks();
    });
  }

  bookDetails(bookId: number) {
    this.router.navigate(['book-details', bookId ]);
  }

}
