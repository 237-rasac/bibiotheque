import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule } from '@angular/forms';
import { LoginComponent } from './login.component';
import { UsersService } from '../_service/users.service';
import { UserAuthService } from '../_service/user-auth.service';
import { NotificationService } from '../_service/notification.service';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let userServiceSpy: jasmine.SpyObj<UsersService>;
  let userAuthServiceSpy: jasmine.SpyObj<UserAuthService>;
  let notificationSpy: jasmine.SpyObj<NotificationService>;
  let router: Router;

  beforeEach(async () => {
    userServiceSpy = jasmine.createSpyObj('UsersService', ['login']);
    userAuthServiceSpy = jasmine.createSpyObj('UserAuthService', ['setUserId', 'setName', 'setRoles']);
    notificationSpy = jasmine.createSpyObj('NotificationService', ['success', 'error', 'warning', 'info']);

    await TestBed.configureTestingModule({
      imports: [RouterTestingModule, FormsModule],
      declarations: [LoginComponent],
      providers: [
        { provide: UsersService, useValue: userServiceSpy },
        { provide: UserAuthService, useValue: userAuthServiceSpy },
        { provide: NotificationService, useValue: notificationSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    spyOn(router, 'navigate');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should hide the error message at init', () => {
    expect(component.errorMessage).toBeNull();
  });

  it('should set userId/name/roles and navigate to /dashboard for a librarian', () => {
    userServiceSpy.login.and.returnValue(subscribeWith({
      user: { userId: 7, name: 'Alice' },
      roles: ['ROLE_BIBLIOTHECAIRE']
    }));

    component.login(formValue({ username: 'alice', password: 'secret' }));

    expect(userServiceSpy.login).toHaveBeenCalledWith({ username: 'alice', password: 'secret' } as any);
    expect(userAuthServiceSpy.setUserId).toHaveBeenCalledWith(7);
    expect(userAuthServiceSpy.setName).toHaveBeenCalledWith('Alice');
    expect(userAuthServiceSpy.setRoles as jasmine.Spy).toHaveBeenCalledWith([{ roleName: 'BIBLIOTHECAIRE' }]);
    expect(notificationSpy.success).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  it('should navigate to /my-reservations for an adherent', () => {
    userServiceSpy.login.and.returnValue(subscribeWith({
      user: { userId: 3, name: 'Bob' },
      roles: ['ROLE_ADHERENT']
    }));

    component.login(formValue({}));

    expect(router.navigate).toHaveBeenCalledWith(['/my-reservations']);
  });

  it('should navigate to /forbidden when the response has no known role', () => {
    userServiceSpy.login.and.returnValue(subscribeWith({
      user: { userId: 1, name: 'X' },
      roles: []
    }));

    component.login(formValue({}));

    expect(router.navigate).toHaveBeenCalledWith(['/forbidden']);
  });

  it('should display the backend error message on failed login', () => {
    userServiceSpy.login.and.returnValue(subscribeWithError({ message: 'Mot de passe incorrect.' }));

    component.login(formValue({}));

    expect(component.errorMessage).toBe('Mot de passe incorrect.');
    expect(userAuthServiceSpy.setUserId).not.toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should fall back to the generic message when the error has no message', () => {
    userServiceSpy.login.and.returnValue(subscribeWithError({ message: undefined }));

    component.login(formValue({}));

    expect(component.errorMessage).toBeTruthy();
  });

  it('should toggle the password visibility flag', () => {
    expect(component.showPassword).toBeFalse();
    component.showPassword = true;
    expect(component.showPassword).toBeTrue();
  });
});

/** Builds an observable-like object for the spy: invokes the given handler once. */
function subscribeWith(response: any) {
  return { subscribe: (handlers: any) => handlers.next(response) } as any;
}

function subscribeWithError(err: any) {
  return { subscribe: (handlers: any) => handlers.error(err) } as any;
}

function formValue(value: any) {
  return { value } as any;
}
