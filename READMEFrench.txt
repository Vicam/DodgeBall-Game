Balle
=========

Afin de pouvoir utiliser l'application, il faut télécharger node.js
======================================================================================================

Tout d'abord, il faut modifier le fichier config.js en y inscrivant les deux ports utilisés pour la websocket et le serveur (il n'est pas nécessaire de modifier les ports indiqués par défaut)
puis l'IP de la machine sur laquelle le serveur a été lancé. (Un ipconfig donne facilement cette IP)

Dans la fenêtre de commande node.js, après s'être placé dans le bon répertoire (faire des changedir..) lancer le serveur : 
$ node serveur.js

Puis après avoir connecté tous les appareils souhaités au même réseau, entrer dans leur navigteur respectif l'URL : x.x.x.x:8080 où "x.x.x.x" est l'adresse IP entré dans config.js.
Les différents écrans connectés sont alors reconnus et dessinés sur la page.
Ils sont aussi draggable afin de pouvoir représenter leur position physique réelle, mais l'application ne supporte pas encore cette fonctionnalité. La balle ne peut navigur que de la gauche
vers la droite et inversement.

Appuyer sur "go" dans l'ordre voulu et faire apparaître les balles en cliquant sur l'écran.
