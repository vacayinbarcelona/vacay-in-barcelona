'use client';

// Small confirm-before-submit wrapper so admin deletes (attraction, ticket
// option, FAQ, image, review...) aren't one accidental click away. Used
// inside a <form action={someDeleteAction.bind(null, id)}>.
export function DeleteButton({
  confirmText = 'Delete this? This cannot be undone.',
  label = 'Delete',
  className = 'text-xs text-red-600 hover:text-red-700 font-medium'
}: {
  confirmText?: string;
  label?: string;
  className?: string;
}) {
  return (
    <button
      type="submit"
      onClick={(e) => {
        if (!window.confirm(confirmText)) e.preventDefault();
      }}
      className={className}
    >
      {label}
    </button>
  );
}
