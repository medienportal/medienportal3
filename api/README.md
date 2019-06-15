# medienportal

> Diese Anleitung wurde nicht auf den aktuellen Stand gebracht.

## Einrichten

### Abhängigkeiten installieren
Die Abhängigkeiten werden per [npm](http://npmjs.org/) verwaltet. Direkt nach dem Klonen sollten `npm install`
`npm install` muss außerdem jedesmal ausgeführt werden, wenn eine neue Abhängigkeit hinzugekommen ist.
Solltest du dir unsicher sein, führe `npm install` nach jedem Pull durch.

#### Native Abhängigkeiten
Der Server kümmert sich auch um das Skalieren und Beschneiden von Bilder sowie um die Umwandlung von PDF-Dateien. Dafür musst du die Programme *graphicsmagick*
Am Besten installierst du das über [homebrew](http://brew.sh/): `brew install graphicsmagick`

#### Tests durchführen
Um die Tests durchzuführen, musst du folgende Abhängigkeiten installiert haben:
- Alle Developer Dependencies
`npm install --dev`
- Das Mocha testing Framework
`npm install mocha -g`

Die eigentlichen Tests werden dann mit `npm test` durchgeführt.

### den Server starten
Den Server startest, indem du `node app` im Projektordner ausführst. Solltest du debuggen wollen, empfehlen wir dir, nodemon zu benutzen. Nodemon wird gestartet über `npm test`
Die api findest du dann unter http://localhost:9000