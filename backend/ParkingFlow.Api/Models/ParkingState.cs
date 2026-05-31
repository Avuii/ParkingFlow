namespace ParkingFlow.Api.Models;

public class ParkingState
{
    public List<ParkingSpot> Spots { get; set; } = new();
    public List<ParkingCar> Queue { get; set; } = new();
    public List<ParkingEvent> Events { get; set; } = new();
    public ParkingStats Stats { get; set; } = new();
    public string SystemStatus { get; set; } = "normal";
    public bool IsSimulating { get; set; }
    public bool IsAutoMode { get; set; }
    public string Speed { get; set; } = "normal";
}