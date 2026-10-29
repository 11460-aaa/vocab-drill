import { Modal } from './Modal';
import { AlertIcon, InfoIcon } from '../Icons';
import { Button } from './Button';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'default' | 'danger';
  onConfirm: () => void;
  onCancel: () => void;
}

/** 统一的确认弹窗，用于删除、重复词条、数量不足等需要二次确认的操作。 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = '确认',
  cancelLabel = '取消',
  tone = 'default',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const Icon = tone === 'danger' ? AlertIcon : InfoIcon;

  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button
            variant={tone === 'danger' ? 'danger' : 'primary'}
            onClick={onConfirm}
            data-autofocus
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex gap-3.5">
        <span
          className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
            tone === 'danger' ? 'bg-coral-50 text-coral-600' : 'bg-papaya-50 text-papaya-700'
          }`}
        >
          <Icon className="h-5 w-5" />
        </span>
        <p className="pt-1 text-sm leading-relaxed text-ink-600">{description}</p>
      </div>
    </Modal>
  );
}
