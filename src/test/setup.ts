import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import { useLab } from '../store/useLab';

afterEach(() => {
  cleanup();
  localStorage.clear();
  useLab.setState(useLab.getInitialState(), true);
});
