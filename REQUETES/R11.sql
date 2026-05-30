-- R11 : Animaux dont le poids est supérieur à la moyenne globale
SELECT nom_animal, espece, poids_kg
FROM animaux
WHERE poids_kg > (
    SELECT AVG(poids_kg)
    FROM animaux
    WHERE poids_kg IS NOT NULL
);