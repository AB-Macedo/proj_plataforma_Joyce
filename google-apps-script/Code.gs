/**
 * Ponte privada entre Magia Selenne e o Google Agenda.
 * Configure CALENDAR_ID ("primary") e BRIDGE_SECRET nas Propriedades do script.
 */
function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents || '{}');
    const secret = PropertiesService.getScriptProperties().getProperty('BRIDGE_SECRET');
    const calendarId = PropertiesService.getScriptProperties().getProperty('CALENDAR_ID') || 'primary';
    if (!secret || payload.secret !== secret) return response_({ ok: false, error: 'Não autorizado.' });

    const calendar = CalendarApp.getCalendarById(calendarId);
    if (!calendar) return response_({ ok: false, error: 'Agenda não encontrada.' });
    if (payload.action === 'delete') {
      if (payload.eventId) {
        const current = calendar.getEventById(payload.eventId);
        if (current) current.deleteEvent();
      }
      return response_({ ok: true });
    }

    if (!payload.title || !payload.startsAt || !payload.endsAt) return response_({ ok: false, error: 'Dados do evento incompletos.' });
    const start = new Date(payload.startsAt);
    const end = new Date(payload.endsAt);
    let event = payload.eventId ? calendar.getEventById(payload.eventId) : null;
    if (event) {
      event.setTitle(payload.title);
      event.setTime(start, end);
      event.setDescription(payload.description || '');
    } else {
      event = calendar.createEvent(payload.title, start, end, { description: payload.description || '' });
    }
    event.setVisibility(CalendarApp.Visibility.PRIVATE);
    return response_({ ok: true, eventId: event.getId() });
  } catch (error) {
    return response_({ ok: false, error: String(error && error.message ? error.message : error) });
  }
}

function response_(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
