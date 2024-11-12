const express = require("express");
const bodyParser = require("body-parser");
const pdf = require("html-pdf");
const qr = require("qr-image");
const fs = require("fs");
const path = require("path");

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));


app.get('/', (req,res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.hmlt'));
})

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

    pdf.create(html, options).toFile('./output/documento.pdf', (err, result) => {
        
        if(err) return res.status(500).send('Hubo un error al crear el pdf');

        const downloadLink = `https://demo-document-to-qr.onrender.com/download/document.pdf`;

        const qrCode = qr.imageSync(downloadLink, { type: 'png' });

        res.send(`
            <p>Documento creado exitosamente.</p>
            <a href="${downloadLink}" target="_blank">Descargar PDF</a>
            <br>
            <img src="data:image/png;base64,${qrCode.toString('base64')}" alt="QR Code" />
          `);

    })

})


// Ruta para descargar el PDF
app.get('/download/document.pdf', (req, res) => {
    const filePath = path.join(__dirname, 'output', 'document.pdf');
    res.download(filePath);
  });
  
  app.listen(3000, () => {
    console.log('Server running on https://demo-document-to-qr.onrender.com:3000');
  });

