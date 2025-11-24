import Papa from 'papaparse';
import * as XLSX from 'xlsx';
export class FileProcessor {
    static async processCSV(fileBuffer) {
        return new Promise((resolve, reject) => {
            const csvString = fileBuffer.toString('utf-8');
            Papa.parse(csvString, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    try {
                        const recipients = results.data.map((row) => {
                            const name = row.name || row.Name || row.NAME || '';
                            const email = row.email || row.Email || row.EMAIL || '';
                            if (!email || !this.validateEmail(email)) {
                                throw new Error(`Invalid email: ${email}`);
                            }
                            return {
                                name: name.trim(),
                                email: email.trim()
                            };
                        }).filter(recipient => recipient.email !== '');
                        resolve(recipients);
                    }
                    catch (error) {
                        reject(error);
                    }
                },
                error: (error) => {
                    reject(new Error(`CSV parsing failed: ${error.message}`));
                }
            });
        });
    }
    static async processXLSX(fileBuffer) {
        try {
            const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const data = XLSX.utils.sheet_to_json(worksheet);
            const recipients = data.map((row) => {
                const name = row.name || row.Name || row.NAME || '';
                const email = row.email || row.Email || row.EMAIL || '';
                if (!email || !this.validateEmail(email)) {
                    throw new Error(`Invalid email: ${email}`);
                }
                return {
                    name: name.trim(),
                    email: email.trim()
                };
            }).filter(recipient => recipient.email !== '');
            return recipients;
        }
        catch (error) {
            throw new Error(`XLSX processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    static async processFile(file) {
        const fileExtension = file.originalname.split('.').pop()?.toLowerCase();
        if (!fileExtension) {
            throw new Error('Unable to determine file extension');
        }
        if (fileExtension === 'csv') {
            return this.processCSV(file.buffer);
        }
        else if (['xlsx', 'xls'].includes(fileExtension)) {
            return this.processXLSX(file.buffer);
        }
        else {
            throw new Error('Unsupported file format. Please upload CSV or XLSX files.');
        }
    }
    static validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
}
