using System;
using System.Threading.Tasks;
using BCrypt.Net;
using Npgsql;
using Server.Models;

namespace EleccionesUTN
{
    public class PostgresDb : IDatabase
    {
        private readonly string _connectionString;

        public PostgresDb(string connectionString) => _connectionString = connectionString;



        /// <summary>
        /// Registra el voto de un votante para un candidato específico
        /// </summary>
        /// <param name="cedulaVotante"></param>
        /// <param name="candidatoId"></param>
        public void RegistrarVoto(string cedulaVotante, int candidatoId)
        {
            using var con = new NpgsqlConnection(_connectionString);
            con.OpenAsync();

            using (var upd = new NpgsqlCommand(@"update votantes
                                                   set ya_voto = true,
                                                       candidato_votado_id = @cid,
                                                       fecha_voto = now()
                                                 where cedula = @vid;", con))
            {
                upd.Parameters.AddWithValue("cid", candidatoId);
                upd.Parameters.AddWithValue("vid", cedulaVotante);
                upd.ExecuteNonQuery();
            }
        }


        /// <summary>
        /// Retorna el ID del candidato a partir de su cédula, si no existe lanza NotFoundException
        /// </summary>
        /// <param name="cedulaCandidato"></param>
        /// <returns></returns>
        /// <exception cref="Exceptions.NotFoundException"></exception>
        public int GetCandidatoId(string cedulaCandidato)
        {
            using var con = new NpgsqlConnection(_connectionString);
            con.OpenAsync();

            using (var sqlCmd = new NpgsqlCommand("select id from candidatos where cedula=@cid;", con))
            {
                sqlCmd.Parameters.AddWithValue("cid", cedulaCandidato);
                var id = sqlCmd.ExecuteScalar();

                if (id is null)
                    throw new Exceptions.NotFoundException("Candidato", cedulaCandidato);

                return (int)id;
            }
        }



        /// <summary>
        /// Retorna true si el votante ya ha votado, false en caso contrario. Si no existe el votante lanza NotFoundException
        /// </summary>
        /// <param name="cedulaVotante"></param>
        /// <returns></returns>
        /// <exception cref="Exceptions.NotFoundException"></exception>
        public bool YaVoto(string cedulaVotante)
        {
            using var con = new NpgsqlConnection(_connectionString);
            con.OpenAsync();

            using (var sqlCmd = new NpgsqlCommand("select ya_voto from votantes where cedula=@vid for update;", con))
            {
                sqlCmd.Parameters.AddWithValue("vid", cedulaVotante);
                var r = sqlCmd.ExecuteScalar();

                if (r is null)
                    throw new Exceptions.NotFoundException("Votante", cedulaVotante.ToString());

                return (bool)r;
            }
        }

        public async Task<bool> Login_ReturnsOk_WhenCredentialsAreValid(string identifi, string password)
        {
            await using var con = new NpgsqlConnection(_connectionString);
            await con.OpenAsync();

            const string query = @"
                SELECT COUNT(*) 
                FROM ""Users"" 
                WHERE ""Identification"" = @iden AND ""PasswordHash"" = @pass;
            ";

            await using var sqlCmd = new NpgsqlCommand(query, con);
            sqlCmd.Parameters.AddWithValue("iden", identifi);
            sqlCmd.Parameters.AddWithValue("pass", password);

            var result = (long?)await sqlCmd.ExecuteScalarAsync();

            if (result == 0)
                throw new Exceptions.NotFoundException("Usuario", identifi);

            return true;
        }

        /// <summary>
        /// Registra un usuario específico
        /// </summary>
        /// <param name="identificacion"></param>
        /// <param name="name"></param>
        public void RegistrarUser(string identificacion, string name, string email, string pass, UserRole role)
        {
            using var con = new NpgsqlConnection(_connectionString);
            con.Open();

            var hash = BCrypt.Net.BCrypt.HashPassword(pass);

            var roleValue = role switch
            {
                UserRole.ADMIN => "Admin",
                UserRole.VOTER => "Voter",
                _ => "Voter"
            };

            using var cmd = new NpgsqlCommand(@"
                INSERT INTO ""Users"" (""Identification"", ""FullName"", ""Email"", ""PasswordHash"", ""Role"")
                VALUES (@ident, @name, @email, @pass, @role);
            ", con);

            cmd.Parameters.AddWithValue("ident", identificacion);
            cmd.Parameters.AddWithValue("name", name);
            cmd.Parameters.AddWithValue("email", email);
            cmd.Parameters.AddWithValue("pass", hash);
            cmd.Parameters.AddWithValue("role", roleValue);

            cmd.ExecuteNonQuery();
        }

        public void RegisrarElecciones(string nombreEleccion, DateTime fechaInicio, DateTime fechaFin, string status, int candidateCount, int voteCount, bool isActive)
        {
            using var con = new NpgsqlConnection(_connectionString);
            con.Open();

            using var cmd = new NpgsqlCommand(@"
                INSERT INTO ""Elections"" (""Name"", ""StartDate"", ""EndDate"", ""Status"", ""CandidateCount"", ""VoteCount"", ""IsActive"")
                VALUES (@name, @startDate, @endDate, @status, @candidateCount, @voteCount, @isActive);", con);

            cmd.Parameters.AddWithValue("name", nombreEleccion);
            cmd.Parameters.AddWithValue("startDate", fechaInicio);
            cmd.Parameters.AddWithValue("endDate", fechaFin);
            cmd.Parameters.AddWithValue("status", status);
            cmd.Parameters.AddWithValue("candidateCount", candidateCount);
            cmd.Parameters.AddWithValue("voteCount", voteCount);
            cmd.Parameters.AddWithValue("isActive", isActive);

            cmd.ExecuteNonQuery();


            throw new NotImplementedException();
        }
    }
}
