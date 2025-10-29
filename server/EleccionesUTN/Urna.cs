using Server.Models;
using System.ComponentModel.DataAnnotations.Schema;

namespace EleccionesUTN
{

    public class Urna
    {

        IDatabase _database;

        public Urna(IDatabase p_database)
        {
            _database = p_database; 
        }

        public bool RegistrarVoto(string cedulaVotante, string cedulaCandidato)
        {

            if (string.IsNullOrEmpty(cedulaVotante))
            {
                throw new ArgumentNullException(nameof(cedulaVotante));
            }

            if (string.IsNullOrEmpty(cedulaCandidato))
            {
                throw new ArgumentNullException(nameof(cedulaCandidato));
            }


            int candidatoId =_database.GetCandidatoId(cedulaCandidato); // Lanza NotFoundException si no existe el candidato
            int votanteId = _database.GetVotante(cedulaVotante);   // Lanza NotFoundException si no existe el votante
            int eleccionId = _database.GetEleccion(1); // Lanza NotFoundException si no existe la eleccion

            if (_database.YaVoto(cedulaVotante))
            {
                return true;
            }


            _database.RegistrarVoto(cedulaVotante, candidatoId);

            return true;
        }
    }

    public class LoginResult
    {
        IDatabase _database;

        public LoginResult(IDatabase p_database)
        {
            _database = p_database;
        }

        public bool Login_ReturnsOk_WhenCredentialsAreValid(string identi, string password)
        {
            if (string.IsNullOrEmpty(identi))
            {
                throw new ArgumentNullException(nameof(identi));
            }

            if (string.IsNullOrEmpty(password))
            {
                throw new ArgumentNullException(nameof(password));
            }

            _database.Login_ReturnsOk_WhenCredentialsAreValid(identi, password);

            return true;
        }

        public bool RegistrarUsers(string identificacion, string name, string email, string pass, UserRole role)
        {

            if (string.IsNullOrEmpty(identificacion))
            {
                throw new ArgumentNullException(nameof(identificacion));
            }

            if (string.IsNullOrEmpty(name))
            {
                throw new ArgumentNullException(nameof(name));
            }

            _database.RegistrarUser(identificacion, name, email, pass, role);

            return true;
        }
    }

    public class Elecciones
    {
        IDatabase _database;
        public Elecciones(IDatabase p_database)
        {
            _database = p_database;
        }
        public bool RegisrarElecciones(string nombreEleccion, DateTime fechaInicio, DateTime fechaFin, string status, int candidateCount, int voteCount,  bool isActive)
        {
            if (string.IsNullOrEmpty(nombreEleccion))
            {
                throw new ArgumentNullException(nameof(nombreEleccion));
            }
            _database.RegisrarElecciones(nombreEleccion, fechaInicio, fechaFin, status, candidateCount, voteCount, isActive);
            return true;
        }
    }


}
