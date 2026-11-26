import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { AppRoutes } from './App';
import { TURN_LIMIT } from '../engines/rl/robot';
import { useRobot } from '../lessons/robot/store';
import { useLab } from '../store/useLab';

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
    </MemoryRouter>,
  );
}

describe('lab shell', () => {
  it('shows a lesson with its panel and all 13 lessons in the strip', () => {
    renderAt('/lesson/3');
    expect(
      screen.getByRole('heading', { level: 1, name: 'Predict waterlogging (decision tree)' }),
    ).toBeInTheDocument();
    const strip = screen.getByRole('navigation', { name: 'Lessons' });
    expect(within(strip).getAllByRole('link')).toHaveLength(13);
    expect(within(strip).getByRole('link', { current: 'page' })).toHaveTextContent('Waterlogging tree');
    expect(useLab.getState().visited).toEqual([3]);
  });

  it('opens 8B from the traffic lesson and records a manual drive', async () => {
    const user = userEvent.setup();
    renderAt('/lesson/8');
    await user.click(screen.getByRole('link', { name: 'Try 8B · Waste robot' }));
    expect(screen.getByRole('heading', { level: 1, name: 'Waste-collection robot (Q-learning)' })).toBeInTheDocument();
    expect(useLab.getState().visited).toEqual([8, '8b']);
    const driving = screen.getByRole('group', { name: 'Driving controls' });
    for (let move = 0; move < 3; move++) await user.click(within(driving).getByRole('button', { name: 'East' }));
    expect(screen.getByRole('status')).toHaveTextContent('Carrying waste');
    for (let move = 0; move < 2; move++) await user.click(within(driving).getByRole('button', { name: 'West' }));
    expect(screen.getByRole('status')).toHaveTextContent('Battery ran out');
    expect(screen.getByRole('link', { name: 'Try 8A · Traffic signal' })).toHaveAttribute('href', '/lesson/8');
    await user.click(within(driving).getByRole('button', { name: 'Restart drive' }));
  });

  it('trains and replays the two robot routes with matching starting batteries', () => {
    vi.useFakeTimers();
    try {
      renderAt('/lesson/8b');
      fireEvent.click(screen.getByRole('button', { name: 'Open training' }));
      fireEvent.click(screen.getByRole('button', { name: 'Watch next action' }));
      expect(screen.getByRole('columnheader', { name: 'Q-value update' })).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Train 600 attempts' }));
      act(() => vi.advanceTimersByTime(2400));
      expect(useRobot.getState().training.completed).toBe(600);

      fireEvent.click(screen.getByRole('button', { name: 'Open comparison' }));
      fireEvent.click(screen.getByRole('button', { name: 'Compare routes' }));
      for (let move = 0; move < TURN_LIMIT; move++) act(() => vi.advanceTimersByTime(400));
      const direct = screen.getByRole('heading', { name: 'Direct route' }).closest('section')!;
      const learned = screen.getByRole('heading', { name: 'Learned route' }).closest('section')!;
      expect(within(direct).getByText('Battery ran out')).toBeInTheDocument();
      expect(within(learned).getByText('Delivered to depot')).toBeInTheDocument();
      expect(useRobot.getState().training.completed).toBe(600);

      fireEvent.click(screen.getByRole('button', { name: '12' }));
      expect(within(direct).getByRole('meter')).toHaveAttribute('value', '12');
      expect(within(learned).getByRole('meter')).toHaveAttribute('value', '12');
    } finally {
      vi.useRealTimers();
      act(() => useRobot.getState().resetTraining());
    }
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
    expect(screen.getByText('পাঠ ৩')).toBeInTheDocument();
    // Ported lessons carry their tab text and step briefs in Bangla too.
    await user.click(screen.getByRole('tab', { name: 'কীভাবে কাজ করে' }));
    expect(screen.getByRole('tabpanel')).toHaveTextContent('ট্রি সেই একটি প্রশ্ন বাছে');
    expect(screen.queryByText('আপাতত শুধু ইংরেজি')).not.toBeInTheDocument();
  });

  it('runs a ported lesson on the stage with step briefs and panel controls', async () => {
    const user = userEvent.setup();
    renderAt('/lesson/2');
    expect(screen.getByText(/An officer writes the knowledge as IF/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Next step/ }));
    expect(useLab.getState().step).toBe('explore');
    // A Break it preset in the panel loads a tricky complaint and moves the cycle to Break it.
    await user.click(screen.getByRole('button', { name: /Street light says/ }));
    expect(useLab.getState().step).toBe('break');
    expect(screen.getByText(/Conflict: rules point to different departments/)).toBeInTheDocument();
  });

  it('offers the online tool for online lessons', () => {
    renderAt('/lesson/6');
    const links = screen.getAllByRole('link', { name: /Open TensorFlow Playground/ });
    expect(links[0]).toHaveAttribute('href', 'https://playground.tensorflow.org/');
    expect(document.querySelector('iframe')).toBeNull();
  });

  it('explains when a lesson number does not exist', () => {
    renderAt('/lesson/40');
    expect(screen.getByText('There is no lesson 40. Choose a lesson from the home page.')).toBeInTheDocument();
  });
});
