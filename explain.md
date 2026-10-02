# Documentation de l’architecture et du fonctionnement de BozaCM

> Ce document décrit l’application Angular telle qu’elle est implémentée dans le dépôt. Il suit le parcours des données depuis les modèles TypeScript et les appels HTTP jusqu’à leur affichage dans les vues, puis explique les concepts Angular utilisés et les limites fonctionnelles actuellement visibles dans le code.

## 1. Présentation générale

BozaCM est une interface web d’administration d’une plateforme de voyages. Le tableau de bord permet principalement de gérer les agences partenaires, les trajets et les offres, ainsi que de consulter des statistiques par agence et un rapport global.

Le projet est une application **Angular 18** utilisant des composants autonomes (*standalone components*), le routeur Angular, `HttpClient`, RxJS et Bootstrap 5. Les données métier sont obtenues depuis un backend HTTP dont les URL sont codées dans les services sous la forme `http://localhost:8080/api/v1/...`.

L’application suit une organisation par **fonctionnalité** (`features/`) : le modèle, l’accès aux données, les pages et les formulaires d’une fonctionnalité sont regroupés dans un même dossier. Les composants jouent le rôle de contrôleurs de présentation : ils coordonnent le formulaire ou la liste et le service, tandis que les templates HTML affichent l’état obtenu.

## 2. Démarrage et structure Angular

### 2.1 Démarrage de l’application

Le démarrage passe par [src/main.ts](src/main.ts). `bootstrapApplication()` démarre le composant racine `AppComponent` et lui fournit la configuration centrale `appConfig`.

- [src/app/app.component.ts](src/app/app.component.ts) déclare le composant racine autonome.
- [src/app/app.component.html](src/app/app.component.html) contient le `<router-outlet>` racine : Angular y affiche la page correspondant à l’URL.
- [src/app/app.config.ts](src/app/app.config.ts) enregistre le routeur avec `provideRouter(routes)`, les requêtes HTTP avec `provideHttpClient()` et la configuration de détection des changements.
- [src/app/app.routes.ts](src/app/app.routes.ts) centralise les routes et associe les URL aux composants.

Il n’y a pas de module Angular classique `AppModule` : les composants concernés sont autonomes et déclarent eux-mêmes leurs dépendances de template dans leur propriété `imports`.

### 2.2 Arborescence par responsabilité

```text
src/app/
├── app.component.*       # composant racine et point d’injection du routeur
├── app.config.ts         # fournisseurs globaux (routes, HTTP)
├── app.routes.ts         # routes de l’application
├── features/
│   ├── agences/
│   │   ├── models/       # contrats TypeScript des données d’agence
│   │   ├── data-access/  # appels HTTP du domaine agence
│   │   ├── pages/        # liste et consultation
│   │   └── components/   # formulaire de création/modification
│   ├── trajets/          # modèles, service, liste et formulaire
│   ├── offres/           # modèles, service, liste et formulaire
│   ├── statistiques/     # liste des agences et statistiques détaillées
│   ├── rapport/          # rapport global
│   └── auth/             # écrans de connexion et d’inscription
└── shared/
    └── layouts/          # structure partagée du tableau de bord
```

Chaque fichier a une responsabilité dominante :

| Couche | Rôle | Exemple |
|---|---|---|
| Modèle | Décrire les propriétés et types attendus des données échangées | [src/app/features/offres/models/offre.model.ts](src/app/features/offres/models/offre.model.ts) |
| Service (`data-access` ou `service`) | Centraliser les URL et les appels HTTP vers l’API | [src/app/features/offres/data-access/offre.service.ts](src/app/features/offres/data-access/offre.service.ts) |
| Composant TypeScript | Gérer l’état de l’écran, appeler les services, valider et réagir aux événements | [src/app/features/offres/pages/offre-list/offre-list.component.ts](src/app/features/offres/pages/offre-list/offre-list.component.ts) |
| Template HTML | Présenter les données et connecter l’interface aux propriétés et méthodes du composant | [src/app/features/offres/pages/offre-list/offre-list.component.html](src/app/features/offres/pages/offre-list/offre-list.component.html) |
| SCSS/CSS | Définir les styles propres à l’écran ou au composant | `*.component.scss` ou `*.component.css` des composants |

## 3. Navigation et mise en page

Les routes métier sont des routes enfants du `AdminLayoutComponent` dans [src/app/app.routes.ts](src/app/app.routes.ts). Le layout reste affiché et seul son `<router-outlet>` enfant change. Cela évite de reconstruire la barre latérale à chaque navigation.

