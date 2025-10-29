using Server.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EleccionesUTN
{
    public interface IDatabase
    {
        bool YaVoto(string cedulaVotante);
        int GetCandidatoId(string cedulaCandidato);
        void RegistrarVoto(string cedulaVotante, int candidatoId);

        Task<bool> Login_ReturnsOk_WhenCredentialsAreValid(string username, string password);
        void RegistrarUser(string identificacion, string name, string email, string pass, UserRole role);

        void RegisrarElecciones(string nombreEleccion, DateTime fechaInicio, DateTime fechaFin, string status, int candidateCount, int voteCount, bool isActive);

        string GetVotante(string identificacion);
        int GetEleccion(int idEleccion);
    }
}
