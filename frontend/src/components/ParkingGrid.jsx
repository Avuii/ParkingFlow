import { ParkingSpot } from './ParkingSpot';

export function ParkingGrid({ spots, onSpotClick }) {
  return (
    <section className="panel parking-panel">
      <div className="panel-heading">
        <div>
          <h2>Parking Grid</h2>
          <p>Live overview of all parking spots</p>
        </div>

        <span className="small-pill">20 spots</span>
      </div>

      <div className="parking-grid">
        {spots.map(spot => (
          <ParkingSpot
            key={spot.id}
            spot={spot}
            onClick={() => onSpotClick(spot)}
          />
        ))}
      </div>
    </section>
  );
}