| URL | Écran |
|---|---|
| `/` | Redirection vers `/agences` |
| `/agences` | Liste et gestion des agences |
| `/ajouter-agence` | Création d’agence |
| `/modifier-agence/:id` | Modification d’agence identifiée par son ID |
| `/trajets` | Liste et gestion des trajets |
| `/ajouter-trajet` | Création de trajet |
| `/modifier-trajet/:id` | Modification du trajet identifié |
| `/offres` | Liste et gestion des offres |
| `/ajouter-offre` | Création d’offre |
| `/modifier-offre/:id` | Modification de l’offre identifiée |
| `/statistiques` | Liste des agences avec filtres et accès à leurs statistiques |
| `/statistiques/:id/statistiques` | Détail statistique d’une agence |
| `/rapports` | Rapport global de la plateforme |
| URL inconnue | Redirection vers la route racine, puis vers les agences |

[admin-layout.component.html](src/app/shared/layouts/admin-layout/admin-layout.component.html) construit la barre latérale, l’en-tête et le `<router-outlet>` des pages enfants. `RouterLink` réalise les navigations Angular sans rechargement complet de la page. `RouterLinkActive` ajoute une classe active au lien correspondant. Le composant [admin-layout.component.ts](src/app/shared/layouts/admin-layout/admin-layout.component.ts) porte aussi l’état `isSidebarOpen` et les méthodes `toggleSidebar()` et `fermerSidebar()`. Sur téléphone, le bouton burger ouvre un tiroir latéral, un voile assombrit l’arrière-plan, et la navigation ou le bouton de fermeture referme le tiroir. Ces règles sont dans [admin-layout.component.scss](src/app/shared/layouts/admin-layout/admin-layout.component.scss).

Les styles partagés, Bootstrap et les icônes Bootstrap sont chargés dans [src/styles.scss](src/styles.scss). Les styles détaillés des vues restent généralement locaux aux composants.

## 4. Parcours des données : du modèle à la vue

Le flux typique d’une liste est le suivant :

1. Angular active la route et crée le composant de page.
2. Le hook `ngOnInit()` demande les données au service du domaine.
3. Le service construit une requête `HttpClient` vers le backend et retourne un `Observable` typé avec le modèle de réponse.
4. Le composant s’abonne à cet Observable avec `subscribe()`.
5. Dans `next`, il place les données dans ses propriétés et met à jour son état de chargement ; dans `error`, il conserve un message d’erreur.
6. Angular actualise le template lorsque les propriétés liées changent. Le template utilise interpolation, directives de contrôle et liaisons pour afficher les lignes, les messages et les actions.

Exemple concret pour les agences :

- [agence.model.ts](src/app/features/agences/models/agence.model.ts) définit `AgenceRequestDTO` pour les données envoyées et `AgenceResponseDTO` pour les données reçues.
- [agence.service.ts](src/app/features/agences/data-access/agence.service.ts) expose `getAllAgences()`, `getAgenceById()`, `createAgence()`, `updateAgence()` et `deleteAgence()`.
- [agence-list.component.ts](src/app/features/agences/pages/agence-list/agence-list.component.ts) charge les agences, garde les résultats en mémoire, filtre, pagine et supprime.
- [agence-list.component.html](src/app/features/agences/pages/agence-list/agence-list.component.html) présente les cartes récapitulatives, le champ de recherche, le tableau, les états de chargement/erreur et les commandes de pagination.

Le composant ne communique donc pas directement avec `fetch` ou une URL : il appelle le service. Cette séparation centralise les échanges réseau et rend plus lisible la logique de présentation.

## 5. Fonctionnalités implémentées

### 5.1 Gestion des agences

La liste des agences est chargée depuis l’API via `AgenceService`. Elle permet de rechercher localement par nom, adresse e-mail ou téléphone, de parcourir les résultats par pages, d’ouvrir le formulaire d’ajout/modification et de supprimer une agence après confirmation. Dans [agence-list.component.html](src/app/features/agences/pages/agence-list/agence-list.component.html), les cellules reçoivent aussi un attribut `data-label`. Sous 600 px, le CSS masque l’en-tête du tableau, transforme chaque ligne en fiche verticale et affiche ces libellés devant les valeurs. Les styles sont dans [agence-list.component.scss](src/app/features/agences/pages/agence-list/agence-list.component.scss).

