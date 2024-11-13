const express = require("express");
const bodyParser = require("body-parser");
const pdf = require("html-pdf");
const qr = require("qr-image");
const fs = require("fs");
const path = require("path");

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Asegúrate de que la carpeta 'output' existe
if (!fs.existsSync('./output')) {
    fs.mkdirSync('./output');
}

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/create-pdf', (req, res) => {
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

    const options = { format: 'Letter' };

    pdf.create(html, options).toFile('./output/document.pdf', (err, result) => {
        if (err) return res.status(500).send('Hubo un error al crear el pdf');

        const downloadLink = `http://localhost:3000/download/document.pdf`;

        // Generar el código QR como archivo de imagen PNG
        const qrImagePath = path.join(__dirname, 'output', 'qr-code.png');
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
    });
});

// Ruta para descargar el PDF
app.get('/download/document.pdf', (req, res) => {
    const filePath = path.join(__dirname, 'output', 'document.pdf');
    res.download(filePath);
});

// Servir la imagen QR como un archivo estático
app.use('/output', express.static(path.join(__dirname, 'output')));

app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});
