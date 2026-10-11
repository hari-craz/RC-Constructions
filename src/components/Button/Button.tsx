import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';
import './Button.css';

interface BaseButtonProps {
  children: ReactNode;
  className?: string;
}

type ButtonAsButton = BaseButtonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof BaseButtonProps> & {
    href?: undefined;
  };

type ButtonAsAnchor = BaseButtonProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof BaseButtonProps> & {
    href: string;
  };

export type ButtonProps = ButtonAsButton | ButtonAsAnchor;

export function Button(props: ButtonProps) {
  const { children, className = '', ...rest } = props;
  const classes = `btn ${className}`.trim();

  if ('href' in rest && rest.href) {
    const { href, ...anchorProps } = rest as ButtonAsAnchor;
    return (
      <a href={href} className={classes} {...anchorProps}>
        {children}
      </a>
    );
  }

  const { type = 'button', ...buttonProps } = rest as ButtonAsButton;
  return (
    <button type={type} className={classes} {...buttonProps}>
      {children}
    </button>
  );
}
