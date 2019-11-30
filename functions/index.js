const functions = require('firebase-functions');
const express = require('express');
const app = express();
let date = new Date();
let formatted = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate();

app.get('/timestamp', (request, response) => {
    response.set('Cache-Control', '/public, max-age=10, s-mexage=20')
    response.send(`${formatted}`);
});

exports.app = functions.https.onRequest(app); 