const fs = require('fs');
const { PDFDocument } = require('pdf-lib');

// Funktion zum Verarbeiten von PDF-Dateien
async function processPDF(filePath) {
    const dataBuffer = fs.readFileSync(filePath);
    const pdfDoc = await PDFDocument.load(dataBuffer);
    const pageTexts = await Promise.all(
        pdfDoc.getPages().map(async (page) => {
            const content = await page.getTextContent();
            return content.items.map((item) => item.str).join(' ');
        })
    );

    const fullText = pageTexts.join(' ');
    return extractInformation(fullText);
}

// Funktion zum Verarbeiten von TXT-Dateien
function processTXT(filePath) {
    const data = fs.readFileSync(filePath, 'utf8');
    return extractInformation(data);
}

// Funktion zum Extrahieren der Informationen
function extractInformation(text) {
    // Regex-Muster
    const rechnungsNrMatch = text.match(/Rechnungsnummer:\s*(\w+)/i);
    const datumMatch = text.match(/Datum:\s*(\d{2}\.\d{2}\.\d{4})/i);
    const bruttoMatch = text.match(/Bruttobetrag:\s*([\d,.]+)\s*€/i);
    const nettoMatch = text.match(/Nettobetrag:\s*([\d,.]+)\s*€/i);
    const gesamtbetragMatch = text.match(/Gesamtbetrag:\s*€\s*([\d,.]+)[,-]*/i);

    return {
        rechnungs_nr: rechnungsNrMatch ? String(rechnungsNrMatch[1]) : null,
        rechnungs_datum: datumMatch ? datumMatch[1] : null,
        gesamt_betrag_brutto: bruttoMatch ? parseFloat(bruttoMatch[1].replace(',', '.')) : null,
        gesamt_betrag_netto: nettoMatch ? parseFloat(nettoMatch[1].replace(',', '.')) : (gesamtbetragMatch ? parseFloat(gesamtbetragMatch[1].replace(',', '.')) : totalNetto),
    };
}

// Hauptfunktion
async function main(filePath) {
    try {
        let result;
        if (filePath.endsWith('.pdf')) {
            result = await processPDF(filePath);
        } else if (filePath.endsWith('.txt')) {
            result = processTXT(filePath);
        } else {
            throw new Error('Unsupported file format. Only PDF and TXT are allowed.');
        }

        // JSON-Ausgabe
        console.log('Extrahierte Daten:', JSON.stringify(result, null, 2));
    } catch (error) {
        console.error('Fehler:', error.message);
    }
}

// Dateipfad über die Kommandozeile übergeben
const filePath = process.argv[2];
if (!filePath) {
    console.error('Bitte einen Dateipfad angeben.');
    process.exit(1);
}

main(filePath);
