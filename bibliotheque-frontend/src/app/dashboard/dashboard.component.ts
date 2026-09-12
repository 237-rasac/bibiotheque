import { AfterViewInit, Component, ElementRef, OnDestroy, QueryList, ViewChildren } from '@angular/core';
import { forkJoin } from 'rxjs';
import { Books } from '../_model/books';
import { Reservation } from '../_model/reservation';
import { Users } from '../_model/users';
import { BooksService } from '../_service/books.service';
import { ReservationService } from '../_service/reservation.service';
import { UsersService } from '../_service/users.service';

/**
 * Admin dashboard: the first screen the librarian sees after login.
 * KPI cards with count-up animation, a weekly borrow chart drawn with
 * plain SVG, a status donut and live top-lists.
 */
@Component({
  standalone: false,
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements AfterViewInit, OnDestroy {
  loading = true;
  hasError = false;
  error: string | null = null;

  // Raw data
  books: Books[] = [];
  users: Users[] = [];
  reservations: Reservation[] = [];

  // KPIs
  totalBooks = 0;
  totalCopies = 0;
  totalUsers = 0;
  activeMembers = 0;
  activeReservations = 0;
  pendingReservations = 0;
  expiredReservations = 0;
  honoredRate = 0;

  // Charts
  weekBars: { label: string; value: number; isToday: boolean }[] = [];
  donutSegments: { pct: number; color: string }[] = [];
  donutLegend: { label: string; value: number; color: string }[] = [];

  // Top lists
  topBooks: { name: string; count: number }[] = [];
  topMembers: { name: string; count: number }[] = [];

  @ViewChildren('kpiValue') kpiValues!: QueryList<ElementRef<HTMLElement>>;
  private countUpDone = false;
  private chartObserver?: IntersectionObserver;

  constructor(
    private booksService: BooksService,
    private usersService: UsersService,
    private reservationService: ReservationService
  ) {}

  ngOnInit(): void {
    this.loadAll();
  }

  ngAfterViewInit(): void {
    // ViewChildren resolve after data render; hook when the list stabilizes.
    this.kpiValues.changes.subscribe(() => this.setupCountUps());
  }

  ngOnDestroy(): void {
    this.chartObserver?.disconnect();
  }

  loadAll() {
    this.loading = true;
    this.hasError = false;
    this.error = null;

    forkJoin({
      books: this.booksService.getBooksList(),
      users: this.usersService.getUsersList(),
      reservations: this.reservationService.getReservations('TOUS')
    }).subscribe({
      next: ({ books, users, reservations }) => {
        this.books = books ?? [];
        this.users = users ?? [];
        this.reservations = reservations ?? [];
        this.computeStats();
        this.loading = false;
        // Give the DOM a tick so the KPI nodes exist before animating.
        setTimeout(() => this.setupCountUps());
      },
      error: () => {
        this.loading = false;
        this.hasError = true;
        this.error = 'Unable to load the dashboard data.';
      }
    });
  }

  onRetry() {
    this.loadAll();
  }

  /** Derives every KPI, chart series and top list from the raw collections. */
  private computeStats() {
    // --- Books ---
    this.totalBooks = this.books.length;
    this.totalCopies = this.books.reduce((sum, b) => sum + (Number(b.noOfCopies) || 0), 0);

    // --- Users ---
    this.totalUsers = this.users.length;
    this.activeMembers = new Set(
      this.reservations
        .filter(r => r.statut === 'EN_ATTENTE' || r.statut === 'DISPONIBLE' || r.statut === 'HONOREE')
        .map(r => r.adherentId)
    ).size;

    // --- Reservations ---
    this.activeReservations = this.reservations.filter(r => r.statut === 'EN_ATTENTE' || r.statut === 'DISPONIBLE').length;
    this.pendingReservations = this.reservations.filter(r => r.statut === 'EMPRUNTE' || r.statut === 'EN_ATTENTE').length;
    this.expiredReservations = this.reservations.filter(r => r.statut === 'EXPIREE').length;
    const finished = this.reservations.filter(r => r.statut === 'HONOREE' || r.statut === 'ANNULEE').length;
    const honored = this.reservations.filter(r => r.statut === 'HONOREE').length;
    this.honoredRate = finished > 0 ? Math.round((honored / finished) * 100) : 0;

    this.buildWeekChart();
    this.buildDonut();
    this.buildTopLists();
  }

  /** Max value of the week series, used to scale the bars. */
  get maxWeekValue(): number {
    return Math.max(1, ...this.weekBars.map(b => b.value));
  }

  /** Cumulative SVG donut offset so segments follow each other. */
  segmentOffset(index: number): number {
    let offset = 0;
    for (let i = 0; i < index; i++) {
      offset += this.donutSegments[i].pct;
    }
    // Start at the top: dashoffset moves counter-clockwise from 3 o'clock,
    // rotating -90° makes it start at 12 o'clock; shift by 25 to begin there.
    return 25 - offset;
  }

  /** Reservations created over the last 7 days (SVG bar chart). */
  private buildWeekChart() {
    const days: { label: string; value: number; isToday: boolean }[] = [];
    const formatter = new Intl.DateTimeFormat('en', { weekday: 'short' });
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const day = new Date(today);
      day.setDate(today.getDate() - i);
      const dayStr = day.toDateString();
      const value = this.reservations.filter(r => r.dateReservation && new Date(r.dateReservation).toDateString() === dayStr).length;
      days.push({ label: formatter.format(day), value, isToday: i === 0 });
    }
    this.weekBars = days;
  }

  /** Reservations per status (donut + legend). */
  private buildDonut() {
    const palette: Record<string, string> = {
      'EN_ATTENTE': 'var(--ds-warning)',
      'DISPONIBLE': 'var(--ds-success)',
      'HONOREE': 'var(--ds-info)',
      'ANNULEE': 'var(--ds-text-muted)',
      'EXPIREE': 'var(--ds-danger)'
    };
    const labels: Record<string, string> = {
      'EN_ATTENTE': 'Pending',
      'DISPONIBLE': 'Available',
      'HONOREE': 'Honored',
      'ANNULEE': 'Cancelled',
      'EXPIREE': 'Expired'
    };

    const counts = new Map<string, number>();
    for (const r of this.reservations) {
      counts.set(r.statut, (counts.get(r.statut) ?? 0) + 1);
    }

    const total = this.reservations.length;
    const legend: { label: string; value: number; color: string }[] = [];
    const segments: { pct: number; color: string }[] = [];

    for (const statut of ['EN_ATTENTE', 'DISPONIBLE', 'HONOREE', 'ANNULEE', 'EXPIREE']) {
      const value = counts.get(statut) ?? 0;
      if (value === 0) { continue; }
      legend.push({ label: labels[statut] ?? statut, value, color: palette[statut] });
      segments.push({ pct: total > 0 ? (value / total) * 100 : 0, color: palette[statut] });
    }

    this.donutLegend = legend;
    this.donutSegments = segments;
  }

  /** Most reserved books and most active members. */
  private buildTopLists() {
    const bookCounts = new Map<string, number>();
    for (const r of this.reservations) {
      if (r.livreName) {
        bookCounts.set(r.livreName, (bookCounts.get(r.livreName) ?? 0) + 1);
      }
    }
    this.topBooks = [...bookCounts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const memberCounts = new Map<number, { name: string; count: number }>();
    for (const r of this.reservations) {
      if (r.adherentId) {
        const entry = memberCounts.get(r.adherentId) ?? { name: r.adherentName, count: 0 };
        entry.count++;
        memberCounts.set(r.adherentId, entry);
      }
    }
    this.topMembers = [...memberCounts.values()]
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  /** Animate KPI numbers from 0 to their value with easing (skip reduced motion). */
  private setupCountUps() {
    if (this.countUpDone) { return; }
    const prefersReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced || !this.kpiValues) { return; }

    this.countUpDone = true;
    const duration = 1100;

    this.kpiValues.forEach(el => {
      const target = Number(el.nativeElement.dataset['value'] ?? 0);
      const suffix = el.nativeElement.dataset['suffix'] ?? '';
      const start = performance.now();

      const tick = (now: number) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
        el.nativeElement.textContent = Math.round(target * eased).toLocaleString('en-US') + suffix;
        if (progress < 1) {
          requestAnimationFrame(tick);
        }
      };
      requestAnimationFrame(tick);
    });
  }
}
