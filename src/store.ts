import { v4 as uuidv4 } from "uuid";
import { Company, Project, Language } from "./types";

const companies = new Map<string, Company>();
const projects = new Map<string, Project>();

export function createCompany(name: string): Company {
  const company: Company = { id: uuidv4(), name, createdAt: Date.now() };
  companies.set(company.id, company);
  return company;
}

export function getCompany(id: string): Company | undefined {
  return companies.get(id);
}

export function listCompanies(): Company[] {
  return Array.from(companies.values());
}

export function createProject(
  companyId: string,
  name: string,
  opts: {
    id?: string;
    description?: string;
    demographicsEnabled?: boolean;
    allowedLanguages?: Language[];
  } = {}
): Project {
  const project: Project = {
    id: opts.id ?? uuidv4(),
    companyId,
    name,
    demographicsEnabled: opts.demographicsEnabled ?? false,
    allowedLanguages: opts.allowedLanguages ?? ["ru", "en", "tr"],
    createdAt: Date.now(),
    ...(opts.description !== undefined && { description: opts.description }),
  };
  projects.set(project.id, project);
  return project;
}

export function getProject(id: string): Project | undefined {
  return projects.get(id);
}

export function listProjectsByCompany(companyId: string): Project[] {
  return Array.from(projects.values()).filter((p) => p.companyId === companyId);
}
