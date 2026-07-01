'use client';

import React from 'react';
import { NodeProps, NodeResizer } from '@xyflow/react';
import { VVSNodeData } from '@/types/graph';

export function VVSCommentNode({ selected, data }: NodeProps<import('@xyflow/react').Node<VVSNodeData>>) {
  return (
    <>
      <NodeResizer 
        color="#3f3f46" 
        isVisible={selected} 
        minWidth={200} 
        minHeight={100} 
      />
      <div
        className="w-full h-full bg-zinc-900/60 border-2 rounded-xl flex flex-col relative"
        style={{
          borderColor: data.commentColor ? `${data.commentColor}99` : 'rgba(63, 63, 70, 0.5)',
          backgroundColor: data.commentColor ? `${data.commentColor}14` : undefined,
        }}
      >
        <div className="px-4 py-2 text-lg font-bold text-white/90 cursor-grab active:cursor-grabbing border-b border-white/10">
          {data.label || 'Comment Box'}
        </div>
        <div className="flex-1" />
      </div>
    </>
  );
}
