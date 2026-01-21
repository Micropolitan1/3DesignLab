/**
 * ParameterInput - Input component for various parameter types
 */

import { useState, useCallback, useEffect } from 'react';
import type { Parameter, NumberParameter, EnumParameter, BooleanParameter } from '../../types/features';
import './ParameterInput.css';

interface ParameterInputProps {
  parameter: Parameter;
  onChange: (value: number | string | boolean) => void;
}

export function ParameterInput({ parameter, onChange }: ParameterInputProps) {
  switch (parameter.type) {
    case 'number':
      return <NumberInput parameter={parameter} onChange={onChange} />;
    case 'enum':
      return <EnumInput parameter={parameter} onChange={onChange} />;
    case 'boolean':
      return <BooleanInput parameter={parameter} onChange={onChange} />;
    case 'string':
      return <StringInput parameter={parameter} onChange={onChange} />;
    default:
      return null;
  }
}

// ============ Number Input ============

interface NumberInputProps {
  parameter: NumberParameter;
  onChange: (value: number) => void;
}

function NumberInput({ parameter, onChange }: NumberInputProps) {
  const [inputValue, setInputValue] = useState(String(parameter.value));
  const [isFocused, setIsFocused] = useState(false);

  // Sync input when parameter value changes externally
  useEffect(() => {
    if (!isFocused) {
      setInputValue(String(parameter.value));
    }
  }, [parameter.value, isFocused]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  }, []);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    let num = parseFloat(inputValue);

    if (isNaN(num)) {
      num = parameter.value;
      setInputValue(String(num));
      return;
    }

    // Apply min/max constraints
    if (parameter.min !== undefined && num < parameter.min) {
      num = parameter.min;
    }
    if (parameter.max !== undefined && num > parameter.max) {
      num = parameter.max;
    }

    setInputValue(String(num));
    if (num !== parameter.value) {
      onChange(num);
    }
  }, [inputValue, parameter, onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur();
      (e.target as HTMLInputElement).blur();
    } else if (e.key === 'Escape') {
      setInputValue(String(parameter.value));
      (e.target as HTMLInputElement).blur();
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      const step = parameter.step ?? 1;
      const delta = e.key === 'ArrowUp' ? step : -step;
      let num = parseFloat(inputValue) + delta;

      if (parameter.min !== undefined && num < parameter.min) num = parameter.min;
      if (parameter.max !== undefined && num > parameter.max) num = parameter.max;

      setInputValue(String(num));
      onChange(num);
    }
  }, [inputValue, parameter, onChange, handleBlur]);

  return (
    <div className="parameter-input number-input">
      <label className="parameter-label">{parameter.name}</label>
      <div className="number-input-wrapper">
        <input
          type="text"
          value={inputValue}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={() => setIsFocused(true)}
          onKeyDown={handleKeyDown}
          className="number-input-field"
        />
        {parameter.unit && <span className="parameter-unit">{parameter.unit}</span>}
      </div>
    </div>
  );
}

// ============ Enum Input ============

interface EnumInputProps {
  parameter: EnumParameter;
  onChange: (value: string) => void;
}

function EnumInput({ parameter, onChange }: EnumInputProps) {
  const handleChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value);
  }, [onChange]);

  return (
    <div className="parameter-input enum-input">
      <label className="parameter-label">{parameter.name}</label>
      <select
        value={parameter.value}
        onChange={handleChange}
        className="enum-select"
      >
        {parameter.options.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// ============ Boolean Input ============

interface BooleanInputProps {
  parameter: BooleanParameter;
  onChange: (value: boolean) => void;
}

function BooleanInput({ parameter, onChange }: BooleanInputProps) {
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.checked);
  }, [onChange]);

  return (
    <div className="parameter-input boolean-input">
      <label className="parameter-label">
        <input
          type="checkbox"
          checked={parameter.value}
          onChange={handleChange}
          className="boolean-checkbox"
        />
        {parameter.name}
      </label>
    </div>
  );
}

// ============ String Input ============

interface StringInputProps {
  parameter: { id: string; name: string; value: string };
  onChange: (value: string) => void;
}

function StringInput({ parameter, onChange }: StringInputProps) {
  const [value, setValue] = useState(parameter.value);

  const handleBlur = useCallback(() => {
    if (value !== parameter.value) {
      onChange(value);
    }
  }, [value, parameter.value, onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur();
      (e.target as HTMLInputElement).blur();
    }
  }, [handleBlur]);

  return (
    <div className="parameter-input string-input">
      <label className="parameter-label">{parameter.name}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="string-input-field"
      />
    </div>
  );
}
