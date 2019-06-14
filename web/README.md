# medienportal
## Was es ist

Das Medienportal ist ein Portal für Schulen, auf denen alle Schulmedien aggregiert werden. Es ist zugänglich und auch für Schüler leicht verständlich.

## Einrichten

### 'Migration Guide' vom alten Medienportal-Guide

Diese Sektion ist nur vorübergehend um zu zeigen, wie der neueste Master am einfachsten einzurichten ist:

- lösche dein altes Projekt (einfach den Ordner `medienportal_neu` von der festplatte löschen)
- im Terminal in den Ordner navigieren, wo früher `medienportal_neu` war (zB ~/Websites, im Terminal mit `cd ~/Websites/`)
- Ab hier einfach starten mit der unteren Anleitung: Projekt klonen, dann Abhängigkeiten installieren)

!!! Achtung: Änderungen
- Das Projekt öffnet sich nicht mehr von alleine im Browser. Einfach Browser öffnen und `http://panda.dev:3000` in die Browserleiste eintippen
- Das Projekt lädt Änderungen nicht mehr automatisch im Browser. Einfach Browser-Reload durchführen (cmd+R)
Diese 2 Punkte werden eventuell nachgereicht.
  Bitte beachten, dass sich die Ordnerstruktur geändert hat. Am Besten mal die README einmal aufmerksam durchlesen.

### Projekt Klonen
Das Projekt wird mit `git clone ssh://git@bitbucket.org/unsdrei/medienportal_neu.git` auf die Platte klopiert.

