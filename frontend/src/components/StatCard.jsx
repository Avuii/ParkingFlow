import { motion } from 'framer-motion';

export function StatCard({ icon: Icon, label, value, color }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className={`stat-card ${color}`}
    >
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
      </div>

      <div className="stat-icon">
        <Icon size={30} />
      </div>
    </motion.div>
  );
}