import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';

import { UserDetailsComponent } from './user-details.component';
import { BooksService } from '../_service/books.service';
import { BorrowService } from '../_service/borrow.service';
import { UsersService } from '../_service/users.service';

describe('UserDetailsComponent', () => {
  let component: UserDetailsComponent;
  let fixture: ComponentFixture<UserDetailsComponent>;

  let booksServiceSpy: jasmine.SpyObj<BooksService>;
  let borrowServiceSpy: jasmine.SpyObj<BorrowService>;
  let usersServiceSpy: jasmine.SpyObj<UsersService>;

  beforeEach(async () => {
    booksServiceSpy = jasmine.createSpyObj('BooksService', ['getBookById']);
    borrowServiceSpy = jasmine.createSpyObj('BorrowService', ['getBooksBorrowedByUser']);
    usersServiceSpy = jasmine.createSpyObj('UsersService', ['getUserById']);

    usersServiceSpy.getUserById.and.returnValue(of({ userId: 9, username: 'bob', name: 'Bob', password: '', role: [] }));
    borrowServiceSpy.getBooksBorrowedByUser.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      // The template navigates via routerLink.
      imports: [RouterTestingModule],
      declarations: [UserDetailsComponent],
      providers: [
        { provide: BooksService, useValue: booksServiceSpy },
        { provide: BorrowService, useValue: borrowServiceSpy },
        { provide: UsersService, useValue: usersServiceSpy },
        { provide: ActivatedRoute, useValue: { snapshot: { params: { userId: 9 } } } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(UserDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load the user and their borrows from the route param', () => {
    expect(component.id).toBe(9);
    expect(usersServiceSpy.getUserById).toHaveBeenCalledWith(9);
    expect(borrowServiceSpy.getBooksBorrowedByUser).toHaveBeenCalledWith(9);
    expect(component.user.name).toBe('Bob');
  });
});
