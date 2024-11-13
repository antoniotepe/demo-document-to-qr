const express = require("express");
const bodyParser = require("body-parser");
const puppeteer = require("puppeteer");
const qr = require("qr-image");
const fs = require("fs");
const path = require("path");

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

const outputDir = path.join(__dirname, 'output');
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// Ruta principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Generación de PDF y QR
app.post('/create-pdf', async (req, res) => {
    const { content } = req.body;

    const html = `
        <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                </style>
            </head>
            <body>${content}</body>
        </html>
    `;

    try {
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        await page.setContent(html);

        // Guardar PDF
        const pdfPath = path.join(outputDir, 'document.pdf');
        await page.pdf({ path: pdfPath, format: 'Letter' });
        await browser.close();

        const downloadLink = `${req.protocol}://${req.get('host')}/download/document.pdf`;

        // Generar código QR con el enlace de descarga
        const qrImagePath = path.join(outputDir, 'qr-code.png');
        const qrCodeImage = qr.image(downloadLink, { type: 'png' });

        qrCodeImage.pipe(fs.createWriteStream(qrImagePath))
            .on('finish', () => {
                res.send(`
                    <p>Documento y código QR creados exitosamente.</p>
                    <a href="${downloadLink}" target="_blank">Descargar PDF</a>
                    <br>
                    <p>Código QR generado:</p>
                    <img src="/output/qr-code.png" alt="QR Code" />
                `);
            })
            .on('error', (err) => {
                console.error('Error al guardar el código QR:', err);
                res.status(500).send('Hubo un error al crear el código QR');
            });

    } catch (error) {
        console.error('Error al crear el PDF:', error);
        res.status(500).send('Hubo un error al crear el PDF');
    }
});

// Ruta para descargar el PDF
app.get('/download/document.pdf', (req, res) => {
    const filePath = path.join(outputDir, 'document.pdf');
    res.download(filePath);
});

// Servir la imagen QR como un archivo estático
app.use('/output', express.static(path.join(__dirname, 'output')));

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

