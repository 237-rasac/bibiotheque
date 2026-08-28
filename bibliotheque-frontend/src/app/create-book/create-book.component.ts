import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Books } from '../_model/books';
import { BooksService } from '../_service/books.service';

@Component({
  standalone: false,
  selector: 'app-create-book',
  templateUrl: './create-book.component.html',
  styleUrls: ['./create-book.component.css']
})
export class CreateBookComponent implements OnInit {

  book: Books = new Books();

  constructor(private booksService: BooksService,
    private router: Router) { }

  ngOnInit(): void {
  }

  saveBook() {
    this.booksService.createBook(this.book).subscribe({
      next: () => { this.goToBooksList(); }
    });
  }

  goToBooksList() {
    this.router.navigate(['/books']);
  }

  onSubmit() {
    this.saveBook();
  }

}
