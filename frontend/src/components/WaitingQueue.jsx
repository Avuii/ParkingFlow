import { Car, Clock, Zap, Crown } from 'lucide-react';
import { motion } from 'framer-motion';

export function WaitingQueue({ queue }) {
  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;

    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  function renderIcon(car) {
    if (car.type === 'electric') return <Zap size={20} className="green-icon" />;
    if (car.type === 'vip') return <Crown size={20} className="yellow-icon" />;

    return <Car size={20} className="blue-icon" />;
  }

  return (
    <section className="panel">
      <div className="panel-heading">
        <h2>Waiting Queue</h2>
        <span className="small-pill">{queue.length} waiting</span>
      </div>

      <div className="queue-list">
        {queue.length === 0 ? (
          <p className="empty-text">No cars in queue</p>
        ) : (
          queue.map((car, index) => (
            <motion.div
              key={car.id}
              initial={{ opacity: 0, x: 14 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.04 }}
              className="queue-item"
            >
              <div className="queue-icon">
                {renderIcon(car)}
              </div>

              <div className="queue-main">
                <strong>{car.id}</strong>

                <span>
                  <Clock size={13} />
                  {formatTime(car.waitingTime)}
                </span>
              </div>

              <span className={`priority ${car.priority}`}>
                {car.priority}
              </span>
            </motion.div>
          ))
        )}
      </div>
    </section>
  );
}