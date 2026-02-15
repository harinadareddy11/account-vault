// src/utils/exportService.ts - Export with Print API (No native linking needed)
import { getDatabase } from './database';
import * as masterPasswordService from './masterPasswordService';
import { Alert, Share, Platform } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import RNFS from 'react-native-fs';

export interface ExportData {
  exportDate: string;
  exportTime: string;
  accountCount: number;
  projectCount: number;
  serviceCount: number;
  accounts: any[];
  projects: any[];
  services: any[];
}

// Generate comprehensive export data (encrypted)
export const generateExportData = (): ExportData | null => {
  try {
    const db = getDatabase();
    
    const accounts = db.getAllSync('SELECT * FROM accounts ORDER BY createdAt DESC');
    const projects = db.getAllSync('SELECT * FROM projects ORDER BY createdAt DESC');
    const services = db.getAllSync('SELECT * FROM project_services ORDER BY createdAt DESC');

    const now = new Date();
    const exportData: ExportData = {
      exportDate: now.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      exportTime: now.toLocaleTimeString('en-US'),
      accountCount: accounts.length,
      projectCount: projects.length,
      serviceCount: services.length,
      accounts,
      projects,
      services,
    };

    return exportData;
  } catch (error) {
    console.error('❌ Error generating export data:', error);
    return null;
  }
};

// 🔓 Decrypt services for PDF export
export const decryptServicesForExport = async (
  services: any[], 
  masterPassword: string
): Promise<any[]> => {
  try {
    const decryptedServices = await Promise.all(
      services.map(async (service) => {
        if (service.password) {
          try {
            const decryptedPassword = await masterPasswordService.decryptWithMasterPassword(
              service.password, 
              masterPassword
            );
            return { ...service, password: decryptedPassword };
          } catch (err) {
            console.error('Failed to decrypt service:', service.serviceName);
            return service;
          }
        }
        return service;
      })
    );
    return decryptedServices;
  } catch (error) {
    console.error('❌ Decryption failed:', error);
    return services;
  }
};

// ✅ Export as JSON (UNCHANGED - WORKS)
export const exportAsJSON = async (userId: string): Promise<boolean> => {
  try {
    const exportData = generateExportData();
    if (!exportData) {
      Alert.alert('Error', 'Failed to prepare export data');
      return false;
    }

    const jsonString = JSON.stringify(exportData, null, 2);
    
    await Share.share({
      message: `AccountVault Backup\n\n${jsonString}`,
      title: 'AccountVault JSON Backup',
    });

    console.log('✅ JSON export successful');
    return true;
  } catch (error) {
    console.error('❌ Error exporting as JSON:', error);
    Alert.alert('Error', 'Failed to export as JSON');
    return false;
  }
};

// ✅ NEW: PDF using Expo Print API (No native linking needed!)
export const exportAsPDF = async (userId: string): Promise<boolean> => {
  try {
    const exportData = generateExportData();
    if (!exportData) {
      Alert.alert('Error', 'Failed to prepare export data');
      return false;
    }

    // Generate HTML content
    const htmlContent = generatePDFHTML(exportData);
    
    // Print to PDF using Expo Print
    const { uri } = await Print.printToFileAsync({
      html: htmlContent,
      base64: false,
    });

    console.log('✅ PDF created at:', uri);

    // Share the PDF
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'AccountVault Backup Report',
        UTI: 'com.adobe.pdf',
      });
    } else {
      Alert.alert('Success', `PDF saved at: ${uri}`);
    }

    console.log('✅ PDF export successful');
    return true;
  } catch (error) {
    console.error('❌ Error exporting as PDF:', error);
    Alert.alert('Error', 'Failed to generate PDF. JSON export still works.');
    return false;
  }
};

// 🔐 PDF with FULL DECRYPTION (passwords visible)
export const exportRealPDFWithPassword = async (
  userId: string, 
  masterPassword: string
): Promise<boolean> => {
  try {
    const exportData = generateExportData();
    if (!exportData) {
      Alert.alert('Error', 'Failed to prepare export data');
      return false;
    }

    // DECRYPT services for PDF
    const decryptedServices = await decryptServicesForExport(
      exportData.services, 
      masterPassword
    );
    const exportDataWithPasswords: any = { 
      ...exportData, 
      services: decryptedServices 
    };

    const htmlContent = generatePDFHTML(exportDataWithPasswords, true);
    
    // Print to PDF with passwords
    const { uri } = await Print.printToFileAsync({
      html: htmlContent,
      base64: false,
    });

    // Share the PDF
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'AccountVault FULL Backup (with Passwords)',
        UTI: 'com.adobe.pdf',
      });
    } else {
      Alert.alert('Success', `PDF saved at: ${uri}`);
    }

    console.log('✅ FULL PDF export successful');
    return true;
  } catch (error) {
    console.error('❌ Full PDF export failed:', error);
    Alert.alert('Error', 'PDF generation failed. Wrong master password?');
    return false;
  }
};

