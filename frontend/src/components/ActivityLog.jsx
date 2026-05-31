import { LogIn, LogOut, Clock, AlertCircle, Settings } from 'lucide-react';
import { motion } from 'framer-motion';

export function ActivityLog({ events }) {
  const config = {
    entered: {
      icon: LogIn,
      className: 'entered'
    },
    left: {
      icon: LogOut,
      className: 'left'
    },
    waiting: {
      icon: Clock,
      className: 'waiting'
    },
    full: {
      icon: AlertCircle,
      className: 'full'
    },
    system: {
      icon: Settings,
      className: 'system'
    }
  };

  function formatTimestamp(value) {
    return new Date(value).toLocaleTimeString('en-US', { hour12: false });
  }

  return (
    <section className="panel">
      <div className="panel-heading">
        <h2>Activity Log</h2>
        <span className="small-pill">{events.length} events</span>
      </div>

      <div className="log-list">
        {events.length === 0 ? (
          <p className="empty-text">No activity yet</p>
        ) : (
          events.slice().reverse().slice(0, 50).map((event, index) => {
            const item = config[event.type];
            const Icon = item.icon;

            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.015 }}
                className="log-item"
              >
                <div className={`log-icon ${item.className}`}>
                  <Icon size={16} />
                </div>

                <p>{event.message}</p>

                <span>{formatTimestamp(event.timestamp)}</span>
              </motion.div>
            );
          })
        )}
      </div>
    </section>
  );
}