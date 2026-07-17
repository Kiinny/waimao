import { DomainError } from "@/lib/errors";
import type { AuthorizationContext } from "@/lib/rbac";
import {
  assertLeadMutable,
  assertOpportunityTransition,
  assertOwned,
  type OpportunityStageValue,
} from "@/modules/crm/crm-domain";

export interface LeadForConversion {
  id: string;
  version: number;
  ownerId: string;
  status: string;
  companyName: string;
  contactName: string;
  countryCode: string;
  email: string | null;
  phone: string | null;
}

export interface OpportunityForStage {
  id: string;
  ownerId: string;
  stage: OpportunityStageValue;
  version: number;
}

export interface ConvertLeadInput {
  opportunityName: string;
  value: string;
  currencyCode: string;
  exchangeRateToUsd: string;
  probability: number;
}

export interface AtomicConversionInput extends ConvertLeadInput {
  ownerId: string;
}

export interface ConversionResult {
  leadId: string;
  customerId: string;
  opportunityId: string;
  ownerId: string;
}

export interface StageUpdateResult {
  id: string;
  stage: OpportunityStageValue;
  lossReason: string | null;
}

export interface CrmRepository {
  findLead(
    context: AuthorizationContext,
    id: string,
  ): Promise<LeadForConversion | null>;
  convertLeadAtomically(
    context: AuthorizationContext,
    lead: LeadForConversion,
    input: AtomicConversionInput,
  ): Promise<ConversionResult>;
  findOpportunity(
    context: AuthorizationContext,
    id: string,
  ): Promise<OpportunityForStage | null>;
  updateOpportunityStage(
    context: AuthorizationContext,
    opportunity: OpportunityForStage,
    input: { stage: OpportunityStageValue; lossReason?: string | null },
  ): Promise<StageUpdateResult>;
}

export async function convertLead(
  repository: CrmRepository,
  context: AuthorizationContext,
  leadId: string,
  input: ConvertLeadInput,
) {
  const lead = await repository.findLead(context, leadId);
  if (!lead) {
    throw new DomainError("LEAD_NOT_FOUND", "Lead not found", 404);
  }
  assertOwned(context, lead, "lead.update");
  assertLeadMutable(lead.status);
  return repository.convertLeadAtomically(context, lead, {
    ...input,
    ownerId: lead.ownerId,
  });
}

export async function moveOpportunity(
  repository: CrmRepository,
  context: AuthorizationContext,
  opportunityId: string,
  stage: OpportunityStageValue,
  lossReason?: string | null,
) {
  const opportunity = await repository.findOpportunity(
    context,
    opportunityId,
  );
  if (!opportunity) {
    throw new DomainError(
      "OPPORTUNITY_NOT_FOUND",
      "Opportunity not found",
      404,
    );
  }
  assertOwned(context, opportunity, "opportunity.update");
  assertOpportunityTransition(opportunity.stage, stage, lossReason);
  return repository.updateOpportunityStage(context, opportunity, {
    stage,
    lossReason,
  });
}
