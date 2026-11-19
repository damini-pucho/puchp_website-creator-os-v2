// Input — the DS text field (44 h · r12 · hairline · hover @30 % · focus violet 1.5 px · error red) with the label above.
// A password field always has a working show / hide eye (compulsory on the login page).
import React, { useId, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const Input = ({ label, type = 'text', icon, placeholder, value, onChange, error, hint, name, autoComplete, id, required, disabled, className = '', ...rest }) => {
  const [show, setShow] = useState(false);
  const autoId = useId();
  const inputId = id || autoId;
  const isPassword = type === 'password';
  const inputType = isPassword ? (show ? 'text' : 'password') : type;

  return (
    <div className={`space-y-1.5 w-full min-w-0 ${className}`}>
      {label && (
        <label htmlFor={inputId} className="block text-[13px] font-medium text-ink-3">
          {label}{required && <span className="text-bad-text ml-0.5" aria-hidden>*</span>}
        </label>
      )}
      <div
        className={`field flex items-center gap-2.5 !py-0 ${disabled ? 'bg-surface-2' : ''}`}
        aria-invalid={error ? 'true' : undefined}
      >
        {icon && (
          typeof icon === 'string'
            ? <img src={icon} alt="" className="w-[18px] h-[18px] opacity-50 shrink-0 dark:invert" aria-hidden />
            : React.createElement(icon, { className: 'w-[18px] h-[18px] text-ink-3 shrink-0', strokeWidth: 1.7, 'aria-hidden': true })
        )}
        <input
          id={inputId}
          name={name}
          type={inputType}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          required={required}
          disabled={disabled}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error || hint ? `${inputId}-help` : undefined}
          className="flex-1 min-w-0 h-[42px] bg-transparent border-none outline-none text-ink placeholder:text-ink-4 text-sm"
          {...rest}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? 'Hide password' : 'Show password'}
            title={show ? 'Hide password' : 'Show password'}
            aria-pressed={show}
            className="-mr-1 w-9 h-9 rounded-md flex items-center justify-center text-ink-3 hover:text-ink hover:bg-surface-2 shrink-0"
          >
            {show ? <EyeOff className="w-[18px] h-[18px]" strokeWidth={1.7} /> : <Eye className="w-[18px] h-[18px]" strokeWidth={1.7} />}
          </button>
        )}
      </div>
      {(error || hint) && (
        <p id={`${inputId}-help`} className={`text-xs ${error ? 'text-bad-text' : 'text-ink-3'}`}>{error || hint}</p>
      )}
    </div>
  );
};

export default Input;
