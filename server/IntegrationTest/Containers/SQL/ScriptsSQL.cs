using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace IntegrationTest
{
    internal struct ScriptsQLS
    {
        /// <summary>
        /// Creates the Users table (SQL Server version)
        /// </summary>
        internal const string Users = """
            IF OBJECT_ID('dbo.Users', 'U') IS NOT NULL DROP TABLE dbo.Users;

            CREATE TABLE dbo.Users (
                UserId INT IDENTITY(1,1) PRIMARY KEY,
                Identification VARCHAR(20) NOT NULL UNIQUE,
                FullName VARCHAR(100) NOT NULL,
                Email VARCHAR(100) NOT NULL UNIQUE,
                PasswordHash VARCHAR(255) NULL,
                Role VARCHAR(20) CHECK (Role IN ('Auditor', 'Voter', 'Admin')),
                CreatedAt DATETIME DEFAULT GETDATE(),
                TemporalPassword VARCHAR(255) NULL
            );
        """;

        /// <summary>
        /// Creates the Elections table (SQL Server version)
        /// </summary>
        internal const string Elections = """
            IF OBJECT_ID('dbo.Elections', 'U') IS NOT NULL DROP TABLE dbo.Elections;

            CREATE TABLE dbo.Elections (
                ElectionId INT IDENTITY(1,1) PRIMARY KEY,
                Name VARCHAR(100) NOT NULL,
                StartDate DATETIME NOT NULL,
                EndDate DATETIME NOT NULL
            );
        """;

        /// <summary>
        /// Creates the Candidates table (SQL Server version)
        /// </summary>
        internal const string Candidates = """
            IF OBJECT_ID('dbo.Candidates', 'U') IS NOT NULL DROP TABLE dbo.Candidates;

            CREATE TABLE dbo.Candidates (
                CandidateId INT IDENTITY(1,1) PRIMARY KEY,
                Name VARCHAR(100) NOT NULL,
                Party VARCHAR(100) NOT NULL,
                ElectionId INT NOT NULL,
                CONSTRAINT FK_Candidates_Elections FOREIGN KEY (ElectionId)
                    REFERENCES dbo.Elections (ElectionId),
                CONSTRAINT UQ_Candidate UNIQUE (Name, ElectionId)
            );
        """;

        /// <summary>
        /// Creates the Votes table (SQL Server version)
        /// </summary>
        internal const string Votes = """
            IF OBJECT_ID('dbo.Votes', 'U') IS NOT NULL DROP TABLE dbo.Votes;

            CREATE TABLE dbo.Votes (
                VoteId INT IDENTITY(1,1) PRIMARY KEY,
                ElectionId INT NOT NULL,
                VoterId INT NOT NULL,
                CandidateId INT NOT NULL,
                CastedAt DATETIME DEFAULT GETDATE(),
                CONSTRAINT FK_Votes_Elections FOREIGN KEY (ElectionId)
                    REFERENCES dbo.Elections (ElectionId),
                CONSTRAINT FK_Votes_Voters FOREIGN KEY (VoterId)
                    REFERENCES dbo.Users (UserId),
                CONSTRAINT FK_Votes_Candidates FOREIGN KEY (CandidateId)
                    REFERENCES dbo.Candidates (CandidateId),
                CONSTRAINT UQ_Vote UNIQUE (ElectionId, VoterId)
            );
        """;

        /// <summary>
        /// Creates the AuditLog table (SQL Server version)
        /// </summary>
        internal const string AuditLog = """
            IF OBJECT_ID('dbo.AuditLog', 'U') IS NOT NULL DROP TABLE dbo.AuditLog;

            CREATE TABLE dbo.AuditLog (
                AuditId INT IDENTITY(1,1) PRIMARY KEY,
                UserId INT NOT NULL,
                Action VARCHAR(50) NOT NULL,
                [Timestamp] DATETIME DEFAULT GETDATE(),
                Details VARCHAR(255) NULL,
                CONSTRAINT FK_AuditLog_Users FOREIGN KEY (UserId)
                    REFERENCES dbo.Users (UserId)
            );
        """;

        /// <summary>
        /// Inserts seed data (SQL Server version)
        /// </summary>
        internal const string Seed = """
            -- Insert test users
            INSERT INTO dbo.Users (Identification, FullName, Email, PasswordHash, Role)
            VALUES 
                ('101', 'Dennis Ritchie', 'dennis@example.com', NULL, 'Voter'),
                ('102', 'Bjorn Stroustrup', 'bjorn@example.com', NULL, 'Voter'),
                ('103', 'Richard Stallman', 'richard@example.com', NULL, 'Voter'),
                ('104', 'Linus Torvalds', 'linus@example.com', NULL, 'Admin'),
                ('105', 'Grace Hopper', 'grace@example.com', NULL, 'Auditor');

            -- Insert test election
            INSERT INTO dbo.Elections (Name, StartDate, EndDate)
            VALUES ('Elección Presidencial 2024', '2024-11-01', '2024-11-30');

            -- Insert test candidates
            INSERT INTO dbo.Candidates (Name, Party, ElectionId)
            VALUES 
                ('Mr. Anderson', 'Partido A', 1),
                ('Morpheus', 'Partido B', 1),
                ('Trinity', 'Partido C', 1);

            -- Insert test vote
            INSERT INTO dbo.Votes (ElectionId, VoterId, CandidateId)
            VALUES (1, 2, 1); -- Bjorn voted for Mr. Anderson
        """;

        // ===== LEGACY SCRIPTS =====

        internal const string DDL = """
            IF OBJECT_ID('dbo.votantes', 'U') IS NOT NULL DROP TABLE dbo.votantes;
            IF OBJECT_ID('dbo.candidatos', 'U') IS NOT NULL DROP TABLE dbo.candidatos;

            CREATE TABLE dbo.candidatos (
                id INT IDENTITY(1,1) PRIMARY KEY,
                cedula NVARCHAR(50) NOT NULL UNIQUE,
                nombre NVARCHAR(100) NOT NULL
            );

            CREATE TABLE dbo.votantes (
                id INT IDENTITY(1,1) PRIMARY KEY,
                nombre NVARCHAR(100) NOT NULL,
                cedula NVARCHAR(50) NOT NULL UNIQUE,
                ya_voto BIT NOT NULL DEFAULT 0,
                candidato_votado_id INT NULL FOREIGN KEY REFERENCES dbo.candidatos(id),
                fecha_voto DATETIME NULL
            );
        """;

        internal const string SeedLegacy = """
            INSERT INTO dbo.candidatos (cedula, nombre)
            VALUES 
                ('901', 'Mr.Anderson.'),
                ('902', 'Morpheus');

            INSERT INTO dbo.votantes (nombre, cedula, ya_voto, candidato_votado_id)
            VALUES
                ('Dennis Ritchie', '101', 0, NULL),
                ('Bjorn Stroustrup', '102', 1, 1),
                ('Richard Stallman', '103', 0, NULL);
        """;

        internal const string votes = """
            IF OBJECT_ID('dbo.votos', 'U') IS NOT NULL DROP TABLE dbo.votos;

            CREATE TABLE dbo.votos (
                id INT IDENTITY(1,1) PRIMARY KEY,
                voterId INT NOT NULL,
                candidateId INT NOT NULL,
                electionid INT NOT NULL,
                [timestamp] DATETIME DEFAULT GETDATE()
            );
        """;
    }
}
