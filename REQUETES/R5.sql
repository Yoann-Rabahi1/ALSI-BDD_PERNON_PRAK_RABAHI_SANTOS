-- R5 : Afficher tous les propriétaires, même ceux sans animal
SELECT p.nom, p.prenom, a.nom_animal
FROM proprietaires p
LEFT JOIN animaux a ON p.id_proprietaire = a.id_proprietaire;