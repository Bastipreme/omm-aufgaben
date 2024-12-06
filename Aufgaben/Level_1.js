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

    // Entferne "DHL" aus dem Datumstext
    text = text.replace(/DHL\s*/i, '');

    const rechnungsNrMatch = text.match(/Rechnungsnummer\s*[:|\s]*([A-Z0-9]+)/i);
    const datumMatch = text.match(/Rechnungs-?\/?Lieferdatum\s*[\s]*([\d]{2}\.[\d]{2}\.[\d]{4})/i);
    const bruttoMatch = text.match(/Gesamtbetrag\s*[:|\s-]*\s*([\d,.]+)\s*€/i);
    const nettoMatch = text.match(/Warenwert netto\s*[:|]\s*([\d,.]+)\s*€/i);

    // Formatieren des Bruttobetrags auf 2 Dezimalstellen
    const bruttoBetrag = bruttoMatch ? parseFloat(bruttoMatch[1].replace(',', '.')) : null;
    const bruttoBetragFormatted = bruttoBetrag !== null ? bruttoBetrag.toFixed(2) : null;

    return {
        rechnungs_nr: rechnungsNrMatch ? String(rechnungsNrMatch[1]) : null,
        rechnungs_datum: datumMatch ? datumMatch[1] : null,
        gesamt_betrag_brutto: bruttoBetragFormatted,
        gesamt_betrag_netto: nettoMatch ? parseFloat(nettoMatch[1].replace(',', '.')) : null,
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
