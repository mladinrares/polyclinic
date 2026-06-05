using Microsoft.AspNetCore.Mvc;
using Polyclinic.Application.DTOs.ChatBot;
using System.Text;
using System.Text.Json;

namespace Polyclinic.API.Controllers
{
    [ApiController]
    [Route("api/chat")]
    public class ChatController : ControllerBase
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;

        public ChatController(IHttpClientFactory httpClientFactory, IConfiguration configuration)
        {
            _httpClient = httpClientFactory.CreateClient();
            _configuration = configuration;
        }

        [HttpPost]
        public async Task<IActionResult> Chat([FromBody] ChatRequestDto dto)
        {
            var apiKey = _configuration["Anthropic:ApiKey"];

            var requestBody = new
            {
                model = "claude-sonnet-4-20250514",
                max_tokens = 1000,
                system = dto.System,
                messages = dto.Messages,
            };

            var request = new HttpRequestMessage(HttpMethod.Post, "https://api.anthropic.com/v1/messages");
            request.Headers.Add("x-api-key", apiKey);
            request.Headers.Add("anthropic-version", "2023-06-01");
            request.Content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");

            var response = await _httpClient.SendAsync(request);
            var content = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
                return StatusCode((int)response.StatusCode, content);

            return Ok(JsonSerializer.Deserialize<object>(content));
        }
    }

    
}
