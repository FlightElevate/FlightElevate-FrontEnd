import { api } from '../apiClient';
import { ENDPOINTS } from '../config';

export const reservationService = {
  async getReservations(params = {}) {
    return await api.get(ENDPOINTS.RESERVATIONS.LIST, { params });
  },

  async getReservation(id) {
    return await api.get(ENDPOINTS.RESERVATIONS.SHOW(id));
  },

  async getReservationDetail(id) {
    return await api.get(ENDPOINTS.RESERVATIONS.DETAIL(id));
  },

  async createReservation(data) {
    return await api.post(ENDPOINTS.RESERVATIONS.CREATE, data);
  },

  async updateReservation(id, data) {
    return await api.put(ENDPOINTS.RESERVATIONS.UPDATE(id), data);
  },

  async deleteReservation(id) {
    return await api.delete(ENDPOINTS.RESERVATIONS.DELETE(id));
  },

  async dispatchReservation(id, data) {
    return await api.post(ENDPOINTS.RESERVATIONS.DISPATCH(id), data);
  },

  async checkinReservation(id, data) {
    return await api.post(ENDPOINTS.RESERVATIONS.CHECKIN(id), data);
  },

  async getInvoice(id) {
    return await api.get(ENDPOINTS.RESERVATIONS.INVOICE(id));
  },

  async createInvoice(id, data) {
    return await api.post(ENDPOINTS.RESERVATIONS.INVOICE(id), data);
  },

  async chargeInvoice(id, data) {
    return await api.post(ENDPOINTS.RESERVATIONS.INVOICE_CHARGE(id), data);
  },

  async refundInvoice(id, data) {
    return await api.post(ENDPOINTS.RESERVATIONS.INVOICE_REFUND(id), data);
  },

  async confirmPayment(id, data) {
    return await api.post(ENDPOINTS.RESERVATIONS.INVOICE_CONFIRM(id), data);
  },

  async fetchMetar(ids) {
    return await api.get(ENDPOINTS.WEATHER.METAR, { params: { ids } });
  },
};
