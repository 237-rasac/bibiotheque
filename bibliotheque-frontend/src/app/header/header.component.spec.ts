import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { HeaderComponent } from './header.component';
import { UsersService } from '../_service/users.service';
import { UserAuthService } from '../_service/user-auth.service';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;
  let userServiceSpy: jasmine.SpyObj<UsersService>;
  let userAuthServiceSpy: jasmine.SpyObj<UserAuthService>;
  let router: Router;

  beforeEach(async () => {
    userServiceSpy = jasmine.createSpyObj('UsersService', ['logout']);
    userAuthServiceSpy = jasmine.createSpyObj('UserAuthService', ['getName', 'isLoggedIn', 'clear']);

    await TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      declarations: [HeaderComponent],
      providers: [
        { provide: UsersService, useValue: userServiceSpy },
        { provide: UserAuthService, useValue: userAuthServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    spyOn(router, 'navigate');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should read the user name from UserAuthService at init', () => {
    expect(userAuthServiceSpy.getName).toHaveBeenCalled();
  });

  it('should report the authentication state via isLoggedIn', () => {
    userAuthServiceSpy.isLoggedIn.and.returnValue(true);
    expect(component.isLoggedIn()).toBeTrue();

    userAuthServiceSpy.isLoggedIn.and.returnValue(false);
    expect(component.isLoggedIn()).toBeFalse();
  });

  it('should clear the session and navigate home after a successful logout', () => {
    userServiceSpy.logout.and.returnValue(subscribeWith({}));

    component.logout();

    expect(userServiceSpy.logout).toHaveBeenCalled();
    expect(userAuthServiceSpy.clear).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });

  it('should still clear the session and navigate home when the logout call fails', () => {
    userServiceSpy.logout.and.returnValue(subscribeWithError({}));

    component.logout();

    expect(userAuthServiceSpy.clear).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });

  it('should toggle the theme flag and persist it', () => {
    localStorage.removeItem('ds-theme');
    expect(component.isDark).toBeFalse();

    component.toggleTheme();
    expect(component.isDark).toBeTrue();
    expect(localStorage.getItem('ds-theme')).toBe('dark');

    component.toggleTheme();
    expect(component.isDark).toBeFalse();
    expect(localStorage.getItem('ds-theme')).toBe('light');
  });
});

function subscribeWith(response: any) {
  return { subscribe: (handlers: any) => handlers.next(response) } as any;
}

function subscribeWithError(err: any) {
  return { subscribe: (handlers: any) => handlers.error(err) } as any;
}
