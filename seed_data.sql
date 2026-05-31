CREATE DATABASE IF NOT EXISTS railway;

USE railway;

-- Seed cohérent avec les données fournies.
-- Les IDs sont fixés pour garder les relations stables.

INSERT IGNORE INTO
    compte_users (
        id_user,
        mail,
        mot_de_passe,
        est_actif,
        role
    )
VALUES (
        1,
        'billy@gmail.com',
        'test1',
        1,
        'veto'
    ),
    (
        4,
        'yoann@gmail.com',
        'test12',
        1,
        'client'
    ),
    (
        5,
        'admin@vetoapp.fr',
        'admin',
        1,
        'admin'
    ),
    (
        6,
        'jean.dupont@mail.com',
        'testduppont',
        1,
        'client'
    ),
    (
        7,
        'marie.lavigne@mail.com',
        'testmarie',
        1,
        'client'
    ),
    (
        8,
        'lucas.bernard@mail.com',
        'testbernand',
        1,
        'client'
    ),
    (
        9,
        'dr.smith@veto.fr',
        'testsmith',
        1,
        'veto'
    ),
    (
        10,
        'dr.leclerc@veto.fr',
        'testleclrec',
        1,
        'veto'
    );

INSERT IGNORE INTO
    etablissements (
        id_etablissement,
        nom_etablissement,
        ville,
        adresse,
        est_actif
    )
VALUES (
        2,
        'VétoSanté Sud',
        'Paris',
        '45 Avenue d''Italie, 75013',
        1
    ),
    (
        3,
        'Urgences Vétos 24/7',
        'Lyon',
        '88 Boulevard de l''Hôpital, 69003',
        1
    ),
    (
        4,
        'Cabinet Félin Étoile',
        'Marseille',
        '3 Rue de Tilsitt, 13006',
        1
    ),
    (
        5,
        'Clinique de la Plage',
        'Nice',
        '15 Promenade des Anglais, 06000',
        1
    ),
    (
        6,
        'Clinique Vétérinaire du Capitole',
        'Toulouse',
        '15 Rue Lafayette, 31000',
        1
    ),
    (
        7,
        'Centre Hospitalier Vétérinaire Nord',
        'Lille',
        '42 Rue de la Barre, 59000',
        1
    ),
    (
        8,
        'Véto-Tech Euratlantique',
        'Bordeaux',
        '10 Quai de Paludate, 33800',
        1
    ),
    (
        9,
        'Clinique de la Presqu''île',
        'Lyon',
        '25 Rue de la République, 69002',
        1
    ),
    (
        10,
        'Espace Vétérinaire du Port',
        'Marseille',
        '5 Place de la Joliette, 13002',
        1
    ),
    (
        11,
        'Cabinet des Ducs',
        'Nantes',
        '8 Rue du Château, 44000',
        1
    ),
    (
        12,
        'Pôle Santé Animale Strasbourg',
        'Strasbourg',
        '12 Place Broglie, 67000',
        1
    ),
    (
        13,
        'Clinique Vétérinaire de l''Écusson',
        'Montpellier',
        '3 Rue de la Loge, 34000',
        1
    ),
    (
        14,
        'Véto-Bretagne Sud',
        'Rennes',
        '20 Rue d''Isly, 35000',
        1
    );

INSERT IGNORE INTO
    proprietaires (
        id_proprietaire,
        nom,
        prenom,
        telephone,
        id_user
    )
VALUES (
        2,
        'Rabahi',
        'Yoann',
        '0612986140',
        4
    ),
    (
        3,
        'dupont',
        'jean',
        '0601020304',
        6
    ),
    (
        4,
        'lavigne',
        'marie',
        '0611223344',
        7
    ),
    (
        5,
        'Bernard',
        'Lucas',
        '0788990011',
        8
    );

INSERT IGNORE INTO
    animaux (
        id_animal,
        nom_animal,
        espece,
        race,
        age,
        poids_kg,
        id_proprietaire,
        est_actif
    )
