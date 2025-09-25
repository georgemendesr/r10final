const instagramAutomation = {
  requestNotificationPermission() {
    try {
      if (typeof Notification !== 'undefined' && Notification?.permission === 'default') {
        Notification.requestPermission?.();
      }
    } catch (_) {}
  }
};

export default instagramAutomation;
