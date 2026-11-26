import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { AppRoutes } from './App';
import { useLab } from '../store/useLab';

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
    </MemoryRouter>,
  );
}

describe('lab shell', () => {
  it('shows a lesson with its panel and all 12 lessons in the strip', () => {
    renderAt('/lesson/3');
    expect(
      screen.getByRole('heading', { level: 1, name: 'Predict waterlogging (decision tree)' }),
    ).toBeInTheDocument();
    const strip = screen.getByRole('navigation', { name: 'Lessons' });
    expect(within(strip).getAllByRole('link')).toHaveLength(12);
    expect(within(strip).getByRole('link', { current: 'page' })).toHaveTextContent('Waterlogging tree');
    expect(useLab.getState().visited).toEqual([3]);
  });

  it('links the Break it step to the Break it tab', async () => {
    const user = userEvent.setup();
    renderAt('/lesson/3');
    await user.click(screen.getByRole('button', { name: /Break it/ }));
    expect(screen.getByRole('tab', { name: 'Break it' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('memorised');
  });

  it('switches the whole shell to Bangla', async () => {
    const user = userEvent.setup();
    renderAt('/lesson/3');
    await user.click(screen.getByRole('button', { name: 'বাংলা' }));
    expect(
      screen.getByRole('heading', { level: 1, name: 'জলাবদ্ধতার পূর্বাভাস (ডিসিশন ট্রি)' }),
    ).toBeInTheDocument();
    expect(screen.getByText('পাঠ ৩ / ১২')).toBeInTheDocument();
    // Draft tab text has no Bangla yet, so the panel says so.
    await user.click(screen.getByRole('tab', { name: 'কীভাবে কাজ করে' }));
    expect(screen.getByText('আপাতত শুধু ইংরেজি')).toBeInTheDocument();
  });

  it('offers the online tool for online lessons', () => {
    renderAt('/lesson/6');
    const links = screen.getAllByRole('link', { name: /Open TensorFlow Playground/ });
    expect(links[0]).toHaveAttribute('href', 'https://playground.tensorflow.org/');
  });

  it('explains when a lesson number does not exist', () => {
    renderAt('/lesson/40');
    expect(screen.getByText('There is no lesson 40. The lab has lessons 1 to 12.')).toBeInTheDocument();
  });
});
