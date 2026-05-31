using Microsoft.AspNetCore.SignalR;
using ParkingFlow.Api.Hubs;
using ParkingFlow.Api.Models;

namespace ParkingFlow.Api.Services;

public class ParkingService
{
    private readonly object _lock = new();
    private readonly IHubContext<ParkingHub> _hubContext;
    private SemaphoreSlim _parkingSemaphore;
    private CancellationTokenSource _tokenSource = new();

    private List<ParkingSpot> _spots;
    private readonly List<ParkingCar> _waitingCars = new();
    private readonly List<ParkingEvent> _events = new();

    private bool _isSimulating;
    private bool _isAutoMode;
    private string _speed = "normal";
    private int _servedToday;
    private int _peakOccupancy;
    private int _carCounter = 100;
    private Task? _autoModeTask;

    public ParkingService(IHubContext<ParkingHub> hubContext)
    {
        _hubContext = hubContext;
        _spots = CreateParkingSpots();
        _parkingSemaphore = new SemaphoreSlim(_spots.Count, _spots.Count);
    }

    public ParkingState GetState()
    {
        lock (_lock)
        {
            return BuildState();
        }
    }

    public async Task StartSimulationAsync()
    {
        lock (_lock)
        {
            _isSimulating = true;
            AddEventLocked("system", "Simulation started");
        }

        await SendStateAsync();
    }

    public async Task StopSimulationAsync()
    {
        lock (_lock)
        {
            _isSimulating = false;
            AddEventLocked("system", "Simulation stopped");
        }

        await SendStateAsync();
    }

    public async Task StartAutoModeAsync()
    {
        CancellationToken token;

        lock (_lock)
        {
            _isAutoMode = true;
            token = _tokenSource.Token;
            AddEventLocked("system", "Auto mode started");
        }

        if (_autoModeTask == null || _autoModeTask.IsCompleted)
        {
            _autoModeTask = Task.Run(() => AutoModeLoopAsync(token));
        }

        await SendStateAsync();
    }

    public async Task StopAutoModeAsync()
    {
        lock (_lock)
        {
            _isAutoMode = false;
            AddEventLocked("system", "Auto mode stopped");
        }

        await SendStateAsync();
    }

    public async Task SetSpeedAsync(string speed)
    {
        if (speed != "slow" && speed != "normal" && speed != "fast")
        {
            speed = "normal";
        }

        lock (_lock)
        {
            _speed = speed;
            AddEventLocked("system", $"Speed changed to {speed}");
        }

        await SendStateAsync();
    }

    public async Task AddCarAsync()
    {
        ParkingCar car;
        CancellationToken token;

        lock (_lock)
        {
            car = CreateCar();
            _waitingCars.Add(car);
            SortQueueLocked();
            token = _tokenSource.Token;
            AddEventLocked("waiting", $"{car.Id} is waiting in queue");
        }

        _ = Task.Run(() => ProcessCarAsync(car, token));

        await SendStateAsync();
    }

    public async Task AddCarsAsync(int count)
    {
        if (count < 1)
        {
            count = 1;
        }

        if (count > 10)
        {
            count = 10;
        }

        for (int i = 0; i < count; i++)
        {
            await AddCarAsync();
            await Task.Delay(100);
        }
    }

    public async Task ReleaseSpotAsync(string spotId)
    {
        string? carId = null;
        bool released = false;

        lock (_lock)
        {
            ParkingSpot? spot = _spots.FirstOrDefault(x => x.Id == spotId);

            if (spot == null || !spot.Occupied)
            {
                return;
            }

            carId = spot.CarId;
            ClearSpotLocked(spot);
            AddEventLocked("left", $"{carId} left spot {spotId}");
            released = true;
        }

        if (released)
        {
            _parkingSemaphore.Release();
        }

        await SendStateAsync();
    }

    public async Task ResetAsync()
    {
        _tokenSource.Cancel();

        lock (_lock)
        {
            _tokenSource.Dispose();
            _tokenSource = new CancellationTokenSource();

            _parkingSemaphore.Dispose();
            _spots = CreateParkingSpots();
            _parkingSemaphore = new SemaphoreSlim(_spots.Count, _spots.Count);

            _waitingCars.Clear();
            _events.Clear();

            _isSimulating = false;
            _isAutoMode = false;
            _servedToday = 0;
            _peakOccupancy = 0;
            _carCounter = 100;

            AddEventLocked("system", "Parking system has been reset");
        }

        await SendStateAsync();
    }

