# Île Recycle — export pour GitHub Pages

## Contenu
- index.html, style.css, data.js, app.js, icons.js : le site
- logo.jpg, bg.jpg : le logo et la photo de fond

## Déploiement sur GitHub Pages
1. Créez un dépôt GitHub (public ou privé selon votre offre), par ex. `ile-recycle-site`.
2. Ajoutez tous les fichiers de ce dossier à la racine du dépôt (pas dans un sous-dossier),
   en conservant exactement les mêmes noms de fichiers.
3. Dans le dépôt GitHub : Settings > Pages > Source > choisissez la branche `main` et le
   dossier `/ (root)`, puis Save.
4. Après 1 à 2 minutes, le site est disponible à l'adresse indiquée par GitHub
   (en général https://<votre-compte>.github.io/<nom-du-depot>/).

## Important
- Les données de stock sont actuellement stockées dans le navigateur de chaque visiteur
  (pas de base de données partagée) : c'est un prototype, pas encore un site de production
  avec un vrai stock commun à tous les visiteurs.
- Le fichier icons.js de cet export va chercher les icônes sur le service public Iconify
  (api.iconify.design) : cela nécessite un accès internet côté visiteur, ce qui est normal
  pour un site réellement hébergé.
- Les photos de produits et fiches PDF ajoutées via le mode gestionnaire sont elles aussi
  stockées uniquement dans le navigateur de la personne qui les ajoute (localStorage) :
  elles ne seront pas visibles par les autres visiteurs tant qu'il n'y a pas de backend.
