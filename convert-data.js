const XLSX = require('xlsx');
const fs = require('fs');

console.log('Converting Data.xlsx to prospects.json...');

try {
    // Read the Excel file
    const workbook = XLSX.readFile('Data.xlsx');
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json(sheet);
    
    console.log(`Found ${rawData.length} records`);
    
    // Function to convert Excel serial date to JavaScript Date
    function excelDateToJSDate(serial) {
        if (!serial || typeof serial !== 'number') return null;
        const utc_days = Math.floor(serial - 25569);
        const utc_value = utc_days * 86400;
        const date_info = new Date(utc_value * 1000);
        return new Date(date_info.getFullYear(), date_info.getMonth(), date_info.getDate());
    }
    
    // Function to format date as readable string
    function formatDate(date) {
        if (!date) return null;
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
    }
    
    // Function to calculate years since date
    function yearsSince(date) {
        if (!date) return null;
        const now = new Date();
        const diffMs = now - date;
        const years = diffMs / (1000 * 60 * 60 * 24 * 365.25);
        return Math.floor(years * 10) / 10; // Round to 1 decimal place
    }
    
    // Function to convert text to Title Case (proper capitalization)
    function toTitleCase(str) {
        if (!str || typeof str !== 'string') return '';
        return str.toLowerCase().trim().replace(/\b\w/g, char => char.toUpperCase());
    }
    
    // Function to normalize city names (handle special cases)
    function normalizeCity(city) {
        if (!city || typeof city !== 'string') return '';
        let normalized = toTitleCase(city.trim());
        
        // Handle special cases like "St.", "Mt.", etc.
        normalized = normalized
            .replace(/\bSt\b/g, 'St.')
            .replace(/\bMt\b/g, 'Mt.')
            .replace(/\bFt\b/g, 'Ft.');
        
        return normalized;
    }
    
    // Transform the data
    const prospects = rawData.map((row, index) => {
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
            licenseNo: row.license_no || '',
            licenseStatus: row.license_status_name || '',
            
            // Dates - both raw and formatted
            issueDateRaw: row.issue_date,
            issueDate: formatDate(issueDate),
            issueDateObj: issueDate ? issueDate.toISOString() : null,
            expirationDateRaw: row.expiration_date,
            expirationDate: formatDate(expirationDate),
            expirationDateObj: expirationDate ? expirationDate.toISOString() : null,
            yearsSinceLicense: yearsSince(issueDate),
            
            // Address - normalized for consistency
            addressLine1: toTitleCase(row.addr_line_1 || ''),
            addressLine2: toTitleCase(row.addr_line_2 || ''),
            city: normalizeCity(row.addr_city || ''),
            state: (row.addr_state || '').toUpperCase().trim(),
            zipCode: row.addr_zipcode ? String(row.addr_zipcode) : '',
            county: toTitleCase(row.addr_county || ''),
            
            // Contact
            email: (row.addr_email || '').toLowerCase().trim()
        };
    });
    
    // Write to JSON file
    fs.writeFileSync('prospects.json', JSON.stringify(prospects, null, 2));
    
    console.log(`✓ Successfully converted ${prospects.length} records to prospects.json`);
    
    // Show some statistics
    const withEmail = prospects.filter(p => p.email).length;
    const uniqueStates = [...new Set(prospects.map(p => p.state))].filter(Boolean).length;
    const uniqueCities = [...new Set(prospects.map(p => p.city))].filter(Boolean).length;
    
    console.log(`\nStatistics:`);
    console.log(`- Records with email: ${withEmail} (${Math.round(withEmail/prospects.length*100)}%)`);
    console.log(`- Unique states: ${uniqueStates}`);
    console.log(`- Unique cities: ${uniqueCities}`);
    console.log(`- Date range: ${Math.min(...prospects.filter(p => p.yearsSinceLicense).map(p => p.yearsSinceLicense))} to ${Math.max(...prospects.filter(p => p.yearsSinceLicense).map(p => p.yearsSinceLicense))} years`);
    
} catch (error) {
    console.error('Error:', error);
    process.exit(1);
}