    private async Task ProcessCarAsync(ParkingCar car, CancellationToken token)
    {
        try
        {
            while (true)
            {
                token.ThrowIfCancellationRequested();

                await WaitForSimulationAsync(token);

                bool isFirst;

                lock (_lock)
                {
                    isFirst = _waitingCars.Count > 0 && _waitingCars[0].Id == car.Id;

                    if (!isFirst)
                    {
                        car.WaitingTime++;
                    }
                }

                if (isFirst)
                {
                    bool canEnter = await _parkingSemaphore.WaitAsync(0, token);

                    if (canEnter)
                    {
                        break;
                    }

                    lock (_lock)
                    {
                        car.WaitingTime++;
                    }
                }

                await SendStateAsync();
                await Task.Delay(GetDelay(), token);
            }

            lock (_lock)
            {
                ParkingSpot? selectedSpot = FindSpotForCarLocked(car);

                if (selectedSpot == null)
                {
                    _parkingSemaphore.Release();
                    return;
                }

                _waitingCars.RemoveAll(x => x.Id == car.Id);

                int totalTime = GetRandomParkingTime();

                selectedSpot.Occupied = true;
                selectedSpot.CarId = car.Id;
                selectedSpot.CarType = car.Type;
                selectedSpot.RemainingTime = totalTime;
                selectedSpot.TotalTime = totalTime;
                selectedSpot.EnteredAt = DateTime.Now;

                _servedToday++;

                int occupied = _spots.Count(x => x.Occupied);

                if (occupied > _peakOccupancy)
                {
                    _peakOccupancy = occupied;
                }

                AddEventLocked("entered", $"{car.Id} entered spot {selectedSpot.Id}");
            }

            await SendStateAsync();

            while (true)
            {
                token.ThrowIfCancellationRequested();

                await WaitForSimulationAsync(token);
                await Task.Delay(GetDelay(), token);

                bool carStillParked = true;
                bool carLeft = false;

                lock (_lock)
                {
                    ParkingSpot? currentSpot = _spots.FirstOrDefault(x => x.CarId == car.Id);

                    if (currentSpot == null || !currentSpot.Occupied)
                    {
                        carStillParked = false;
                    }
                    else if (currentSpot.RemainingTime.HasValue)
                    {
                        currentSpot.RemainingTime--;

                        if (currentSpot.RemainingTime <= 0)
                        {
                            string message = $"{currentSpot.CarId} left spot {currentSpot.Id}";
                            ClearSpotLocked(currentSpot);
                            AddEventLocked("left", message);
                            carLeft = true;
                        }
                    }
                }

                await SendStateAsync();

                if (!carStillParked)
                {
                    return;
                }

                if (carLeft)
                {
                    _parkingSemaphore.Release();
                    return;
                }
            }
        }
        catch (OperationCanceledException)
        {
        }
    }

    private async Task AutoModeLoopAsync(CancellationToken token)
    {
        try
        {
            while (!token.IsCancellationRequested)
            {
                bool shouldAddCar;

                lock (_lock)
                {
                    shouldAddCar = _isAutoMode && _isSimulating;
                }

                if (shouldAddCar)
                {
                    await AddCarAsync();
                }

                await Task.Delay(2500, token);
            }
        }
        catch (OperationCanceledException)
        {
        }
    }

    private async Task WaitForSimulationAsync(CancellationToken token)
    {
        while (true)
        {
            token.ThrowIfCancellationRequested();

            bool running;

            lock (_lock)
            {
                running = _isSimulating;
            }

            if (running)
            {
                return;
            }

            await Task.Delay(250, token);
        }
    }

    private ParkingCar CreateCar()
    {
        string[] types = { "normal", "electric", "vip" };
        string type = types[Random.Shared.Next(types.Length)];

        string priority = "normal";

        if (type == "electric")
        {
            priority = "medium";
        }

        if (type == "vip")
        {
            priority = "high";
        }

        string prefix = "CAR";

        if (type == "electric")
        {
            prefix = "EV";
        }

        if (type == "vip")
        {
            prefix = "VIP";
        }

        ParkingCar car = new()
        {
            Id = $"{prefix}-{_carCounter}",
            Type = type,
            Priority = priority,
            WaitingTime = 0
        };

        _carCounter++;

        return car;
    }

    private int GetRandomParkingTime()
    {
        int[] times = { 30, 45, 60, 75, 90, 120 };
        int index = Random.Shared.Next(times.Length);

        return times[index];
    }

    private List<ParkingSpot> CreateParkingSpots()
    {
        List<ParkingSpot> spots = new();
        string[] rows = { "A", "B", "C", "D" };

        for (int r = 0; r < rows.Length; r++)
        {
            for (int c = 1; c <= 5; c++)
            {
                int index = r * 5 + c - 1;
                string type = "standard";

                if (index == 2 || index == 12)
                {
                    type = "vip";
                }

                if (index == 4 || index == 14)
                {
                    type = "electric";
                }

                if (index == 9)
                {
                    type = "disabled";
                }

                if (index == 19)
                {
                    type = "reserved";
                }

                spots.Add(new ParkingSpot
                {
                    Id = $"{rows[r]}{c}",
                    Type = type,
                    Occupied = false
                });
            }
        }

        return spots;
    }

