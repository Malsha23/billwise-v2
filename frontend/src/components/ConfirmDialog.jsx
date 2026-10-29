import Modal from './Modal';

export default function ConfirmDialog({ title, children, confirmText = 'Delete', onConfirm, onCancel }) {
  return (
    <Modal title={title} onClose={onCancel}>
      <div className="space-y-4 text-sm text-gray-600">
        <div>{children}</div>
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="rounded border px-4 py-2">Cancel</button>
          <button onClick={onConfirm} className="rounded bg-red-500 px-4 py-2 font-semibold text-white">
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}