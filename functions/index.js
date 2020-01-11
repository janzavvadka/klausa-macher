// #################################################
//     imports
// #################################################
const functions = require('firebase-functions');
const express = require("express");
const nodemailer = require('nodemailer');
const multer = require('multer');
const csvParser = require('csv-string');

// #################################################
//      init
// #################################################
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {fieldSize: 10 * 1024 * 1024},
    startProcessing(req, busboy) {
        req.rawBody ? busboy.end(req.rawBody) : req.pipe(busboy)
    },
});
const app = express();
const transporter = initNodemailer();

// #################################################
//     api
// #################################################
app.get('/live-check', (request, response) => {
    response.send(`${Date.now()}`);
});

app.get('/test', (request, response) => {
    response.sendFile(__dirname + '/view/test.html');
});

app.get('/prod', (request, response) => {
    response.sendFile(__dirname + '/view/prod.html');
});

app.post('/test-send-csv', upload.single('csvfile'), (request, response) => {
    const participantsDataRaw = getParticipantFromCsv(request.file);
    if (participantsDataRaw < 2) {
        return response.send("Za mało hobbitów");
    }
    const participantsData = mapParticipants(participantsDataRaw);
    const participantsFullData = matchParticipants(participantsData);
    participantsFullData.forEach((participant) => {
        sendMail(prepareTestMail(participant));
    });
    sendMail(preparePostMail(participantsFullData));
    response.send('sended');
});

app.post('/prod-send-csv', upload.single('csvfile'), (request, response) => {
    const participantsDataRaw = getParticipantFromCsv(request.file);
    if (participantsDataRaw < 2) {
        return response.send("Za mało hobbitów");
    }
    const participantsData = mapParticipants(participantsDataRaw);
    const participantsFullData = matchParticipants(participantsData);
    participantsFullData.forEach((participant) => {
        sendMail(prepareProdMail(participant));
    });
    sendMail(preparePostMail(participantsFullData));
    response.send('sended');
});

// #################################################
//     random match participant
// #################################################
function matchParticipants(participantsData) {
    let participantsToMatch = participantsData.map((participants) => {
        return participants.name;
    });
    for (let participant of participantsData) {
        let isDone = false;
        while (!isDone) {
            let participantIndex = getRandomRange(0, participantsToMatch.length - 1);
            let participantToMatch = participantsToMatch[participantIndex];

            if (participantToMatch !== participant.name) {
                participantsToMatch.splice(participantIndex, 1);
                participant.hobbit = participantToMatch;
                participant.hobbitIndex = findIndexByName(participantsData, participantToMatch);
                participant.myIndex = findIndexByName(participantsData, participant.name);
                break;
            }

            if (participantsToMatch.length === 1) {
                participant.hobbit = participantToMatch;
                participant.hobbitIndex = findIndexByName(participantsData, participantToMatch);
                participant.myIndex = findIndexByName(participantsData, participant.name);
                break;
            }
        }
    }
    if (participantsToMatch.length === 1) {
        participantsData = swapHobbit(participantsData);
    }

    return participantsData;
}

function findIndexByName(array, name) {
    return array.findIndex((element) => element.name === name);
}

function swapHobbit(participantData) {
    const lastElement = participantData[participantData.length - 1].hobbit;
    const beforeLastElement = participantData[participantData.length - 2].hobbit;
    participantData[participantData.length - 1].hobbit = beforeLastElement;
    participantData[participantData.length - 2].hobbit = lastElement;
    return participantData
}

function getRandomRange(min, max) {
    return Math.round(Math.random() * (max - min) + min);
}

function mapParticipants(participantData) {
    return participantData.map(participant =>
        new Participant(participant[0], participant[1])
    )
}

// #################################################
//     csv parser
// #################################################
function getParticipantFromCsv(file) {
    return csvParser.parse(file.buffer.toString());
}

