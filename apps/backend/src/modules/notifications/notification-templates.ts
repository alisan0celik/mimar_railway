export type NotificationLocale = "tr" | "en";

const DEFAULT_LOCALE: NotificationLocale = "tr";

export function resolveNotificationLocale(preferred?: string | null): NotificationLocale {
  if (preferred === "en") return "en";
  return DEFAULT_LOCALE;
}

export function membershipApprovedNotification(
  locale: NotificationLocale,
  params: { companyName: string; roleName: string },
) {
  if (locale === "en") {
    return {
      title: "Membership approved",
      message: `You were approved at ${params.companyName} as ${params.roleName}. You can now use the app.`,
    };
  }
  return {
    title: "Üyeliğiniz onaylandı",
    message: `${params.companyName} şirketinde ${params.roleName} olarak onaylandınız. Artık uygulamayı kullanabilirsiniz.`,
  };
}

export function membershipRejectedNotification(
  locale: NotificationLocale,
  params: { companyName: string },
) {
  if (locale === "en") {
    return {
      title: "Membership request declined",
      message: `Your request to join ${params.companyName} was declined.`,
    };
  }
  return {
    title: "Üyelik talebiniz reddedildi",
    message: `${params.companyName} şirketine katılım talebiniz reddedildi.`,
  };
}

export function projectTaskCreatedNotification(
  locale: NotificationLocale,
  params: { creatorName: string; projectName: string; taskTitle: string },
) {
  if (locale === "en") {
    return {
      title: "New to-do",
      message: `${params.creatorName} added "${params.taskTitle}" to ${params.projectName}.`,
    };
  }
  return {
    title: "Yeni yapılacak",
    message: `${params.creatorName}, "${params.projectName}" projesine "${params.taskTitle}" ekledi.`,
  };
}

export function projectNoteCreatedNotification(
  locale: NotificationLocale,
  params: { creatorName: string; projectName: string; notePreview: string },
) {
  if (locale === "en") {
    return {
      title: "New note",
      message: `${params.creatorName} added a note to ${params.projectName}: "${params.notePreview}"`,
    };
  }
  return {
    title: "Yeni not",
    message: `${params.creatorName}, "${params.projectName}" projesine not ekledi: "${params.notePreview}"`,
  };
}

export function projectCreatedNotification(
  locale: NotificationLocale,
  params: { creatorName: string; projectName: string },
) {
  if (locale === "en") {
    return {
      title: "New project",
      message: `${params.creatorName} created the project "${params.projectName}".`,
    };
  }
  return {
    title: "Yeni proje",
    message: `${params.creatorName}, "${params.projectName}" projesini oluşturdu.`,
  };
}

export function financeRecordCreatedNotification(
  locale: NotificationLocale,
  params: { creatorName: string; amount: string; isCollection: boolean; projectName?: string },
) {
  const scope = params.projectName ? ` (${params.projectName})` : "";
  if (locale === "en") {
    const kind = params.isCollection ? "collection" : "expense";
    return {
      title: "New finance record",
      message: `${params.creatorName} added a ${kind} of ${params.amount}${scope}.`,
    };
  }
  const kind = params.isCollection ? "tahsilat" : "gider";
  return {
    title: "Yeni finans kaydı",
    message: `${params.creatorName}, ${params.amount} tutarında ${kind} kaydı ekledi${scope}.`,
  };
}

export function calendarEventCreatedNotification(
  locale: NotificationLocale,
  params: { creatorName: string; eventTitle: string; time: string },
) {
  if (locale === "en") {
    return {
      title: "New calendar event",
      message: `${params.creatorName} added "${params.eventTitle}" at ${params.time}.`,
    };
  }
  return {
    title: "Yeni takvim etkinliği",
    message: `${params.creatorName}, "${params.eventTitle}" etkinliğini ${params.time} saatine ekledi.`,
  };
}

export function supportTicketRepliedNotification(
  locale: NotificationLocale,
  params: { subject: string },
) {
  if (locale === "en") {
    return {
      title: "Support reply",
      message: `You have a new reply on "${params.subject}".`,
    };
  }
  return {
    title: "Destek yanıtı",
    message: `"${params.subject}" talebinize yeni bir yanıt geldi.`,
  };
}

export function supportTicketStatusNotification(
  locale: NotificationLocale,
  params: { subject: string; status: string },
) {
  if (locale === "en") {
    return {
      title: "Ticket status updated",
      message: `Your ticket "${params.subject}" is now ${params.status}.`,
    };
  }
  return {
    title: "Talep durumu güncellendi",
    message: `"${params.subject}" talebinizin durumu: ${params.status}.`,
  };
}
