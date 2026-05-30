-- R13 : Classement des vétérinaires selon le nombre de consultations
SELECT v.nom, v.prenom, COUNT(c.id_consult) AS nombre_consultations
FROM veterinaires v
LEFT JOIN consultations c ON v.id_veterinaire = c.id_veterinaire
GROUP BY v.id_veterinaire, v.nom, v.prenom
ORDER BY nombre_consultations DESC, v.nom ASC, v.prenom ASC;