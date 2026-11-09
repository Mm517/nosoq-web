/* ==========================================================================
   js/distance.js — حساب المسافة بين نقطتين (window.Distance)

   Distance.meters(lat1, lng1, lat2, lng2) -> المسافة بالمتر (Haversine)، أو null لو أي قيمة غير صالحة
   Distance.format(meters)                 -> "850 متر" (أقل من 1000) أو "1.2 كم" (1000 فأكثر)
   ========================================================================== */
(function () {
  'use strict';

  const EARTH_RADIUS_M = 6371000;
  const rad = (deg) => (deg * Math.PI) / 180;

  function valid(lat, lng) {
    return typeof lat === 'number' && typeof lng === 'number' && isFinite(lat) && isFinite(lng) &&
      Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
  }

  function meters(latitude1, longitude1, latitude2, longitude2) {
    if (!valid(latitude1, longitude1) || !valid(latitude2, longitude2)) return null;
    const dLat = rad(latitude2 - latitude1);
    const dLng = rad(longitude2 - longitude1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(rad(latitude1)) * Math.cos(rad(latitude2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(a)));
  }

  function format(m) {
    if (typeof m !== 'number' || !isFinite(m) || m < 0) return '';
    const rounded = Math.round(m);
    if (rounded < 1000) return rounded + ' متر';
    return (Math.round(m / 100) / 10).toString() + ' كم';
  }

  const api = { meters, format };
  if (typeof window !== 'undefined') window.Distance = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})();
