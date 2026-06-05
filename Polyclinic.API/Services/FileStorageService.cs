namespace Polyclinic.API.Services
{
    public class FileStorageService
    {
        private readonly string _uploadPath;

        public FileStorageService(IWebHostEnvironment env)
        {
            _uploadPath = Path.Combine(env.WebRootPath ?? env.ContentRootPath,"uploads");
            Directory.CreateDirectory(_uploadPath);
        }

        public async Task<string> SaveFileAsync(IFormFile file, string subfolder)
        {
            var folder = Path.Combine(_uploadPath, subfolder);
            Directory.CreateDirectory(folder);

            var fileName = $"{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
            var filePath = Path.Combine(folder, fileName);

            using var stream = new FileStream(filePath, FileMode.Create);
            await file.CopyToAsync(stream);

            return $"/uploads/{subfolder}/{fileName}";
        }

        public void DeleteFile(string fileUrl)
        {
            var filePath = Path.Combine(_uploadPath, fileUrl.Replace("/uploads/", "").Replace("/", Path.DirectorySeparatorChar.ToString()));
            if (File.Exists(filePath))
                File.Delete(filePath);
        }
        public async Task<string> SaveProfilePictureAsync(IFormFile file, Guid userId)
        {
            var folder = Path.Combine(_uploadPath, "profiles");
            Directory.CreateDirectory(folder);

            var fileName = $"{userId}{Path.GetExtension(file.FileName)}";
            var filePath = Path.Combine(folder, fileName);

            using var stream = new FileStream(filePath, FileMode.Create);
            await file.CopyToAsync(stream);

            return $"/uploads/profiles/{fileName}";
        }
    }
}
