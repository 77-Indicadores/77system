import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type RegistryField = {
  name: string;
  label?: string;
  type: "string" | "decimal" | "integer" | "boolean" | "date";
  required?: boolean;
  default?: string | number | boolean;
};

export type RegistrySchema = {
  fields: RegistryField[];
};

export type RegistryValidationError = {
  field: string;
  message: string;
};

export function parseRegistrySchema(schemaJson: Prisma.JsonValue): RegistrySchema {
  const schema = schemaJson as Partial<RegistrySchema>;
  return {
    fields: Array.isArray(schema.fields) ? schema.fields : [],
  };
}

export function validateRegistryData(
  data: Record<string, unknown>,
  schema: RegistrySchema
): RegistryValidationError[] {
  const errors: RegistryValidationError[] = [];

  for (const field of schema.fields) {
    const value = data[field.name];
    const missing = value === undefined || value === null || value === "";

    if (field.required && missing) {
      errors.push({ field: field.name, message: `Campo obrigatório: ${field.label ?? field.name}` });
      continue;
    }

    if (missing) continue;

    if (field.type === "decimal" || field.type === "integer") {
      const n = Number(value);
      if (isNaN(n)) {
        errors.push({ field: field.name, message: `${field.label ?? field.name} deve ser numérico` });
      } else if (field.type === "integer" && !Number.isInteger(n)) {
        errors.push({ field: field.name, message: `${field.label ?? field.name} deve ser inteiro` });
      }
    } else if (field.type === "boolean") {
      if (typeof value !== "boolean" && value !== "true" && value !== "false") {
        errors.push({ field: field.name, message: `${field.label ?? field.name} deve ser verdadeiro ou falso` });
      }
    } else if (field.type === "date") {
      if (isNaN(Date.parse(String(value)))) {
        errors.push({ field: field.name, message: `${field.label ?? field.name} deve ser uma data válida` });
      }
    }
  }

  const knownFields = new Set(schema.fields.map((f) => f.name));
  for (const key of Object.keys(data)) {
    if (!knownFields.has(key)) {
      errors.push({ field: key, message: `Campo desconhecido: ${key}` });
    }
  }

  return errors;
}

export async function listRegistries() {
  return prisma.registryDefinition.findMany({
    orderBy: { name: "asc" },
    include: { records: { orderBy: { createdAt: "desc" }, take: 20 } },
  });
}

export async function getRegistry(registryKey: string) {
  return prisma.registryDefinition.findUnique({
    where: { key: registryKey },
    include: { records: { orderBy: { createdAt: "desc" }, take: 50 } },
  });
}

export async function createRegistryRecord(registryKey: string, data: Prisma.InputJsonObject) {
  const registry = await prisma.registryDefinition.findUniqueOrThrow({ where: { key: registryKey } });
  const schema = parseRegistrySchema(registry.schemaJson);
  const errors = validateRegistryData(data as Record<string, unknown>, schema);

  if (errors.length > 0) {
    throw Object.assign(new Error("Dados inválidos para o cadastro."), { validationErrors: errors });
  }

  return prisma.registryRecord.create({
    data: {
      registryId: registry.id,
      dataJson: data,
    },
  });
}
