# sdk.js
Un simple générateur de sudokus écrit en javascript

## Comment ça marche?

L'intégralité du traitement est réalisé côté client (navigateur) en javascript. 
Le sudoku est généré dans un worker (scripts/worker.js), le rendu est réalisé dans un second fichier de script (scripts/sdk.js)

Il s'agit avant tout d'un outil de résolution. La construction d'une grille passe par plusieurs étapes :
* Génération d'une grille complète,
* Une cellule candidate est tirée au hasard,
* S'il est toujours possible de résoudre le sudoku sans la cellule, elle est éliminée. Dans le cas contraire, elle est confirmée.
Cette approche garantit qu'il n'y a toujours qu'une seule solution possible. En contrepartie, le niveau de difficulté dépend des capacités de résolution du programme.

## Version en ligne

L'utilisation d'un worker ne permet pas de faire fonctionner cet exemple hors ligne (cross origin, contournable). Une version est disponible sur le site [zepr.fr](https://zepr.fr/sdk/).

## Dépendances

La génération d'export au format pdf requiert la bibliothèque [jspdf](https://github.com/MrRio/jsPDF) réalisée par [MrRio](https://github.com/MrRio). Il suffit de copier le fichier dist/jspdf.dist.js dans le répertoire scripts