// #################################################
//     mailer
// #################################################
function initNodemailer() {
    return nodemailer.createTransport({
        service: 'gmail',
        secure: false,
        pool: true,
        auth: {
            user: 'nizolkowy.swiety.mikolaj@gmail.com',
            pass: 'xxx'
        },
        tls: {
            rejectUnauthorized: false
        }
    });
}

function prepareTestMail(participant) {
    return {
        from: 'nizolkowy.swiety.mikolaj',
        to: participant.email,
        subject: 'niziołkowe mikołajki 2019',
        html: ` <div style="width:100%">
                    <h1 style="color:red;">
                        Buh buh buh, to ja Niziołkowy Święty Mikołaj.
                    </h1>
                        <img src="https://pbs.twimg.com/media/CctkW6UW8AEoNsP.jpg" />
                        <h2>
                            Witaj ${participant.name}
                        </h2>
                        <p style="font-size: 16px">
                            Z żalem informuje, że ta wiadomość jest tylko do celów testowych.<br>
                            Jeśli ją otrzymałeś to super! Po otrzymaniu następnej i ty zostaniesz <br>
                            niezwykłym niziołkowym mikołajem ;)<br>
                        </p>
                        <p style="font-size: 16px">
                            Twój kod to: 
                            <span style="color: red;font-size: 18px">
                                ${participant.myIndex}:${(+new Date).toString(36).slice(-3)}:${participant.hobbitIndex}
                            </span>
                        </p>
                        <p>
                        Wstawcie ten kod pod post na fb, żebym wiedziałm że do wszystkich doszło! :D
                        </p>
                    <br/>
                </div>`
    };
}

function prepareProdMail(participant) {
    return {
        from: 'nizolkowy.swiety.mikolaj',
        to: participant.email,
        subject: 'niziołkowe mikołajki 2019',
        html: ` <div style="width:100%">
                    <h1 style="color:red;">
                        Buh buh buh, to ja Niziołkowy Święty Mikołaj.
                    </h1>
                        <img src="https://pbs.twimg.com/media/CctkW6UW8AEoNsP.jpg" />
                        <h2>
                            Witaj ${participant.name}
                        </h2>
                        <p style="font-size: 16px">
                            W tym roku i ty zostałeś niezwykłym niziołkowym mikołajem ;)
                        </p>
                        <p style="font-size: 16px">
                            Twój mały hobbit to: 
                            <span style="color: red;font-size: 18px">
                                ${participant.hobbit}    
                            </span>
                        </p>
                        <p>
                            Spokojnych świąt Bożego Narodzenia, spędzonych z bliskimi, w ciepłej, rodzinnej atmosferze, oraz samych szczęśliwych dni w nadchodzącym nowym roku. 
                            Do zobaczenia na wigili :D
                        </p>
                        <p>
                            Kocham was wszystkich <3
                        </p>
                        <img src="https://i.etsystatic.com/5587831/r/il/951bf7/1419657063/il_794xN.1419657063_q7x3.jpg" />
                    <br/>
                </div>`
    };
}

function preparePostMail(data) {
    const log = data.map(participant => {
        return JSON.stringify(participant);
    }).join("<br>");
    return {
        from: 'nizolkowy.swiety.mikolaj',
        to: 'nizolkowy.swiety.mikolaj@gmail.com',
        subject: 'niziołkowe mikołajki 2019 - post',
        html: ` <div style="width:100%">
                    ${log}
                </div>`
    };
}

function sendMail(mail) {
    transporter.sendMail(mail, (error, info) => {
        if (error) {
            console.log("error: " + mail.to);
            return "error"
        }
        console.log("ok: " + mail.to);
        return "ok";
    });
}

// #################################################
//     model
// #################################################

class Participant {
    constructor(name, email, hobbit, myIndex, hobbitIndex) {
        this.name = name;
        this.email = email;
        this.hobbit = hobbit;
        this.myIndex = myIndex;
        this.hobbitIndex = hobbitIndex;
    }

}

// #################################################
//     exports
// #################################################
exports.app = functions.https.onRequest(app);

