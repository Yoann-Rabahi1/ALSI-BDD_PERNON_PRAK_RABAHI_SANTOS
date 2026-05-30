-- R14 : Vétérinaires ayant consulté au moins deux espèces différentes
SELECT v.nom, v.prenom, COUNT(DISTINCT a.espece) AS nombre_especes
FROM veterinaires v
INNER JOIN consultations c ON v.id_veterinaire = c.id_veterinaire
INNER JOIN animaux a ON c.id_animal = a.id_animal
GROUP BY v.id_veterinaire, v.nom, v.prenom
HAVING COUNT(DISTINCT a.espece) >= 2;