// Area principale scrollabile della dashboard.
// Contiene Today Pillars, Focus Timer, Analytics e Tasks.
function MainContent({ children, className = '' }) {
  return (
    <main className={`main-content ${className}`.trim()}>
      {children}
    </main>
  );
}

export default MainContent;
