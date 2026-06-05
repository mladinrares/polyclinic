using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Polyclinic.Application.DTOs.ChatBot
{
    public class ChatRequestDto
    {
        public string System { get; set; } = string.Empty;
        public List<ChatMessageDto> Messages { get; set; } = new();
    }
}
