const fs = require('fs');
const pdf = require('pdf-parse');

// Funktion zum Verarbeiten von PDF-Dateien
async function processPDF(filePath) {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdf(dataBuffer);
    return extractInformation(data.text);
}

// Funktion zum Verarbeiten von TXT-Dateien
function processTXT(filePath) {
    const data = fs.readFileSync(filePath, 'utf8');
    return extractInformation(data);
}

// Funktion zum Extrahieren der Informationen
function extractInformation(text) {
    // Regex-Muster
    const rechnungsNrMatch = text.match(/Rechnungsnummer|Invoice number\s*[:|\s]*\s*([A-Z0-9\s]+)(?:\nDate of issue([A-Za-z]+\s+\d{1,2},\s*\d{4}))/i);
    const datumMatch = text.match(/Rechnungs-?\/?Lieferdatum|Date of issue\s*[\s]*([\d]{2}\.[\d]{2}\.[\d]{4})|([\d]{2}\/[\d]{2}\/[\d]{4})|Date of issue\s*([A-Za-z]+\s+\d{1,2},\s*\d{4})/i);
    const bruttoMatch = text.match(/Gesamtbetrag\s*[:|\s-]*\s*([\d,.]+)\s*€/i);
    const nettoMatch = text.match(/Warenwert netto\s*[:|]\s*([\d,.]+)\s*€/i);
    const gesamtbetragMatch = text.match(/Total\s*[:|\s]*\s*\$?€?\s*([\d.,]+)/i);

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
        gesamt_betrag_netto: nettoMatch ? parseFloat(nettoMatch[1].replace(',', '.')).toFixed(2) : gesamtbetragFormatted,
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
