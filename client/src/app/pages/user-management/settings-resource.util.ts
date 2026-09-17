import { Observable } from 'rxjs';
import { ApiService } from '../../shared/services/api.service';
import { MessageNotificationService } from '../../services/message_notification/message-notification.service';
import { TranslationService } from '../../shared/services/translation.service';

export function uploadImageResource(apiService: ApiService, endpoint: string, file: File): Observable<{ image?: string }> {
  const formData = new FormData();
  formData.append('file', file);
  return apiService.put<{ image?: string }>(endpoint, formData);
}

export function notifyUploadImageError(error: { error?: { detail?: string } }, messageNotificationService: MessageNotificationService, translationService: TranslationService): void {
  const message = error?.error?.detail ?? translationService.translate('Failed to upload image');
  messageNotificationService.show(message);
}
