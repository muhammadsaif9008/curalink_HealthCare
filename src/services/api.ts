import { CaseItem, Clinic, MokDoctor, TreatmentRule, UserProfile } from '../types';

let activeUserId: string = 'user-patient-01';

export function setActiveApiUser(userId: string) {
  activeUserId = userId;
}

function getHeaders(customHeaders: Record<string, string> = {}): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'X-User-Id': activeUserId,
    ...customHeaders,
  };
}

async function safeJson<T = any>(res: Response, fallback?: T): Promise<T> {
  try {
    const text = await res.text();
    if (!text || !text.trim()) {
      return fallback ?? ({} as T);
    }
    return JSON.parse(text);
  } catch {
    return fallback ?? ({} as T);
  }
}

export const api = {
  setActiveUser(userId: string) {
    setActiveApiUser(userId);
  },

  async getHealth() {
    const res = await fetch('/api/health');
    return safeJson(res, { status: 'ok' });
  },

  async getUsers(): Promise<UserProfile[]> {
    try {
      const res = await fetch('/api/auth/users', { headers: getHeaders() });
      return await safeJson(res, []);
    } catch {
      return [];
    }
  },

  async getCurrentUser(): Promise<UserProfile> {
    try {
      const res = await fetch('/api/auth/current', { headers: getHeaders() });
      const user = await safeJson<UserProfile>(res, {
        id: 'user-patient-01',
        name: 'Kovács László',
        email: 'kovacs.laszlo@example.hu',
        role: 'patient' as const,
        tajDemo: '042-881-934',
      });
      if (user?.id) {
        activeUserId = user.id;
      }
      return user;
    } catch {
      return {
        id: 'user-patient-01',
        name: 'Kovács László',
        email: 'kovacs.laszlo@example.hu',
        role: 'patient',
        tajDemo: '042-881-934',
      };
    }
  },

  async switchUser(userId: string): Promise<{ success: boolean; user?: UserProfile }> {
    activeUserId = userId;
    try {
      const res = await fetch('/api/auth/switch', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ userId }),
      });
      const data = await safeJson<{ success: boolean; user?: UserProfile }>(res, { success: res.ok });
      if (data?.user?.id) {
        activeUserId = data.user.id;
      }
      return data;
    } catch (err) {
      console.warn('Network call failed in switchUser, falling back to local state:', err);
      return { success: true };
    }
  },

  async login(identifier: string, password?: string): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ identifier, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Login failed');
    }
    if (data?.user?.id) {
      activeUserId = data.user.id;
    }
    return data;
  },

  async signup(data: { name: string; email: string; tajNumber?: string; password?: string }): Promise<{ success: boolean; user?: UserProfile; error?: string; alreadyExisted?: boolean }> {
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.error || 'Signup failed');
    }
    if (result?.user?.id) {
      activeUserId = result.user.id;
    }
    return result;
  },

  async logout(): Promise<{ success: boolean }> {
    const res = await fetch('/api/auth/logout', { method: 'POST', headers: getHeaders() });
    return res.json();
  },

  async getTreatmentRules(): Promise<TreatmentRule[]> {
    const res = await fetch('/api/rules/treatments');
    return res.json();
  },

  async verifyMokLicense(license: string): Promise<{ verified: boolean; doctor?: MokDoctor; message?: string }> {
    const res = await fetch(`/api/mok-registry/verify/${encodeURIComponent(license)}`);
    return res.json();
  },

  async getClinics(params?: { procedure?: string; route?: string; country?: string }): Promise<Clinic[]> {
    const query = new URLSearchParams();
    if (params?.procedure) query.append('procedure', params.procedure);
    if (params?.route) query.append('route', params.route);
    if (params?.country) query.append('country', params.country);

    const res = await fetch(`/api/clinics?${query.toString()}`);
    return res.json();
  },

  async getCases(): Promise<CaseItem[]> {
    const res = await fetch('/api/cases', { headers: getHeaders() });
    return res.json();
  },

  async getCaseById(id: string): Promise<CaseItem> {
    const res = await fetch(`/api/cases/${id}`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Case not found');
    return res.json();
  },

  async createCase(data: Partial<CaseItem>): Promise<CaseItem> {
    const res = await fetch('/api/cases', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to submit case');
    }
    return res.json();
  },

  async advisorDecision(
    caseId: string,
    data: {
      action: 'approve' | 'request_info' | 'reject';
      clinicalJustification?: string;
      moreInfoMessage?: string;
      rejectionReason?: string;
      advisorName?: string;
      advisorMokLicense?: string;
      advisorSpecialty?: string;
    }
  ): Promise<CaseItem> {
    const res = await fetch(`/api/cases/${caseId}/advisor-decision`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await safeJson(res, { error: 'Failed to record advisor decision' });
      throw new Error(err.error || 'Failed to record advisor decision');
    }
    return safeJson(res);
  },

  async updateProfile(data: { id?: string; name?: string; mokLicense?: string; specialty?: string }): Promise<{ success: boolean; user: UserProfile }> {
    const res = await fetch('/api/auth/profile', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      throw new Error('Failed to update profile');
    }
    return safeJson(res);
  },

  async reviewCase(caseId: string, data: { advisorName?: string; notes?: string }): Promise<CaseItem> {
    const res = await fetch(`/api/cases/${caseId}/review`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await safeJson(res, { error: 'Failed to review case' });
      throw new Error(err.error || 'Failed to review case');
    }
    return res.json();
  },

  async submitCase(caseId: string): Promise<CaseItem> {
    const res = await fetch(`/api/cases/${caseId}/submit`, {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to submit case to NEAK');
    }
    return res.json();
  },

  async dispatchSubmit(
    caseId: string,
    data: {
      signedScanFileName?: string;
      signedOriginalInHand: boolean;
      dateSent: string;
      trackingNumber: string;
      isClaimDispatch?: boolean;
    }
  ): Promise<CaseItem> {
    const res = await fetch(`/api/cases/${caseId}/dispatch-submit`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await safeJson(res, { error: 'Failed to dispatch application to NEAK' });
      throw new Error(err.error || 'Failed to dispatch application to NEAK');
    }
    return res.json();
  },

  async updateNeakFollowUp(
    caseId: string,
    data: {
      callDate?: string;
      decisionDate?: string;
      referenceNumber?: string;
      notes?: string;
      decision?: 'Authorised' | 'Rejected' | 'Still pending' | string;
      outcome?: 'Authorised' | 'Approved' | 'Rejected' | 'More info requested' | 'Still pending' | string;
      officerName?: string;
      decisionLetterName?: string;
      travelSupportDecision?: 'not_requested' | 'not_granted' | 'granted';
      travelSupportAmount?: string;
      travelSupportTiming?: 'before_travel' | 'after_travel';
      rejectionReason?: string;
      reimbursementAmount?: string;
    }
  ): Promise<CaseItem> {
    const res = await fetch(`/api/cases/${caseId}/neak-followup`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await safeJson(res, { error: 'Failed to record NEAK follow-up call' });
      throw new Error(err.error || 'Failed to record NEAK follow-up call');
    }
    return res.json();
  },

  async recordNeakDecision(
    caseId: string,
    data: {
      decision: 'Authorised' | 'Rejected' | 'Still pending' | string;
      decisionDate: string;
      referenceNumber: string;
      decisionLetterName?: string;
      notes: string;
      travelSupportDecision?: 'not_requested' | 'not_granted' | 'granted';
      travelSupportAmount?: string;
      travelSupportTiming?: 'before_travel' | 'after_travel';
      rejectionReason?: string;
      reimbursementAmount?: string;
    }
  ): Promise<CaseItem> {
    return this.updateNeakFollowUp(caseId, {
      ...data,
      outcome: data.decision,
    });
  },

  async payTravelSupport(caseId: string, amount?: string): Promise<CaseItem> {
    const res = await fetch(`/api/cases/${caseId}/pay-travel-support`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ amount }),
    });
    if (!res.ok) {
      const err = await safeJson(res, { error: 'Failed to record travel support payment' });
      throw new Error(err.error || 'Failed to record travel support payment');
    }
    return res.json();
  },

  async patientArrived(caseId: string): Promise<CaseItem> {
    const res = await fetch(`/api/cases/${caseId}/patient-arrived`, {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!res.ok) {
      const err = await safeJson(res, { error: 'Failed to record patient arrival' });
      throw new Error(err.error || 'Failed to record patient arrival');
    }
    return res.json();
  },

  async completeTreatment(caseId: string): Promise<CaseItem> {
    const res = await fetch(`/api/cases/${caseId}/complete-treatment`, {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!res.ok) {
      const err = await safeJson(res, { error: 'Failed to mark treatment as complete' });
      throw new Error(err.error || 'Failed to mark treatment as complete');
    }
    return res.json();
  },

  async closeS2Case(
    caseId: string,
    data: {
      settlementConfirmed: boolean;
      travelSupportPaidAmount?: string;
      otherPaymentAmount?: string;
      notes?: string;
    }
  ): Promise<CaseItem> {
    const res = await fetch(`/api/cases/${caseId}/close-s2-case`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await safeJson(res, { error: 'Failed to close S2 case' });
      throw new Error(err.error || 'Failed to close S2 case');
    }
    return res.json();
  },

  async uploadPostTreatmentDoc(
    caseId: string,
    data: { name: string; type: string }
  ): Promise<CaseItem> {
    const res = await fetch(`/api/cases/${caseId}/upload-post-treatment-docs`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await safeJson(res, { error: 'Failed to upload document' });
      throw new Error(err.error || 'Failed to upload document');
    }
    return res.json();
  },

  async reimburseDirective(
    caseId: string,
    data: { reimbursementAmount: string; reimbursementDate: string; notes?: string }
  ): Promise<CaseItem> {
    const res = await fetch(`/api/cases/${caseId}/reimburse-directive`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await safeJson(res, { error: 'Failed to finalize reimbursement' });
      throw new Error(err.error || 'Failed to finalize reimbursement');
    }
    return res.json();
  },

  async addManagerNote(caseId: string, text: string): Promise<CaseItem> {
    const res = await fetch(`/api/cases/${caseId}/manager-notes`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ text }),
    });
    if (!res.ok) {
      const err = await safeJson(res, { error: 'Failed to save note' });
      throw new Error(err.error || 'Failed to save note');
    }
    return res.json();
  },

  async generateArticle95(caseId: string): Promise<CaseItem> {
    const res = await fetch(`/api/cases/${caseId}/article-9-5`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return res.json();
  },

  async triggerSolvitAppeal(caseId: string): Promise<CaseItem> {
    const res = await fetch(`/api/cases/${caseId}/solvit-appeal`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return res.json();
  },

  async updateEvidence(caseId: string, data: any): Promise<CaseItem> {
    const res = await fetch(`/api/cases/${caseId}/evidence`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update evidence');
    return res.json();
  },

  async uploadDocumentAbroad(
    caseId: string,
    data: { documentName: string; documentType: string }
  ): Promise<CaseItem> {
    const res = await fetch(`/api/cases/${caseId}/upload-document`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to upload document from abroad');
    return res.json();
  },

  async uploadDocument(caseId: string, documentName: string, documentType?: string): Promise<CaseItem> {
    return this.uploadDocumentAbroad(caseId, { documentName, documentType: documentType || 'Hospital Document' });
  },

  async uploadClaimSlot(caseId: string, slotKey: string, fileName: string): Promise<CaseItem> {
    const res = await fetch(`/api/cases/${caseId}/claim-slot-upload`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ slotKey, fileName }),
    });
    if (!res.ok) {
      const err = await safeJson(res, { error: 'Failed to upload claim document' });
      throw new Error(err.error || 'Failed to upload claim document');
    }
    return res.json();
  },

  async reviewClaim(caseId: string, status: 'complete' | 'needs_more', message?: string): Promise<CaseItem> {
    const res = await fetch(`/api/cases/${caseId}/claim-review`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ status, message }),
    });
    if (!res.ok) {
      const err = await safeJson(res, { error: 'Failed to update claim review' });
      throw new Error(err.error || 'Failed to update claim review');
    }
    return res.json();
  },

  async resetDemoData(): Promise<void> {
    await fetch('/api/reset-demo', { method: 'POST', headers: getHeaders() });
  },
};
