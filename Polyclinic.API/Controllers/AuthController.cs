using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Polyclinic.Application.DTOs.Auth;
using Polyclinic.Application.Interfaces;
using System.Security.Claims;

namespace Polyclinic.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly IEnumerable<ISocialAuthProvider> _socialAuthProviders;

        public AuthController(IAuthService authService, IEnumerable<ISocialAuthProvider> socialAuthProviders)
        {
            _authService = authService;
            _socialAuthProviders = socialAuthProviders;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto dto)
        {
            var result = await _authService.RegisterAsync(dto);
            return Ok(result);
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto dto)
        {
            var result = await _authService.LoginAsync(dto);
            return Ok(result);
        }

        [HttpPost("refresh")]
        public async Task<IActionResult> Refresh([FromBody] string refreshToken)
        {
            var result = await _authService.RefreshTokenAsync(refreshToken);
            return Ok(result);
        }

        [HttpPost("revoke")]
        public async Task<IActionResult> Revoke([FromBody] string refreshToken)
        {
            await _authService.RevokeTokenAsync(refreshToken);
            return Ok();
        }

        [HttpGet("social/{provider}")]
        public IActionResult SocialLogin(string provider)
        {
            var redirectUrl = $"http://localhost:5289/api/auth/social/callback";
            var properties = new AuthenticationProperties { RedirectUri = redirectUrl };

            var scheme = provider.ToLower() switch
            {
                "google" => "Google",
                "facebook" => "Facebook",
                _ => throw new ArgumentException("Provider invalid")
            };

            return Challenge(properties, scheme);
        }

        [HttpGet("social/callback")]
        public async Task<IActionResult> SocialCallback()
        {
            var result = await HttpContext.AuthenticateAsync(CookieAuthenticationDefaults.AuthenticationScheme);

            if (!result.Succeeded)
            {
                var error = result.Failure?.Message ?? "unknown";
                return Redirect($"http://localhost:5173/login?error=social_failed&reason={Uri.EscapeDataString(error)}");
            }

            var email = result.Principal?.FindFirst(ClaimTypes.Email)?.Value;
            var firstName = result.Principal?.FindFirst(ClaimTypes.GivenName)?.Value;
            var lastName = result.Principal?.FindFirst(ClaimTypes.Surname)?.Value;
            var provider = result.Properties?.Items[".AuthScheme"] ?? "unknown";

            var authResult = await _authService.SocialLoginAsync(new SocialLoginDto
            {
                Email = email ?? string.Empty,
                FirstName = firstName ?? string.Empty,
                LastName = lastName ?? string.Empty,
                Provider = provider,
            });

            return Redirect($"http://localhost:5173/auth/callback?accessToken={authResult.AccessToken}&refreshToken={authResult.RefreshToken}");
        }
        [HttpGet("verify-email")]
        [AllowAnonymous]
        public async Task<IActionResult> VerifyEmail([FromQuery] string token)
        {
            var result = await _authService.VerifyEmailAsync(token);
            if (!result)
                return Redirect("http://localhost:5173/verify-email?success=false");
            return Redirect("http://localhost:5173/verify-email?success=true");
        }
        [HttpPost("resend-verification")]
        [Authorize]
        public async Task<IActionResult> ResendVerification()
        {
            var email = User.FindFirst(ClaimTypes.Email)?.Value
                ?? User.FindFirst("email")?.Value;
            if (email == null) return Unauthorized();

            await _authService.ResendVerificationEmailAsync(email);
            return Ok(new { message = "Email trimis" });
        }
        [HttpPost("forgot-password")]
        [AllowAnonymous]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDto dto)
        {
            await _authService.ForgotPasswordAsync(dto.Email);
            return Ok(new { message = "Dacă email-ul există, vei primi un link de resetare" });
        }

        [HttpPost("reset-password")]
        [AllowAnonymous]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto dto)
        {
            var result = await _authService.ResetPasswordAsync(dto.Token, dto.NewPassword);
            if (!result) return BadRequest(new { message = "Token invalid sau expirat" });
            return Ok(new { message = "Parola a fost resetată cu succes" });
        }

        public class ForgotPasswordDto
        {
            public string Email { get; set; } = string.Empty;
        }

        public class ResetPasswordDto
        {
            public string Token { get; set; } = string.Empty;
            public string NewPassword { get; set; } = string.Empty;
        }
    }
}
