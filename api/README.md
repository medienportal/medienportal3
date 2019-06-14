# medienportal
## Was es ist

Dies ist der API-Server für das Medienportal 3.0 (panda): https://bitbucket.org/kakidesign/medienportal_neu

## Einrichten

### Projekt Klonen
Das Projekt wird mit `shell git clone ssh://git@bitbucket.org/kakidesign/medienportal_api.git` auf die Platte klopiert.

### Abhängigkeiten installieren
Die Abhängigkeiten werden per [npm](http://npmjs.org/) verwaltet. Direkt nach dem Klonen sollten `shell npm install`
`shell npm install` muss außerdem jedesmal ausgeführt werden, wenn eine neue Abhängigkeit hinzugekommen ist.
Solltest du dir unsicher sein, führe `shell npm install` nach jedem Pull durch.

#### Native Abhängigkeiten
Der Server kümmert sich auch um das Skalieren und Beschneiden von Bilder sowie um die Umwandlung von PDF-Dateien. Dafür musst du die Programme *graphicsmagick*
Am Besten installierst du das über [homebrew](http://brew.sh/): `shell brew install graphicsmagick`

#### Tests durchführen
Um die Tests durchzuführen, musst du folgende Abhängigkeiten installiert haben:
- Alle Developer Dependencies
`shell npm install --dev`
- Das Mocha testing Framework
`shell npm install mocha -g`

Die eigentlichen Tests werden dann mit `shell npm test` durchgeführt.

### den Server starten
Den Server startest, indem du `shell node app` im Projektordner ausführst. Solltest du debuggen wollen, empfehlen wir dir, nodemon zu benutzen. Nodemon wird gestartet über `shell npm test`
Die api findest du dann unter http://localhost:9000