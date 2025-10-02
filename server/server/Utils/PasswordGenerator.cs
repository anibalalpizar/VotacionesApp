using System.Security.Cryptography;

namespace Server.Utils
{
    public static class PasswordGenerator
    {
        private const string Pool = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@$%*#?";
        public static string New(int length = 10)
        {
            var bytes = RandomNumberGenerator.GetBytes(length);
            var chars = new char[length];
            for (int i = 0; i < length; i++)
                chars[i] = Pool[bytes[i] % Pool.Length];
            return new string(chars);
        }
    }
}
