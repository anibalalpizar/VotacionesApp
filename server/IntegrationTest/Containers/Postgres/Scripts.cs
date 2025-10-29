using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace IntegrationTest
{
    internal struct Scripts
    {
        /// <summary>
        /// Crea la tabla Users según el esquema real de SQL Server
        /// </summary>
        internal const string Users = """
            DROP TABLE IF EXISTS "Users";

            CREATE TABLE "Users" (
                "UserId" SERIAL PRIMARY KEY,
                "Identification" VARCHAR(20) NOT NULL UNIQUE,
                "FullName" VARCHAR(100) NOT NULL,
                "Email" VARCHAR(100) NOT NULL UNIQUE,
                "PasswordHash" VARCHAR(255),
                "Role" VARCHAR(20) CHECK ("Role" IN ('Auditor', 'Voter', 'Admin')),
                "CreatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                "TemporalPassword" VARCHAR(255)
            );
        """;

        /// <summary>
        /// Crea la tabla Elections según el esquema real de SQL Server
        /// </summary>
        internal const string Elections = """
            DROP TABLE IF EXISTS "Elections";
            
            CREATE TABLE "Elections"(
                "ElectionId" SERIAL PRIMARY KEY,
                "Name" VARCHAR(100) NOT NULL,
                "StartDate" TIMESTAMP NOT NULL,
                "EndDate" TIMESTAMP NOT NULL
            );
        """;

        /// <summary>
        /// Crea la tabla Candidates según el esquema real de SQL Server
        /// </summary>
        internal const string Candidates = """
            DROP TABLE IF EXISTS "Candidates";
            
            CREATE TABLE "Candidates"(
                "CandidateId" SERIAL PRIMARY KEY,
                "Name" VARCHAR(100) NOT NULL,
                "Party" VARCHAR(100) NOT NULL,
                "ElectionId" INT NOT NULL,
                CONSTRAINT "FK_Candidates_Elections" FOREIGN KEY("ElectionId") 
                    REFERENCES "Elections"("ElectionId"),
                CONSTRAINT "UQ_Candidate" UNIQUE ("Name", "ElectionId")
            );
        """;

        /// <summary>
        /// Crea la tabla Votes según el esquema real de SQL Server
        /// </summary>
        internal const string Votes = """
            DROP TABLE IF EXISTS "Votes";
            
            CREATE TABLE "Votes"(
                "VoteId" SERIAL PRIMARY KEY,
                "ElectionId" INT NOT NULL,
                "VoterId" INT NOT NULL,
                "CandidateId" INT NOT NULL,
                "CastedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "FK_Votes_Elections" FOREIGN KEY("ElectionId") 
                    REFERENCES "Elections"("ElectionId"),
                CONSTRAINT "FK_Votes_Voters" FOREIGN KEY("VoterId") 
                    REFERENCES "Users"("UserId"),
                CONSTRAINT "FK_Votes_Candidates" FOREIGN KEY("CandidateId") 
                    REFERENCES "Candidates"("CandidateId"),
                CONSTRAINT "UQ_Vote" UNIQUE ("ElectionId", "VoterId")
            );
        """;

        /// <summary>
        /// Crea la tabla AuditLog según el esquema real de SQL Server
        /// </summary>
        internal const string AuditLog = """
            DROP TABLE IF EXISTS "AuditLog";
            
            CREATE TABLE "AuditLog"(
                "AuditId" SERIAL PRIMARY KEY,
                "UserId" INT NOT NULL,
                "Action" VARCHAR(50) NOT NULL,
                "Timestamp" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                "Details" VARCHAR(255),
                CONSTRAINT "FK_AuditLog_Users" FOREIGN KEY("UserId") 
                    REFERENCES "Users"("UserId")
            );
        """;

        /// <summary>
        /// Script de datos de prueba (seed data)
        /// </summary>
        internal const string Seed = """
            -- Insertar usuarios de prueba
            INSERT INTO "Users"("Identification", "FullName", "Email", "PasswordHash", "Role")
            VALUES 
                ('101', 'Dennis Ritchie', 'dennis@example.com', NULL, 'Voter'),
                ('102', 'Bjorn Stroustrup', 'bjorn@example.com', NULL, 'Voter'),
                ('103', 'Richard Stallman', 'richard@example.com', NULL, 'Voter'),
                ('104', 'Linus Torvalds', 'linus@example.com', NULL, 'Admin'),
                ('105', 'Grace Hopper', 'grace@example.com', NULL, 'Auditor');

            -- Insertar una elección de prueba
            INSERT INTO "Elections"("Name", "StartDate", "EndDate")
            VALUES ('Elección Presidencial 2024', '2024-11-01', '2024-11-30');

            -- Insertar candidatos de prueba
            INSERT INTO "Candidates"("Name", "Party", "ElectionId")
            VALUES 
                ('Mr. Anderson', 'Partido A', 1),
                ('Morpheus', 'Partido B', 1),
                ('Trinity', 'Partido C', 1);

            -- Insertar un voto de prueba
            INSERT INTO "Votes"("ElectionId", "VoterId", "CandidateId")
            VALUES (1, 2, 1); -- Bjorn votó por Mr. Anderson
        """;

        // ===== SCRIPTS LEGACY (para compatibilidad con tests existentes) =====

        /// <summary>
        /// DDL legacy para tests de votantes y candidatos (si aún se usa)
        /// </summary>
        internal const string DDL = """
            DROP TABLE IF EXISTS votantes;
            DROP TABLE IF EXISTS candidatos;

            CREATE TABLE candidatos(
              id     SERIAL PRIMARY KEY,
              cedula TEXT NOT NULL UNIQUE,
              nombre TEXT NOT NULL
            );

            CREATE TABLE votantes(
              id                   SERIAL PRIMARY KEY,
              nombre               TEXT NOT NULL,
              cedula               TEXT NOT NULL UNIQUE,
              ya_voto              BOOLEAN NOT NULL DEFAULT FALSE,
              candidato_votado_id  INT NULL REFERENCES candidatos(id),
              fecha_voto           TIMESTAMP NULL
            );
        """;

        /// <summary>
        /// Seed legacy (si aún se usa)
        /// </summary>
        internal const string SeedLegacy = """
            INSERT INTO candidatos(cedula, nombre) 
            VALUES 
                ('901','Mr.Anderson.'), 
                ('902','Morpheus');

            INSERT INTO votantes(nombre, cedula, ya_voto, candidato_votado_id)
            VALUES
              ('Dennis Ritchie',  '101', FALSE, NULL),
              ('Bjorn Stroustrup', '102', TRUE,  1),
              ('Richard Stallman',   '103', FALSE, NULL);
        """;
        internal const string votes = """
            DROP TABLE IF EXISTS votos;
            CREATE TABLE votos(
                id SERIAL PRIMARY KEY,
                voterId int NOT NULL,
                candidateId int NOT NULL,
                electionid int NOT NULL,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """;

    }
}