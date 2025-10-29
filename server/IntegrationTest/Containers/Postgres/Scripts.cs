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
        /// Contains the Data Definition Language (DDL) script for managing the database schema of the voting system,
        /// including tables for candidates and voters.
        /// </summary>
        /// <remarks>This DDL script defines the structure of two tables: <list type="bullet"> <item>
        /// <description> <c>candidatos</c>: Stores information about candidates, including a unique identifier
        /// (<c>id</c>) and the candidate's name (<c>nombre</c>). </description> </item> <item> <description>
        /// <c>votantes</c>: Stores information about voters, including a unique identifier (<c>id</c>), the voter's
        /// name (<c>nombre</c>), their unique identification number (<c>cedula</c>), whether they have voted
        /// (<c>ya_voto</c>), the ID of the candidate they voted for (<c>candidato_votado_id</c>, referencing
        /// <c>candidatos</c>), and the timestamp of their vote (<c>fecha_voto</c>). </description> </item> </list> The
        /// script also includes logic to drop the tables if they already exist before creating them.</remarks>
        internal const string DDL = """
            drop table if exists votantes;
            drop table if exists candidatos;

            create table candidatos(
              id     serial primary key,
              cedula               text not null unique,
              nombre text not null
            );

            create table votantes(
              id                   serial primary key,
              nombre               text not null,
              cedula               text not null unique,
              ya_voto              boolean not null default false,
              candidato_votado_id  int null references candidatos(id),
              fecha_voto           timestamp null
            );
        """;


        /// <summary>
        /// Represents the SQL seed data used to initialize the database with default values for candidates and voters.
        /// </summary>
        /// <remarks>This constant contains SQL statements that insert predefined data into the
        /// "candidatos" and "votantes" tables. It is intended for internal use to populate the database during setup or
        /// testing.</remarks>
        internal const string Seed = """
            insert into candidatos(cedula, nombre) 
            values 
                ('901','Mr.Anderson.'), 
                ('902','Morpheus');


            insert into votantes(nombre, cedula, ya_voto, candidato_votado_id)
            values
              ('Dennis Ritchie',  '101', false, null),   -- aún no ha votado
              ('Bjorn Stroustrup', '102', true,  1),      -- ya votó por Ana
              ('Richard Stallman',   '103', false, null);   -- aún no ha votado
        """;

        internal const string users = """
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

        internal const string elections = """
            DROP TABLE IF EXISTS elecciones;
            CREATE TABLE elecciones(
                id SERIAL PRIMARY KEY,
                nombre_eleccion TEXT NOT NULL,
                fecha_inicio TIMESTAMP NOT NULL,
                fecha_fin TIMESTAMP NOT NULL,
                status TEXT NOT NULL,
                candidate_count INT NOT NULL,
                vote_count INT NOT NULL,
                is_active BOOLEAN NOT NULL
            );
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