Le formulaire [agence-form.component.ts](src/app/features/agences/components/agence-form/agence-form.component.ts) est un **formulaire réactif**. Il crée les contrôles avec `FormBuilder`, applique les validateurs Angular (`required`, `minLength`, `email`), puis distingue ajout et édition en lisant le paramètre `id` de la route. En édition, `getAgenceById()` charge les données et `patchValue()` remplit le formulaire. À l’envoi, le composant choisit `createAgence()` ou `updateAgence()` selon le mode, puis revient à la liste avec un message de succès dans les paramètres de l’URL.

### 5.2 Gestion des trajets

La liste [trajet-list.component.ts](src/app/features/trajets/pages/trajet-list/trajet-list.component.ts) charge les trajets, filtre localement par ville de départ, ville d’arrivée ou durée, affiche quelques indicateurs et réalise une pagination locale. Elle offre la modification et la suppression.

Le formulaire [trajet-form.component.ts](src/app/features/trajets/components/trajet-form/trajet-form.component.ts) utilise la liaison de formulaire par modèle (`[(ngModel)]`). Il vérifie que départ, arrivée et durée sont fournis, et interdit que la ville de départ et celle d’arrivée soient identiques. En mode modification, l’ID de la route déclenche le chargement du trajet puis le préremplissage des propriétés.

Le modèle correspondant, [trajet.model.ts](src/app/features/trajets/models/trajet.model.ts), distingue les données de requête et de réponse. [trajet.service.ts](src/app/features/trajets/data-access/trajet.service.ts) expose les opérations CRUD, des méthodes de recherche et un endpoint paginé.

### 5.3 Gestion des offres

La liste [offre-list.component.ts](src/app/features/offres/pages/offre-list/offre-list.component.ts) affiche les offres avec le trajet et l’agence associés. Elle propose une recherche textuelle, des filtres par ville de départ et par agence, des indicateurs (offres, places, agences) et une pagination en mémoire. Elle permet aussi la modification et la suppression. Sur téléphone, le tableau de [offre-list.component.html](src/app/features/offres/pages/offre-list/offre-list.component.html) est restylé en fiches : l’en-tête de colonnes est caché, les informations sont redisposées en grille et des libellés CSS sont ajoutés avant l’agence, le prix et les places ; les actions restent accessibles en bas de chaque fiche. Les règles figurent dans [offre-list.component.scss](src/app/features/offres/pages/offre-list/offre-list.component.scss).

Le formulaire [offre-form.component.ts](src/app/features/offres/components/offre-form/offre-form.component.ts) utilise `[(ngModel)]` et charge les agences et les trajets pour alimenter les listes de sélection. En édition, l’offre reçue (qui contient des objets `agence` et `trajet`) est convertie en données de requête simples `agenceId` et `trajetId`. Avant l’envoi, le composant vérifie les champs, les valeurs positives et la présence des deux relations.

Les modèles de [offre.model.ts](src/app/features/offres/models/offre.model.ts) illustrent la distinction entre `OffreRequestDTO` (IDs de relations pour écrire), `OffreResponseDTO` (objets d’agence et de trajet pour afficher) et `OffrePageResponseDTO` (métadonnées d’une page de résultats). [offre.service.ts](src/app/features/offres/data-access/offre.service.ts) fournit le CRUD, la recherche, le filtrage par prix/agence et des méthodes de pagination côté API.

### 5.4 Statistiques par agence

La page [stat-list.component.ts](src/app/features/statistiques/pages/stat-list/stat-list.component.ts) réutilise les données de `AgenceService` pour afficher les agences, proposer une recherche et un filtre par ville, et paginer la liste. Le bouton « Voir stats » navigue vers `/statistiques/:id/statistiques`. La feuille de style partagée avec la liste des offres agence adapte aussi cette liste : en écran étroit, chaque agence devient une fiche avec ville, téléphone, adresse et bouton d’accès aux statistiques plutôt qu’une ligne trop large.

Le composant de détail [ag-stats.component.ts](src/app/features/statistiques/component/ag-stats/ag-stats.component.ts) lit l’ID dans l’URL et charge deux ressources : les statistiques détaillées de l’agence et le classement. Il combine ces appels avec `forkJoin`, puis le template [ag-stats.component.html](src/app/features/statistiques/component/ag-stats/ag-stats.component.html) affiche les indicateurs, le classement et des barres de comparaison. Le pourcentage de largeur des barres est calculé à partir de la valeur maximale des réservations.

