// src/utils/projectStorage.ts
import { getDatabase } from './database';
import { encryptData, decryptData } from './encryption';

/* =========================
   PROJECTS (LOCAL SOURCE OF TRUTH)
========================= */

export const createProject = async (userId: string, name: string): Promise<string> => {
  const db = getDatabase();
  const id = `proj_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const now = Date.now();

  db.execSync(`
    INSERT INTO projects (id, userId, name, createdAt, updatedAt)
    VALUES ('${id}', '${userId}', '${name.replace(/'/g, "''")}', ${now}, ${now})
  `);

  return id;
};

export const getProjects = async (userId: string): Promise<any[]> => {
  const db = getDatabase();
  return db.getAllSync(`
    SELECT * FROM projects 
    WHERE userId='${userId}'
    ORDER BY updatedAt DESC
  `) || [];
};

export const getProjectById = async (projectId: string, userId: string) => {
  const db = getDatabase();
  const rows = db.getAllSync(`
    SELECT * FROM projects 
    WHERE id='${projectId}' AND userId='${userId}'
  `);
  return rows?.[0] || null;
};

/* =========================
   PROJECT SERVICES
========================= */

export const addProjectService = async (
  userId: string,
  projectId: string,
  serviceData: any,
  masterPassword: string
): Promise<string> => {
  const db = getDatabase();
  const id = `ps_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const now = Date.now();

  const encryptedPassword = serviceData.password
    ? encryptData(serviceData.password, masterPassword)
    : null;

  const encryptedApiKey = serviceData.apiKey
    ? encryptData(serviceData.apiKey, masterPassword)
    : null;

  db.execSync(`
    INSERT INTO project_services
    (id, userId, projectId, serviceName, email, password, apiKey, expiryDate, notes, createdAt)
    VALUES (
      '${id}',
      '${userId}',
      '${projectId}',
      '${serviceData.serviceName.replace(/'/g, "''")}',
      '${(serviceData.email || '').replace(/'/g, "''")}',
      ${encryptedPassword ? `'${encryptedPassword}'` : 'NULL'},
      ${encryptedApiKey ? `'${encryptedApiKey}'` : 'NULL'},
      '${(serviceData.expiryDate || '').replace(/'/g, "''")}',
      '${(serviceData.notes || '').replace(/'/g, "''")}',
      ${now}
    )
  `);

  return id;
};

export const getProjectServices = async (
  userId: string,
  projectId: string,
  masterPassword: string
): Promise<any[]> => {
  const db = getDatabase();

  const rows = db.getAllSync(`
    SELECT * FROM project_services
    WHERE userId='${userId}' AND projectId='${projectId}'
    ORDER BY createdAt DESC
  `) || [];

  return rows.map((s: any) => {
    let decryptedPassword = '';
    let decryptedApiKey = '';

    if (s.password) {
      try { decryptedPassword = decryptData(s.password, masterPassword); } catch {}
    }
    if (s.apiKey) {
      try { decryptedApiKey = decryptData(s.apiKey, masterPassword); } catch {}
    }

    return {
      ...s,
      decryptedPassword,
      decryptedApiKey,
    };
  });
};

export const deleteProjectService = async (serviceId: string, userId: string) => {
  const db = getDatabase();
  db.execSync(`
    DELETE FROM project_services 
    WHERE id='${serviceId}' AND userId='${userId}'
  `);
  return true;
};

export const deleteProject = async (projectId: string, userId: string) => {
  const db = getDatabase();
  db.execSync(`DELETE FROM project_services WHERE projectId='${projectId}' AND userId='${userId}'`);
  db.execSync(`DELETE FROM projects WHERE id='${projectId}' AND userId='${userId}'`);
  return true;
};
