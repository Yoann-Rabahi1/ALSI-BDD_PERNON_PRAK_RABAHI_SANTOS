-- R15 : Animal le plus lourd par espèce, avec égalités affichées
SELECT a.espece, a.nom_animal, a.poids_kg
FROM animaux a
WHERE a.poids_kg = (
    SELECT MAX(a2.poids_kg)
    FROM animaux a2
    WHERE a2.espece = a.espece
)
ORDER BY a.espece;