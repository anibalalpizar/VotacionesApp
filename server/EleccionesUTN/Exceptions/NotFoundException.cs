using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EleccionesUTN.Exceptions
{
    public class NotFoundException : Exception
    {
        public NotFoundException(string entity, string id)
            : base($"{entity} con Id={id} no existe.") { }
    }
}
