import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const EXCEL_FILE = path.join(__dirname, '../Data.xlsx');
const PROSPECTS_FILE = path.join(__dirname, '../prospects.json');
const FRONTEND_PROSPECTS_FILE = path.join(__dirname, '../frontend/public/prospects.json');

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
 * Read prospects from JSON
 */
export function readProspects() {
    try {
        const data = fs.readFileSync(PROSPECTS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading prospects file:', error);
        return [];
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
            blocked: prospect.blocked ? 'Yes' : 'No'
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