Les interfaces de réponse sont définies dans [stat.model.ts](src/app/features/statistiques/model/stat.model.ts), et les requêtes correspondantes dans [sats.service.ts](src/app/features/statistiques/service/sats.service.ts).

### 5.5 Rapport global

[rapport-global.component.ts](src/app/features/rapport/pages/rapport-global/rapport-global.component.ts) appelle `RapportService` au démarrage de la page et gère les états de chargement, d’erreur et de succès des données. Il calcule notamment les pourcentages de réservations en attente et annulées, puis construit une chaîne CSS `conic-gradient` pour le graphique circulaire. Le template [rapport-global.component.html](src/app/features/rapport/pages/rapport-global/rapport-global.component.html) affiche les KPI, les meilleures performances, le taux de confirmation et le chiffre d’affaires. L’action d’export appelle `window.print()` : il s’agit d’une impression du rapport par le navigateur, pas de la génération d’un fichier PDF dédié par le code Angular.

Le contrat de données est dans [rapport.model.ts](src/app/features/rapport/model/rapport.model.ts) et l’appel HTTP dans [rapport.service.ts](src/app/features/rapport/service/rapport.service.ts).

### 5.6 Connexion et inscription

Les écrans [login.component.ts](src/app/features/auth/pages/login/login.component.ts) et [register.component.ts](src/app/features/auth/pages/register/register.component.ts) existent et utilisent des formulaires réactifs. Ils illustrent aussi les signaux Angular pour sélectionner le type de compte ou afficher/masquer le mot de passe. L’inscription possède un validateur personnalisé qui compare le mot de passe et sa confirmation.

**À noter : dans la configuration actuelle de `app.routes.ts`, ces deux écrans ne sont pas enregistrés comme routes.** La connexion valide localement le formulaire puis navigue vers `/admin/dashboard`, route qui n’est pas non plus déclarée ici. L’inscription contient un TODO : aucun appel à un service d’authentification n’est réalisé. Ces écrans constituent donc actuellement une interface et une validation côté client, pas un flux d’authentification opérationnel.

## 6. Concepts Angular importants utilisés

### 6.1 Composants autonomes (*standalone*)

Les composants comportent `standalone: true` et listent les dépendances de template dans `imports`. Par exemple, `CommonModule` fournit notamment les fonctionnalités courantes, `RouterLink` les liens Angular, `FormsModule` `ngModel` et `ReactiveFormsModule` les formulaires réactifs. Cela permet de dépendre directement des éléments requis sans les déclarer dans un `NgModule` de fonctionnalité.

### 6.2 Liaison des données dans les templates

Les templates utilisent plusieurs formes de liaison Angular :

- `{{ valeur }}` : interpolation d’une propriété TypeScript dans le HTML.
- `[class.active]="condition"` et `[style.width.%]="valeur"` : liaison d’une propriété de classe ou de style.
- `(click)="supprimer(id)"` et `(input)="filtrer()"` : écoute d’événements de l’interface.
- `[(ngModel)]="recherche"` : liaison bidirectionnelle entre un champ de formulaire et une propriété du composant.
- `[routerLink]="['/modifier-agence', agence.id]"` : navigation construite avec une valeur dynamique.

Les templates utilisent la syntaxe de contrôle moderne `@if`, `@else`, `@for` et `@empty` pour afficher conditionnellement les états et parcourir les collections. Les boucles emploient par exemple `track agence.id` afin d’identifier les lignes à partir d’une clé stable.

### 6.3 Deux approches de formulaires

Le projet emploie les deux styles Angular :

**Formulaires réactifs** — utilisés notamment dans le formulaire d’agence, la connexion et l’inscription. Le `FormGroup` et les validateurs sont définis en TypeScript avec `FormBuilder`. Le HTML relie les champs avec `formControlName`. Cette approche facilite la validation structurée, l’accès à l’état (`invalid`, `touched`) et les validateurs personnalisés de groupe.

**Formulaires pilotés par le template** (*template-driven*) — utilisés dans les formulaires d’offre et de trajet ainsi que dans les champs de recherche. `FormsModule` et `[(ngModel)]` synchronisent les valeurs du formulaire avec l’objet du composant. La validation métier est principalement écrite sous forme de conditions TypeScript dans la méthode d’enregistrement.

