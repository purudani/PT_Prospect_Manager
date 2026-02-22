import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const EXCEL_FILE = path.join(__dirname, '../Data.xlsx');
const PROSPECTS_FILE = path.join(__dirname, '../prospects.json');
const FRONTEND_PROSPECTS_FILE = path.join(__dirname, '../frontend/public/prospects.json');

function excelDateToJSDate(serial) {
    if (!serial || typeof serial !== 'number') return null;
    const utc_days = Math.floor(serial - 25569);
    const utc_value = utc_days * 86400;
    const date_info = new Date(utc_value * 1000);
    return new Date(date_info.getFullYear(), date_info.getMonth(), date_info.getDate());
}

function formatDate(date) {
    if (!date) return null;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

function yearsSince(date) {
    if (!date) return null;
    const now = new Date();
    const diffMs = now - date;
    const years = diffMs / (1000 * 60 * 60 * 24 * 365.25);
    return Math.floor(years * 10) / 10;
}

function toTitleCase(str) {
    if (!str || typeof str !== 'string') return '';
    return str.toLowerCase().trim().replace(/\b\w/g, char => char.toUpperCase());
}

function normalizeCity(city) {
    if (!city || typeof city !== 'string') return '';
    let normalized = toTitleCase(city.trim());
    normalized = normalized
        .replace(/\bSt\b/g, 'St.')
        .replace(/\bMt\b/g, 'Mt.')
        .replace(/\bFt\b/g, 'Ft.');
    return normalized;
}

function toBlockedBoolean(value) {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value === 1;
    if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        return normalized === 'yes' || normalized === 'true' || normalized === '1' || normalized === 'blocked';
    }
    return false;
}

function toClickedBoolean(value) {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value === 1;
    if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        return normalized === 'yes' || normalized === 'true' || normalized === '1' || normalized === 'clicked';
    }
    return false;
}

function normalizeLicenseNumber(value) {
    if (value === null || value === undefined) return '';
    return String(value).trim();
}

function readFromExcel() {
    const workbook = XLSX.readFile(EXCEL_FILE);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json(sheet);

    return rawData.map((row, index) => {
        const issueDate = excelDateToJSDate(row.issue_date);
        const expirationDate = excelDateToJSDate(row.expiration_date);

        return {
            id: index + 1,
            fullName: toTitleCase(row.full_name || ''),
            firstName: toTitleCase(row.first_name || ''),
            middleName: row.middle_name || '',
            lastName: toTitleCase(row.last_name || ''),
            nameSuffix: row.name_suffix || '',
            professionName: row.profession_name || '',
            licenseType: row.license_type_name || '',
            licenseNo: normalizeLicenseNumber(row.license_no),
            licenseNumber: normalizeLicenseNumber(row.license_no),
            licenseStatus: row.license_status_name || '',
            issueDateRaw: row.issue_date ?? null,
            issueDate: formatDate(issueDate),
            issueDateObj: issueDate ? issueDate.toISOString() : null,
            expirationDateRaw: row.expiration_date ?? null,
            expirationDate: formatDate(expirationDate),
            expirationDateObj: expirationDate ? expirationDate.toISOString() : null,
            yearsSinceLicense: yearsSince(issueDate),
            addressLine1: toTitleCase(row.addr_line_1 || ''),
            addressLine2: toTitleCase(row.addr_line_2 || ''),
            city: normalizeCity(row.addr_city || ''),
            state: (row.addr_state || '').toUpperCase().trim(),
            zipCode: row.addr_zipcode ? String(row.addr_zipcode) : '',
            county: toTitleCase(row.addr_county || ''),
            email: (row.addr_email || '').toLowerCase().trim(),
            email_sent: row.email_sent || null,
            blocked: toBlockedBoolean(row.blocked),
            clicked: toClickedBoolean(row.clicked)
        };
    });
}

/**
 * Convert JavaScript Date to Excel serial date
 */
function dateToExcelSerial(date) {
    if (!date) return null;
    const d = new Date(date);
    const epoch = new Date(1899, 11, 30);
    const ms_per_day = 24 * 60 * 60 * 1000;
    return Math.floor((d - epoch) / ms_per_day);
}

/**
 * Convert formatted date string back to Excel serial
 */
function formatDateToExcelSerial(dateStr) {
    if (!dateStr) return null;
    try {
        // Parse "Jan 15, 2023" format
        const date = new Date(dateStr);
        return dateToExcelSerial(date);
    } catch {
        return null;
    }
}

/**
 * Read prospects from Excel (source of truth), then sync JSON copies
 */
export function readProspects() {
    try {
        const prospects = readFromExcel();
        fs.writeFileSync(PROSPECTS_FILE, JSON.stringify(prospects, null, 2));
        fs.writeFileSync(FRONTEND_PROSPECTS_FILE, JSON.stringify(prospects, null, 2));
        return prospects;
    } catch (error) {
        console.error('Error reading from Excel, falling back to JSON:', error);
        try {
            const data = fs.readFileSync(PROSPECTS_FILE, 'utf8');
            return JSON.parse(data);
        } catch (fallbackError) {
            console.error('Error reading prospects fallback file:', fallbackError);
            return [];
        }
    }
}

/**
 * Write prospects to both JSON files AND Excel file
 */
export function writeProspects(prospects) {
    try {
        // Write to JSON files
        fs.writeFileSync(PROSPECTS_FILE, JSON.stringify(prospects, null, 2));
        fs.writeFileSync(FRONTEND_PROSPECTS_FILE, JSON.stringify(prospects, null, 2));
        
        // Write back to Excel
        writeToExcel(prospects);
        
        return true;
    } catch (error) {
        console.error('Error writing prospects:', error);
        return false;
    }
}

/**
 * Write prospects data back to Excel file
 */
function writeToExcel(prospects) {
    try {
        // Transform prospects back to Excel format
        const excelData = prospects.map(prospect => ({
            // Personal info
            full_name: prospect.fullName || '',
            first_name: prospect.firstName || '',
            middle_name: prospect.middleName || '',
            last_name: prospect.lastName || '',
            name_suffix: prospect.nameSuffix || '',
            
            // License info
            license_no: prospect.licenseNo || prospect.licenseNumber || '',
            license_type_name: prospect.licenseType || '',
            license_status_name: prospect.licenseStatus || '',
            profession_name: prospect.professionName || '',
            
            // Dates - convert back to Excel serial dates
            issue_date: formatDateToExcelSerial(prospect.issueDate),
            expiration_date: formatDateToExcelSerial(prospect.expirationDate),
            
            // Address
            addr_line_1: prospect.addressLine1 || '',
            addr_line_2: prospect.addressLine2 || '',
            addr_city: prospect.city || '',
            addr_state: prospect.state || '',
            addr_zipcode: prospect.zipCode || '',
            addr_county: prospect.county || '',
            addr_email: prospect.email || '',
            
            // NEW COLUMNS - Tracking fields
            email_sent: prospect.email_sent || '',
            blocked: prospect.blocked ? 'Yes' : 'No',
            clicked: prospect.clicked ? 'Yes' : 'No'
        }));
        
        // Create worksheet from data
        const worksheet = XLSX.utils.json_to_sheet(excelData);
        
        // Create workbook
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
        
        // Write to Excel file
        XLSX.writeFile(workbook, EXCEL_FILE);
        
        console.log(`✓ Synced ${prospects.length} records back to Data.xlsx`);
        return true;
    } catch (error) {
        console.error('Error writing to Excel:', error);
        return false;
    }
}
