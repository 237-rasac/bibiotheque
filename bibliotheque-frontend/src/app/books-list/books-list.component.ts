import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
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

  showCreateModal = false;
  formSubmitting = false;
  newBook: Books = new Books();

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
    this.booksService.deleteBook(bookId).subscribe({
      next: () => { this.getBooks(); },
      error: () => { /* toast handled by interceptor */ }
    });
  }

  bookDetails(bookId: number) {
    this.router.navigate(['book-details', bookId ]);
  }

  openCreateModal() {
    this.newBook = new Books();
    this.showCreateModal = true;
  }

  closeCreateModal() {
    if (!this.formSubmitting) {
      this.showCreateModal = false;
    }
  }

  onCreateBook(form: NgForm) {
    // Bloque la requête si le formulaire est invalide (nom requis, copies >= 0)
    if (form.invalid) {
      Object.values(form.controls).forEach(control => control.markAsTouched());
      return;
    }

    this.formSubmitting = true;
    this.booksService.createBook(this.newBook).subscribe({
      next: () => {
        this.formSubmitting = false;
        this.showCreateModal = false;
        this.getBooks();
      },
      error: () => {
        this.formSubmitting = false;
      }
    });
  }

}
