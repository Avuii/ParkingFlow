import { X, Car, Clock, Zap, Crown, Accessibility } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function SpotDetailsModal({ spot, onClose, releaseSpot }) {
    const icons = {
        vip: Crown,
        disabled: Accessibility,
        electric: Zap,
        standard: Car,
        reserved: Car
    };

    const TypeIcon = icons[spot.type];

    function formatTime(minutes) {
        if (minutes === undefined) return 'N/A';

        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;

        return `${hours}:${String(mins).padStart(2, '0')} h`;
    }

    function formatTimestamp(date) {
        if (!date) return 'N/A';

        return new Date(date).toLocaleTimeString('en-US', { hour12: false });
    }

    return (
        <AnimatePresence>
            <div className="modal-layer">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="modal-backdrop"
                    onClick={onClose}
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.92, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.92, y: 20 }}
                    className="modal"
                >
                    <button className="modal-close" onClick={onClose}>
                        <X size={18} />
                    </button>

                    <div className="modal-title">
                        <h2>Spot {spot.id}</h2>

                        <span>
                            <TypeIcon size={18} />
                            {spot.type} spot
                        </span>
                    </div>

                    <div className="modal-grid">
                        <div className="modal-card">
                            <span>Status</span>
                            <strong className={spot.occupied ? 'red-text' : 'green-text'}>
                                {spot.occupied ? 'Occupied' : 'Available'}
                            </strong>
                        </div>

                        <div className="modal-card">
                            <span>Type</span>
                            <strong>{spot.type}</strong>
                        </div>
                    </div>

                    {spot.occupied && (
                        <>
                            <div className="modal-grid">
                                <div className="modal-card">
                                    <span>Car ID</span>
                                    <strong>{spot.carId}</strong>
                                </div>

                                <div className="modal-card">
                                    <span>Car Type</span>
                                    <strong>{spot.carType}</strong>
                                </div>
                            </div>

                            <div className="modal-grid">
                                <div className="modal-card">
                                    <span>Entered At</span>
                                    <strong>
                                        <Clock size={15} />
                                        {formatTimestamp(spot.enteredAt)}
                                    </strong>
                                </div>

                                <div className="modal-card">
                                    <span>Remaining Time</span>
                                    <strong>{formatTime(spot.remainingTime)}</strong>
                                </div>
                            </div>

                            <button
                                className="button danger full-width"
                                onClick={() => {
                                    releaseSpot(spot.id);
                                    onClose();
                                }}
                            >
                                Release Spot
                            </button>
                        </>
                    )}

                </motion.div>
            </div>
        </AnimatePresence>
    );
}