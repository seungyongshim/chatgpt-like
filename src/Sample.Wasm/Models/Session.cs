namespace Sample.Wasm.Models
{
    using Microsoft.Extensions.AI;

    public class Session 
    { 
        public Guid Id { get; set; } 
        public string Title { get; set; } = string.Empty; 
        public List<ChatMessage> History { get; set; } = new(); 
    }
}