import Decimal from "decimal.js";

import { DomainError } from "@/lib/errors";
import type { AuthorizationContext } from "@/lib/rbac";
import { hasGlobalOwnershipScope, requirePermission } from "@/lib/rbac";

export function crmOwnerWhere(
  context: AuthorizationContext,
  requestedOwnerId?: string,
) {
  const representativeScope =
    context.roles?.includes("SALES_REP") &&
    !hasGlobalOwnershipScope(context)
      ? context.userId
      : undefined;
  const ownerId = representativeScope ?? requestedOwnerId;
  return ownerId ? { ownerId } : {};
}

export interface OwnedCrmRecord {
  ownerId: string;
}

export function assertOwned(
  context: AuthorizationContext,
  record: OwnedCrmRecord,
  permission: string,
) {
  requirePermission(context, permission, record);
}

interface DuplicateCandidate {
  companyName?: string | null;
  email?: string | null;
  phone?: string | null;
}

interface DuplicateRow extends DuplicateCandidate {
  id: string;
}

function normalizedText(value?: string | null) {
  return value?.trim().toLocaleLowerCase().replace(/\s+/g, " ") ?? "";
}

function normalizedPhone(value?: string | null) {
  return value?.replace(/\D/g, "") ?? "";
}

export function findLeadDuplicates(
  candidate: DuplicateCandidate,
  rows: readonly DuplicateRow[],
) {
  const companyName = normalizedText(candidate.companyName);
  const email = normalizedText(candidate.email);
  const phone = normalizedPhone(candidate.phone);

  return rows
    .filter(
      (row) =>
        (companyName !== "" &&
          normalizedText(row.companyName) === companyName) ||
        (email !== "" && normalizedText(row.email) === email) ||
        (phone !== "" && normalizedPhone(row.phone) === phone),
    )
    .map((row) => row.id);
}

export function assertPrimaryContactChange(
  isPrimary: boolean,
  existingPrimaryContactIds: readonly string[],
) {
  if (isPrimary && existingPrimaryContactIds.length > 0) {
    throw new DomainError(
      "PRIMARY_CONTACT_EXISTS",
      "This customer already has an active primary contact",
      409,
    );
  }
}

export interface FollowUpSchedule {
  nextActionAt: Date | null;
  completedAt: Date | null;
  deletedAt: Date | null;
}

export function isFollowUpOverdue(
  followUp: FollowUpSchedule,
  now = new Date(),
) {
  return (
    followUp.nextActionAt !== null &&
    followUp.nextActionAt < now &&
    followUp.completedAt === null &&
    followUp.deletedAt === null
  );
}

export const opportunityStages = [
  "QUALIFICATION",
  "DISCOVERY",
  "PROPOSAL",
  "NEGOTIATION",
  "WON",
  "LOST",
] as const;

export type OpportunityStageValue = (typeof opportunityStages)[number];

const activeStages = opportunityStages.slice(0, 4);

export function assertOpportunityTransition(
  current: OpportunityStageValue,
  next: OpportunityStageValue,
  lossReason?: string | null,
) {
  if (current === "WON" || current === "LOST") {
    throw new DomainError(
      "OPPORTUNITY_TERMINAL",
      "A terminal opportunity cannot change stage",
      409,
    );
  }
  if (current === next) return;
  if (next === "LOST") {
    if (!lossReason?.trim()) {
      throw new DomainError(
        "LOSS_REASON_REQUIRED",
        "A loss reason is required",
      );
    }
    return;
  }

  const currentIndex = activeStages.indexOf(current);
  const nextIndex = activeStages.indexOf(next);
  const validSequentialMove = nextIndex === currentIndex + 1;
  const validWonMove = current === "NEGOTIATION" && next === "WON";
  if (!validSequentialMove && !validWonMove) {
    throw new DomainError(
      "INVALID_STAGE_TRANSITION",
      `Invalid opportunity transition from ${current} to ${next}`,
      409,
    );
  }
}

export interface ForecastOpportunity {
  valueUsd: string;
  probability: number;
  stage: OpportunityStageValue;
}

export function weightedForecast(
  opportunities: readonly ForecastOpportunity[],
) {
  return opportunities
    .filter(({ stage }) => stage !== "LOST")
    .reduce((total, opportunity) => {
      const probability =
        opportunity.stage === "WON" ? 100 : opportunity.probability;
      return total.plus(
        new Decimal(opportunity.valueUsd).times(probability).dividedBy(100),
      );
    }, new Decimal(0))
    .toFixed(2);
}
