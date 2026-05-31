import { Moon, Sun, Play, Square, Plus, Users, RotateCcw, Gauge } from 'lucide-react';

export function Header({
    isDarkMode,
    toggleDarkMode,
    isSimulating,
    toggleSimulation,
    addCar,
    addFiveCars,
    isAutoMode,
    toggleAutoMode,
    resetParking,
    speed,
    setSpeed,
    systemStatus
}) {
    const labels = {
        normal: 'Normal',
        'almost-full': 'Almost Full',
        critical: 'Critical',
        full: 'Full'
    };

    const logoSrc = isDarkMode ? '/spaces-darkmode.png' : '/spaces-lightmode.png';

    return (
        <header className="header">
            <div className="header-top">
                <div className="header-brand">
                    <div className="app-logo">
                        <img src={logoSrc} alt="Parking Flow logo" />
                    </div>

                    <div>
                        <h1>Parking Flow</h1>
                        <p>Real-time smart parking simulator</p>
                    </div>
                </div>

                <div className="header-badges">
                    <span className="badge live">Live Simulation</span>
                    <span className={`badge ${systemStatus}`}>{labels[systemStatus]}</span>

                    <button className="icon-button" onClick={toggleDarkMode}>
                        {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                    </button>
                </div>
            </div>

            <div className="controls">
                <button className={isSimulating ? 'button danger' : 'button success'} onClick={toggleSimulation}>
                    {isSimulating ? <Square size={16} /> : <Play size={16} />}
                    {isSimulating ? 'Stop Simulation' : 'Start Simulation'}
                </button>

                <button className="button primary" onClick={addCar}>
                    <Plus size={16} />
                    Add Car
                </button>

                <button className="button primary" onClick={addFiveCars}>
                    <Users size={16} />
                    Add 5 Cars
                </button>

                <button className={isAutoMode ? 'button purple' : 'button secondary'} onClick={toggleAutoMode}>
                    <Gauge size={16} />
                    {isAutoMode ? 'Stop Auto Mode' : 'Start Auto Mode'}
                </button>

                <button className="button warning" onClick={resetParking}>
                    <RotateCcw size={16} />
                    Reset Parking
                </button>

                <div className="speed-control">
                    <span>Speed:</span>

                    {['slow', 'normal', 'fast'].map(item => (
                        <button
                            key={item}
                            onClick={() => setSpeed(item)}
                            className={speed === item ? 'speed active' : 'speed'}
                        >
                            {item}
                        </button>
                    ))}
                </div>
            </div>
        </header>
    );
}