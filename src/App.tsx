import { useEffect, useRef } from 'react';
import { Viewport } from './components/Viewport';
import { Sidebar } from './components/Sidebar';
import { ViewportManager } from './viewport/ViewportManager';
import { createAllTestGeometry } from './utils/testGeometry';
import './App.css';

function App() {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // Wait for viewport to be ready
    const checkViewport = setInterval(() => {
      const viewport = (window as unknown as { viewport: ViewportManager }).viewport;
      if (viewport) {
        clearInterval(checkViewport);

        // Add test geometry
        const testMeshes = createAllTestGeometry();
        testMeshes.forEach(({ id, mesh }) => {
          viewport.addMesh(id, mesh);
        });
      }
    }, 100);

    return () => clearInterval(checkViewport);
  }, []);

  return (
    <div className="app">
      <Sidebar />
      <div className="viewport-container">
        <Viewport />
      </div>
    </div>
  );
}

export default App;
