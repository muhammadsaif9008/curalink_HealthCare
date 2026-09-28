import fs from 'fs';
import path from 'path';
import { CaseItem, UserProfile, HistoryEntry } from '../src/types.js';
import { INITIAL_SEED_CASES } from './rules.js';

interface DatabaseSchema {
  cases: CaseItem[];
  users: UserProfile[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.resolve(DATA_DIR, 'database.json');

export const INITIAL_USERS: UserProfile[] = [
  {
    id: 'user-patient-01',
    name: 'Kovács László',
    email: 'kovacs.laszlo@example.hu',
    role: 'patient',
    tajDemo: '042-881-934',
  },
  {
    id: 'user-patient-02',
    name: 'Varga Éva',
    email: 'varga.eva@example.hu',
    role: 'patient',
    tajDemo: '118-293-401',
  },
  {
    id: 'user-patient-03',
    name: 'Németh Ferenc',
    email: 'nemeth.ferenc@example.hu',
    role: 'patient',
    tajDemo: '093-412-581',
  },
  {
    id: 'user-patient-04',
    name: 'Szabó Anna',
    email: 'szabo.anna@example.hu',
    role: 'patient',
    tajDemo: '109-843-221',
  },
  {
    id: 'user-patient-05',
    name: 'Molnár Péter',
    email: 'molnar.peter@example.hu',
    role: 'patient',
    tajDemo: '081-334-912',
  },
  {
    id: 'user-advisor-01',
    name: 'Dr. Varga Zsuzsa',
    email: 'varga.zsuzsa@curalink.hu',
    role: 'advisor',
    tajDemo: '000-000-000',
    mokLicense: 'MOK-HU-48192',
    specialty: 'Ortopédia és Traumatológia',
  },
  {
    id: 'user-manager-01',
    name: 'Molnár Balázs',
    email: 'molnar.balazs@curalink.hu',
    role: 'case_manager',
    tajDemo: '000-000-000',
  },
];

class Database {
  private schema: DatabaseSchema = {
    cases: [],
    users: [],
  };

  constructor() {
    this.init();
  }

  private init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.schema = JSON.parse(raw);
        // Ensure users exist
        if (!this.schema.users || this.schema.users.length === 0) {
          this.schema.users = INITIAL_USERS;
          this.save();
        }
        if (!this.schema.cases || this.schema.cases.length === 0) {
          this.schema.cases = INITIAL_SEED_CASES;
          this.save();
        }
      } else {
        this.schema = {
          cases: INITIAL_SEED_CASES,
          users: INITIAL_USERS,
        };
        this.save();
      }
    } catch (err) {
      console.error('Error initializing database, using defaults:', err);
      this.schema = {
        cases: INITIAL_SEED_CASES,
        users: INITIAL_USERS,
      };
    }
  }

  private save() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.schema, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving database to file:', err);
    }
  }

  public getCases(userId?: string): CaseItem[] {
    if (!userId) return this.schema.cases;
    return this.schema.cases.filter((c) => c.userId === userId);
  }

  public getCaseById(id: string): CaseItem | undefined {
    return this.schema.cases.find((c) => c.id === id);
  }

  public createCase(newCase: CaseItem): CaseItem {
    this.schema.cases.unshift(newCase);
    this.save();
    return newCase;
  }

  public updateCase(id: string, updates: Partial<CaseItem>): CaseItem | undefined {
    const idx = this.schema.cases.findIndex((c) => c.id === id);
    if (idx === -1) return undefined;

    this.schema.cases[idx] = {
      ...this.schema.cases[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.save();
    return this.schema.cases[idx];
  }

  public addHistoryEntry(
    caseId: string,
    entry: {
      stage: CaseItem['currentStage'];
      title: string;
      note: string;
      author: string;
      referenceNumber?: string;
    }
  ): CaseItem | undefined {
    const c = this.getCaseById(caseId);
    if (!c) return undefined;

    const newHistoryEntry: HistoryEntry = {
      id: 'hist-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      stage: entry.stage,
      timestamp: new Date().toISOString(),
      title: entry.title,
      note: entry.note,
      author: entry.author,
      referenceNumber: entry.referenceNumber,
    };

    c.history.push(newHistoryEntry);
    c.currentStage = entry.stage;
    c.updatedAt = new Date().toISOString();
    if (entry.referenceNumber) {
      c.referenceNumber = entry.referenceNumber;
    }
    this.save();
    return c;
  }

  public resetSeedData(): void {
    this.schema = {
      cases: JSON.parse(JSON.stringify(INITIAL_SEED_CASES)),
      users: INITIAL_USERS,
    };
    this.save();
  }

  public getUsers(): UserProfile[] {
    return this.schema.users;
  }

  public getUserById(id: string): UserProfile | undefined {
    return this.schema.users.find((u) => u.id === id);
  }

  public addUser(user: UserProfile): UserProfile {
    this.schema.users.push(user);
    this.save();
    return user;
  }

  public updateUser(id: string, updates: Partial<UserProfile>): UserProfile | undefined {
    const user = this.schema.users.find((u) => u.id === id);
    if (!user) return undefined;
    Object.assign(user, updates);
    this.save();
    return user;
  }

  public findUser(query: string): UserProfile | undefined {
    const q = query.trim().toLowerCase();
    return this.schema.users.find(
      (u) =>
        u.email.toLowerCase() === q ||
        u.tajDemo.replace(/[-\s]/g, '') === q.replace(/[-\s]/g, '') ||
        u.name.toLowerCase() === q ||
        u.id === query
    );
  }
}

export const db = new Database();
