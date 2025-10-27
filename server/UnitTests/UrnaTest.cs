using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Xunit;

namespace UnitTests
{
    [TestClass]
    public class UrnaTest
    {
        [Fact]
        [TestMethod]
        public void RegistrarVotoValida_RetornaTrue_Test()
        {
            //Arrange
            string cedulaVotante = "101"; // Dennis Ritchie que no ha votado
            string cedulaCandidato = "902"; // Morpheus, candidato válido
            const bool EXPECTED_TRUE = true;

            Moq.Mock<EleccionesUTN.IDatabase> bdMock = new Moq.Mock<EleccionesUTN.IDatabase>();
            bdMock.Setup(db => db.YaVoto(cedulaVotante)).Returns(false);
            bdMock.Setup(db => db.GetCandidatoId(cedulaCandidato)).Returns(2); //Digamos que 2 es el ID de Morpheus
            bdMock.Setup(db => db.RegistrarVoto(cedulaVotante, 2)).Verifiable();


            //Act
            EleccionesUTN.Urna urna = new EleccionesUTN.Urna(bdMock.Object);
            bool resultado = urna.RegistrarVoto(cedulaVotante, cedulaCandidato);

            //Assert
            Assert.AreEqual(EXPECTED_TRUE, resultado);
        }
    }
}
