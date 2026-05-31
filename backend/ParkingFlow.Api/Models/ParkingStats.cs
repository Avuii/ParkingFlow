namespace ParkingFlow.Api.Models;

public class ParkingStats
{
    public int FreeSpots { get; set; }
    public int Occupied { get; set; }
    public int InQueue { get; set; }
    public int ServedToday { get; set; }
    public int CurrentOccupancy { get; set; }
    public int TotalSpots { get; set; }
    public int PeakOccupancy { get; set; }
    public int AverageWaitTime { get; set; }
    public int AverageParkingTime { get; set; }
    public string? NextReleaseSpotId { get; set; }
    public int? NextReleaseTime { get; set; }
}