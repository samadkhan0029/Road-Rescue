let ioInstance = null;

export const setIo = (io) => {
  ioInstance = io;
};

export const emitRequestUpdate = (requestId, status, payload = {}) => {
  if (!ioInstance) {
    return;
  }

  ioInstance.to(`request-${requestId}`).emit('request-update', {
    requestId,
    status,
    ...payload,
  });
};

export const emitProviderRequest = (providerId, payload = {}) => {
  if (!ioInstance) {
    return;
  }

  console.log(' EMITTING provider-request to provider:', providerId, 'Payload:', payload);
  ioInstance.to(`provider-${providerId}`).emit('provider-request', payload);
};
