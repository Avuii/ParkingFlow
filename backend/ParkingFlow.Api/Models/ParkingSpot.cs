namespace ParkingFlow.Api.Models;

public class ParkingSpot
{
    public string Id { get; set; } = "";
    public string Type { get; set; } = "standard";
    public bool Occupied { get; set; }
    public string? CarId { get; set; }
    public string? CarType { get; set; }
    public int? RemainingTime { get; set; }
    public int? TotalTime { get; set; }
    public DateTime? EnteredAt { get; set; }
}