Les deux approches sont valides, mais garder une approche cohérente au sein d’un formulaire facilite son évolution et les tests.

### 6.4 Services et injection de dépendances

Les services sont décorés par `@Injectable({ providedIn: 'root' })`, ce qui les rend disponibles à l’application via l’injection de dépendances. Un composant les reçoit dans son constructeur, par exemple `AgenceService` dans `AgenceListComponent`. Le service conserve les détails de communication avec l’API, alors que le composant se concentre sur l’écran et ses interactions.

`app.config.ts` fournit `HttpClient` à l’application. Les services utilisent les méthodes `get`, `post`, `put` et `delete` selon l’opération. Les interfaces TypeScript passées à `HttpClient<T>` documentent la forme attendue des réponses, mais ne valident pas à elles seules les données reçues à l’exécution.

### 6.5 Observables et RxJS

`HttpClient` retourne des `Observable<T>`. Un Observable représente une source de valeurs asynchrones. Dans le code actuel, les composants s’y abonnent généralement avec `subscribe({ next, error })` :

- `next` reçoit les données lorsque la requête réussit ;
- `error` reçoit l’erreur et permet de mettre à jour `errorMessage` ;
- `isLoading` est généralement passé à `false` à la fin du succès ou de l’échec.

Les services appliquent `catchError()` pour transformer les erreurs HTTP en erreurs plus lisibles et propager une erreur RxJS avec `throwError()`. Dans les statistiques détaillées, `forkJoin()` attend que les deux requêtes indépendantes soient terminées puis émet un objet regroupant leurs résultats. Les requêtes HTTP sont des Observables qui émettent généralement une réponse puis se terminent ; les abonnements montrés ici ne sont donc pas des abonnements permanents à un flux continu.

### 6.6 Routes et paramètres

`ActivatedRoute` permet aux composants de lire les paramètres de l’URL (`paramMap.get('id')`) et les paramètres de requête (`queryParamMap.get('message')`). Les formulaires réutilisés pour ajouter et modifier détectent la présence de `id` pour choisir leur mode. `Router` sert à naviguer par code après une action, par exemple après une sauvegarde ou pour ouvrir le détail des statistiques.

Le message de réussite des créations/modifications est transmis avec un paramètre de requête, lu par l’écran de liste, puis retiré de l’URL en naviguant avec `replaceUrl: true`.

### 6.7 Pagination et filtres

La pagination affichée par les listes est, dans les pages actuellement décrites, **côté client** : le composant reçoit une collection complète, calcule l’index de départ, puis utilise `slice()` pour extraire la page courante.

Pour une page commençant à 1 et une taille `taillePage`, l’index de départ est :

$$
\text{début} = (\text{page} - 1) \times \text{taillePage}
$$

Les éléments rendus sont la tranche `slice(début, début + taillePage)`. Le nombre de pages est calculé par `ceil(nombreDeRésultats / taillePage)`, avec un minimum d’une page. Une recherche ou un filtre remet la page à 1 afin de ne pas rester sur une page devenue invalide.

Les services d’offres et de trajets proposent aussi des méthodes paginées côté serveur (`getAllOffresPaginated()`, `getAllTrajetsPaginated()`, avec paramètres `page`, `size`, etc.). **Les composants de liste actuels utilisent plutôt les méthodes qui récupèrent toutes les données et font leur pagination dans le navigateur**. Il faut donc distinguer les capacités prévues dans les services de celles effectivement utilisées par les écrans.

### 6.8 Signaux Angular

Les composants de connexion et d’inscription utilisent `signal()` pour quelques états locaux simples comme le type d’utilisateur et la visibilité du mot de passe. Une lecture se fait avec `signal()`, une affectation avec `.set()` et une mise à jour calculée avec `.update()`. La plupart des autres composants utilisent des propriétés de classe ordinaires.

## 7. Contrats de données et DTO

Les interfaces `*RequestDTO` représentent généralement les champs envoyés à l’API ; les interfaces `*ResponseDTO` représentent les données retournées et incluent souvent un identifiant et des relations enrichies. Par exemple, une requête d’offre porte `agenceId` et `trajetId`, alors qu’une réponse d’offre expose `agence` et `trajet`.

Ces types améliorent l’autocomplétion et détectent des incohérences lors de la compilation. Ils servent de contrat entre le frontend et le backend : leurs propriétés doivent rester alignées avec les DTO renvoyés ou attendus par l’API.

## 8. Gestion des états d’écran et des erreurs

