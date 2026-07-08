'use client';

import React from 'react';
import type { PinDefinition } from '@/types/graph';
import {
  coerceInlineValue,
  inlineValueForDisplay,
  pinInlineWidgetKind,
} from '@/lib/pinInlineWidget';
import {
  GRAPH_WHEEL_SHIELD_CLASS,
  graphInlineFieldInteractionProps,
  graphInlineFieldProps,
  stopGraphBubble,
} from './graphInlineFieldProps';
import { useNumberInputWheel } from './useNumberInputWheel';
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
      <span className={styles.inlineShield}>
        <label
          className={`${styles.inlineCheckbox} ${GRAPH_WHEEL_SHIELD_CLASS}`}
          title={pin.label || 'Boolean value'}
          onPointerDown={stopGraphBubble}
          onClick={stopGraphBubble}
        >
          <input
            type="checkbox"
            className={styles.inlineCheckboxInput}
            checked={Boolean(display)}
            onChange={(e) => onChange(coerceInlineValue(pin, e.target.checked))}
            onKeyDown={graphInlineFieldInteractionProps.onKeyDown}
          />
          <span className={styles.inlineCheckboxBox} aria-hidden />
        </label>
      </span>
    );
  }

  if (kind === 'number') {
    return (
      <span className={styles.inlineShield}>
        <NumberPinInput
          pin={pin}
          display={display}
          onChange={(next) => onChange(coerceInlineValue(pin, next))}
        />
      </span>
    );
  }

  return (
    <span className={styles.inlineShield}>
      <input
        type="text"
        className={`${styles.inlineField} ${styles.inlineFieldWide} ${GRAPH_WHEEL_SHIELD_CLASS}`}
        value={String(display)}
        onChange={(e) => onChange(coerceInlineValue(pin, e.target.value))}
        aria-label={pin.label || 'Value'}
        autoComplete="off"
        draggable={false}
        placeholder={pin.label || '…'}
        spellCheck={false}
        {...graphInlineFieldProps}
      />
    </span>
  );
}

function NumberPinInput({
  pin,
  display,
  onChange,
}: {
  pin: PinDefinition;
  display: string | number | boolean;
  onChange: (value: number) => void;
}) {
  const wheelRef = useNumberInputWheel(onChange);

  return (
    <input
      ref={wheelRef}
      type="text"
      inputMode="decimal"
      className={`${styles.inlineField} ${styles.inlineFieldNumber} ${GRAPH_WHEEL_SHIELD_CLASS}`}
      value={String(display)}
      onChange={(e) => onChange(coerceInlineValue(pin, e.target.value) as number)}
      aria-label={pin.label || 'Number value'}
      title="Scroll to adjust · Shift ±10 · Ctrl ±0.1"
      autoComplete="off"
      draggable={false}
      {...graphInlineFieldInteractionProps}
    />
  );
}
