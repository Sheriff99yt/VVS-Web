import { useRef } from 'react';

/** Keeps a ref in sync with the latest value (updated during render — safe for flush-on-event). */
export function useLatestRef<T>(value: T) {
  const ref = useRef(value);
  // eslint-disable-next-line react-hooks/refs
  ref.current = value;
  return ref;
}
