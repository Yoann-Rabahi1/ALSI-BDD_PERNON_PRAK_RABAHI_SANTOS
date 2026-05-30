-- R4 : Afficher les animaux avec leur propriétaire
SELECT a.nom_animal, a.espece, p.nom, p.prenom
FROM animaux a
INNER JOIN proprietaires p ON a.id_proprietaire = p.id_proprietaire;