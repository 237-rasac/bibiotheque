import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule } from '@angular/forms';
import { RegistrationComponent } from './registration.component';
import { UsersService } from '../_service/users.service';

describe('RegistrationComponent', () => {
  let component: RegistrationComponent;
  let fixture: ComponentFixture<RegistrationComponent>;
  let usersServiceSpy: jasmine.SpyObj<UsersService>;
  let router: Router;

  beforeEach(async () => {
    usersServiceSpy = jasmine.createSpyObj('UsersService', ['createUser']);

    await TestBed.configureTestingModule({
      imports: [RouterTestingModule, FormsModule],
      declarations: [RegistrationComponent],
      providers: [{ provide: UsersService, useValue: usersServiceSpy }]
    }).compileComponents();

    fixture = TestBed.createComponent(RegistrationComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    spyOn(router, 'navigate');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not call the API when the form is invalid', () => {
    const invalidForm = {
      invalid: true,
      controls: { name: { markAsTouched: jasmine.createSpy('markAsTouched') } }
    } as any;

    component.onSubmit(invalidForm);

    expect(usersServiceSpy.createUser).not.toHaveBeenCalled();
    expect(invalidForm.controls.name.markAsTouched).toHaveBeenCalled();
  });

  it('should create the user and navigate to /users on success', () => {
    usersServiceSpy.createUser.and.returnValue(subscribeWith({}));

    const validForm = { invalid: false, controls: {} } as any;
    component.onSubmit(validForm);

    expect(usersServiceSpy.createUser).toHaveBeenCalledWith(component.user);
    expect(router.navigate).toHaveBeenCalledWith(['/users']);
    expect(component.formSubmitting).toBeTrue();
  });

  it('should re-enable submission when the API call fails', () => {
    usersServiceSpy.createUser.and.returnValue(subscribeWithError({}));

    const validForm = { invalid: false, controls: {} } as any;
    component.onSubmit(validForm);

    expect(component.formSubmitting).toBeFalse();
    expect(router.navigate).not.toHaveBeenCalled();
  });
});

function subscribeWith(response: any) {
  return { subscribe: (handlers: any) => handlers.next(response) } as any;
}

function subscribeWithError(err: any) {
  return { subscribe: (handlers: any) => handlers.error(err) } as any;
}