VALUES (
        1,
        'Neil',
        'Chien',
        'Retriver',
        7,
        10,
        2,
        1
    ),
    (
        3,
        'Felix',
        'Chat',
        'Goutiere',
        3,
        8,
        2,
        1
    ),
    (
        4,
        'Shadow',
        'Chien',
        'Berger Allemand',
        3,
        8,
        2,
        1
    ),
    (
        5,
        'Luna',
        'Chat',
        'Siamois',
        2,
        9,
        2,
        1
    ),
    (
        6,
        'Rex',
        'Chien',
        'Labrador',
        5,
        0,
        3,
        1
    ),
    (
        7,
        'Felix',
        'Chat',
        'Européen',
        4,
        0,
        3,
        1
    ),
    (
        8,
        'Misty',
        'Chat',
        'Maine Coon',
        1,
        0,
        4,
        1
    ),
    (
        9,
        'Bubulle',
        'Poisson',
        'Poisson Rouge',
        1,
        0,
        4,
        1
    ),
    (
        10,
        'Rocky',
        'Chien',
        'Bulldog Anglais',
        6,
        0,
        5,
        1
    );

INSERT IGNORE INTO
    veterinaires (
        id_veterinaire,
        nom,
        prenom,
        id_etablissement,
        id_user,
        telephone
    )
VALUES (
        1,
        'prak',
        'billy',
        2,
        1,
        '0838238428'
    ),
    (
        2,
        'John',
        'Smith',
        NULL,
        9,
        '0140506070'
    ),
    (
        3,
        'Hélène',
        'Leclerc',
        2,
        10,
        '0491002233'
    );

INSERT IGNORE INTO
    medicaments (
        id_medicament,
        nom_medicament,
        description,
        prix_unitaire
    )
VALUES (
        1,
        'Amoxicilline 250mg',
        'Antibiotique à large spectre pour infections bactériennes.',
        12.5
    ),
    (
        2,
        'Metacam Chien',
        'Anti-inflammatoire non stéroïdien (AINS) pour le soulagement de la douleur.',
        24.9
    ),
    (
        3,
        'Metacam Chat',
        'Suspension orale pour le traitement de l''inflammation chronique.',
        18.2
    ),
    (
        4,
        'Milbemax Chien',
        'Vermifuge complet contre les vers plats et ronds (comprimé).',
        8.75
    ),
    (
        5,
        'Milbemax Chat',
        'Vermifuge efficace en une seule prise.',
        6.5
    ),
    (
        6,
        'Bravecto Chien M',
        'Comprimé à croquer contre les puces et les tiques (durée 12 semaines).',
        35
    ),
    (
        7,
        'Apelka',
        'Traitement de l''hyperthyroïdie féline.',
        29.1
    ),
    (
        8,
        'Cosequin',
        'Complément alimentaire pour le soutien des articulations.',
        42
    ),
    (
        9,
        'Otamine',
        'Solution de nettoyage auriculaire pour chiens et chats.',
        9.3
    ),
    (
        10,
        'Eyelyt',
        'Solution de lavage oculaire stérile.',
        7.8
    );

INSERT IGNORE INTO
    consultations (
        id_consult,
        date_consult,
        diagnostic,
        id_animal,
        id_veterinaire
    )
VALUES (
        1,
        '2026-05-29 20:08:05',
        'il faudrait qu''il aille boire de l''eau',
        1,
        1
    ),
    (
        2,
        '2026-09-27 10:30:00',
        'en attente',
        1,
        1
    ),
    (
        7,
        '2026-05-20 00:00:00',
        'Infection urinaire - Traitement antibiotique prescrit',
        10,
        2
    ),
    (
        8,
        '2026-05-22 00:00:00',
        'Otite externe sévère - Nettoyage requis',
        3,
        3
    ),
    (
        9,
        '2026-05-25 00:00:00',
        'Vaccination annuelle et rappel rage',
        4,
        1
    ),
    (
        10,
        '2026-05-28 00:00:00',
        'Gingivite et tartre important',
        5,
        3
    );

INSERT IGNORE INTO
    prescriptions (
        id_prescription,
        id_consult,
        id_medicament,
        posologie,
        duree_traitement
    )
VALUES (1, 1, 1, '2', '8'),
    (
        2,
        10,
        1,
        '1 comprimé matin et soir',
        '10 jours'
    ),
    (
        3,
        10,
        2,
        '0.5ml par jour dans la nourriture',
        '5 jours'
    );