import React from 'react';
import {
  PHONE_PREFIX_OPTIONS,
  DEFAULT_PHONE_PREFIX,
  validatePhoneWithPrefix,
} from '../utils/phonePrefixes';

export { validatePhoneWithPrefix, combinePhoneNumber } from '../utils/phonePrefixes';

const PhoneInput = ({
  prefix,
  number,
  onPrefixChange,
  onNumberChange,
  id = 'phone',
  required = false,
  inputStyle = {},
  selectStyle = {},
  containerStyle = {},
}) => {
  return (
    <div style={{ display: 'flex', gap: '8px', ...containerStyle }}>
      <select
        id={`${id}-prefix`}
        name={`${id}Prefix`}
        value={prefix || DEFAULT_PHONE_PREFIX}
        onChange={(e) => onPrefixChange(e.target.value)}
        style={{ flex: '0 0 180px', ...selectStyle }}
        required={required}
        aria-label="Phone prefix"
      >
        {PHONE_PREFIX_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <input
        type="tel"
        id={id}
        name={id}
        value={number || ''}
        onChange={(e) => onNumberChange(e.target.value.replace(/[^\d\s\-().]/g, ''))}
        style={{ flex: 1, ...inputStyle }}
        placeholder="Phone number"
        required={required}
        autoComplete="tel-national"
      />
    </div>
  );
};

export default PhoneInput;
