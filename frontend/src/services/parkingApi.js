const API_URL = 'http://localhost:5288';

async function request(path, method = 'GET') {
  const response = await fetch(`${API_URL}${path}`, {
    method
  });

  if (!response.ok) {
    throw new Error('Request failed');
  }

  if (response.status === 204) {
    return null;
  }

  const text = await response.text();

  if (!text) {
    return null;
  }

  return JSON.parse(text);
}

export const parkingApi = {
  apiUrl: API_URL,

  getState() {
    return request('/api/parking/state');
  },

  startSimulation() {
    return request('/api/parking/start', 'POST');
  },

  stopSimulation() {
    return request('/api/parking/stop', 'POST');
  },

  startAutoMode() {
    return request('/api/parking/auto-mode/start', 'POST');
  },

  stopAutoMode() {
    return request('/api/parking/auto-mode/stop', 'POST');
  },

  setSpeed(speed) {
    return request(`/api/parking/speed/${speed}`, 'POST');
  },

  addCar() {
    return request('/api/parking/add-car', 'POST');
  },

  addCars(count) {
    return request(`/api/parking/add-cars/${count}`, 'POST');
  },

  releaseSpot(spotId) {
    return request(`/api/parking/release/${spotId}`, 'POST');
  },

  resetParking() {
    return request('/api/parking/reset', 'POST');
  }
};