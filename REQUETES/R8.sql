-- R8 : Propriétaires ayant plus d’un animal
SELECT p.nom, p.prenom, COUNT(a.id_animal) AS nombre_animaux
FROM proprietaires p
INNER JOIN animaux a ON p.id_proprietaire = a.id_proprietaire
GROUP BY p.id_proprietaire, p.nom, p.prenom
HAVING COUNT(a.id_animal) > 1;