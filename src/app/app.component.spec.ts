import { TestBed } from '@angular/core/testing';
import { provideIonicAngular } from '@ionic/angular/standalone';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  let component: AppComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent], // Componente standalone
      providers: [
        provideIonicAngular(), // Necessário para componentes Ionic
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the app', () => {
    expect(component).toBeTruthy();
  });

  // ====================== TESTES BÁSICOS DE INICIALIZAÇÃO ======================

  it('should initialize with default values', () => {
    expect(component.isOpen()).toBeFalse();
    expect(component.queues().SP.length).toBe(0);
    expect(component.queues().SG.length).toBe(0);
    expect(component.queues().SE.length).toBe(0);
    expect(component.sequences().SP).toBe(1);
    expect(component.sequences().SG).toBe(1);
    expect(component.sequences().SE).toBe(1);
    expect(component.guiches().length).toBe(3);
    expect(component.lastCalls().length).toBe(0);
    expect(component.dailyReports().length).toBe(0);
  });

  // ====================== TESTES DE FUNCIONALIDADES PRINCIPAIS ======================

  it('should open office and reset states', () => {
    component.openOffice();

    expect(component.isOpen()).toBeTrue();
    expect(component.sequences().SP).toBe(1);
    expect(component.sequences().SG).toBe(1);
    expect(component.sequences().SE).toBe(1);
    expect(component.issuedTickets().length).toBe(0);
    expect(component.queues().SP.length).toBe(0);
  });

  it('should issue a ticket correctly', () => {
    component.openOffice();
    component.issueTicket('SP');

    expect(component.queues().SP.length).toBe(1);
    expect(component.issuedTickets().length).toBe(1);
    expect(component.queues().SP[0].type).toBe('SP');
    expect(component.queues().SP[0].number).toContain('SP'); // verifica formato da senha
  });

  it('should not issue ticket if office is closed', () => {
    spyOn(window, 'alert');

    component.issueTicket('SG');

    expect(component.queues().SG.length).toBe(0);
    expect(window.alert).toHaveBeenCalledWith('Expediente fechado.');
  });

  it('should call next ticket correctly', () => {
    component.openOffice();
    component.issueTicket('SE');
    component.issueTicket('SG');

    component.callNext(1);

    expect(component.guiches()[0].currentTicket).toBeTruthy();
    expect(component.guiches()[0].currentTicket.type).toBe('SE'); // deve priorizar SE quando lastPriority é null
    expect(component.lastCalls().length).toBe(1);
  });

  it('should not call next if guiche is busy', () => {
    spyOn(window, 'alert');
    component.openOffice();
    component.issueTicket('SP');

    // Ocupa o guichê 1
    component.callNext(1);

    // Tenta chamar novamente no mesmo guichê
    component.callNext(1);

    expect(window.alert).toHaveBeenCalledWith('Guichê ocupado.');
  });

  it('should finish attendance correctly', () => {
    component.openOffice();
    component.issueTicket('SP');
    component.callNext(2);

    const guicheBefore = component.guiches().find(g => g.id === 2);
    expect(guicheBefore?.currentTicket).toBeTruthy();

    component.finishAttendance(2);

    const guicheAfter = component.guiches().find(g => g.id === 2);
    expect(guicheAfter?.currentTicket).toBeNull();
    expect(guicheAfter?.endTime).toBeNull();
  });

  // ====================== TESTES DE RELATÓRIOS ======================

  it('should generate daily report', () => {
    const report = component['generateDailyReport'](); // acessa método privado via bracket notation

    expect(report).toBeDefined();
    expect(report.totalIssued).toBeDefined();
    expect(report.totalAttended).toBeDefined();
    expect(report.byTypeIssued).toBeDefined();
    expect(report.tmByType).toBeDefined();
  });

  it('should close office and save daily report', () => {
    component.openOffice();
    component.issueTicket('SP');
    component.issueTicket('SG');

    const initialReportsCount = component.dailyReports().length;

    component.closeOffice();

    expect(component.isOpen()).toBeFalse();
    expect(component.dailyReports().length).toBe(initialReportsCount + 1);
    expect(component.queues().SP.length).toBe(0);
    expect(component.queues().SG.length).toBe(0);
  });

  // ====================== TESTES DE UTILITÁRIOS ======================

  it('should generate correct ticket number format', () => {
    const testDate = new Date(2025, 10, 21); // Novembro = mês 10
    const number = component['generateTicketNumber']('SP', 7, testDate);

    expect(number).toMatch(/^\d{6}-SP\d{2}$/); // Ex: 251121-SP07
    expect(number).toContain('SP');
  });

  it('should calculate attendance time correctly', () => {
    const spTime = component['getAttendanceTime']('SP');
    const sgTime = component['getAttendanceTime']('SG');
    const seTime = component['getAttendanceTime']('SE');

    expect(spTime).toBeGreaterThan(10 * 60 * 1000); // mínimo ~10 min
    expect(sgTime).toBeGreaterThan(2 * 60 * 1000);
    expect(seTime).toBeGreaterThanOrEqual(60 * 1000);
    expect(seTime).toBeLessThanOrEqual(5 * 60 * 1000);
  });
});