

# Plan : IA Design Elite + Generation d'Images + Landing Multi-Pages

## Problemes identifies

1. **L'IA utilise `gemini-3-flash-preview`** (modele rapide mais basique) pour le design -- resultat moyen
2. **Aucune generation d'images** -- l'IA ne genere jamais de visuels, elle se contente de texte/JSON
3. **Les landing pages sont mono-page** -- pas de notion de pages multiples (ex: Accueil, A propos, Contact, etc.)

---

## Chantier 1 : IA Design de niveau superieur

### Changements

- **Upgrade du modele** : Passer de `google/gemini-3-flash-preview` a `google/gemini-3-pro-preview` dans la edge function `design-landing` pour des designs plus sophistiques et creatifs
- **Enrichir le system prompt** avec des references de design premium (Apple, Stripe, Airbnb), des regles de typographie avancees, des ratios de contraste, et des palettes harmonieuses basees sur la theorie des couleurs
- **Ajouter des exemples "few-shot"** dans le prompt : inclure 2-3 exemples de JSON de sortie exceptionnels pour guider l'IA vers un resultat haut de gamme

### Fichiers concernes
- `supabase/functions/design-landing/index.ts` -- upgrade modele + prompts enrichis

---

## Chantier 2 : Generation d'images IA

### Architecture

L'IA generera des images hero, produit et d'ambiance en utilisant le modele `google/gemini-2.5-flash-image` (generation d'images via l'API Lovable AI). Les images seront stockees dans le bucket `store-assets` existant.

### Nouvelle Edge Function : `generate-landing-images`

- Recoit le prompt de design + contexte (nom boutique, produit, ambiance)
- Appelle `google/gemini-2.5-flash-image` avec `modalities: ["image", "text"]`
- Decode le base64 retourne, upload dans le bucket `store-assets`
- Retourne les URLs publiques des images generees

### Integration dans le workflow

- **Option 1 (automatique)** : Apres la generation du design, un second appel genere les images pour les sections hero, gallery, before-after
- **Option 2 (manuelle)** : Bouton "Generer une image IA" dans l'editeur de chaque section ayant un champ image (hero, image, gallery, before-after)
- Les deux options seront implementees

### Modifications dans l'editeur

- Ajout d'un bouton "Generer avec l'IA" a cote de chaque champ `ImageUploader` dans le panneau de proprietes
- Dialog de prompt pour decrire l'image souhaitee
- Preview de l'image generee avant insertion

### Fichiers concernes
- Nouveau : `supabase/functions/generate-landing-images/index.ts`
- Modifie : `supabase/functions/design-landing/index.ts` -- appel optionnel de generation d'images
- Modifie : `src/pages/DashboardLandingEditor.tsx` -- bouton "Generer image IA" dans le panneau de proprietes
- Nouveau : `src/components/dashboard/AiImageDialog.tsx` -- dialog de generation d'image

---

## Chantier 3 : Landing Pages Multi-Pages

### Concept

Chaque landing page pourra avoir plusieurs **sous-pages** (ex: Accueil, A propos, Tarifs, Contact, FAQ). Le header affichera la navigation entre ces pages, et chaque page aura ses propres sections.

### Schema de donnees

Nouvelle table `landing_subpages` :

| Colonne | Type | Description |
|---------|------|-------------|
| id | uuid | Cle primaire |
| landing_page_id | uuid | FK vers landing_pages |
| title | text | Nom de la page (ex: "A propos") |
| slug | text | Sous-slug (ex: "about") |
| sections | jsonb | Sections de cette sous-page |
| sort_order | integer | Ordre dans la navigation |
| is_home | boolean | Page d'accueil par defaut |
| created_at | timestamptz | Date de creation |

Les politiques RLS seront liees a celles de `landing_pages` (le vendeur proprietaire peut CRUD).

### Changements dans l'editeur

- **Onglets de pages** en haut de l'editeur : barre d'onglets avec les sous-pages + bouton "+" pour en ajouter
- Chaque onglet charge ses propres sections dans le canvas
- Le header de la landing publique affichera automatiquement les liens vers les sous-pages
- La page d'accueil existante (`landing_pages.sections`) sera migree comme sous-page `is_home = true`

### Routage public

- `/lp/:slug` -- page d'accueil de la landing
- `/lp/:slug/:subpage` -- sous-page specifique

### Fichiers concernes
- Migration SQL : creation de `landing_subpages` + RLS
- Modifie : `src/pages/DashboardLandingEditor.tsx` -- onglets de pages, gestion multi-pages
- Modifie : `src/pages/LandingPagePublic.tsx` -- support des sous-pages
- Modifie : `src/components/landing/LandingSectionRenderer.tsx` -- navigation header dynamique
- Modifie : `src/App.tsx` -- nouvelle route `/lp/:slug/:subpage`

---

## Ordre d'implementation

1. **Chantier 1** -- Upgrade IA design (rapide, impact immediat)
2. **Chantier 2** -- Generation d'images IA (nouvelle edge function + integration editeur)
3. **Chantier 3** -- Multi-pages (migration DB + refonte editeur + routage)

---

## Details techniques

### Edge Function `generate-landing-images`

```text
POST /generate-landing-images
Body: { prompt: string, storeId: string, count: number }
Response: { images: [{ url: string, alt: string }] }
```

Utilise `google/gemini-2.5-flash-image` avec `modalities: ["image", "text"]`.
Les images base64 sont uploadees dans `store-assets/{storeId}/ai-generated/` via le SDK Supabase Storage (service role).

### Migration SQL pour `landing_subpages`

- Table avec FK vers `landing_pages(id)` ON DELETE CASCADE
- RLS : SELECT/INSERT/UPDATE/DELETE restreint au vendeur proprietaire via jointure sur `landing_pages.store_id` et `stores.user_id`
- Index sur `(landing_page_id, sort_order)`

### Retrocompatibilite

Les landing pages existantes (mono-page) continueront de fonctionner normalement. Les sections actuelles de `landing_pages.sections` resteront la source de verite pour les pages sans sous-pages. La migration vers le multi-pages sera opt-in.

