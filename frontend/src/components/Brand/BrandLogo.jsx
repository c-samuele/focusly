import { useId } from 'react';

const WORDMARK = ['F', 'O', 'C', 'U', 'S', 'L', 'Y'];

function BrandLogo({
  subtitle = 'Focus Workspace',
  className = '',
  size = 'md',
  orientation = 'inline',
  animated = false,
  showSubtitle = true,
}) {
  const gradientId = useId();

  return (
    <div
      className={[
        'brand-lockup',
        `brand-lockup--${size}`,
        `brand-lockup--${orientation}`,
        animated ? 'brand-lockup--animated' : '',
        className,
      ].filter(Boolean).join(' ')}
    >
      <span className="brand-lockup__mark" aria-hidden="true">
        <svg viewBox="0 0 250 250" role="presentation" className="brand-lockup__mark-svg">
          <defs>
            <linearGradient id={gradientId} x1="173.7625" y1="182.2652" x2="87.0563" y2="42.0268" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="var(--brand-mark-gradient-start)" />
              <stop offset="1" stopColor="var(--brand-mark-gradient-end)" />
            </linearGradient>
          </defs>
          <path
            className="brand-lockup__mark-shadow"
            d="M207.17 58.17H103.69v47.47h90.6v35.85h-90.6v86.53H60.84V21.91h146.33V58.17Z"
          />
          <path
            className="brand-lockup__mark-accent"
            d="M207.17 51.17H103.69v47.47h90.6v35.85h-90.6v86.53H60.84V14.91h146.33V51.17Z"
            fill={`url(#${gradientId})`}
          />
        </svg>
      </span>

      <span className="brand-lockup__copy">
        <strong className="brand-lockup__wordmark" aria-label="FOCUSLY">
          {WORDMARK.map((letter, index) => (
            <span
              key={`${letter}-${index}`}
              className="brand-lockup__wordmark-char"
              style={{ '--brand-char-index': index }}
            >
              {letter}
            </span>
          ))}
        </strong>

        {showSubtitle ? <span className="brand-lockup__subtitle">{subtitle}</span> : null}
      </span>
    </div>
  );
}

export default BrandLogo;
