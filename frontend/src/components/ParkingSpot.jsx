import { Car, Zap, Crown, Accessibility } from 'lucide-react';
import { motion } from 'framer-motion';

export function ParkingSpot({ spot, onClick }) {
  const icons = {
    vip: Crown,
    electric: Zap,
    disabled: Accessibility,
    standard: null,
    reserved: null
  };

  const TypeIcon = icons[spot.type];

  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;

    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  function getProgressClass() {
    if (!spot.remainingTime || !spot.totalTime) return 'blue';

    const value = (spot.remainingTime / spot.totalTime) * 100;

    if (value > 60) return 'green';
    if (value > 30) return 'yellow';

    return 'orange';
  }

  function getProgressWidth() {
    if (!spot.remainingTime || !spot.totalTime) return 0;

    return (spot.remainingTime / spot.totalTime) * 100;
  }

  return (
    <motion.button
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.03 }}
      onClick={onClick}
      className={`parking-spot ${spot.type} ${spot.occupied ? 'occupied' : ''}`}
    >
      <div className="spot-top">
        <span>{spot.id}</span>

        {TypeIcon && (
          <TypeIcon size={15} />
        )}
      </div>

      {spot.occupied ? (
        <div className="spot-car-content">
          <div className="car-icon-box">
            <Car size={34} />

            {spot.carType === 'electric' && <Zap className="car-small-icon green-icon" size={14} />}
            {spot.carType === 'vip' && <Crown className="car-small-icon yellow-icon" size={14} />}
          </div>

          <div className="car-info">
            <strong>{spot.carId}</strong>
            <span>{formatTime(spot.remainingTime)} left</span>
          </div>

          <div className="time-bar">
            <div
              className={`time-bar-fill ${getProgressClass()}`}
              style={{ width: `${getProgressWidth()}%` }}
            />
          </div>
        </div>
      ) : (
        <div className="empty-spot-content">
          <div className="empty-circle" />

          {spot.type !== 'standard' && (
            <span className="spot-type-label">{spot.type}</span>
          )}
        </div>
      )}
    </motion.button>
  );
}