// ✅ Generate professional HTML for PDF
const generatePDFHTML = (exportData: any, showPasswords: boolean = false): string => {
  let html = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AccountVault Backup Report</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { 
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        margin: 40px; 
        color: #333; 
        line-height: 1.6; 
        background: white;
      }
      .header { 
        text-align: center; 
        border-bottom: 3px solid #2196f3; 
        padding-bottom: 20px; 
        margin-bottom: 30px; 
      }
      .header h1 { 
        color: #2196f3; 
        margin: 0 0 10px 0; 
        font-size: 28px; 
      }
      .header p {
        color: #666;
        font-size: 14px;
      }
      .info-grid { 
        display: grid; 
        grid-template-columns: repeat(3, 1fr);
        gap: 20px; 
        margin: 30px 0; 
      }
      .info-card { 
        background: #f8f9fa; 
        padding: 20px; 
        border-radius: 8px; 
        border-left: 4px solid #2196f3;
        text-align: center;
      }
      .info-card h3 {
        font-size: 14px;
        color: #666;
        margin-bottom: 8px;
      }
      .info-card h2 {
        font-size: 32px;
        color: #2196f3;
      }
      .section { 
        margin: 40px 0; 
        page-break-inside: avoid; 
      }
      .section h2 { 
        color: #2196f3; 
        border-bottom: 2px solid #2196f3; 
        padding-bottom: 10px; 
        margin-bottom: 20px;
        font-size: 22px;
      }
      .item { 
        margin-bottom: 15px; 
        padding: 15px; 
        background: #f8f9fa; 
        border-radius: 6px; 
        border-left: 3px solid #2196f3;
        page-break-inside: avoid;
      }
      .item h4 {
        color: #333;
        margin-bottom: 10px;
        font-size: 16px;
      }
      .item p {
        margin: 5px 0;
        font-size: 14px;
        color: #555;
      }
      .item strong {
        color: #333;
      }
      .password { 
        font-family: 'Courier New', monospace; 
        background: #fff3cd; 
        padding: 4px 8px; 
        border-radius: 4px; 
        font-weight: bold;
        color: #856404;
        display: inline-block;
      }
      .warning { 
        background: #fff3cd; 
        border: 2px solid #ffc107;
        border-left: 4px solid #ff9800;
        padding: 20px; 
        border-radius: 8px; 
        margin: 30px 0;
        page-break-inside: avoid;
      }
      .warning h3 {
        color: #ff9800;
        margin-bottom: 10px;
      }
      .warning p {
        color: #856404;
        margin: 5px 0;
      }
      @media print { 
        body { margin: 20px; }
        .item { page-break-inside: avoid; }
      }
    </style>
  </head>
  <body>
    <div class="header">
      <h1>📋 AccountVault Backup Report</h1>
      <p><strong>Generated:</strong> ${exportData.exportDate} at ${exportData.exportTime}</p>
    </div>

    <div class="info-grid">
      <div class="info-card">
        <h3>Total Accounts</h3>
        <h2>${exportData.accountCount}</h2>
      </div>
      <div class="info-card">
        <h3>Total Projects</h3>
        <h2>${exportData.projectCount}</h2>
      </div>
      <div class="info-card">
        <h3>API Keys/Services</h3>
        <h2>${exportData.serviceCount}</h2>
      </div>
    </div>

  `;

  // Accounts Section
  if (exportData.accounts?.length > 0) {
    html += `
    <div class="section">
      <h2>📝 Accounts (${exportData.accountCount})</h2>
    `;
    exportData.accounts.forEach((account: any, idx: number) => {
      const date = new Date(account.createdAt).toLocaleDateString();
      html += `
        <div class="item">
          <h4>${idx + 1}. ${account.serviceName || 'Unnamed Service'}</h4>
          <p><strong>Email:</strong> ${account.email || 'N/A'}</p>
          <p><strong>Category:</strong> ${account.category || 'General'}</p>
          <p><strong>Added:</strong> ${date}</p>
          ${account.notes ? `<p><strong>Notes:</strong> ${account.notes}</p>` : ''}
        </div>
      `;
    });
    html += '</div>';
  }

  // Projects Section
  if (exportData.projects?.length > 0) {
    html += `
    <div class="section">
      <h2>🗂️ Projects (${exportData.projectCount})</h2>
    `;
    exportData.projects.forEach((project: any, idx: number) => {
      const date = new Date(project.createdAt).toLocaleDateString();
      html += `
        <div class="item">
          <h4>${idx + 1}. ${project.name || 'Unnamed Project'}</h4>
          <p><strong>Created:</strong> ${date}</p>
        </div>
      `;
    });
    html += '</div>';
  }

  // Services Section (with optional passwords)
  if (exportData.services?.length > 0) {
    html += `
    <div class="section">
      <h2>🔑 API Keys & Services (${exportData.serviceCount})</h2>
    `;
    exportData.services.forEach((service: any, idx: number) => {
      const date = new Date(service.createdAt).toLocaleDateString();
      html += `
        <div class="item">
          <h4>${idx + 1}. ${service.serviceName || 'Unnamed Service'}</h4>
          <p><strong>Email:</strong> ${service.email || 'N/A'}</p>
          ${service.password && showPasswords ? `
            <p><strong>Password:</strong> <span class="password">${service.password}</span></p>
          ` : ''}
          <p><strong>Created:</strong> ${date}</p>
          ${service.expiryDate ? `<p><strong>Expires:</strong> ${service.expiryDate}</p>` : ''}
          ${service.notes ? `<p><strong>Notes:</strong> ${service.notes}</p>` : ''}
        </div>
      `;
    });
    html += '</div>';
  }

  html += `
    <div class="warning">
      <h3>⚠️ SECURITY NOTICE</h3>
      <p><strong>This document contains sensitive credential information.</strong></p>
      <p>Store securely and <strong>never share</strong> with unauthorized persons.</p>
      <p><em>Encryption: AES-256 | Generated by AccountVault v1.0.0</em></p>
    </div>
  `;

  html += `
  </body>
  </html>
  `;

  return html;
};

export const getExportStats = () => {
  const exportData = generateExportData();
  return exportData ? {
    accounts: exportData.accountCount,
    projects: exportData.projectCount,
    services: exportData.serviceCount,
    date: exportData.exportDate,
    time: exportData.exportTime,
  } : null;
};

export default {
  generateExportData,
  exportAsJSON,
  exportAsPDF,
  exportRealPDFWithPassword,
  getExportStats,
};