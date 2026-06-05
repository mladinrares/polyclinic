using Polyclinic.Application.DTOs.Auth;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Polyclinic.Application.Interfaces
{
    public interface ISocialAuthProvider
    {
        string ProviderName { get; }
        Task<AuthResponseDto> LoginAsync(string token);
    }
}
