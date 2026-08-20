import { Assessment, AssessmentStatus } from '../types';

let serverTimeOffsetMs = 0;
let lastSyncedAt: number | null = null;

/**
 * Synchronize with the server time API to prevent reliance on the user's local clock.
 */
export async function syncServerTime(): Promise<number> {
  try {
    const startFetch = Date.now();
    const res = await fetch('/api/assessments/server-time', {
      headers: { 'Cache-Control': 'no-cache' },
    });
    
    if (res.ok) {
      const data = await res.json();
      const endFetch = Date.now();
      const roundTripLatency = (endFetch - startFetch) / 2;
      const serverEpoch = data.epochMs || new Date(data.serverTime).getTime();
      
      // serverEpoch corresponds roughly to startFetch + roundTripLatency
      serverTimeOffsetMs = serverEpoch - (startFetch + roundTripLatency);
      lastSyncedAt = Date.now();
      return serverTimeOffsetMs;
    }
  } catch (err) {
    console.warn('Could not sync with server time endpoint, using existing offset or local clock fallback.', err);
  }
  return serverTimeOffsetMs;
}

/**
 * Returns the current timestamp according to server-side clock.
 */
export function getServerNow(): Date {
  return new Date(Date.now() + serverTimeOffsetMs);
}

/**
 * Returns the current server time offset in milliseconds.
 */
export function getServerTimeOffset(): number {
  return serverTimeOffsetMs;
}

export interface AssessmentAvailabilityResult {
  isAvailable: boolean;
  status: AssessmentStatus;
  reason: string;
  badgeLabel: string;
  badgeColor: string;
  opensAt?: Date;
  closesAt?: Date;
  formattedSchedule?: string;
}

/**
 * Validates assessment availability against program manager state and server-side time.
 */
export function checkAssessmentAvailability(
  assessment?: Assessment | null,
  currentServerTime?: Date
): AssessmentAvailabilityResult {
  if (!assessment) {
    return {
      isAvailable: false,
      status: 'draft',
      reason: 'No assessment configuration found.',
      badgeLabel: 'UNAVAILABLE',
      badgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
    };
  }

  const serverNow = currentServerTime || getServerNow();
  const normalizedStatus = (assessment.status || 'draft').toLowerCase() as AssessmentStatus;

  // 1. DRAFT state: Manager has not published or opened the assessment
  if (normalizedStatus === 'draft') {
    return {
      isAvailable: false,
      status: 'draft',
      reason: 'This assessment is currently in Draft mode under faculty preparation. It is not open for candidate intake.',
      badgeLabel: 'DRAFT • NOT OPEN',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    };
  }

  // 2. CLOSED state: Program Manager has manually locked / closed access
  if (normalizedStatus === 'closed') {
    return {
      isAvailable: false,
      status: 'closed',
      reason: 'This assessment intake has been officially CLOSED by the Program Admissions Board.',
      badgeLabel: 'CLOSED',
      badgeColor: 'bg-slate-200 text-slate-700 border-slate-300',
    };
  }

  // 3. ARCHIVED state
  if (normalizedStatus === 'archived') {
    return {
      isAvailable: false,
      status: 'archived',
      reason: 'This assessment has been archived and is no longer accessible.',
      badgeLabel: 'ARCHIVED',
      badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
    };
  }

  // 4. SCHEDULED state: Check against server time window
  if (normalizedStatus === 'scheduled') {
    let opensAt: Date | undefined;
    let closesAt: Date | undefined;

    if (assessment.openDate) {
      const openTimeStr = assessment.openTime || '00:00';
      opensAt = new Date(`${assessment.openDate}T${openTimeStr}:00`);
    }

    if (assessment.closeDate) {
      const closeTimeStr = assessment.closeTime || '23:59';
      closesAt = new Date(`${assessment.closeDate}T${closeTimeStr}:00`);
    }

    // Check if before opening window
    if (opensAt && !isNaN(opensAt.getTime()) && serverNow.getTime() < opensAt.getTime()) {
      const openFormatted = opensAt.toLocaleString([], {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
      return {
        isAvailable: false,
        status: 'scheduled',
        reason: `Assessment is scheduled to open on ${openFormatted} (Server Time: ${serverNow.toLocaleTimeString()}). Please return at the scheduled start time.`,
        badgeLabel: 'SCHEDULED (UPCOMING)',
        badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
        opensAt,
        closesAt,
        formattedSchedule: `Opens: ${openFormatted}`,
      };
    }

    // Check if after closing window
    if (closesAt && !isNaN(closesAt.getTime()) && serverNow.getTime() > closesAt.getTime()) {
      const closeFormatted = closesAt.toLocaleString([], {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
      return {
        isAvailable: false,
        status: 'closed',
        reason: `The scheduled testing window for this assessment closed on ${closeFormatted}.`,
        badgeLabel: 'SCHEDULED WINDOW EXPIRED',
        badgeColor: 'bg-slate-200 text-slate-700 border-slate-300',
        opensAt,
        closesAt,
        formattedSchedule: `Closed: ${closeFormatted}`,
      };
    }

    // Within scheduled window
    const closeFormatted = closesAt ? closesAt.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'Intake Cutoff';
    return {
      isAvailable: true,
      status: 'open',
      reason: `Assessment is currently OPEN within its scheduled window (Closes ${closeFormatted}).`,
      badgeLabel: 'OPEN (SCHEDULED)',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      opensAt,
      closesAt,
      formattedSchedule: `Open until ${closeFormatted}`,
    };
  }

  // 5. OPEN / PUBLISHED state: Immediately available
  if (normalizedStatus === 'open' || normalizedStatus === 'published') {
    return {
      isAvailable: true,
      status: 'open',
      reason: 'This assessment is currently OPEN and accepting candidate attempts.',
      badgeLabel: 'OPEN & ACTIVE',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    };
  }

  return {
    isAvailable: false,
    status: normalizedStatus,
    reason: 'Assessment state is not active for candidate access.',
    badgeLabel: String(normalizedStatus).toUpperCase(),
    badgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
  };
}