    private ParkingSpot? FindSpotForCarLocked(ParkingCar car)
    {
        if (car.Type == "electric")
        {
            ParkingSpot? electricSpot = _spots.FirstOrDefault(x => !x.Occupied && x.Type == "electric");

            if (electricSpot != null)
            {
                return electricSpot;
            }
        }

        if (car.Type == "vip")
        {
            ParkingSpot? vipSpot = _spots.FirstOrDefault(x => !x.Occupied && x.Type == "vip");

            if (vipSpot != null)
            {
                return vipSpot;
            }
        }

        ParkingSpot? standardSpot = _spots.FirstOrDefault(x => !x.Occupied && x.Type == "standard");

        if (standardSpot != null)
        {
            return standardSpot;
        }

        return _spots.FirstOrDefault(x => !x.Occupied);
    }

    private void ClearSpotLocked(ParkingSpot spot)
    {
        spot.Occupied = false;
        spot.CarId = null;
        spot.CarType = null;
        spot.RemainingTime = null;
        spot.TotalTime = null;
        spot.EnteredAt = null;
    }

    private void SortQueueLocked()
    {
        Dictionary<string, int> order = new()
        {
            { "high", 0 },
            { "medium", 1 },
            { "normal", 2 }
        };

        _waitingCars.Sort((a, b) => order[a.Priority].CompareTo(order[b.Priority]));
    }

    private void AddEventLocked(string type, string message)
    {
        _events.Add(new ParkingEvent
        {
            Id = $"event-{Guid.NewGuid()}",
            Type = type,
            Message = message,
            Timestamp = DateTime.Now
        });

        if (_events.Count > 80)
        {
            _events.RemoveAt(0);
        }
    }

    private int GetDelay()
    {
        lock (_lock)
        {
            if (_speed == "slow")
            {
                return 1600;
            }

            if (_speed == "fast")
            {
                return 500;
            }

            return 1000;
        }
    }

    private ParkingState BuildState()
    {
        int occupied = _spots.Count(x => x.Occupied);
        int free = _spots.Count - occupied;
        int averageWait = 0;
        int averageParkingTime = 0;
        string? nextReleaseSpotId = null;
        int? nextReleaseTime = null;

        if (_waitingCars.Count > 0)
        {
            averageWait = (int)_waitingCars.Average(x => x.WaitingTime);
        }

        List<ParkingSpot> occupiedSpots = _spots
            .Where(x => x.Occupied && x.RemainingTime.HasValue)
            .ToList();

        if (occupiedSpots.Count > 0)
        {
            averageParkingTime = (int)occupiedSpots.Average(x => x.TotalTime ?? 0);

            ParkingSpot nextReleaseSpot = occupiedSpots
                .OrderBy(x => x.RemainingTime)
                .First();

            nextReleaseSpotId = nextReleaseSpot.Id;
            nextReleaseTime = nextReleaseSpot.RemainingTime;
        }

        return new ParkingState
        {
            Spots = _spots.Select(x => new ParkingSpot
            {
                Id = x.Id,
                Type = x.Type,
                Occupied = x.Occupied,
                CarId = x.CarId,
                CarType = x.CarType,
                RemainingTime = x.RemainingTime,
                TotalTime = x.TotalTime,
                EnteredAt = x.EnteredAt
            }).ToList(),

            Queue = _waitingCars.Select(x => new ParkingCar
            {
                Id = x.Id,
                Type = x.Type,
                Priority = x.Priority,
                WaitingTime = x.WaitingTime
            }).ToList(),

            Events = _events.Select(x => new ParkingEvent
            {
                Id = x.Id,
                Type = x.Type,
                Message = x.Message,
                Timestamp = x.Timestamp
            }).ToList(),

            Stats = new ParkingStats
            {
                FreeSpots = free,
                Occupied = occupied,
                InQueue = _waitingCars.Count,
                ServedToday = _servedToday,
                CurrentOccupancy = occupied,
                TotalSpots = _spots.Count,
                PeakOccupancy = _peakOccupancy,
                AverageWaitTime = averageWait,
                AverageParkingTime = averageParkingTime,
                NextReleaseSpotId = nextReleaseSpotId,
                NextReleaseTime = nextReleaseTime
            },

            SystemStatus = GetSystemStatusLocked(occupied),
            IsSimulating = _isSimulating,
            IsAutoMode = _isAutoMode,
            Speed = _speed
        };
    }

    private string GetSystemStatusLocked(int occupied)
    {
        double value = (double)occupied / _spots.Count * 100;

        if (value == 100)
        {
            return "full";
        }

        if (value >= 90)
        {
            return "critical";
        }

        if (value >= 70)
        {
            return "almost-full";
        }

        return "normal";
    }

    private async Task SendStateAsync()
    {
        ParkingState state;

        lock (_lock)
        {
            state = BuildState();
        }

        await _hubContext.Clients.All.SendAsync("ParkingUpdated", state);
    }
}