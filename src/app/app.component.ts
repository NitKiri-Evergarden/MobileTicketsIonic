import { Component, effect, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent,
  IonList, IonItem, IonLabel, IonBadge, IonGrid, IonRow, IonCol,
  IonIcon 
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { people, time, ticket, statsChart, close, play } from 'ionicons/icons';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton,
    IonCard, IonCardHeader, IonCardTitle, IonCardContent,
    IonList, IonItem, IonLabel, IonBadge, IonGrid, IonRow, IonCol,
    IonIcon
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {

  // Estados (signals)
  queues = signal<{ SP: any[], SG: any[], SE: any[] }>({ SP: [], SG: [], SE: [] });
  sequences = signal<{ SP: number, SG: number, SE: number }>({ SP: 1, SG: 1, SE: 1 });
  currentTime = signal(new Date(2025, 10, 21, 7, 0));
  isOpen = signal(false);
  guiches = signal([
    { id: 1, currentTicket: null as any, endTime: null as number | null },
    { id: 2, currentTicket: null as any, endTime: null as number | null },
    { id: 3, currentTicket: null as any, endTime: null as number | null },
  ]);
  lastCalls = signal<any[]>([]);
  issuedTickets = signal<any[]>([]);
  attendedTickets = signal<any[]>([]);
  discardedTickets = signal<any[]>([]);
  lastPriority = signal<'SP' | 'non-SP' | null>(null);
  dailyReports = signal<any[]>([]);
  showMonthlyReport = signal(false);
  notificationPermission = signal<NotificationPermission>('default');

  private timeInterval?: any;
  private guicheInterval?: any;

  constructor() {
    addIcons({ people, time, ticket, statsChart, close, play });
  }

  ngOnInit() {
    // Solicitar permissão de notificações
    if ('Notification' in window) {
      Notification.requestPermission().then(permission => {
        this.notificationPermission.set(permission);
      });
    }

    // Simular passagem do tempo
    this.timeInterval = setInterval(() => {
      this.currentTime.set(new Date(this.currentTime().getTime() + 1000));
    }, 1000);

    // Fechamento automático às 17h
    effect(() => {
      const now = this.currentTime();
      const today5pm = new Date(now);
      today5pm.setHours(17, 0, 0, 0);
      if (now >= today5pm && this.isOpen()) {
        this.closeOffice();
      }
    });

    // Finalização automática de atendimentos
    this.guicheInterval = setInterval(() => {
      const nowMs = this.currentTime().getTime();
      this.guiches.update(prev =>
        prev.map(g => {
          if (g.currentTicket && g.endTime && g.endTime <= nowMs) {
            this.finishAttendance(g.id);
          }
          return g;
        })
      );
    }, 1000);
  }

  ngOnDestroy() {
    if (this.timeInterval) clearInterval(this.timeInterval);
    if (this.guicheInterval) clearInterval(this.guicheInterval);
  }

  // ==================== UTILITÁRIOS ====================
  private generateTicketNumber(type: string, sequence: number, date: Date): string {
    const yy = date.getFullYear().toString().slice(-2);
    const mm = (date.getMonth() + 1).toString().padStart(2, '0');
    const dd = date.getDate().toString().padStart(2, '0');
    return `${yy}${mm}${dd}-${type}${sequence.toString().padStart(2, '0')}`;
  }

  private getAttendanceTime(type: string): number {
    if (type === 'SP') {
      return 15 * 60 * 1000 + (Math.random() * 10 - 5) * 60 * 1000;
    }
    if (type === 'SG') {
      return 5 * 60 * 1000 + (Math.random() * 6 - 3) * 60 * 1000;
    }
    if (type === 'SE') {
      return Math.random() < 0.05 ? 5 * 60 * 1000 : 1 * 60 * 1000;
    }
    return 0;
  }

  private sendNotification(title: string, body: string) {
    if (this.notificationPermission() === 'granted') {
      new Notification(title, { body });
      const audio = new Audio('https://notificationsounds.com/storage/sounds/file-sounds-1150-pristine.mp3');
      audio.play().catch(() => {});
    } else if (this.notificationPermission() === 'default') {
      Notification.requestPermission().then(permission => {
        this.notificationPermission.set(permission);
        if (permission === 'granted') {
          new Notification(title, { body });
          const audio = new Audio('https://notificationsounds.com/storage/sounds/file-sounds-1150-pristine.mp3');
          audio.play().catch(() => {});
        }
      });
    }
  }

  // ==================== AÇÕES ====================
  openOffice() {
    this.isOpen.set(true);
    this.sequences.set({ SP: 1, SG: 1, SE: 1 });
    this.issuedTickets.set([]);
    this.attendedTickets.set([]);
    this.discardedTickets.set([]);
    this.lastCalls.set([]);
    this.queues.set({ SP: [], SG: [], SE: [] });
    this.lastPriority.set(null);
  }

  closeOffice() {
    // Finalizar atendimentos em andamento
    this.guiches.update(prev => 
      prev.map(g => {
        if (g.currentTicket) {
          g.currentTicket.finishTime = new Date(this.currentTime());
        }
        return { ...g, currentTicket: null, endTime: null };
      })
    );

    // Descartar senhas restantes nas filas
    const remaining = [...this.queues().SP, ...this.queues().SG, ...this.queues().SE];
    this.discardedTickets.update(prev => [...prev, ...remaining]);
    this.queues.set({ SP: [], SG: [], SE: [] });

    // Gerar relatório diário
    const report = this.generateDailyReport();

    const reportDate = new Date(this.currentTime());
    reportDate.setHours(0, 0, 0, 0);

    this.dailyReports.update(prev => [...prev, { 
      date: reportDate, 
      ...report 
    }]);

    this.isOpen.set(false);
  }

  issueTicket(type: 'SP' | 'SG' | 'SE') {
    if (!this.isOpen()) {
      alert('Expediente fechado.');
      return;
    }

    const seq = this.sequences()[type];
    const number = this.generateTicketNumber(type, seq, this.currentTime());
    const ticket = {
      number,
      type,
      issueTime: new Date(this.currentTime()),
      attendanceTime: null,
      finishTime: null,
      guiche: null
    };

    this.sequences.update(prev => ({ ...prev, [type]: seq + 1 }));
    this.queues.update(prev => ({ ...prev, [type]: [...prev[type], ticket] }));
    this.issuedTickets.update(prev => [...prev, ticket]);

    // 5% de chance de descarte imediato
    if (Math.random() < 0.05) {
      this.discardedTickets.update(prev => [...prev, ticket]);
      this.queues.update(prev => ({
        ...prev,
        [type]: prev[type].filter((t: any) => t.number !== number)
      }));
    }
  }

  callNext(guicheId: number) {
    if (!this.isOpen()) {
      alert('Expediente fechado.');
      return;
    }

    const guiche = this.guiches().find(g => g.id === guicheId);
    if (guiche?.currentTicket) {
      alert('Guichê ocupado.');
      return;
    }

    let nextType: 'SP' | 'SG' | 'SE' | null = null;
    const q = this.queues();
    const last = this.lastPriority();

    if (last === 'SP' || !last) {
      nextType = q.SE.length > 0 ? 'SE' : q.SG.length > 0 ? 'SG' : null;
    } else {
      nextType = q.SP.length > 0 ? 'SP' : null;
    }

    // Fallback caso não tenha encontrado o tipo preferencial
    if (!nextType) {
      nextType = last === 'SP'
        ? (q.SG.length > 0 ? 'SG' : q.SE.length > 0 ? 'SE' : q.SP.length > 0 ? 'SP' : null)
        : (q.SP.length > 0 ? 'SP' : q.SE.length > 0 ? 'SE' : q.SG.length > 0 ? 'SG' : null);
    }

    if (!nextType) {
      alert('Nenhuma senha na fila.');
      return;
    }

    const ticket = q[nextType].shift()!;

    const duration = this.getAttendanceTime(nextType);
    const endTime = this.currentTime().getTime() + duration;

    this.queues.update(prev => ({ ...prev, [nextType!]: [...prev[nextType!]] }));
    this.guiches.update(prev => 
      prev.map(g => g.id === guicheId ? { ...g, currentTicket: ticket, endTime } : g)
    );

    this.lastPriority.set(nextType === 'SP' ? 'SP' : 'non-SP');

    ticket.attendanceTime = new Date(this.currentTime());
    ticket.guiche = guicheId;

    this.attendedTickets.update(prev => [...prev, ticket]);

    // Últimas 5 chamadas
    this.lastCalls.update(prev => [
      { number: ticket.number, guiche: guicheId, time: new Date(this.currentTime()) },
      ...prev
    ].slice(0, 5));

    // Notificação
    this.sendNotification('Senha Chamada', `Sua senha ${ticket.number} foi chamada no guichê ${guicheId}.`);
  }

  finishAttendance(guicheId: number) {
    this.guiches.update(prev => 
      prev.map(g => {
        if (g.id === guicheId && g.currentTicket) {
          g.currentTicket.finishTime = new Date(this.currentTime());
        }
        return g.id === guicheId 
          ? { ...g, currentTicket: null, endTime: null } 
          : g;
      })
    );
  }

  // ==================== RELATÓRIOS ====================
  private generateDailyReport() {
    const issued = this.issuedTickets();
    const attended = this.attendedTickets();

    const totalIssued = issued.length;
    const totalAttended = attended.filter((t: any) => !!t.finishTime).length;

    const byTypeIssued = { SP: 0, SG: 0, SE: 0 };
    const byTypeAttended = { SP: 0, SG: 0, SE: 0 };

    issued.forEach((t: any) => byTypeIssued[t.type as keyof typeof byTypeIssued]++);
    attended.forEach((t: any) => {
      if (t.finishTime) byTypeAttended[t.type as keyof typeof byTypeAttended]++;
    });

    const detailed = issued.map((t: any) => ({
      number: t.number,
      type: t.type,
      issueTime: t.issueTime.toLocaleString('pt-BR'),
      attendanceTime: t.attendanceTime ? t.attendanceTime.toLocaleString('pt-BR') : '',
      guiche: t.guiche || '',
    }));

    // Cálculo do TM médio por tipo
    const tmSums = { SP: 0, SG: 0, SE: 0 };
    const tmCounts = { SP: 0, SG: 0, SE: 0 };

    attended.forEach((t: any) => {
      if (t.finishTime && t.attendanceTime) {
        const duration = (t.finishTime.getTime() - t.attendanceTime.getTime()) / 60000; // minutos
        tmSums[t.type as keyof typeof tmSums] += duration;
        tmCounts[t.type as keyof typeof tmCounts]++;
      }
    });

    const tmByType: any = {};
    (['SP', 'SG', 'SE'] as const).forEach(type => {
      tmByType[type] = tmCounts[type] > 0 
        ? (tmSums[type] / tmCounts[type]).toFixed(2) 
        : '0.00';
    });

    return {
      totalIssued,
      totalAttended,
      byTypeIssued,
      byTypeAttended,
      detailed,
      tmByType,
      tmSums,
      tmCounts
    };
  }

  private generateMonthlyReport() {
    const currentMonth = this.currentTime().getMonth();
    const monthReports = this.dailyReports().filter((r: any) => 
      new Date(r.date).getMonth() === currentMonth
    );

    if (monthReports.length === 0) return null;

    let totalIssued = 0;
    let totalAttended = 0;
    const byTypeIssued = { SP: 0, SG: 0, SE: 0 };
    const byTypeAttended = { SP: 0, SG: 0, SE: 0 };
    const tmSums = { SP: 0, SG: 0, SE: 0 };
    const tmCounts = { SP: 0, SG: 0, SE: 0 };
    let detailed: any[] = [];

    monthReports.forEach((r: any) => {
      totalIssued += r.totalIssued || 0;
      totalAttended += r.totalAttended || 0;

      (['SP', 'SG', 'SE'] as const).forEach(type => {
        byTypeIssued[type] += r.byTypeIssued?.[type] || 0;
        byTypeAttended[type] += r.byTypeAttended?.[type] || 0;
        tmSums[type] += r.tmSums?.[type] || 0;
        tmCounts[type] += r.tmCounts?.[type] || 0;
      });

      detailed = [...detailed, ...(r.detailed || [])];
    });

    const tmByType: any = {};
    (['SP', 'SG', 'SE'] as const).forEach(type => {
      tmByType[type] = tmCounts[type] > 0 
        ? (tmSums[type] / tmCounts[type]).toFixed(2) 
        : '0.00';
    });

    return {
      totalIssued,
      totalAttended,
      byTypeIssued,
      byTypeAttended,
      detailed,
      tmByType
    };
  }

  // Getters para o template
  get dailyReport() {
    return this.generateDailyReport();
  }

  get monthlyReport() {
    return this.generateMonthlyReport();
  }
}