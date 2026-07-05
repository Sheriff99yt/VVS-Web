'use client';

import React from 'react';
import type { PinDefinition } from '@/types/graph';
import {
  coerceInlineValue,
  inlineValueForDisplay,
  pinInlineWidgetKind,
} from '@/lib/pinInlineWidget';
import { graphInlineFieldProps, stopGraphBubble } from './graphInlineFieldProps';
import { GraphWheelShield } from './GraphWheelShield';
import styles from './VVSNode.module.css';

interface NodePinInlineWidgetProps {
  pin: PinDefinition;
  value: string | number | boolean | undefined;
  onChange: (value: string | number | boolean) => void;
}

export function NodePinInlineWidget({ pin, value, onChange }: NodePinInlineWidgetProps) {
  const kind = pinInlineWidgetKind(pin);
  const display = inlineValueForDisplay(pin, value);

  if (kind === 'checkbox') {
    return (
      <GraphWheelShield className={styles.inlineShield}>
        <label
          className={styles.inlineCheckbox}
          title={pin.label || 'Boolean value'}
          onPointerDown={stopGraphBubble}
          onClick={stopGraphBubble}
        >
          <input
            type="checkbox"
            className={styles.inlineCheckboxInput}
            checked={Boolean(display)}
            onChange={(e) => onChange(coerceInlineValue(pin, e.target.checked))}
            onKeyDown={graphInlineFieldProps.onKeyDown}
          />
          <span className={styles.inlineCheckboxBox} aria-hidden />
        </label>
      </GraphWheelShield>
    );
  }

  if (kind === 'number') {
    return (
      <GraphWheelShield className={styles.inlineShield}>
        <input
          type="text"
          inputMode="decimal"
          className={`${styles.inlineField} ${styles.inlineFieldNumber}`}
          value={String(display)}
          onChange={(e) => onChange(coerceInlineValue(pin, e.target.value))}
          aria-label={pin.label || 'Number value'}
          autoComplete="off"
          draggable={false}
          {...graphInlineFieldProps}
        />
      </GraphWheelShield>
    );
  }

  return (
    <GraphWheelShield className={styles.inlineShield}>
      <input
        type="text"
        className={`${styles.inlineField} ${styles.inlineFieldWide}`}
        value={String(display)}
        onChange={(e) => onChange(coerceInlineValue(pin, e.target.value))}
        aria-label={pin.label || 'Value'}
        autoComplete="off"
        draggable={false}
        placeholder={pin.label || '…'}
        spellCheck={false}
        {...graphInlineFieldProps}
      />
    </GraphWheelShield>
  );
}
