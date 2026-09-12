import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BookDetailsComponent } from './book-details/book-details.component';
import { BooksListComponent } from './books-list/books-list.component';
import { BorrowBookComponent } from './borrow-book/borrow-book.component';
import { CreateBookComponent } from './create-book/create-book.component';
import { ForbiddenComponent } from './forbidden/forbidden.component';
import { HomeComponent } from './home/home.component';
import { LoginComponent } from './login/login.component';
import { RegistrationComponent } from './registration/registration.component';
import { ReturnBookComponent } from './return-book/return-book.component';
import { UpdateBookComponent } from './update-book/update-book.component';
import { UpdateUserComponent } from './update-user/update-user.component';
import { UserDetailsComponent } from './user-details/user-details.component';
import { UsersListComponent } from './users-list/users-list.component';
import { AuthGuard } from './_auth/auth.guard';
import { ReservationComponent } from './reservation/reservation.component';
import { ReservationDetailsComponent } from './reservation-details/reservation-details.component';
import { MyReservationsComponent } from './my-reservations/my-reservations.component';

const routes: Routes = [
  {path: 'books', component: BooksListComponent, canActivate:[AuthGuard], data:{roles:['BIBLIOTHECAIRE']}},
  {path: 'create-book', component: CreateBookComponent, canActivate:[AuthGuard], data:{roles:['BIBLIOTHECAIRE']}},
  {path: '', component: HomeComponent},
  {path: 'update-book/:bookId', component: UpdateBookComponent, canActivate:[AuthGuard], data:{roles:['BIBLIOTHECAIRE']}},
  {path: 'book-details/:bookId', component: BookDetailsComponent, canActivate:[AuthGuard], data:{roles:['BIBLIOTHECAIRE']}},
  {path: 'users', component: UsersListComponent, canActivate:[AuthGuard], data:{roles:['BIBLIOTHECAIRE']}},
  {path: 'register-user', component: RegistrationComponent, canActivate:[AuthGuard], data:{roles:['BIBLIOTHECAIRE']}},
  {path: 'user-details/:userId', component: UserDetailsComponent, canActivate:[AuthGuard], data:{roles:['BIBLIOTHECAIRE']}},
  {path: 'update-user/:userId', component: UpdateUserComponent, canActivate:[AuthGuard], data:{roles:['BIBLIOTHECAIRE']}},
  {path: 'login', component: LoginComponent},
  {path: 'forbidden', component: ForbiddenComponent},
  {path: 'borrow-book', component: BorrowBookComponent, canActivate:[AuthGuard], data:{roles:['ADHERENT']}},
  {path: 'my-reservations', component: MyReservationsComponent, canActivate:[AuthGuard], data:{roles:['ADHERENT']}},
  {path: 'return-book', component: ReturnBookComponent, canActivate:[AuthGuard], data:{roles:['ADHERENT']}},
  {path: 'reservations', component: ReservationComponent, canActivate:[AuthGuard], data:{roles:['BIBLIOTHECAIRE']}},
  {path: 'reservation-details/:reservationId', component: ReservationDetailsComponent, canActivate:[AuthGuard], data:{roles:['BIBLIOTHECAIRE']}}
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { onSameUrlNavigation: 'reload' })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
