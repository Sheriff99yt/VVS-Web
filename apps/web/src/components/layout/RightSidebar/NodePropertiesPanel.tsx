import React from 'react';
import { ExternalLink } from 'lucide-react';
import { VVSNode, PinDefinition } from '@/types/graph';

interface NodePropertiesPanelProps {
  nodeId: string;
  nodeData: Pick<VVSNode, 'id' | 'type' | 'data'>;
  onInputChange: (key: string, value: string | number | boolean) => void;
  onLabelChange: (label: string) => void;
  onDescriptionChange: (description: string) => void;
  onCommentColorChange?: (color: string) => void;
  linkedGraphName?: string;
  linkedGraphInspectorLabel?: string;
  onOpenLinkedGraph?: () => void;
}

export function NodePropertiesPanel({
  nodeId,
  nodeData,
  onInputChange,
  onLabelChange,
  onDescriptionChange,
  onCommentColorChange,
  linkedGraphName,
  linkedGraphInspectorLabel,
  onOpenLinkedGraph,
}: NodePropertiesPanelProps) {
  const inputs = nodeData.data.inputs || [];
  const isComment = nodeData.type === 'vvs_comment_node';

  return (
    <div className="text-sm text-zinc-300 space-y-4">
      <div className="mb-4">
        <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-1">Node Details</p>
        <p className="font-mono text-xs bg-zinc-900 px-2 py-1 rounded inline-block border border-zinc-800 text-zinc-400">
          {nodeId}
        </p>
      </div>

      <div className="space-y-1.5">
        <label className="text-[11px] font-medium text-zinc-400">Label</label>
        <input
          type="text"
          value={nodeData.data.label}
          onChange={(e) => onLabelChange(e.target.value)}
          className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-zinc-500 transition-colors"
        />
      </div>

      {!isComment && (
        <div className="space-y-1.5">
          <label className="text-[11px] font-medium text-zinc-400">Description</label>
          <textarea
            rows={2}
            value={nodeData.data.description ?? ''}
            onChange={(e) => onDescriptionChange(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-zinc-500 transition-colors resize-none"
            placeholder="Optional notes for this node..."
          />
        </div>
      )}

      {isComment && onCommentColorChange && (
        <div className="space-y-1.5">
          <label className="text-[11px] font-medium text-zinc-400">Accent color</label>
          <input
            type="color"
            value={nodeData.data.commentColor ?? '#6366f1'}
            onChange={(e) => onCommentColorChange(e.target.value)}
            className="w-full h-8 bg-zinc-900 border border-zinc-800 rounded cursor-pointer"
          />
        </div>
      )}

      {!isComment && nodeData.data.category && (
        <div className="space-y-1.5">
          <label className="text-[11px] font-medium text-zinc-400">Category</label>
          <p className="text-xs text-zinc-400">{nodeData.data.category}</p>
        </div>
      )}

      {nodeData.data.linkKind && linkedGraphName && (
        <div className="space-y-1.5">
          <label className="text-[11px] font-medium text-zinc-400">
            {linkedGraphInspectorLabel ?? 'Linked graph'}
          </label>
          <p
            className={`text-xs font-medium ${
              nodeData.data.linkKind === 'import_module' ? 'text-teal-300' : 'text-indigo-300'
            }`}
          >
            {linkedGraphName}
          </p>
          {nodeData.data.linkKind === 'import_module' && (
            <p className="text-[10px] text-zinc-500 leading-relaxed">
              Import is emitted at this point in the execution flow (wire exec in/out).
            </p>
          )}
          {onOpenLinkedGraph && (
            <button
              type="button"
              onClick={onOpenLinkedGraph}
              className="flex items-center gap-1.5 text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              <ExternalLink size={12} />
              Open graph
            </button>
          )}
        </div>
      )}

      {inputs.length > 0 ? (
        <div className="space-y-4">
          <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-1">Inputs</p>
          {inputs.map((input: PinDefinition) => {
            const val = (nodeData.data.inlineValues && nodeData.data.inlineValues[input.id]) ?? '';

            return (
              <div key={input.id} className="space-y-1.5">
                <label className="text-[11px] font-medium text-zinc-400">{input.label || input.id}</label>

                {(input.type === 'data_string' || input.type === 'data_any') && (
                  <input
                    type="text"
                    value={val as string}
                    onChange={(e) => onInputChange(input.id, e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-zinc-500 transition-colors"
                  />
                )}

                {input.type === 'data_number' && (
                  <input
                    type="number"
                    value={val as number}
                    onChange={(e) => onInputChange(input.id, parseFloat(e.target.value) || 0)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-zinc-500 transition-colors"
                  />
                )}

                {input.type === 'data_boolean' && (
                  <label className="flex items-center gap-2 text-xs text-white cursor-pointer py-1">
                    <input
                      type="checkbox"
                      checked={val as boolean}
                      onChange={(e) => onInputChange(input.id, e.target.checked)}
                      className="accent-zinc-500 bg-zinc-900 border-zinc-800"
                    />
                    {input.label}
                  </label>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        !isComment && (
          <div className="text-zinc-500 text-xs text-center py-4 border border-dashed border-zinc-800/50 rounded">
            No configurable inputs.
          </div>
        )
      )}
    </div>
  );
}
