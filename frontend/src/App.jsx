import { useEffect, useState } from 'react';
import * as signalR from '@microsoft/signalr';
import { ParkingSquare, Car, Clock, CheckCircle2 } from 'lucide-react';
import { Header } from './components/Header';
import { StatCard } from './components/StatCard';
import { ParkingGrid } from './components/ParkingGrid';
import { WaitingQueue } from './components/WaitingQueue';
import { ActivityLog } from './components/ActivityLog';
import { AnalyticsPanel } from './components/AnalyticsPanel';
import { SpotDetailsModal } from './components/SpotDetailsModal';
import { parkingApi } from './services/parkingApi';

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [parkingSpots, setParkingSpots] = useState([]);
  const [queue, setQueue] = useState([]);
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState({
    freeSpots: 20,
    occupied: 0,
    inQueue: 0,
    servedToday: 0,
    currentOccupancy: 0,
    totalSpots: 20,
    peakOccupancy: 0,
    averageWaitTime: 0,
    averageParkingTime: 0,
    nextReleaseSpotId: null,
    nextReleaseTime: null
  });
  const [systemStatus, setSystemStatus] = useState('normal');
  const [isSimulating, setIsSimulating] = useState(false);
  const [isAutoMode, setIsAutoMode] = useState(false);
  const [speed, setSpeedValue] = useState('normal');
  const [selectedSpotId, setSelectedSpotId] = useState(null);
  const [occupancyHistory, setOccupancyHistory] = useState([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);

  const selectedSpot = selectedSpotId
    ? parkingSpots.find(spot => spot.id === selectedSpotId)
    : null;

  function updateState(data) {
    setParkingSpots(data.spots || []);
    setQueue(data.queue || []);
    setEvents(data.events || []);
    setStats(data.stats);
    setSystemStatus(data.systemStatus);
    setIsSimulating(data.isSimulating);
    setIsAutoMode(data.isAutoMode);
    setSpeedValue(data.speed);

    setOccupancyHistory(prev => {
      const lastValue = prev[prev.length - 1];

      if (lastValue === data.stats.currentOccupancy) {
        return prev;
      }

      return [...prev.slice(1), data.stats.currentOccupancy];
    });
  }

  async function loadState() {
    const data = await parkingApi.getState();
    updateState(data);
  }

  async function runAction(action) {
    try {
      await action();
      await loadState();
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    loadState();

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${parkingApi.apiUrl}/parkingHub`)
      .withAutomaticReconnect()
      .build();

    connection.on('ParkingUpdated', data => {
      updateState(data);
    });

    connection.start().catch(error => {
      console.error(error);
    });

    return () => {
      connection.stop();
    };
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark');
      document.body.classList.remove('light');
    } else {
      document.body.classList.add('light');
      document.body.classList.remove('dark');
    }
  }, [isDarkMode]);

  return (
    <div className="app">
      <Header
        isDarkMode={isDarkMode}
        toggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        isSimulating={isSimulating}
        toggleSimulation={() => {
          if (isSimulating) {
            runAction(parkingApi.stopSimulation);
          } else {
            runAction(parkingApi.startSimulation);
          }
        }}
        addCar={() => runAction(parkingApi.addCar)}
        addFiveCars={() => runAction(() => parkingApi.addCars(5))}
        isAutoMode={isAutoMode}
        toggleAutoMode={() => {
          if (isAutoMode) {
            runAction(parkingApi.stopAutoMode);
          } else {
            runAction(parkingApi.startAutoMode);
          }
        }}
        resetParking={() => runAction(parkingApi.resetParking)}
        speed={speed}
        setSpeed={(value) => runAction(() => parkingApi.setSpeed(value))}
        systemStatus={systemStatus}
      />

      <main className="main">
        <section className="stats-grid">
          <StatCard icon={ParkingSquare} label="Free Spots" value={stats.freeSpots} color="green" />
          <StatCard icon={Car} label="Occupied" value={stats.occupied} color="red" />
          <StatCard icon={Clock} label="In Queue" value={stats.inQueue} color="yellow" />
          <StatCard icon={CheckCircle2} label="Served Today" value={stats.servedToday} color="blue" />
        </section>

        <section className="dashboard-grid">
          <ParkingGrid
            spots={parkingSpots}
            onSpotClick={(spot) => setSelectedSpotId(spot.id)}
          />

          <aside className="side-column">
            <AnalyticsPanel
              currentOccupancy={stats.currentOccupancy}
              totalSpots={stats.totalSpots}
              peakOccupancy={stats.peakOccupancy}
              averageWaitTime={stats.averageWaitTime}
              averageParkingTime={stats.averageParkingTime}
              nextReleaseSpotId={stats.nextReleaseSpotId}
              nextReleaseTime={stats.nextReleaseTime}
              occupancyHistory={occupancyHistory}
            />

            <WaitingQueue queue={queue} />
          </aside>
        </section>

        <ActivityLog events={events} />
      </main>

      {selectedSpot && (
        <SpotDetailsModal
          spot={selectedSpot}
          onClose={() => setSelectedSpotId(null)}
          releaseSpot={(spotId) => runAction(() => parkingApi.releaseSpot(spotId))}
        />
      )}
    </div>
  );
}