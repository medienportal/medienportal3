# Medienportal für Schulen

Das Medienportal 3 ist eine Platform, die es Schulen ermöglicht, eine eigene, Seite mit weitreichender Integration multimedialer Inhalte zu veröffentlichen.

- Veröffentlichen von Artikeln, Videos, Audio, Bildergalerien
- Kategorisieren von Inhalten
- Nutzer- und Rechteverwaltung
- Kommentieren und Bewerten von Beiträgen

## Open Source

Eine neue Version befindet sich in Entwicklung, weshalt wir entschieden haben, die alte Version zu veröffentlichen.
Diese Veröffentlichung ist absolut unvollständig. Es fehlen einige Komponenten, und wir haben keine Zeit, eine angemessene Dokumentation zu schreiben.

Das Medienportal befindet sich beim [https://www.ehrenberg-gymnasium.de/ehrenberg/startseite/](Christian-Gottfried-Ehrenberg-Gymnasium Delitzsch) im Gebrauch:

https://ehrenberg.medienportal.org/

Die Veröffentlichung des Quellcodes dient ausschließlich dem Bildungszweck.

## Bestandteile

### API

Die API kümmert sich darum, eine [https://de.wikipedia.org/wiki/Representational_State_Transfer](REST)-Schnittstelle zur Verfügung zu stellen.
Hier werden Inhalte abgerufen und geschrieben.

### Web

Hier findet sich das Fontend. Es ist hauptsächlich eine [https://angularjs.org/](AngularJS)-App, der ein kleiner [https://nodejs.org](node)-Server vorgeschalten ist,
um die Konfiguration mitzuschicken.

### Helm-Charts

Im Ordner helm-charts befindet sich die Konfiguration für [https://helm.sh/](helm), die auch produktiv auf [https://ehrenberg.medienportal.org] eingesetzt wird, um das Medienportal auf einem [https://kubernetes.io/](Kubernetes)-Cluster zu veröffentllichen.

> Die [https://docker.com](Docker)-Container zum Projekt sind hier zu finden: https://hub.docker.com/u/medienportal3