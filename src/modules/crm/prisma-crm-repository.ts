import Decimal from "decimal.js";

import type { Prisma } from "@/generated/prisma/client";
import { getPrisma } from "@/lib/prisma";
import { writeAudit } from "@/lib/audit";
import { DomainError } from "@/lib/errors";
import type { AuthorizationContext } from "@/lib/rbac";
import {
  assertLeadMutable,
  assertPrimaryContactChange,
  crmOwnerWhere,
  customerActivityWhere,
  customerTimelineWhere,
  findLeadDuplicates,
  followUpRelationMetadata,
  opportunityStageGuard,
  resolveOpportunityOwner,
} from "@/modules/crm/crm-domain";
import type {
  AtomicConversionInput,
  CrmRepository,
  LeadForConversion,
  OpportunityForStage,
} from "@/modules/crm/crm-service";
import { searchOwnershipFilter } from "@/modules/search/search-scope";

export interface LeadFilters {
  page?: number;
  pageSize?: number;
  query?: string;
  countryCode?: string;
  source?: string;
  status?: string;
  ownerId?: string;
  createdFrom?: Date;
  createdTo?: Date;
}

export interface CreateLeadData {
  companyName: string;
  contactName: string;
  email?: string | null;
  phone?: string | null;
  countryCode: string;
  source: string;
  status?: "NEW" | "CONTACTED" | "QUALIFIED" | "LOST";
  notes?: string | null;
  ownerId: string;
}

export interface CustomerFilters {
  page?: number;
  pageSize?: number;
  query?: string;
  countryCode?: string;
  status?: string;
  level?: string;
  riskRating?: string;
  ownerId?: string;
}

export interface CreateCustomerData {
  companyName: string;
  legalName?: string | null;
  countryCode: string;
  website?: string | null;
  email?: string | null;
  phone?: string | null;
  taxId?: string | null;
  status?: "ACTIVE" | "INACTIVE" | "ARCHIVED";
  level?: string;
  riskRating?: string;
  riskNotes?: string | null;
  ownerId: string;
}

export interface ContactData {
  firstName: string;
  lastName: string;
  title?: string | null;
  email?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  wechat?: string | null;
  preferredChannel?: string | null;
  isPrimary?: boolean;
  language?: string;
  timezone?: string | null;
  decisionRole?: string | null;
}

export interface FollowUpData {
  customerId?: string | null;
  contactId?: string | null;
  leadId?: string | null;
  opportunityId?: string | null;
  type: string;
  channel: string;
  summary: string;
  outcome?: string | null;
  nextAction?: string | null;
  occurredAt: Date;
  nextActionAt?: Date | null;
  completedAt?: Date | null;
  attachments?: Prisma.InputJsonValue;
}

export interface OpportunityFilters {
  page?: number;
  pageSize?: number;
  query?: string;
  stage?: string;
  ownerId?: string;
  customerId?: string;
}

export interface CreateOpportunityData {
  customerId: string;
  name: string;
  value: string;
  currencyCode: string;
  exchangeRateToUsd: string;
  probability: number;
  expectedCloseAt?: Date | null;
  ownerId?: string;
}

function ownerIdFor(context: AuthorizationContext) {
  return searchOwnershipFilter(context).ownerId;
}

function ownershipWhere(
  context: AuthorizationContext,
  requestedOwnerId?: string,
) {
  return crmOwnerWhere(context, requestedOwnerId);
}

function relatedOwnershipWhere(context: AuthorizationContext) {
  const ownerId = ownerIdFor(context);
  return ownerId
    ? {
        OR: [
          { customer: { ownerId } },
          { contact: { customer: { ownerId } } },
          { lead: { ownerId } },
          { opportunity: { ownerId } },
        ],
      }
    : {};
}

function pagination(page = 1, pageSize = 20) {
  return {
    page: Math.max(1, page),
    pageSize: Math.min(100, Math.max(1, pageSize)),
  };
}

