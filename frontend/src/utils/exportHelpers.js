import * as XLSX from 'xlsx';

/**
 * Export prospects data to Excel file
 * @param {Array} prospects - Array of prospect objects to export
 * @param {string} filename - Name for the exported file (without extension)
 */
export function exportToExcel(prospects, filename = 'prospects_export') {
  if (!prospects || prospects.length === 0) {
    alert('No data to export');
    return;
  }

  // Transform data for export (flatten and select relevant fields)
  const exportData = prospects.map(prospect => ({
    'Full Name': prospect.fullName,
    'First Name': prospect.firstName,
    'Middle Name': prospect.middleName,
    'Last Name': prospect.lastName,
    'Email': prospect.email || '',
    'Address Line 1': prospect.addressLine1,
    'Address Line 2': prospect.addressLine2 || '',
    'City': prospect.city,
    'State': prospect.state,
    'Zip Code': prospect.zipCode,
    'County': prospect.county,
    'License Number': prospect.licenseNo,
    'License Type': prospect.licenseType,
    'License Status': prospect.licenseStatus,
    'Issue Date': prospect.issueDate || '',
    'Expiration Date': prospect.expirationDate || '',
    'Years Since License': prospect.yearsSinceLicense !== null ? prospect.yearsSinceLicense : '',
    'Profession': prospect.professionName,
    'Email Sent': prospect.email_sent ? new Date(prospect.email_sent).toLocaleString() : 'Not Sent',
    'Blocked': prospect.blocked ? 'Yes' : 'No',
    'Clicked': prospect.clicked ? 'Yes' : 'No'
  }));

  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(exportData);

  // Set column widths for better readability
  const columnWidths = [
    { wch: 25 }, // Full Name
    { wch: 15 }, // First Name
    { wch: 15 }, // Middle Name
    { wch: 15 }, // Last Name
    { wch: 30 }, // Email
    { wch: 30 }, // Address Line 1
    { wch: 20 }, // Address Line 2
    { wch: 20 }, // City
    { wch: 8 },  // State
    { wch: 12 }, // Zip Code
    { wch: 15 }, // County
    { wch: 18 }, // License Number
    { wch: 25 }, // License Type
    { wch: 15 }, // License Status
    { wch: 15 }, // Issue Date
    { wch: 15 }, // Expiration Date
    { wch: 18 }, // Years Since License
    { wch: 20 }, // Profession
    { wch: 22 }, // Email Sent
    { wch: 10 }, // Blocked
    { wch: 10 }  // Clicked
  ];
  worksheet['!cols'] = columnWidths;

  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Prospects');

  // Generate filename with timestamp
  const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const finalFilename = `${filename}_${timestamp}.xlsx`;

  // Write file
  XLSX.writeFile(workbook, finalFilename);

  return finalFilename;
}

/**
 * Export selected prospects only
 * @param {Array} allProspects - All prospects
 * @param {Set} selectedIds - Set of selected prospect IDs
 * @param {string} filename - Name for the exported file
 */
export function exportSelectedToExcel(allProspects, selectedIds, filename = 'selected_prospects') {
  const selectedProspects = allProspects.filter(p => selectedIds.has(p.id));
  return exportToExcel(selectedProspects, filename);
}
