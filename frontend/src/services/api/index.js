import { authApi } from './auth.api';
import { adminApi } from './admin.api';
import { stationApi } from './station.api';
import { labApi } from './lab.api';
import { warehouseApi } from './warehouse.api';
import { hospitalApi } from './hospital.api';
import { hmsApi } from './hms.api';
import { donorApi } from './donor.api';
import { notifApi } from './notif.api';

export const api = {
  auth: authApi,
  admin: adminApi,
  station: stationApi,
  lab: labApi,
  warehouse: warehouseApi,
  hospital: hospitalApi,
  hms: hmsApi,
  donor: donorApi,
  notifications: notifApi,
};

export { authApi, adminApi, stationApi, labApi, warehouseApi, hospitalApi, hmsApi, donorApi, notifApi };
export default api;