export class PrismaCrmRepository implements CrmRepository {
  async listLeads(context: AuthorizationContext, filters: LeadFilters = {}) {
    const { page, pageSize } = pagination(filters.page, filters.pageSize);
    const where: Prisma.LeadWhereInput = {
      deletedAt: null,
      ...ownershipWhere(context, filters.ownerId),
      ...(filters.countryCode ? { countryCode: filters.countryCode } : {}),
      ...(filters.source ? { source: filters.source } : {}),
      ...(filters.status
        ? { status: filters.status as Prisma.EnumLeadStatusFilter["equals"] }
        : {}),
      ...(filters.createdFrom || filters.createdTo
        ? {
            createdAt: {
              ...(filters.createdFrom ? { gte: filters.createdFrom } : {}),
              ...(filters.createdTo ? { lte: filters.createdTo } : {}),
            },
          }
        : {}),
      ...(filters.query
        ? {
            OR: [
              { companyName: { contains: filters.query, mode: "insensitive" } },
              { contactName: { contains: filters.query, mode: "insensitive" } },
              { email: { contains: filters.query, mode: "insensitive" } },
              { phone: { contains: filters.query, mode: "insensitive" } },
            ],
          }
        : {}),
    };
    const prisma = getPrisma();
    const [total, items] = await prisma.$transaction([
      prisma.lead.count({ where }),
      prisma.lead.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          owner: { select: { id: true, name: true } },
          followUps: {
            where: { deletedAt: null },
            orderBy: { occurredAt: "desc" },
            take: 1,
          },
        },
      }),
    ]);
    return { items, total, page, pageSize, pageCount: Math.ceil(total / pageSize) };
  }

  async findLead(
    context: AuthorizationContext,
    id: string,
  ): Promise<LeadForConversion | null> {
    return getPrisma().lead.findFirst({
      where: { id, deletedAt: null, ...ownershipWhere(context) },
      select: {
        id: true,
        version: true,
        ownerId: true,
        status: true,
        companyName: true,
        contactName: true,
        countryCode: true,
        email: true,
        phone: true,
      },
    });
  }

  getLeadDetail(context: AuthorizationContext, id: string) {
    return getPrisma().lead.findFirst({
      where: { id, deletedAt: null, ...ownershipWhere(context) },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        followUps: {
          where: { deletedAt: null },
          orderBy: { occurredAt: "desc" },
        },
      },
    });
  }

  async createLead(context: AuthorizationContext, input: CreateLeadData) {
    const scopedOwnerId = ownerIdFor(context);
    if (scopedOwnerId && input.ownerId !== scopedOwnerId) {
      throw new DomainError("PERMISSION_DENIED", "Permission denied: lead.create", 403);
    }
    const prisma = getPrisma();
    const candidates = await prisma.lead.findMany({
      where: {
        deletedAt: null,
        ...ownershipWhere(context),
        OR: [
          { companyName: { equals: input.companyName, mode: "insensitive" } },
          ...(input.email
            ? [{ email: { equals: input.email, mode: "insensitive" as const } }]
            : []),
          ...(input.phone ? [{ phone: input.phone }] : []),
        ],
      },
      select: { id: true, companyName: true, email: true, phone: true },
    });
    const duplicateIds = findLeadDuplicates(input, candidates);
    if (duplicateIds.length) {
      throw new DomainError("LEAD_DUPLICATE", "Potential duplicate lead", 409, {
        duplicateIds,
      });
    }
    return prisma.$transaction(async (transaction) => {
      const lead = await transaction.lead.create({ data: input });
      await writeAudit(transaction, {
        actorId: context.userId,
        action: "lead.create",
        entityType: "Lead",
        entityId: lead.id,
        after: { id: lead.id, companyName: lead.companyName, ownerId: lead.ownerId },
      });
      return lead;
    });
  }

  async importLeadsAtomically(
    context: AuthorizationContext,
    rows: Array<Omit<CreateLeadData, "ownerId">>,
    ownerId = context.userId,
  ) {
    const scopedOwnerId = ownerIdFor(context);
    if (scopedOwnerId && ownerId !== scopedOwnerId) {
      throw new DomainError("PERMISSION_DENIED", "Permission denied: lead.create", 403);
    }
    return getPrisma().$transaction(async (transaction) => {
      const created = [];
      for (const row of rows) {
        const lead = await transaction.lead.create({
          data: { ...row, ownerId },
        });
        created.push(lead);
      }
      await writeAudit(transaction, {
        actorId: context.userId,
        action: "lead.csv_import",
        entityType: "Lead",
        metadata: { ids: created.map(({ id }) => id), count: created.length },
      });
      return created;
    });
  }

  async updateLead(
    context: AuthorizationContext,
    id: string,
    input: Partial<Omit<CreateLeadData, "ownerId">>,
  ) {
    const existing = await this.findLead(context, id);
    if (!existing) throw new DomainError("LEAD_NOT_FOUND", "Lead not found", 404);
    assertLeadMutable(existing.status);
    return getPrisma().$transaction(async (transaction) => {
      const result = await transaction.lead.updateMany({
        where: { id, deletedAt: null, status: { not: "CONVERTED" } },
        data: { ...input, version: { increment: 1 } },
      });
      if (result.count !== 1) {
        throw new DomainError(
          "LEAD_ALREADY_CONVERTED",
          "Converted leads are immutable",
          409,
        );
      }
      const lead = await transaction.lead.findUniqueOrThrow({ where: { id } });
      await writeAudit(transaction, {
        actorId: context.userId,
        action: "lead.update",
        entityType: "Lead",
        entityId: id,
        before: { status: existing.status },
        after: { status: lead.status, version: lead.version },
      });
      return lead;
    });
  }

  async batchLeads(
    context: AuthorizationContext,
    ids: string[],
    input: { ownerId?: string; status?: "NEW" | "CONTACTED" | "QUALIFIED" | "LOST" },
  ) {
    const prisma = getPrisma();
    const scoped = await prisma.lead.findMany({
      where: { id: { in: ids }, deletedAt: null, ...ownershipWhere(context) },
      select: { id: true, status: true },
    });
    if (scoped.length !== new Set(ids).size) {
      throw new DomainError("LEAD_NOT_FOUND", "One or more leads were not found", 404);
    }
    scoped.forEach((lead) => assertLeadMutable(lead.status));
    const ownId = ownerIdFor(context);
    if (input.ownerId && ownId) {
      throw new DomainError("PERMISSION_DENIED", "Permission denied: lead.assign", 403);
    }
    return prisma.$transaction(async (transaction) => {
      const result = await transaction.lead.updateMany({
        where: { id: { in: ids }, status: { not: "CONVERTED" } },
        data: {
          ...(input.ownerId ? { ownerId: input.ownerId } : {}),
          ...(input.status ? { status: input.status } : {}),
          version: { increment: 1 },
        },
      });
      if (result.count !== scoped.length) {
        throw new DomainError(
          "LEAD_ALREADY_CONVERTED",
          "Converted leads are immutable",
          409,
        );
      }
      await writeAudit(transaction, {
        actorId: context.userId,
        action: "lead.batch_update",
        entityType: "Lead",
        metadata: { ids, ...input },
      });
      return result;
    });
  }

  async convertLeadAtomically(
    context: AuthorizationContext,
    lead: LeadForConversion,
    input: AtomicConversionInput,
  ) {
    return getPrisma().$transaction(async (transaction) => {
      const current = await transaction.lead.findFirst({
        where: {
          id: lead.id,
          deletedAt: null,
          status: { not: "CONVERTED" },
          ...ownershipWhere(context),
        },
      });
      if (!current) {
        throw new DomainError(
          "LEAD_CONVERSION_CONFLICT",
          "Lead cannot be converted",
          409,
        );
      }
      const claimed = await transaction.lead.updateMany({
        where: {
          id: current.id,
          status: { not: "CONVERTED" },
          convertedCustomerId: null,
          convertedOpportunityId: null,
          version: current.version,
        },
        data: { status: "CONVERTED", version: { increment: 1 } },
      });
      if (claimed.count !== 1) {
        throw new DomainError(
          "LEAD_CONVERSION_CONFLICT",
          "Lead cannot be converted",
          409,
        );
      }
      const customer = await transaction.customer.create({
        data: {
          companyName: current.companyName,
          countryCode: current.countryCode,
          email: current.email,
          phone: current.phone,
          ownerId: input.ownerId,
          contacts: {
            create: {
              firstName: current.contactName,
              lastName: "",
              email: current.email,
              phone: current.phone,
              isPrimary: true,
            },
          },
        },
      });
      const valueUsd = new Decimal(input.value)
        .times(input.exchangeRateToUsd)
        .toFixed(4);
      const opportunity = await transaction.opportunity.create({
        data: {
          customerId: customer.id,
          name: input.opportunityName,
          value: input.value,
          currencyCode: input.currencyCode,
          exchangeRateToUsd: input.exchangeRateToUsd,
          valueUsd,
          probability: input.probability,
          ownerId: input.ownerId,
        },
      });
      await transaction.lead.update({
        where: { id: current.id },
        data: {
          convertedCustomerId: customer.id,
          convertedOpportunityId: opportunity.id,
        },
      });
      await writeAudit(transaction, {
        actorId: context.userId,
        action: "lead.convert",
        entityType: "Lead",
        entityId: current.id,
        metadata: {
          customerId: customer.id,
          opportunityId: opportunity.id,
        },
      });
      return {
        leadId: current.id,
        customerId: customer.id,
        opportunityId: opportunity.id,
        ownerId: input.ownerId,
      };
    });
  }

  async listCustomers(context: AuthorizationContext, filters: CustomerFilters = {}) {
    const { page, pageSize } = pagination(filters.page, filters.pageSize);
    const where: Prisma.CustomerWhereInput = {
      deletedAt: null,
      ...ownershipWhere(context, filters.ownerId),
      ...(filters.countryCode ? { countryCode: filters.countryCode } : {}),
      ...(filters.status
        ? { status: filters.status as Prisma.EnumRecordStatusFilter["equals"] }
        : {}),
      ...(filters.level ? { level: filters.level } : {}),
      ...(filters.riskRating ? { riskRating: filters.riskRating } : {}),
      ...(filters.query
        ? {
            OR: [
              { companyName: { contains: filters.query, mode: "insensitive" } },
              { legalName: { contains: filters.query, mode: "insensitive" } },
              { email: { contains: filters.query, mode: "insensitive" } },
            ],
          }
        : {}),
    };
    const prisma = getPrisma();
    const [total, items] = await prisma.$transaction([
      prisma.customer.count({ where }),
      prisma.customer.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          owner: { select: { id: true, name: true } },
          _count: { select: { contacts: true, opportunities: true, orders: true } },
        },
      }),
    ]);
    return { items, total, page, pageSize, pageCount: Math.ceil(total / pageSize) };
  }

  async getCustomerDetail(context: AuthorizationContext, id: string) {
    const prisma = getPrisma();
    const customer = await prisma.customer.findFirst({
      where: { id, deletedAt: null, ...ownershipWhere(context) },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        contacts: { where: { deletedAt: null }, orderBy: [{ isPrimary: "desc" }, { firstName: "asc" }] },
        opportunities: { where: { deletedAt: null }, orderBy: { updatedAt: "desc" } },
        quotes: { where: { deletedAt: null }, orderBy: { updatedAt: "desc" } },
        orders: {
          where: { deletedAt: null },
          orderBy: { updatedAt: "desc" },
          include: {
            payments: { where: { deletedAt: null } },
            shipments: { where: { deletedAt: null } },
          },
        },
        tickets: { where: { deletedAt: null }, orderBy: { updatedAt: "desc" } },
      },
    });
    if (!customer) return null;
    const [followUps, files, activity] = await prisma.$transaction([
      prisma.followUp.findMany({
        where: customerTimelineWhere(id),
        orderBy: { occurredAt: "desc" },
      }),
      prisma.fileAsset.findMany({
        where: { entityType: "Customer", entityId: id, deletedAt: null },
        orderBy: { createdAt: "desc" },
      }),
      prisma.auditLog.findMany({
        where: customerActivityWhere(
          id,
          customer.contacts.map(({ id: contactId }) => contactId),
          customer.opportunities.map(
            ({ id: opportunityId }) => opportunityId,
          ),
        ),
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
    ]);
    return { ...customer, followUps, files, activity };
  }

  async createCustomer(context: AuthorizationContext, input: CreateCustomerData) {
    const ownId = ownerIdFor(context);
    if (ownId && input.ownerId !== ownId) {
      throw new DomainError("PERMISSION_DENIED", "Permission denied: customer.create", 403);
    }
    return getPrisma().$transaction(async (transaction) => {
      const customer = await transaction.customer.create({ data: input });
      await writeAudit(transaction, {
        actorId: context.userId,
        action: "customer.create",
        entityType: "Customer",
        entityId: customer.id,
        after: { id: customer.id, companyName: customer.companyName, ownerId: customer.ownerId },
      });
      return customer;
    });
  }

  async updateCustomer(
    context: AuthorizationContext,
    id: string,
    input: Partial<Omit<CreateCustomerData, "ownerId">>,
  ) {
    const existing = await this.getCustomerDetail(context, id);
    if (!existing) throw new DomainError("CUSTOMER_NOT_FOUND", "Customer not found", 404);
    return getPrisma().$transaction(async (transaction) => {
      const customer = await transaction.customer.update({
        where: { id },
        data: { ...input, version: { increment: 1 } },
      });
      await writeAudit(transaction, {
        actorId: context.userId,
        action: "customer.update",
        entityType: "Customer",
        entityId: id,
        before: { status: existing.status, level: existing.level, riskRating: existing.riskRating },
        after: { status: customer.status, level: customer.level, riskRating: customer.riskRating },
      });
      return customer;
    });
  }

  async createContact(
    context: AuthorizationContext,
    customerId: string,
    input: ContactData,
  ) {
    const customer = await getPrisma().customer.findFirst({
      where: { id: customerId, deletedAt: null, ...ownershipWhere(context) },
      select: { id: true },
    });
    if (!customer) throw new DomainError("CUSTOMER_NOT_FOUND", "Customer not found", 404);
    const existingPrimary = input.isPrimary
      ? await getPrisma().contact.findMany({
          where: { customerId, isPrimary: true, deletedAt: null },
          select: { id: true },
        })
      : [];
    assertPrimaryContactChange(
      input.isPrimary === true,
      existingPrimary.map(({ id }) => id),
    );
    return getPrisma().$transaction(async (transaction) => {
      const contact = await transaction.contact.create({
        data: { customerId, ...input },
      });
      await writeAudit(transaction, {
        actorId: context.userId,
        action: "contact.create",
        entityType: "Contact",
        entityId: contact.id,
        metadata: { customerId },
      });
      return contact;
    });
  }

  async updateContact(
    context: AuthorizationContext,
    customerId: string,
    contactId: string,
    input: Partial<ContactData>,
  ) {
    const contact = await getPrisma().contact.findFirst({
      where: {
        id: contactId,
        customerId,
        deletedAt: null,
        customer: { deletedAt: null, ...ownershipWhere(context) },
      },
    });
    if (!contact) throw new DomainError("CONTACT_NOT_FOUND", "Contact not found", 404);
    if (input.isPrimary) {
      const primary = await getPrisma().contact.findMany({
        where: { customerId, isPrimary: true, deletedAt: null, id: { not: contactId } },
        select: { id: true },
      });
      assertPrimaryContactChange(true, primary.map(({ id }) => id));
    }
    return getPrisma().$transaction(async (transaction) => {
      const updated = await transaction.contact.update({
        where: { id: contactId },
        data: { ...input, version: { increment: 1 } },
      });
      await writeAudit(transaction, {
        actorId: context.userId,
        action: "contact.update",
        entityType: "Contact",
        entityId: contactId,
        metadata: { customerId },
      });
      return updated;
    });
  }

  async deleteContact(
    context: AuthorizationContext,
    customerId: string,
    contactId: string,
  ) {
    const contact = await getPrisma().contact.findFirst({
      where: {
        id: contactId,
        customerId,
        deletedAt: null,
        customer: { deletedAt: null, ...ownershipWhere(context) },
      },
    });
    if (!contact) throw new DomainError("CONTACT_NOT_FOUND", "Contact not found", 404);
    return getPrisma().$transaction(async (transaction) => {
      const deleted = await transaction.contact.update({
        where: { id: contactId },
        data: { deletedAt: new Date(), isPrimary: false, version: { increment: 1 } },
      });
      await writeAudit(transaction, {
        actorId: context.userId,
        action: "contact.archive",
        entityType: "Contact",
        entityId: contactId,
        metadata: { customerId },
      });
      return deleted;
    });
  }

  listFollowUps(
    context: AuthorizationContext,
    filters: { overdue?: boolean; customerId?: string; leadId?: string; opportunityId?: string } = {},
  ) {
    return getPrisma().followUp.findMany({
      where: {
        deletedAt: null,
        ...relatedOwnershipWhere(context),
        ...(filters.customerId ? { customerId: filters.customerId } : {}),
        ...(filters.leadId ? { leadId: filters.leadId } : {}),
        ...(filters.opportunityId ? { opportunityId: filters.opportunityId } : {}),
        ...(filters.overdue
          ? { nextActionAt: { lt: new Date() }, completedAt: null }
          : {}),
      },
      orderBy: filters.overdue ? { nextActionAt: "asc" } : { occurredAt: "desc" },
      include: {
        customer: { select: { id: true, companyName: true } },
        lead: { select: { id: true, companyName: true } },
        opportunity: { select: { id: true, name: true } },
      },
    });
  }

  async createFollowUp(context: AuthorizationContext, input: FollowUpData) {
    const relatedIds = [
      input.customerId,
      input.contactId,
      input.leadId,
      input.opportunityId,
    ].filter((id): id is string => Boolean(id));
    const owners = await this.resolveRelatedOwners(input);
    if (!relatedIds.length || owners.length !== relatedIds.length) {
      throw new DomainError("FOLLOW_UP_RELATION_REQUIRED", "A related CRM record is required");
    }
    const uniqueOwners = [...new Set(owners)];
    if (uniqueOwners.length !== 1) {
      throw new DomainError(
        "FOLLOW_UP_RELATION_MISMATCH",
        "Related CRM records must have the same owner",
        409,
      );
    }
    const [ownerId] = uniqueOwners;
    const scopedOwner = ownerIdFor(context);
    if (scopedOwner && ownerId !== scopedOwner) {
      throw new DomainError("PERMISSION_DENIED", "Permission denied: lead.update", 403);
    }
    return getPrisma().$transaction(async (transaction) => {
      const followUp = await transaction.followUp.create({
        data: { ...input, createdById: context.userId },
      });
      await writeAudit(transaction, {
        actorId: context.userId,
        action: "follow_up.create",
        entityType: "FollowUp",
        entityId: followUp.id,
        metadata: followUpRelationMetadata(input),
      });
      return followUp;
    });
  }

  async updateFollowUp(
    context: AuthorizationContext,
    id: string,
    input: Partial<Omit<FollowUpData, "customerId" | "contactId" | "leadId" | "opportunityId">>,
  ) {
    const existing = await getPrisma().followUp.findFirst({
      where: { id, deletedAt: null, ...relatedOwnershipWhere(context) },
    });
    if (!existing) throw new DomainError("FOLLOW_UP_NOT_FOUND", "Follow-up not found", 404);
    return getPrisma().$transaction(async (transaction) => {
      const followUp = await transaction.followUp.update({ where: { id }, data: input });
      await writeAudit(transaction, {
        actorId: context.userId,
        action: "follow_up.update",
        entityType: "FollowUp",
        entityId: id,
        metadata: followUpRelationMetadata(existing),
      });
      return followUp;
    });
  }

  async deleteFollowUp(context: AuthorizationContext, id: string) {
    const existing = await getPrisma().followUp.findFirst({
      where: { id, deletedAt: null, ...relatedOwnershipWhere(context) },
      select: {
        id: true,
        customerId: true,
        contactId: true,
        leadId: true,
        opportunityId: true,
      },
    });
    if (!existing) throw new DomainError("FOLLOW_UP_NOT_FOUND", "Follow-up not found", 404);
    return getPrisma().$transaction(async (transaction) => {
      const followUp = await transaction.followUp.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
      await writeAudit(transaction, {
        actorId: context.userId,
        action: "follow_up.archive",
        entityType: "FollowUp",
        entityId: id,
        metadata: followUpRelationMetadata(existing),
      });
      return followUp;
    });
  }

  private async resolveRelatedOwners(input: FollowUpData) {
    const prisma = getPrisma();
    const owners: string[] = [];
    if (input.customerId) {
      const row = await prisma.customer.findFirst({ where: { id: input.customerId, deletedAt: null }, select: { ownerId: true } });
      if (row) owners.push(row.ownerId);
    }
    if (input.contactId) {
      const row = await prisma.contact.findFirst({ where: { id: input.contactId, deletedAt: null }, select: { customer: { select: { ownerId: true } } } });
      if (row) owners.push(row.customer.ownerId);
    }
    if (input.leadId) {
      const row = await prisma.lead.findFirst({ where: { id: input.leadId, deletedAt: null }, select: { ownerId: true } });
      if (row) owners.push(row.ownerId);
    }
    if (input.opportunityId) {
      const row = await prisma.opportunity.findFirst({ where: { id: input.opportunityId, deletedAt: null }, select: { ownerId: true } });
      if (row) owners.push(row.ownerId);
    }
    return owners;
  }

  async listOpportunities(
    context: AuthorizationContext,
    filters: OpportunityFilters = {},
  ) {
    const { page, pageSize } = pagination(filters.page, filters.pageSize);
    const where: Prisma.OpportunityWhereInput = {
      deletedAt: null,
      ...ownershipWhere(context, filters.ownerId),
      ...(filters.customerId ? { customerId: filters.customerId } : {}),
      ...(filters.stage
        ? { stage: filters.stage as Prisma.EnumOpportunityStageFilter["equals"] }
        : {}),
      ...(filters.query
        ? { name: { contains: filters.query, mode: "insensitive" } }
        : {}),
    };
    const prisma = getPrisma();
    const [total, items] = await prisma.$transaction([
      prisma.opportunity.count({ where }),
      prisma.opportunity.findMany({
        where,
        orderBy: [{ stage: "asc" }, { expectedCloseAt: "asc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          owner: { select: { id: true, name: true } },
          customer: { select: { id: true, companyName: true } },
        },
      }),
    ]);
    return { items, total, page, pageSize, pageCount: Math.ceil(total / pageSize) };
  }

  async createOpportunity(
    context: AuthorizationContext,
    input: CreateOpportunityData,
  ) {
    const customer = await getPrisma().customer.findFirst({
      where: { id: input.customerId, deletedAt: null, ...ownershipWhere(context) },
      select: { ownerId: true },
    });
    if (!customer) throw new DomainError("CUSTOMER_NOT_FOUND", "Customer not found", 404);
    const ownerId = resolveOpportunityOwner(customer.ownerId, input.ownerId);
    const valueUsd = new Decimal(input.value).times(input.exchangeRateToUsd).toFixed(4);
    return getPrisma().$transaction(async (transaction) => {
      const opportunity = await transaction.opportunity.create({
        data: { ...input, ownerId, valueUsd },
      });
      await writeAudit(transaction, {
        actorId: context.userId,
        action: "opportunity.create",
        entityType: "Opportunity",
        entityId: opportunity.id,
        after: { id: opportunity.id, stage: opportunity.stage, ownerId: opportunity.ownerId },
      });
      return opportunity;
    });
  }

  async findOpportunity(
    context: AuthorizationContext,
    id: string,
  ): Promise<OpportunityForStage | null> {
    return getPrisma().opportunity.findFirst({
      where: { id, deletedAt: null, ...ownershipWhere(context) },
      select: { id: true, ownerId: true, stage: true, version: true },
    });
  }

  async updateOpportunityStage(
    context: AuthorizationContext,
    opportunity: OpportunityForStage,
    input: {
      stage: OpportunityForStage["stage"];
      lossReason?: string | null;
    },
  ) {
    return getPrisma().$transaction(async (transaction) => {
      const guard = opportunityStageGuard(opportunity);
      const result = await transaction.opportunity.updateMany({
        where: { ...guard, ...ownershipWhere(context) },
        data: {
          stage: input.stage,
          lostReason: input.stage === "LOST" ? input.lossReason : null,
          lostAt: input.stage === "LOST" ? new Date() : null,
          wonAt: input.stage === "WON" ? new Date() : null,
          probability:
            input.stage === "WON"
              ? 100
              : input.stage === "LOST"
                ? 0
                : undefined,
          version: { increment: 1 },
        },
      });
      if (result.count !== 1) {
        throw new DomainError(
          "OPPORTUNITY_STAGE_CONFLICT",
          "Opportunity stage changed; refresh and retry",
          409,
        );
      }
      const updated = await transaction.opportunity.findUniqueOrThrow({
        where: { id: opportunity.id },
        select: { id: true, stage: true, lostReason: true },
      });
      await writeAudit(transaction, {
        actorId: context.userId,
        action: "opportunity.stage_change",
        entityType: "Opportunity",
        entityId: opportunity.id,
        before: { stage: opportunity.stage },
        after: { stage: updated.stage, lossReason: updated.lostReason },
      });
      return {
        id: updated.id,
        stage: updated.stage,
        lossReason: updated.lostReason,
      };
    });
  }
}
