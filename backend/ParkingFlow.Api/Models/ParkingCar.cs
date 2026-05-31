namespace ParkingFlow.Api.Models;

public class ParkingCar
{
    public string Id { get; set; } = "";
    public string Type { get; set; } = "normal";
    public string Priority { get; set; } = "normal";
    public int WaitingTime { get; set; }
}