Les pages déclarent généralement des propriétés telles que :

- `isLoading` pour rendre un état de chargement pendant l’appel réseau ;
- `errorMessage` pour présenter une erreur ;
- `successMessage` pour confirmer une opération ;
- des tableaux de données et de résultats filtrés pour l’affichage.

Les templates conditionnent leur rendu avec `@if` et `@else`. Les services centralisent une partie du traitement HTTP des erreurs, puis le composant reçoit un message affichable. Les opérations destructives demandent généralement une confirmation avec `confirm()`.

## 9. Fichiers principaux à connaître

### Configuration et présentation générale

- [src/main.ts](src/main.ts) — bootstrap de l’application.
- [src/app/app.component.ts](src/app/app.component.ts) et [src/app/app.component.html](src/app/app.component.html) — composant racine et point de rendu du routeur.
- [src/app/app.config.ts](src/app/app.config.ts) — fournisseurs globaux Angular.
- [src/app/app.routes.ts](src/app/app.routes.ts) — table des routes.
- [src/app/shared/layouts/admin-layout/admin-layout.component.html](src/app/shared/layouts/admin-layout/admin-layout.component.html) — navigation et squelette du tableau de bord.
- [src/styles.scss](src/styles.scss) — styles globaux, Bootstrap et icônes.
- [package.json](package.json) — versions et scripts (`start`, `build`, `test`).

### Données métier

- Agences : [agence.model.ts](src/app/features/agences/models/agence.model.ts), [agence.service.ts](src/app/features/agences/data-access/agence.service.ts).
- Trajets : [trajet.model.ts](src/app/features/trajets/models/trajet.model.ts), [trajet.service.ts](src/app/features/trajets/data-access/trajet.service.ts).
- Offres : [offre.model.ts](src/app/features/offres/models/offre.model.ts), [offre.service.ts](src/app/features/offres/data-access/offre.service.ts).
- Statistiques : [stat.model.ts](src/app/features/statistiques/model/stat.model.ts), [sats.service.ts](src/app/features/statistiques/service/sats.service.ts).
- Rapport : [rapport.model.ts](src/app/features/rapport/model/rapport.model.ts), [rapport.service.ts](src/app/features/rapport/service/rapport.service.ts).

### Écrans et formulaires

- Listes : `features/<domaine>/pages/<nom>-list/`.
- Formulaires : `features/<domaine>/components/<nom>-form/`.
- Détail statistique : [ag-stats.component.ts](src/app/features/statistiques/component/ag-stats/ag-stats.component.ts) et son template associé.
- Rapport : [rapport-global.component.ts](src/app/features/rapport/pages/rapport-global/rapport-global.component.ts) et son template associé.
- Authentification : [login.component.ts](src/app/features/auth/pages/login/login.component.ts), [register.component.ts](src/app/features/auth/pages/register/register.component.ts).

## 10. Points d’attention et limites observables

1. **Authentification non raccordée** : les écrans existent, mais les routes de connexion/inscription ne figurent pas dans `app.routes.ts`, aucun `AuthService` n’est utilisé, et la connexion navigue vers une URL de tableau de bord non déclarée.
2. **Réservations** : un lien « Réservations » apparaît dans la barre latérale, mais aucune route correspondante n’est présente dans la configuration fournie. La fonctionnalité de gestion des réservations n’est donc pas accessible depuis ces routes.
3. **Pagination mixte** : des services exposent une pagination backend pour trajets/offres, mais les vues observées paginent principalement les collections chargées intégralement en mémoire. Avec beaucoup de données, il serait préférable de brancher les écrans sur les endpoints paginés.
4. **URL de backend fixe** : les services utilisent `localhost:8080`. Pour plusieurs environnements (local, test, production), une configuration par environnement ou une URL de base centralisée serait plus maintenable.
5. **Validation frontend uniquement** : les validations côté Angular améliorent l’expérience utilisateur, mais le backend doit aussi valider les données et contrôler les accès.
6. **Formulaires hétérogènes** : agences/auth utilisent les formulaires réactifs, tandis qu’offres/trajets utilisent `ngModel`. Une harmonisation pourrait simplifier la maintenance, sans être nécessaire pour le fonctionnement actuel.
7. **Tests présents mais à compléter** : certains composants ont un test de création généré. Il serait utile d’ajouter des tests sur les validateurs, les calculs de pagination, les filtres et les interactions avec les services.

