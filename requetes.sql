-- R1 : Liste de tous les animaux triés par ordre alphabétique
SELECT *
FROM animaux
ORDER BY nom_animal ASC;

-- R2 : Animaux ayant un poids supérieur à 8 kg
SELECT *
FROM animaux
WHERE poids_kg > 8;

-- R3 : Animaux appartenant au propriétaire dont l'id = 2
SELECT *
FROM animaux
WHERE id_proprietaire = 2;

-- R4 : Afficher les animaux avec leur propriétaire
SELECT a.nom_animal, a.espece, p.nom, p.prenom
FROM animaux a
INNER JOIN proprietaires p ON a.id_proprietaire = p.id_proprietaire;

-- R5 : Afficher tous les propriétaires, même ceux sans animal
SELECT p.nom, p.prenom, a.nom_animal
FROM proprietaires p
LEFT JOIN animaux a ON p.id_proprietaire = a.id_proprietaire;

-- R6 : Total dépensé en médicaments par consultation
SELECT c.id_consult, a.nom_animal, SUM(m.prix_unitaire) AS total_medicaments
FROM consultations c
INNER JOIN animaux a ON c.id_animal = a.id_animal
INNER JOIN prescriptions pr ON c.id_consult = pr.id_consult
INNER JOIN medicaments m ON pr.id_medicament = m.id_medicament
GROUP BY c.id_consult, a.nom_animal;

-- R7 : Nombre d'animaux par espèce
SELECT espece, COUNT(*) AS nombre_animaux
FROM animaux
GROUP BY espece
ORDER BY nombre_animaux DESC;

-- R8 : Propriétaires ayant plus d’un animal
SELECT p.nom, p.prenom, COUNT(a.id_animal) AS nombre_animaux
FROM proprietaires p
INNER JOIN animaux a ON p.id_proprietaire = a.id_proprietaire
GROUP BY p.id_proprietaire, p.nom, p.prenom
HAVING COUNT(a.id_animal) > 1;

-- R9 : Poids moyen par espèce, uniquement si la moyenne dépasse 8 kg
SELECT espece, AVG(poids_kg) AS poids_moyen
FROM animaux
WHERE poids_kg IS NOT NULL
GROUP BY espece
HAVING AVG(poids_kg) > 8;

-- R10 : Âge maximum par espèce
SELECT espece, MAX(age) AS age_maximum
FROM animaux
GROUP BY espece;

-- R11 : Animaux dont le poids est supérieur à la moyenne globale
SELECT nom_animal, espece, poids_kg
FROM animaux
WHERE id_animal IN (
    SELECT id_animal
    FROM animaux
    WHERE poids_kg > (SELECT AVG(poids_kg) FROM animaux)
);

-- R12 : Animaux dont toutes les consultations ont au moins une prescription
SELECT a.id_animal, a.nom_animal
FROM animaux a
WHERE EXISTS (
    SELECT 1
    FROM consultations c
    WHERE c.id_animal = a.id_animal
)
AND NOT EXISTS (
    SELECT 1
    FROM consultations c
    WHERE c.id_animal = a.id_animal
    AND NOT EXISTS (
        SELECT 1
        FROM prescriptions pr
        WHERE pr.id_consult = c.id_consult
    )
);

-- R13 : Classement des vétérinaires selon le nombre de consultations
SELECT v.nom, v.prenom, COUNT(c.id_consult) AS nombre_consultations
FROM veterinaires v
LEFT JOIN consultations c ON v.id_veterinaire = c.id_veterinaire
GROUP BY v.id_veterinaire, v.nom, v.prenom
ORDER BY nombre_consultations DESC, v.nom ASC, v.prenom ASC;

-- R14 : Vétérinaires ayant consulté au moins deux espèces différentes
SELECT v.nom, v.prenom
FROM veterinaires v
WHERE v.id_veterinaire IN (
    SELECT c.id_veterinaire
    FROM consultations c
    JOIN animaux a ON c.id_animal = a.id_animal
    GROUP BY c.id_veterinaire
    HAVING COUNT(DISTINCT a.espece) >= 2
);

-- R15 : Animal le plus lourd par espèce, avec égalités affichées
SELECT a.espece, a.nom_animal, a.poids_kg
FROM animaux a
WHERE NOT EXISTS (
    SELECT 1
    FROM animaux a2
    WHERE a2.espece = a.espece
    AND a2.poids_kg > a.poids_kg
)
ORDER BY a.espece;