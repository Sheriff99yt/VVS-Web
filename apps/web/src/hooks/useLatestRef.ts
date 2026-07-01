import { useLayoutEffect, useRef } from 'react';

/** Keeps a ref in sync with the latest value (updated after render, before paint). */
export function useLatestRef<T>(value: T) {
  const ref = useRef(value);
  useLayoutEffect(() => {
    ref.current = value;
  });
  return ref;
}
