using Microsoft.AspNetCore.Mvc;
using ParkingFlow.Api.Models;
using ParkingFlow.Api.Services;

namespace ParkingFlow.Api.Controllers;

[ApiController]
[Route("api/parking")]
public class ParkingController : ControllerBase
{
    private readonly ParkingService _parkingService;

    public ParkingController(ParkingService parkingService)
    {
        _parkingService = parkingService;
    }

    [HttpGet("state")]
    public ActionResult<ParkingState> GetState()
    {
        return Ok(_parkingService.GetState());
    }

    [HttpPost("start")]
    public async Task<ActionResult> StartSimulation()
    {
        await _parkingService.StartSimulationAsync();
        return Ok();
    }

    [HttpPost("stop")]
    public async Task<ActionResult> StopSimulation()
    {
        await _parkingService.StopSimulationAsync();
        return Ok();
    }

    [HttpPost("auto-mode/start")]
    public async Task<ActionResult> StartAutoMode()
    {
        await _parkingService.StartAutoModeAsync();
        return Ok();
    }

    [HttpPost("auto-mode/stop")]
    public async Task<ActionResult> StopAutoMode()
    {
        await _parkingService.StopAutoModeAsync();
        return Ok();
    }

    [HttpPost("speed/{speed}")]
    public async Task<ActionResult> SetSpeed(string speed)
    {
        await _parkingService.SetSpeedAsync(speed);
        return Ok();
    }

    [HttpPost("add-car")]
    public async Task<ActionResult> AddCar()
    {
        await _parkingService.AddCarAsync();
        return Ok();
    }

    [HttpPost("add-cars/{count}")]
    public async Task<ActionResult> AddCars(int count)
    {
        await _parkingService.AddCarsAsync(count);
        return Ok();
    }

    [HttpPost("release/{spotId}")]
    public async Task<ActionResult> ReleaseSpot(string spotId)
    {
        await _parkingService.ReleaseSpotAsync(spotId);
        return Ok();
    }

    [HttpPost("reset")]
    public async Task<ActionResult> Reset()
    {
        await _parkingService.ResetAsync();
        return Ok();
    }
}