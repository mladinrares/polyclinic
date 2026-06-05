using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Polyclinic.API.Services;
using Polyclinic.Domain.Entities;
using Polyclinic.Infrastructure.Persistence;
using System.Security.Claims;

namespace Polyclinic.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class DocumentsController : ControllerBase
    {
        private readonly PolyclinicDbContext _context;
        private readonly FileStorageService _fileStorage;

        public DocumentsController(PolyclinicDbContext context, FileStorageService fileStorage)
        {
            _context = context;
            _fileStorage = fileStorage;
        }

        [HttpGet]
        public async Task<IActionResult> GetMyDocuments()
        {
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("sub")!.Value);

            var documents = await _context.Documents
                .Where(d => d.PatientId == userId)
                .OrderByDescending(d => d.CreatedAt)
                .Select(d => new
                {
                    d.Id,
                    d.Name,
                    d.Type,
                    d.FileUrl,
                    d.FileSize,
                    d.MimeType,
                    d.CreatedAt
                })
                .ToListAsync();

            return Ok(documents);
        }

        [HttpPost("upload")]
        public async Task<IActionResult> UploadDocument(
            [FromForm] IFormFile file,
            [FromForm] string type,
            [FromForm] string name)
        {
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("sub")!.Value);

            if (file.Length > 10 * 1024 * 1024)
                return BadRequest("Fișierul nu poate depăși 10MB");

            var allowedTypes = new[] { "application/pdf", "image/jpeg", "image/png", "image/jpg" };
            if (!allowedTypes.Contains(file.ContentType))
                return BadRequest("Doar PDF, JPG și PNG sunt acceptate");

            var fileUrl = await _fileStorage.SaveFileAsync(file, $"patients/{userId}");

            var document = new Document
            {
                Id = Guid.NewGuid(),
                PatientId = userId,
                Name = name,
                Type = type,
                FileUrl = fileUrl,
                FileSize = $"{file.Length / 1024} KB",
                MimeType = file.ContentType,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Documents.Add(document);
            await _context.SaveChangesAsync();

            return Ok(new { document.Id, document.Name, document.FileUrl });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteDocument(Guid id)
        {
            var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("sub")!.Value);

            var document = await _context.Documents
                .FirstOrDefaultAsync(d => d.Id == id && d.PatientId == userId);

            if (document == null)
                return NotFound();

            _fileStorage.DeleteFile(document.FileUrl);
            _context.Documents.Remove(document);
            await _context.SaveChangesAsync();

            return Ok();
        }
    }
}
