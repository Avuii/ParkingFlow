import { TrendingUp, Users, Clock, BarChart3, TimerReset } from 'lucide-react';

export function AnalyticsPanel({
    currentOccupancy,
    totalSpots,
    peakOccupancy,
    averageWaitTime,
    averageParkingTime,
    nextReleaseSpotId,
    nextReleaseTime,
    occupancyHistory
}) {
    const percentage = (currentOccupancy / totalSpots) * 100;

    function formatTime(minutes) {
        if (minutes === null || minutes === undefined) return 'N/A';

        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;

        return `${hours}:${String(mins).padStart(2, '0')} h`;
    }

    function getNextReleaseText() {
        if (!nextReleaseSpotId || nextReleaseTime === null || nextReleaseTime === undefined) {
            return 'None';
        }

        return `${nextReleaseSpotId} in ${formatTime(nextReleaseTime)}`;
    }

    return (
        <section className="panel">
            <div className="panel-heading">
                <h2>
                    <TrendingUp size={19} />
                    Parking Analytics
                </h2>
            </div>

            <div className="analytics-content">
                <div>
                    <div className="analytics-row">
                        <span>Current Occupancy</span>
                        <strong>{currentOccupancy}/{totalSpots}</strong>
                    </div>

                    <div className="occupancy-bar">
                        <div style={{ width: `${percentage}%` }} />
                    </div>
                </div>

                <div className="mini-chart-box">
                    <div className="mini-chart-header">
                        <span>
                            <BarChart3 size={15} />
                            Occupancy Trend
                        </span>

                        <strong>{Math.round(percentage)}%</strong>
                    </div>

                    <div className="mini-chart">
                        {occupancyHistory.map((value, index) => {
                            const height = totalSpots > 0 ? (value / totalSpots) * 100 : 0;

                            return (
                                <div key={index} className="chart-bar-wrap">
                                    <div
                                        className="chart-bar"
                                        style={{ height: `${Math.max(height, 4)}%` }}
                                    />
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="analytics-boxes">
                    <div className="analytics-box">
                        <span>
                            <Users size={15} />
                            Peak Occupancy
                        </span>

                        <strong>{peakOccupancy}/{totalSpots}</strong>
                    </div>

                    <div className="analytics-box">
                        <span>
                            <Clock size={15} />
                            Avg Wait Time
                        </span>

                        <strong>{formatTime(averageWaitTime)}</strong>
                    </div>

                    <div className="analytics-box">
                        <span>
                            <Clock size={15} />
                            Avg Parking Time
                        </span>

                        <strong>{formatTime(averageParkingTime)}</strong>
                    </div>

                    <div className="analytics-box">
                        <span>
                            <TimerReset size={15} />
                            Next Release
                        </span>

                        <strong>{getNextReleaseText()}</strong>
                    </div>
                </div>
            </div>
        </section>
    );
}