### Abhängigkeiten installieren
Die Abhängigkeiten werden per npm und [bower](http://bower.io/) verwaltet. Direkt nach dem Klonen sollten `npm install` und `bower install` ausgeführt werden.
`bower install` muss außerdem jedesmal ausgeführt werden, wenn eine neue Abhängigkeit hinzugekommen ist.
Solltest du dir unsicher sein, führe `bower install` nach jedem Pull durch.

### panda.dev
Das Projekt ist aufgrund der Domainrestriktionen von facebook so eingerichtet, dass es auf *http://panda.dev:3000/* läuft.
Deshalb solltest du lokal ein Redirect auf von *panda.dev* auf *127.0.0.1 (localhost)* machen.
Im Prinzip musst du in der */etc/hosts* (Linux/Mac) oder *C:/Windows/System32/etc/hosts* (Windows) den Eintrag *panda.dev 127.0.0.1* hinzufügen.
**Falls du nicht genau weißt, wie das funktioniert, ist es besser, du lässt dir helfen.**

### den Server starten
Es gibt ein Backend-Server, der unter [Server](https://bitbucket.org/unsdrei/medienportal_api) erhältlich ist.
Du kannst entweder den Server bei dir lokal einrichten und nutzen, ansonsten wird standardmäßig https://preview.api.medienportal.org benutzt.
Einzustellen ist das in der Konfigurations-Datei unter `./config/environments/development.json`

### Projekt lokal starten
Um das Projekt lokal zu starten, wird gulp benötigt (zu installieren mit `npm install gulp -g`);
Ist gulp installiert, lässt sich das Projekt mit `gulp serve` starten.

### Versionierung
Bitte bei jedem Update die Version in der Datei `package.json` updaten.

oder:

Nach dem committen `npm version patch` setzen und dann pushen mit `git push`.
(Version wird eins höher gesetzt)

### Tests durchführen
Bevor du Änderungen veröffentlichst, gehe sicher, dass nichts kaputt gegangen ist. Tests können dabei helfen. Um die Tests abzufahren,
führen `gulp test` aus. Sollte ein Test nicht grün sein, siehe dir an, was kaputt gegangen ist, und kümmere dich darum,
dass der Test wieder grün wird.

## Entwicklung

### Entwicklungssprache
Entwicklungssprache ist `Englisch`. Alle Commits sind auf Englisch zu machen. Code-Comments sind auf Englisch. *No Exception To This Rule.*
Bei README, Code-Issues, etc. steht es vorerst jedem frei, seine präferierte Sprache zu nutzen.

### Branches
Grundsätzlich wird auf dem `develop`-Branch entwickelt.
Neue Features bzw. neue Bugfixes sollten in eigene Branches (mit dem Namen `feature/...` bzw. `bugfix/...`) committed und gepusht werden. Wenn diese Features/Bugfixes vollendet sind, sollte ein Pull Request erstellt werden.

Alexis wird dann den Request überprüfen. Ist dieser iO, wird er dann in den `develop`-Branch gemerged.

### Ordnerstruktur

Die Ordnerstruktur dient der Übersichtlichkeit und der Maintanability vom Code. Die Ordnerstruktur ist penibel einzuhalten.

##### config
Der Config-Ordner beinhaltet alle Konfigurations-Einstellungen für das Projekt.
* Unter /deploy sind die Einstellungen für das Deployment zu finden.
* Unter /environments sind die spezifischen Einstellungen für die Applikation zu finden, aufgeteilt in Umgebungen (development, staging, production)
* appConfig.json beinhaltet die Einstellungen für gulp

##### e2e
Hier sind alle End2End-Tests zu finden.

##### gulp
Hier sind alle gulp-Tasks zu finden. Gulp-Tasks sind dazu da, die Aufgaben zu automatisieren. Siehe http://gulpjs.com/

##### node_modules
Hier sind alle per npm installierten Module zu finden.

##### src
Hier ist die eigentliche Applikation zu finden:
* /app beinhaltet alle Module, aus denen die Applikation besteht. Ein Modul kann scss-Files (*.scss), JavaScript-Files (*.js) und JavaScript-Tests (*.spec.js) beinhalten. Es ist wichtig, dass die Zugehörigkeit einer Datei zu einem Modul gewahrt bleibt, um Quellcode schnell zu finden und verstehen zu können.
* /assets beinhaltet alle statischen Assets (fonts, images, ...)
* favicon.ico ist das favicon
* index.ejs ist das index-View

### Technologien

#### SASS
Als css-Präprozessor wird [SASS](http://sass-lang.com/) benutzt. Wir möchten die Features von sass so viel wie möglich dazu nutzen, den Code übersichtlicher und lesbarer zu machen, sowie Wiederholungen zu vermeiden.
Deshalb ist es wichtig, vor Allem mit Features wie `Indentation`, `SASS-Variables` und `SASS-Mixins` vertraut zu sein uns sie dort zu benutzen, wo es sinnvoll ist.

#### BableJS
Alle JavaScript-Dateien werden durch [babel](https://babeljs.io/) von ES6 nach ES5 kompiliert. Wir möchten ein modernes und zukunftssicheres JavaScript nutzen.

#### ExpressJS + EJS
Dem Frontend ist ein [express](http://expressjs.com)-Server vorgeschalten.
Das einzige Template ist `src/index.ejs` in der Sprache [ejs](http://www.embeddedjs.com).

#### AngularJS
Wir benutzen [angular 1.x](http://angularjs.org). Der Plan ist, so schnell wie möglich zu [angular 2](http://angular.io) zu migrieren, sobald es fertig ist.

### Infrastruktur

#### Deployment
Wir nutzen die Technik des `continuous Deployment`s. Unsere Builds und Deploys laufen über [codeship](https://codeship.io).
Der `develop` und `master` Branch werden automatisch deployed. Andere Branches werden nicht deployed.

#### API
Die API ist ein eigenständiges Projekt, zu finden unter https://bitbucket.org/unsdrei/medienportal_api


### Zugehörige Projekte
#### medienportal.org
Die Landingpage des Medienportal-Projektes ist zu finden unter https://bitbucket.org/medienportal/landingpage

#### medienportal Administration (admin.medienportal.org)
Die Administrationsseite für Tenants, Rechnungen, etc. ist zu finden unter https://bitbucket.org/medienportal/administration

#### URL-Shortener (mport.al)
Der URL-Shortener ist zu finden unter https://bitbucket.org/medienportal/url-shortener

#### PhantomJS-Server (phantom.services.medienportal.org)
Der PhantomJS-Server parsed HTML-Seiten und kann Bilder extrahieren bzw. Audrücke als png, jpeg oder pdf ausgeben. Er ist zu finden unter https://bitbucket.org/medienportal/phantom