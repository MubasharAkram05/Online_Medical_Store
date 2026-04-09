import React from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import App from './App';
const { act } = React;

jest.mock('axios', () => {
  const instance = {
    interceptors: {
      response: {
        use: jest.fn()
      }
    },
    post: jest.fn(),
    get: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn()
  };

  return {
    create: jest.fn(() => instance),
    post: jest.fn()
  };
});

jest.mock('react-toastify', () => ({
  ToastContainer: () => <div data-testid="toast-container" />,
  toast: {
    error: jest.fn(),
    info: jest.fn(),
    success: jest.fn(),
    warn: jest.fn()
  }
}));

describe('App routes', () => {
  let container;
  let root;

  beforeAll(() => {
    global.IS_REACT_ACT_ENVIRONMENT = true;
    window.scrollTo = jest.fn();
    Element.prototype.scrollIntoView = jest.fn();
  });

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    container = null;
  });

  const renderAt = async (path) => {
    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={[path]}>
          <App />
        </MemoryRouter>
      );
    });
  };

  test('renders terms page content', async () => {
    await renderAt('/terms');
    expect(container.textContent).toContain('Terms & Conditions');
  });

  test('renders admin login route', async () => {
    await renderAt('/admin/login');
    expect(container.textContent).toContain('Admin Portal');
  });
});
