import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule } from '@angular/forms';
import { of } from 'rxjs';

import { UsersListComponent } from './users-list.component';
import { UsersService } from '../_service/users.service';

describe('UsersListComponent', () => {
  let component: UsersListComponent;
  let fixture: ComponentFixture<UsersListComponent>;
  let usersServiceSpy: jasmine.SpyObj<UsersService>;

  beforeEach(async () => {
    usersServiceSpy = jasmine.createSpyObj('UsersService', ['getUsersList', 'deleteUser', 'createUser']);
    usersServiceSpy.getUsersList.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      // The create-user modal form uses ngModel; rows navigate via the Router.
      imports: [RouterTestingModule, FormsModule],
      declarations: [UsersListComponent],
      providers: [{ provide: UsersService, useValue: usersServiceSpy }]
    }).compileComponents();

    fixture = TestBed.createComponent(UsersListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load users on init', () => {
    expect(usersServiceSpy.getUsersList).toHaveBeenCalled();
    expect(component.users).toEqual([]);
    expect(component.loading).toBeFalse();
  });
});