## 11. Mise en page responsive actuelle

Le responsive est réalisé avec des media queries CSS/SCSS, sans librairie Angular supplémentaire. Les pages conservent leurs composants et leurs données ; seuls leur agencement et leur présentation changent selon la largeur disponible.

### 11.1 Menu d’administration

À partir de 768 px de large, la barre latérale devient un tiroir fixe placé hors de l’écran. Le bouton burger contrôle `isSidebarOpen` dans `AdminLayoutComponent`, la classe CSS `open` fait glisser le tiroir, et `sidebar-overlay` permet de le fermer en cliquant à l’extérieur. Les liens ferment également le menu après la navigation. Le titre du tableau de bord et les actions d’en-tête sont adaptés aux petits écrans. Les trois fichiers à consulter sont :

- [admin-layout.component.ts](src/app/shared/layouts/admin-layout/admin-layout.component.ts) — état ouvert/fermé et fonctions de contrôle ;
- [admin-layout.component.html](src/app/shared/layouts/admin-layout/admin-layout.component.html) — bouton burger, tiroir, bouton fermer et voile ;
- [admin-layout.component.scss](src/app/shared/layouts/admin-layout/admin-layout.component.scss) — tiroir hors champ, transition et largeur mobile.

### 11.2 Listes sur téléphone

Les listes Agences, Offres et Statistiques ont été conçues pour éviter qu’un tableau de nombreuses colonnes réduise le contenu à une largeur illisible :

- **Agences** : sous 600 px, l’en-tête du tableau est masqué et chaque agence apparaît comme une fiche verticale. Les attributs `data-label` dans le HTML fournissent les intitulés « Agence », « Email professionnel », « Téléphone » et « Adresse ».
- **Offres** : sous 600 px, chaque offre devient une carte à deux colonnes. Le titre et les actions occupent toute la largeur ; l’agence, le prix et les places restent clairement identifiés.
- **Statistiques – liste des agences** : chaque agence apparaît sous forme de carte, avec ville, téléphone, adresse et accès aux statistiques.
- **Statistiques – détail d’une agence** : les cartes KPI, le classement, le graphique et la zone d’analyse passent sur une colonne ou une grille plus compacte ; les KPI deviennent une colonne sous 380 px.

Les seuils principaux de la liste sont 850 px pour la réorganisation générale de l’en-tête et des filtres, 600 px pour les fiches mobiles, et 360 px pour les appareils très étroits. Les règles sont dans les feuilles de style des composants indiquées aux sections 5.1, 5.3 et 5.4.

### 11.3 Formulaires et styles globaux

Les formulaires d’agence, trajet et offre réduisent leurs marges et passent les actions en colonne sur téléphone. Les champs des offres qui sont côte à côte sur grand écran s’empilent sous 600 px. Les écrans d’authentification limitent la largeur de la carte et ajustent les onglets. [src/styles.scss](src/styles.scss) fixe notamment une largeur minimale de document de 320 px, limite les débordements globaux et règle le comportement de base des médias et champs.

### 11.4 Comment vérifier le responsive

Dans les outils de développement du navigateur, tester au minimum 320 px (petit téléphone), 390 px (téléphone courant), 768 px (tablette/transition) et une largeur de bureau. Vérifier séparément la largeur totale du document et le défilement volontaire d’un élément particulier : un document ne doit pas déborder horizontalement, mais un tableau très large peut garder un défilement local si sa présentation en cartes n’est pas activée. Vérifier également que le tiroir peut être ouvert, fermé par son bouton, par le voile et après navigation.

## 12. Résumé mental du projet

Pour comprendre ou modifier une fonctionnalité, suivre cette chaîne :

```text
URL déclarée dans app.routes.ts
        ↓
Composant de page ou formulaire
        ↓
Service injecté (règles d’appel HTTP et URL API)
        ↓
Backend REST (réponse décrite par un DTO TypeScript)
        ↓
État du composant (données, chargement, erreur)
        ↓
Template Angular (affichage, filtres, formulaires, actions)
```

En résumé, le projet sépare déjà les responsabilités essentielles : les **modèles** décrivent les données, les **services** s’occupent de l’API, les **composants** coordonnent les interactions et les **templates** rendent l’interface. Les fonctionnalités métier les plus abouties sont les listes et formulaires de gestion, ainsi que les vues statistiques/rapport ; l’authentification et la gestion des réservations restent à raccorder ou à compléter.
