import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ErrorBoundary from '@/components/ErrorBoundary';
import NotFoundPage from '@/app/NotFoundPage';
test('render failures show the recovery screen', () => {
  const log = jest.spyOn(console, 'error').mockImplementation(() => {});
  function Broken(): React.ReactElement { throw new Error('render failed'); }
  try {
    render(<MemoryRouter><ErrorBoundary><Broken /></ErrorBoundary></MemoryRouter>);
    expect(screen.getByRole('heading', { name: 'Something went wrong' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Go back home' })).toBeInTheDocument();
  } finally { log.mockRestore(); }
});
test('healthy children render normally', () => {
  render(<ErrorBoundary><div>Healthy screen</div></ErrorBoundary>); expect(screen.getByText('Healthy screen')).toBeInTheDocument();
});
test('unknown location includes the requested path and working recovery links', () => {
  render(<MemoryRouter initialEntries={['/missing-page']}><NotFoundPage /></MemoryRouter>);
  expect(screen.getByText('/missing-page')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Browse classes' })).toHaveAttribute('href', '/');
  expect(screen.getByRole('link', { name: 'Go to my schedule' })).toHaveAttribute('href', '/schedule');
});
