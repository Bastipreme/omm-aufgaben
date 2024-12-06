const fs = require('fs');
const pdf = require('pdf-parse');
const { PDFDocument } = require('pdf-lib');
//dddd

// Funktion zum Verarbeiten von PDF-Dateien
async function processPDF(filePath) {
    const dataBuffer = fs.readFileSync(filePath);

    // Versuche zuerst, pdf-parse zu verwenden
    try {
        const data = await pdf(dataBuffer);
        return extractInformation(data.text);
    } catch (error) {
        console.warn('pdf-parse failed, falling back to pdf-lib:', error.message);
    }

    // Fallback zu pdf-lib, wenn pdf-parse fehlschlägt
    const pdfDoc = await PDFDocument.load(dataBuffer);
    const pageTexts = await Promise.all(
        pdfDoc.getPages().map(async (page) => {
            const textContent = await page.getTextContent();
            return textContent.items.map((item) => item.str).join(' ');
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

    // Entferne unerwünschte Textmuster
    text = text.replace(/\r\nAnsprechperson/g, '');
    text = text.replace(/\nDate of issueNovember 8"/g, '');
    text = text.replace(/\nZahlungsart\nPayPal\nVersandartAuftragsnummer\n\d+\nOnlineDeal24 GmbH/g, '');
    text = text.replace(/DHL\s*/i, '');

    // Regex-Muster
    const rechnungsNrMatch = text.match(/(?:Rechnungsnummer|Invoice number)\s*[:|\s]*\s*([A-Z0-9\s-]+)/i);
    const datumMatch = text.match(/([\d]{2}\.[\d]{2}\.[\d]{4}|[\d]{2}\/[\d]{2}\/[\d]{4}|[\d]{1,2}\/[\d]{1,2}\/[\d]{4}|[A-Za-z]+\s+\d{1,2},\s*\d{4})/i);
    const bruttoMatch = text.match(/Gesamtbetrag\s*[:|\s-]*\s*([\d,.]+)\s*€/i);
    const nettoMatch = text.match(/[$€]\s*([\d,.]+)/i);
    const gesamtbetragMatch = text.match(/Total\s*[:|\s]*\s*\$?€?\s*([\d.,]+)/i);
    const gesamtNettobetragMatch = text.match(/Gesamtbetrag:\s*€\s*([\d,.]+)[,-]*/i);

    // Formatieren des Bruttobetrags auf 2 Dezimalstellen
    const bruttoBetrag = bruttoMatch ? parseFloat(bruttoMatch[1].replace(',', '.')) : null;
    const bruttoBetragFormatted = bruttoBetrag !== null ? bruttoBetrag.toFixed(2) : null;

    // Datum formatieren
    let formattedDate = null;
    if (datumMatch) {
        const rawDate = datumMatch[1] || datumMatch[2] || datumMatch[3];
        formattedDate = rawDate;
    }

    // Gesamtbetrag formatieren
    const gesamtbetragFormatted = gesamtbetragMatch ? parseFloat(gesamtbetragMatch[1].replace(',', '.')).toFixed(2) : null;

    return {
        rechnungs_nr: rechnungsNrMatch ? String(rechnungsNrMatch[1]).trim() : null,
        rechnungs_datum: formattedDate,
        gesamt_betrag_brutto: bruttoBetragFormatted,
        gesamt_betrag_netto: nettoMatch ? parseFloat(nettoMatch[1].replace(',', '.')).toFixed(2) : (gesamtbetragFormatted ? gesamtbetragFormatted : (gesamtNettobetragMatch ? parseFloat(gesamtNettobetragMatch[1].replace(',', '.')).toFixed(2) : null)),
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