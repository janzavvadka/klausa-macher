const functions = require('firebase-functions');
const express = require('express');
const app = express();

app.get('/timestamp', (request, response) => {
    response.set('Cache-Control', '/public, max-age=10, s-mexage=20')
    response.send(`${Date.now()}`);
});

exports.app = functions.https.onRequest(app); 