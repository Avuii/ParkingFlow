namespace ParkingFlow.Api.Models;

public class ParkingEvent
{
    public string Id { get; set; } = "";
    public string Type { get; set; } = "system";
    public string Message { get; set; } = "";
    public DateTime Timestamp { get; set; } = DateTime.Now;
}