const functions = require('firebase-functions');
const express = require('express');
const engines = require('consolidate'); 

const app = express();
app.engine('hbs', engines.handlebars);
app.set('views','./views');
app.set('view engine', 'hbs');
app.use(express.json());      
app.use(express.urlencoded());

app.get('/heart-beat', (request, response) => {
    response.send(`${Date.now()}`);
});

app.get('/', (request, response) => {
    response.render('login', {test: 'wartość'})
});

app.post('/auth', (request, response) => {
    var name = request.body.name;
    console.log(name + "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    response.send('result')
});

app.get('/csv-form', (request, response) => {
    response.render('csv-form');
});

app.post('/csv-form', (request, response) => {
    response.render('login')
});

exports.app = functions.https.onRequest(app); 