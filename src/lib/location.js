export function getCurrentLocation(options = {}) {
  if (!('geolocation' in navigator)) {
    return Promise.reject(new Error('GPS is not available on this device.'))
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        })
      },
      (error) => {
        const messages = {
          [error.PERMISSION_DENIED]: 'Location permission was denied. You can enter a location manually instead.',
          [error.POSITION_UNAVAILABLE]: 'Current location is unavailable right now. Manual entry still works.',
          [error.TIMEOUT]: 'Location lookup took too long. Try again or enter a location manually.',
        }

        reject(new Error(messages[error.code] || 'Could not read your current location.'))
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
        ...options,
      }
    )
  })
}
