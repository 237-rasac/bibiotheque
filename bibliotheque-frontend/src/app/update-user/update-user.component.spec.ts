import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule } from '@angular/forms';
import { of } from 'rxjs';

import { UpdateUserComponent } from './update-user.component';
import { UsersService } from '../_service/users.service';

describe('UpdateUserComponent', () => {
  let component: UpdateUserComponent;
  let fixture: ComponentFixture<UpdateUserComponent>;
  let usersServiceSpy: jasmine.SpyObj<UsersService>;

  beforeEach(async () => {
    usersServiceSpy = jasmine.createSpyObj('UsersService', ['getUserById', 'updateUser']);
    usersServiceSpy.getUserById.and.returnValue(of({ userId: 4, username: 'alice', name: 'Alice', password: '', role: [{ roleName: 'ADHERENT' }] }));

    await TestBed.configureTestingModule({
      // The user form uses ngModel; the component loads by route param on init.
      imports: [RouterTestingModule, FormsModule],
      declarations: [UpdateUserComponent],
      providers: [
        { provide: UsersService, useValue: usersServiceSpy },
        { provide: ActivatedRoute, useValue: { snapshot: { params: { userId: 4 } } } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(UpdateUserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load the user from the route param on init', () => {
    expect(component.userId).toBe(4);
    expect(usersServiceSpy.getUserById).toHaveBeenCalledWith(4);
    // The fetched user populates the form (name/username/role bindings).
    expect(component.user.name).toBe('Alice');
    expect(component.user.role[0].roleName).toBe('ADHERENT');
  });
});
