// Bottone base riutilizzabile.
// Le varianti visive vengono applicate tramite classi CSS.
function Button({ children, className = '', type = 'button', variant = 'primary', ...props }) {
  return (
    <button
      type={type}
      className={`button button--${variant} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;
