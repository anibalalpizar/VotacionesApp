using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EleccionesUTN.Exceptions
{
    public class AlreadyVotedException : Exception
    {
        public AlreadyVotedException(string votante)
            : base($"El votante {votante} ya emitió su voto.") { }
    }
}
