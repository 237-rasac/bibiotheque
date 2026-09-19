import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { AppComponent } from './app.component';
import { UserAuthService } from './_service/user-auth.service';

/**
 * AppComponent is a layout shell: it renders the notification host, one of the
 * headers, the sidebar and the router outlet depending on the route and the
 * authentication state. All children are stubbed to keep this a unit test.
 */
@Component({ selector: 'app-notification', template: '', standalone: false })
class StubNotificationComponent {}

@Component({ selector: 'app-header', template: '', standalone: false })
class StubHeaderComponent {}

@Component({ selector: 'app-landing-header', template: '', standalone: false })
class StubLandingHeaderComponent {}

@Component({ selector: 'app-sidebar', template: '', standalone: false })
class StubSidebarComponent {}

@Component({ template: '', standalone: false })
class DummyRouteComponent {}

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;
  let userAuthServiceSpy: jasmine.SpyObj<UserAuthService>;
  let router: Router;

  beforeEach(async () => {
    userAuthServiceSpy = jasmine.createSpyObj('UserAuthService', ['isLoggedIn']);

    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule.withRoutes([
          { path: '', component: DummyRouteComponent },
          { path: 'login', component: DummyRouteComponent },
          { path: 'books', component: DummyRouteComponent },
          { path: '**', component: DummyRouteComponent }
        ])
      ],
      declarations: [
        AppComponent,
        StubNotificationComponent,
        StubHeaderComponent,
        StubLandingHeaderComponent,
        StubSidebarComponent,
        DummyRouteComponent
      ],
      providers: [{ provide: UserAuthService, useValue: userAuthServiceSpy }]
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
  });

  it('should create the app', () => {
    userAuthServiceSpy.isLoggedIn.and.returnValue(false);
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it(`should have the title 'Library Management System'`, () => {
    expect(component.title).toEqual('Library Management System');
  });

  it('should render the landing header on the home page for a visitor', async () => {
    userAuthServiceSpy.isLoggedIn.and.returnValue(false);
    await router.navigate(['/']);
    fixture.detectChanges();

    expect(component.showLandingHeader).toBeTrue();
    expect(component.showSidebar).toBeFalse();
    expect(component.showHeader).toBeFalse();
    expect(fixture.nativeElement.querySelector('app-landing-header')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('app-sidebar')).toBeNull();
  });

  it('should hide every chrome on /login', async () => {
    userAuthServiceSpy.isLoggedIn.and.returnValue(false);
    await router.navigate(['/login']);
    fixture.detectChanges();

    expect(component.showLandingHeader).toBeFalse();
    expect(component.showHeader).toBeFalse();
    expect(component.showSidebar).toBeFalse();
    expect(fixture.nativeElement.querySelector('app-header')).toBeNull();
    expect(fixture.nativeElement.querySelector('app-landing-header')).toBeNull();
  });

  it('should render header + sidebar for an authenticated user on a normal route', async () => {
    userAuthServiceSpy.isLoggedIn.and.returnValue(true);
    await router.navigate(['/books']);
    fixture.detectChanges();

    expect(component.showHeader).toBeTrue();
    expect(component.showSidebar).toBeTrue();
    expect(component.showLandingHeader).toBeFalse();
    expect(fixture.nativeElement.querySelector('app-header')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('app-sidebar')).not.toBeNull();
  });
});
