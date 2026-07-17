'use client';

import React from 'react';
import { ExternalLink } from 'lucide-react';
import { Tooltip } from '@/components/ui/Tooltip';
import type { PinDefinition, VVSNode } from '@/types/graph';
import { pinRoleHint, pinTypeLabel } from '@/lib/pinLabels';

interface NodePinsPanelProps {
  nodeData: Pick<VVSNode, 'id' | 'type' | 'data'>;
  onInputChange: (key: string, value: string | number | boolean) => void;
  linkedGraphName?: string;
  linkedGraphInspectorLabel?: string;
  onOpenLinkedGraph?: () => void;
}

function PinTypeBadge({ type }: { type: PinDefinition['type'] }) {
  return (
    <span className="text-[9px] font-semibold uppercase tracking-wide text-zinc-500 bg-zinc-900 border border-zinc-800 px-1 py-0.5 rounded shrink-0">
      {pinTypeLabel(type)}
    </span>
  );
}

function InlinePinField({
  input,
  value,
  onChange,
}: {
  input: PinDefinition;
  value: string | number | boolean;
  onChange: (value: string | number | boolean) => void;
}) {
  if (input.type === 'data_boolean') {
    return (
      <label className="flex items-center gap-2 text-[11px] text-zinc-300 cursor-pointer">
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
          className="accent-zinc-500 bg-zinc-900 border-zinc-800"
        />
        {value ? 'True' : 'False'}
      </label>
    );
  }

  if (input.type === 'data_number') {
    return (
      <input
        type="number"
        value={typeof value === 'number' ? value : 0}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-[11px] text-white focus:outline-none focus:border-zinc-600"
      />
    );
  }

  if (input.type === 'data_string' || input.type === 'data_any') {
    return (
      <input
        type="text"
        value={typeof value === 'string' ? value : String(value ?? '')}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-[11px] text-white focus:outline-none focus:border-zinc-600"
      />
    );
  }

  return null;
}

function PinRow({
  pin,
  direction,
  inlineValue,
  onInlineChange,
}: {
  pin: PinDefinition;
  direction: 'input' | 'output';
  inlineValue?: string | number | boolean;
  onInlineChange?: (value: string | number | boolean) => void;
}) {
  const isExec = pin.type === 'execution';
  const showInline = direction === 'input' && !isExec && onInlineChange;

  return (
    <Tooltip content={pinRoleHint(pin, direction)} placement="left" className="block w-full min-w-0">
      <div className="space-y-1 py-1.5 border-b border-zinc-800/60 last:border-0">
      <div className="flex items-center gap-1.5 min-w-0">
        <span className="text-[11px] font-medium text-zinc-300 truncate flex-1">
          {pin.label || pin.id}
        </span>
        <PinTypeBadge type={pin.type} />
      </div>
      {showInline ? (
        <InlinePinField input={pin} value={inlineValue ?? ''} onChange={onInlineChange} />
      ) : null}
      </div>
    </Tooltip>
  );
}

export function NodePinsPanel({
  nodeData,
  onInputChange,
  linkedGraphName,
  linkedGraphInspectorLabel,
  onOpenLinkedGraph,
}: NodePinsPanelProps) {
  const inputs = nodeData.data.inputs ?? [];
  const outputs = nodeData.data.outputs ?? [];
  const inlineValues = nodeData.data.inlineValues ?? {};
  const dataInputs = inputs.filter((p) => p.type !== 'execution');
  const execInputs = inputs.filter((p) => p.type === 'execution');
  const execOutputs = outputs.filter((p) => p.type === 'execution');
  const dataOutputs = outputs.filter((p) => p.type !== 'execution');

  return (
    <div className="space-y-3 text-xs text-zinc-300">
      {nodeData.data.linkKind && linkedGraphName ? (
        <div className="space-y-1 pb-2 border-b border-zinc-800/80">
          <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-wide">
            {linkedGraphInspectorLabel ?? 'Calls'}
          </p>
          <p className="text-[11px] text-indigo-300 font-medium">{linkedGraphName}</p>
          {onOpenLinkedGraph ? (
            <Tooltip content="Open linked graph" placement="top">
              <button
                type="button"
                onClick={onOpenLinkedGraph}
                className="flex items-center gap-1 text-[10px] text-indigo-400 hover:text-indigo-300"
              >
                <ExternalLink size={11} />
                Open
              </button>
            </Tooltip>
          ) : null}
        </div>
      ) : null}

      {execInputs.length > 0 || execOutputs.length > 0 ? (
        <div>
          <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-wide mb-1">Execution</p>
          {execInputs.map((pin) => (
            <PinRow key={pin.id} pin={pin} direction="input" />
          ))}
          {execOutputs.map((pin) => (
            <PinRow key={pin.id} pin={pin} direction="output" />
          ))}
        </div>
      ) : null}

      {dataInputs.length > 0 ? (
        <div>
          <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-wide mb-1">Inputs</p>
          {dataInputs.map((pin) => (
            <PinRow
              key={pin.id}
              pin={pin}
              direction="input"
              inlineValue={inlineValues[pin.id]}
              onInlineChange={(value) => onInputChange(pin.id, value)}
            />
          ))}
        </div>
      ) : null}

      {dataOutputs.length > 0 ? (
        <div>
          <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-wide mb-1">Outputs</p>
          {dataOutputs.map((pin) => (
            <PinRow key={pin.id} pin={pin} direction="output" />
          ))}
        </div>
      ) : null}

      {inputs.length === 0 && outputs.length === 0 && !linkedGraphName ? (
        <p className="text-[10px] text-zinc-600 py-1">No pins</p>
      ) : null}
    </div>
  );
}
